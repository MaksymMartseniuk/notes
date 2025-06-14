from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note, Tag, NoteVersion
from .serializers import NoteSerializer, TagSerializer, NoteVersionSerializer
from django.utils.text import slugify
from unidecode import unidecode
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.cache import cache
from celery.result import AsyncResult
from .tasks import save_note_from_cache
import json
from django.core.serializers.json import DjangoJSONEncoder
# Create your views here.
class NoteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        cache_key = f"user_notes:{user.id}"
        notes = cache.get(cache_key)

        if notes is None:
            notes = self._get_notes_with_cache(user)
            cache.set(cache_key, notes, timeout=600)

        return Response(notes, status=status.HTTP_200_OK)

    def _get_notes_with_cache(self, user):
        notes_queryset = Note.objects.filter(author=user, is_deleted=False)
        notes = []
        for note in notes_queryset:
            buffer_key = f"note_buffer:{note.id}"
            buffered_data = cache.get(buffer_key)
            if buffered_data:
                notes.append({
                    'id': note.id,
                    'uuid': str(note.uuid),
                    'title': buffered_data.get('title', note.title),
                    'content': buffered_data.get('content', note.content),
                    'updated_at': note.updated_at.isoformat(),
                    'created_at': note.created_at.isoformat(),
                })
            else:
                notes.append(NoteSerializer(note).data)
        return sorted(notes, key=lambda x: x['updated_at'], reverse=True)



class NoteGetOrCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid):
        note = get_object_or_404(Note, uuid=uuid, author=request.user)
        cache_key = f"note_buffer:{note.id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response({
                'id': note.id,
                'uuid': str(note.uuid),
                **cached_data,
            }, status=status.HTTP_206_PARTIAL_CONTENT)
        return Response(NoteSerializer(note).data, status=status.HTTP_200_OK)

    def post(self, request, uuid):
        serializer = NoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note, created = Note.objects.get_or_create(
            uuid=uuid,
            author=request.user,
            defaults=serializer.validated_data,
        )
        self._update_notes_cache(request.user)
        return Response(NoteSerializer(note).data, status=201 if created else 200)

    def put(self, request, uuid):
        note = get_object_or_404(Note, uuid=uuid, author=request.user)
        serializer = NoteSerializer(note, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        cache_key = f"note_buffer:{note.id}"
        task_id_key = f"note_task_id:{note.id}"

        old_task_id = cache.get(task_id_key)
        if old_task_id:
            AsyncResult(old_task_id).revoke(terminate=True)
            
        task = save_note_from_cache.apply_async(
            args=[note.id, serializer.validated_data],
            countdown=300
        )

        safe_data = json.loads(json.dumps(serializer.validated_data, cls=DjangoJSONEncoder))
        cache.set(cache_key, safe_data, timeout=600)
        cache.set(task_id_key, task.id, timeout=600)

        self._update_notes_cache(request.user)

        return Response(serializer.validated_data, status=status.HTTP_200_OK)

    def delete(self, request, uuid):
        note = get_object_or_404(Note, uuid=uuid, author=request.user)
        cache_key = f"note_buffer:{note.id}"
        
        cached_data = cache.get(cache_key)
        if cached_data:
            data_to_save = cached_data.copy()
        else:
            data_to_save = NoteSerializer(note).data
        data_to_save['is_deleted'] = True
        serializer = NoteSerializer(note, data=data_to_save, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        cache.set(cache_key, data_to_save, timeout=600)
        self._update_notes_cache(request.user)
        
        return Response(serializer.data, status=status.HTTP_200_OK)




    def _update_notes_cache(self, user):
        notes_queryset = Note.objects.filter(author=user, is_deleted=False)
        notes = []
        for note in notes_queryset:
            buffer_key = f"note_buffer:{note.id}"
            buffered_data = cache.get(buffer_key)
            if buffered_data:
                notes.append({
                    'id': note.id,
                    'uuid': str(note.uuid),
                    'title': buffered_data.get('title', note.title),
                    'content': buffered_data.get('content', note.content),
                    'updated_at': note.updated_at.isoformat(),
                    'created_at': note.created_at.isoformat(),
                })
            else:
                notes.append(NoteSerializer(note).data)

        notes = sorted(notes, key=lambda x: x['updated_at'], reverse=True)
        cache.set(f"user_notes:{user.id}", notes, timeout=600)


class DeleteNoteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        notes = Note.objects.filter(author=user, is_deleted=True).order_by('-updated_at')
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NoteRestoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, uuid):
        
        note = get_object_or_404(Note, uuid=uuid, author=request.user, is_deleted=True)
        note.is_deleted = False
        note.save(update_fields=["is_deleted"])

        cache_key = f"note_buffer:{note.id}"
        cache.delete(cache_key)

        self._update_notes_cache(request.user)

        return Response(NoteSerializer(note).data, status=200)


    def _update_notes_cache(self, user):
        notes_queryset = Note.objects.filter(author=user, is_deleted=False)
        notes = []
        for note in notes_queryset:
            buffer_key = f"note_buffer:{note.id}"
            buffered_data = cache.get(buffer_key)
            if buffered_data:
                notes.append({
                    'id': note.id,
                    'uuid': str(note.uuid),
                    'title': buffered_data.get('title', note.title),
                    'content': buffered_data.get('content', note.content),
                    'updated_at': note.updated_at.isoformat(),
                    'created_at': note.created_at.isoformat(),
                })
            else:
                notes.append(NoteSerializer(note).data)

        notes = sorted(notes, key=lambda x: x['updated_at'], reverse=True)
        cache.set(f"user_notes:{user.id}", notes, timeout=600)

class NoteVersionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid):
        note = get_object_or_404(Note, uuid=uuid, author=request.user)
        versions = note.versions.all()
        serializer = NoteVersionSerializer(versions, many=True)
        return Response(serializer.data)


class TagCreateView(generics.ListCreateAPIView):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Tag.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class TagDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "slug"

    def get_queryset(self):
        return Tag.objects.filter(author=self.request.user)

    def perform_update(self, serializer):
        instanse = self.get_object()
        old_name = instanse.name
        new_name = self.request.data.get("name", old_name)
        if old_name != new_name:
            serializer.save(author=self.request.user, slug=slugify(unidecode(new_name)))
        else:
            serializer.save()

    def perform_destroy(self, instance):
        instance.delete()
