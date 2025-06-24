from celery import shared_task
from django.core.cache import cache
from .serializers import NoteSerializer
from notes.models import Note 
from django.core.exceptions import ObjectDoesNotExist


@shared_task(max_retries=3, default_retry_delay=10)
def save_note_from_cache(note_id, data):
    try:
        note = Note.objects.get(id=note_id)
    except ObjectDoesNotExist:
        return

    tags = data.pop("tag", None)

    for field, value in data.items():
        setattr(note, field, value)

    note.save()

    if tags is not None:
        note.tag.set(tags)

    cache.delete(f"note_buffer:{note_id}")
    cache.delete(f"note_task_id:{note_id}")

    notes_queryset = Note.objects.filter(author=note.author, is_deleted=False)
    notes = []

    for note_obj in notes_queryset:
        buffer_key = f"note_buffer:{note_obj.id}"
        buffered_data = cache.get(buffer_key)
        if buffered_data:
            notes.append({
                'id': note_obj.id,
                'uuid': str(note_obj.uuid),
                'title': buffered_data.get('title', note_obj.title),
                'content': buffered_data.get('content', note_obj.content),
                'updated_at': note_obj.updated_at.isoformat(),
                'created_at': note_obj.created_at.isoformat(),
            })
        else:
            notes.append(NoteSerializer(note_obj).data)

    notes.sort(key=lambda x: x['updated_at'], reverse=True)
    cache.set(f"user_notes:{note.author.id}", notes, timeout=600)