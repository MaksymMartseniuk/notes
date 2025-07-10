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
    if (!enabled) return;
    clearTimeout(timeoutRef.current);

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
