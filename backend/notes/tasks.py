from celery import shared_task
from django.core.cache import cache
from .serializers import NoteSerializer
from notes.models import Note
from django.core.exceptions import ObjectDoesNotExist
from .models import NoteVersion


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

    update_user_notes_cache(note.author)


def update_user_notes_cache(user):
    notes_queryset = Note.objects.filter(author=user, is_deleted=False)
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
    cache.set(f"user_notes:{user.id}", notes, timeout=600)


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
