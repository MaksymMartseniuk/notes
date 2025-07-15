import { useEffect, useRef } from "react";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

export default function useNoteBuffer(
  noteId,
  note,
  enabled = true,
  delay = 3000
) {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(note);

  useEffect(() => {
    if (!noteId) {
      return;
    }
    const draft=localStorage.getItem(`note-draft-${noteId}`);
    if (draft){
      try {
        const parsedDraft = JSON.parse(draft);
        if (JSON.stringify(parsedDraft) !== JSON.stringify(note)) {
          lastSavedRef.current = parsedDraft;
        }
      } catch{}
    }
    return () => {}
  }, [noteId]);

  useEffect(() => {
    if (!enabled || !noteId) return;
    clearTimeout(timeoutRef.current);
    localStorage.setItem(`note-draft-${noteId}`, JSON.stringify(note));
    timeoutRef.current = setTimeout(() => {
      if (JSON.stringify(lastSavedRef.current) !== JSON.stringify(note)) {
        api
          .put(
            `/notes-api/notes/${noteId}/`,
            {
              ...note,
              title: note.title || "Нова нотатка",
            },
            {
              headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
            }
          )
          .then(() => {
            lastSavedRef.current = note;
          })
          .catch(() => {});
      }
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [note, enabled, noteId]);

  return null;
}
