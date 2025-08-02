import { use, useEffect, useRef, useState } from "react";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import { useAutoSave } from "../contexts/AutoSaveContext";

export default function useNoteBuffer(
  noteId,
  note,
  enabled = true,
  delay = 3000
) {
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(note);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autosaveIntervalMinutes, setAutosaveIntervalMinutes] = useState(5);
  const { checkUpdateAutoSave, setCheckUpdateAutoSave } = useAutoSave();
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  useEffect(() => {
    if (!noteId) {
      return;
    }
    const draft = localStorage.getItem(`note-draft-${noteId}`);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        if (JSON.stringify(parsedDraft) !== JSON.stringify(note)) {
          lastSavedRef.current = parsedDraft;
        }
      } catch {}
    }
    return () => {};
  }, [noteId]);

  useEffect(() => {
    const fetchAutoSave = async () => {
      if (!settingsLoaded || checkUpdateAutoSave) {
        await api
          .get("/api/settings/autosave/")
          .then((response) => {
            const { autosave_enabled, autosave_interval_minutes } =
              response.data;
            setAutoSaveEnabled(autosave_enabled);
            setAutosaveIntervalMinutes(autosave_interval_minutes);
            setSettingsLoaded(true);
            if (checkUpdateAutoSave) {
              setCheckUpdateAutoSave(false);
            }
          })
          .catch(() => {
            setAutoSaveEnabled(false);
          });
      }
    };
    fetchAutoSave();
  }, [checkUpdateAutoSave, settingsLoaded, setCheckUpdateAutoSave]);

  useEffect(() => {
    if (!enabled || !noteId || !autoSaveEnabled) return;
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

            const timeoutMs = autosaveIntervalMinutes * 60 * 1000;
            setTimeout(() => {
              const currentDraft = localStorage.getItem(`note-draft-${noteId}`);
              try {
                if (currentDraft) {
                  const parsedDraft = JSON.parse(currentDraft);
                  if (
                    JSON.stringify(parsedDraft) ===
                    JSON.stringify(lastSavedRef.current)
                  ) {
                    localStorage.removeItem(`note-draft-${noteId}`);
                  }
                }
              } catch {}
            }, timeoutMs);
          })
          .catch(() => {});
      }
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [note, enabled, noteId, autoSaveEnabled, delay]);

  return null;
}
