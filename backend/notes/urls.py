from django.urls import path
from .views import NoteListView, NoteGetOrCreateView, TagCreateView, TagDetailView, NoteVersionListView,DeleteNoteListView, NoteRestoreView, NoteVersionView,RecentlyViewedNoteView



urlpatterns = [
    path('notes/', NoteListView.as_view(), name='note-list-create'),
    path('notes/<uuid:uuid>/', NoteGetOrCreateView.as_view(), name='note-detail'),
    path('notes/<uuid:uuid>/versions/', NoteVersionListView.as_view(), name='note-version-list'),
    path('notes/<uuid:uuid>/restore/', NoteRestoreView.as_view(), name='note-restore'),
    path('notes/deleted/', DeleteNoteListView.as_view(), name='deleted-note-list'),
    path('notes/<uuid:uuid>/versions/<int:version_id>/', NoteVersionView.as_view(), name='note-version-detail'),
    path('tags/', TagCreateView.as_view(), name='tag-list-create'),
    path('tags/<slug:slug>/', TagDetailView.as_view(), name='tag-detail'),
    path("recently-viewed/",RecentlyViewedNoteView.as_view(),name='recently-viewed'),
]