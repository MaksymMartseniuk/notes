from django.shortcuts import render, get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note, Tag, NoteVersion, RecentlyViewedNote
from .serializers import (
    NoteSerializer,
    TagSerializer,
    NoteVersionSerializer,
    RecentlyViewedNoteSerializer,
)
from django.utils.text import slugify
from unidecode import unidecode
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.cache import cache
from celery.result import AsyncResult
from .tasks import save_note_from_cache, save_note_version
import json
from django.core.serializers.json import DjangoJSONEncoder
from Users_Api.models import UserSettings
from .cache import _get_notes_tree, _update_notes_cache
from django.utils.timezone import now
from django.db.models import Q, BooleanField, ExpressionWrapper

# Create your views here.
class NoteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        cache_key = f"user_notes:{user.id}"
        notes_tree = cache.get(cache_key)

        if notes_tree is None:
            notes_tree = _get_notes_tree(user)
            cache.set(cache_key, notes_tree, timeout=600)

        return Response(notes_tree, status=status.HTTP_200_OK)


class NoteGetOrCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid):
        note = get_object_or_404(Note, uuid=uuid, author=request.user)
        cache_key = f"note_buffer:{note.id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(
                {
                    "id": note.id,
                    "uuid": str(note.uuid),
                    **cached_data,
                },
                status=status.HTTP_206_PARTIAL_CONTENT,
            )
        return Response(NoteSerializer(note).data, status=status.HTTP_200_OK)

    def post(self, request, uuid):
        serializer = NoteSerializer(data=request.data, context={"request": request})
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
        version_task_id_key = f"note_version_task_id:{note.id}"
        force_save = request.query_params.get("force_save") == "true"

        try:
            user_settings = request.user.usersettings
        except UserSettings.DoesNotExist:
            user_settings = None

        old_task_id = cache.get(task_id_key)
        if old_task_id:
            AsyncResult(old_task_id).revoke(terminate=True)
            cache.delete(task_id_key)

        old_version_task_id = cache.get(version_task_id_key)
        if old_version_task_id:
            AsyncResult(old_version_task_id).revoke(terminate=True)
            cache.delete(version_task_id_key)

        print(f"Note {note.id} updated with data: {serializer.validated_data}")

        if force_save:
            serializer.save()
            cache.delete(cache_key)
            cache.delete(task_id_key)
            cache.delete(version_task_id_key)
            _update_notes_cache(request.user)
            return Response(
                {"detail": "Дані збережено негайно."}, status=status.HTTP_200_OK
            )

        if user_settings and user_settings.autosave_enabled:
            delay_seconds = user_settings.autosave_interval_minutes * 60
        else:
            delay_seconds = 300

        cleaned_data = serializer.validated_data.copy()

        if "parent" in cleaned_data:
            cleaned_data["parent"] = cleaned_data["parent"].id if cleaned_data["parent"] else None

        if "tag" in cleaned_data:
            cleaned_data["tag"] = [tag.id for tag in cleaned_data["tag"]]

        safe_data = json.loads(json.dumps(cleaned_data, cls=DjangoJSONEncoder))
        cache.set(cache_key, safe_data, timeout=delay_seconds + 60)

        task = save_note_from_cache.apply_async(
            args=[note.id, safe_data], countdown=delay_seconds
        )
        task_version = save_note_version.apply_async(
            args=[note.id], countdown=delay_seconds + 1
        )

        cache.set(task_id_key, task.id, timeout=delay_seconds + 60)
        cache.set(version_task_id_key, task_version.id, timeout=delay_seconds + 60)

        _update_notes_cache(request.user)

        return Response(
            {
                "detail": f"Дані кешовано. Збереження відкладено на {delay_seconds} секунд."
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, uuid):
        note = get_object_or_404(Note, uuid=uuid, author=request.user)
        cache_key = f"note_buffer:{note.id}"

        cached_data = cache.get(cache_key)
        if cached_data:
            data_to_save = cached_data.copy()
        else:
            data_to_save = NoteSerializer(note).data
        data_to_save["is_deleted"] = True
        serializer = NoteSerializer(note, data=data_to_save, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        cache.set(cache_key, data_to_save, timeout=600)
        _update_notes_cache(request.user)

        return Response(serializer.data, status=status.HTTP_200_OK)


class DeleteNoteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        notes = Note.objects.filter(author=user, is_deleted=True).order_by(
            "-updated_at"
        )
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

        _update_notes_cache(request.user)

        return Response(NoteSerializer(note).data, status=200)


class NoteVersionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid):
        note = get_object_or_404(Note, uuid=uuid, author=request.user)
        versions = note.versions.all()
        serializer = NoteVersionSerializer(versions, many=True)
        return Response(serializer.data)


class NoteVersionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid, version_id):
        note = get_object_or_404(Note, uuid=uuid, author=request.user)
        version = get_object_or_404(NoteVersion, id=version_id, note=note)
        serializer = NoteVersionSerializer(version)
        print(f"Retrieved version {version_id} for note {uuid}")
        print(f"Version data: {serializer.data}")
        return Response(serializer.data)


