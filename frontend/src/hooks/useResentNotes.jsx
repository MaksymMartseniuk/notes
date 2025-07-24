import { useEffect, useState } from "react";
import api from "../api";
const getResentNotes = async () => {
  const res = await api.get("notes-api/recently-viewed/");
  return res.data.map((item) => item.note.uuid);
};
const getDraftFromBuffer = (note) => {
  const bufferKey = `note-draft-${note.uuid}`;
  const draft = localStorage.getItem(bufferKey);
  let updatedNote = note;

  if (draft) {
    try {
      const parsedDraft = JSON.parse(draft);
      if (parsedDraft.title && parsedDraft.title !== note.title) {
        updatedNote = { ...updatedNote, title: parsedDraft.title };
      }
    } catch (e) {
      console.error("Помилка парсингу чернетки:", e);
    }
  }

  if (Array.isArray(note.children) && note.children.length > 0) {
    updatedNote = {
      ...updatedNote,
      children: note.children.map(getDraftFromBuffer),
    };
  }

  return updatedNote;
};

const findNoteByUuid = (notes, uuid) => {
  for (const note of notes) {
    if (note.uuid === uuid) {
      return note;
    }
    if (Array.isArray(note.children)) {
      const found = findNoteByUuid(note.children, uuid);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

export default function useResentNotes() {
  const [recentNotes, setRecentNotes] = useState([]);
  useEffect(() => {
    const fetchRecentNotes = async () => {
      const recentUuids = await getResentNotes();
      console.log(recentUuids);
      const response = await api.get("/notes-api/notes/");
      const allNotes = response.data.map(getDraftFromBuffer);

      const viewedNotes = Array.isArray(recentUuids)
        ? recentUuids
            .map((uuid) => findNoteByUuid(allNotes, uuid))
            .filter(Boolean)
        : [];
      const additionalNotes = allNotes
        .filter((note) => !recentUuids.includes(note.uuid))
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      const combined = [...viewedNotes, ...additionalNotes].slice(0, 10);
      setRecentNotes(combined);
    };
    fetchRecentNotes();
  }, []);
  return recentNotes;
}
