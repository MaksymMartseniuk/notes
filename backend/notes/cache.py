from django.core.cache import cache
from .models import Note


def _get_notes_tree(user):
    all_notes = Note.objects.filter(author=user, is_deleted=False).prefetch_related("tag")
    notes_map = {}
    tree = []
   
    for note in all_notes:
        buffer_key = f"note_buffer:{note.id}"
        buffered_data = cache.get(buffer_key)
       
      
        note_data = {
            "id": note.id,
            "uuid": str(note.uuid),
            "title": (
                buffered_data.get("title", note.title) if buffered_data else note.title
            ),
            "content": (
                buffered_data.get("content", note.content)
                if buffered_data
                else note.content
            ),
            "updated_at": note.updated_at.isoformat(),
            "created_at": note.created_at.isoformat(),
            "tags": [t.name for t in note.tag.all()],
            "children": [],
        }
        notes_map[note.id] = note_data

    for note in all_notes:
        if note.parent_id:
            parent = notes_map.get(note.parent_id)
            if parent:
                parent["children"].append(notes_map[note.id])
        else:
            tree.append(notes_map[note.id])

    return tree


def _update_notes_cache(user):
    all_notes = Note.objects.filter(author=user, is_deleted=False)
    notes_map = {}
    tree = []

    for note in all_notes:
        buffer_key = f"note_buffer:{note.id}"
        buffered_data = cache.get(buffer_key)

        note_data = {
            "id": note.id,
            "uuid": str(note.uuid),
            "title": (
                buffered_data.get("title", note.title) if buffered_data else note.title
            ),
            "content": (
                buffered_data.get("content", note.content)
                if buffered_data
                else note.content
            ),
            "updated_at": note.updated_at.isoformat(),
            "created_at": note.created_at.isoformat(),
            "children": [],
        }
        notes_map[note.id] = note_data

    for note in all_notes:
        if note.parent_id:
            parent = notes_map.get(note.parent_id)
            if parent:
                parent["children"].append(notes_map[note.id])
        else:
            tree.append(notes_map[note.id])
    cache.set(f"user_notes:{user.id}", tree, timeout=600)
