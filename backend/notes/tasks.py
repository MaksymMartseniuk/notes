from celery import shared_task
from django.core.cache import cache
from .serializers import NoteSerializer
from notes.models import Note
from django.core.exceptions import ObjectDoesNotExist
from .models import NoteVersion
from .cache import _update_notes_cache


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

    _update_notes_cache(note.author)

@shared_task(max_retries=3, default_retry_delay=10)
def save_note_version(note_id):
    cached_data = cache.get(f"note_buffer:{note_id}")
    if not cached_data:
        return

    last_version = NoteVersion.objects.filter(note_id=note_id).order_by('-created_at').first()
    if last_version and last_version.content == cached_data.get('content'):
        return

    NoteVersion.objects.create(
        note_id=note_id,
        title=cached_data.get('title', ''),
        content=cached_data.get('content', ''),
        edited_by=cached_data.get('edited_by', None)
    )

    cache.delete(f"note_buffer:{note_id}")
    cache.delete(f"note_task_id:{note_id}")