class TagView(APIView):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, note_uuid):
        note = get_object_or_404(Note, uuid=note_uuid, author=request.user)
        tags = note.tag.all()
        serializer = self.serializer_class(tags, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, note_uuid):
        note = get_object_or_404(Note, uuid=note_uuid, author=request.user)

        tag_name = request.data.get("name", "").strip()
        if not tag_name:
            return Response({"detail": "Tag name is required."}, status=400)

        tag, _ = Tag.objects.get_or_create(name=tag_name)
        note.tag.add(tag)
        
        serializer = self.serializer_class(tag)
        return Response(serializer.data, status=201)
    
    def delete(self,request,note_uuid):
        note = get_object_or_404(Note, uuid=note_uuid, author=request.user)
        tag_name = request.data.get("name", "").strip()

        if not tag_name:
            return Response({"detail": "Tag name is required."}, status=400)

        try:
            tag = note.tag.get(name=tag_name)
            note.tag.remove(tag)
            
            if tag.notes.count() == 0:
                tag.delete()
            
            return Response({"detail": f"Tag '{tag_name}' removed from note."}, status=204)
        except Tag.DoesNotExist:
            return Response({"detail": f"Tag '{tag_name}' not found in this note."}, status=404)
        
        
    def update(self,request,note_uuid):
        note = get_object_or_404(Note, uuid=note_uuid, author=request.user)
        old_name = request.data.get("old_name", "").strip()
        new_name = request.data.get("new_name", "").strip()
        
        if not old_name or not new_name:
            return Response({"detail": "Both 'old_name' and 'new_name' are required."}, status=400)

        try:
            tag = note.tag.get(name=old_name)
            new_tag, _ = Tag.objects.get_or_create(name=new_name)
            note.tag.remove(tag)
            note.tag.add(new_tag)
            return Response({"detail": f"Tag '{old_name}' renamed to '{new_name}'."}, status=200)
        except Tag.DoesNotExist:
            return Response({"detail": f"Tag '{old_name}' not found in this note."}, status=404)


class RecentlyViewedNoteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notes = RecentlyViewedNote.objects.filter(user=request.user).select_related(
            "note"
        )[:10]
        return Response(
            RecentlyViewedNoteSerializer(notes, many=True).data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        note_uuid = request.data.get("note_uuid")
        if not note_uuid:
            return Response({"detail": "note_uuid is required"}, status=400)
        note = Note.objects.filter(uuid=note_uuid).first()
        if not note:
            return Response({"detail": "Note not found"}, status=404)
        RecentlyViewedNote.objects.update_or_create(
            user=request.user, note=note, defaults={"viewed_at": now()}
        )

        return Response({"detail": "Saved"}, status=status.HTTP_200_OK)
    
    
class NoteSearchAPIView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        query = request.query_params.get("query", "").strip()
        filter_by = request.query_params.get("filter", "title")
        notes = Note.objects.filter(author=request.user)
        if query:
            if filter_by == "tag":
                notes = notes.filter(tag__name__icontains=query)
            else:
                notes = notes.filter(title__icontains=query)
        notes = notes.annotate(
            is_deleted_bool=ExpressionWrapper(
                Q(is_deleted=True),
                output_field=BooleanField()
            )
        ).order_by("is_deleted_bool", "-updated_at")
        
        serializer = NoteSerializer(notes.distinct(), many=True)
        return Response(serializer.data)
