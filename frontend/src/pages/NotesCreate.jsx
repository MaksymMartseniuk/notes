import { useState, useEffect, useRef, use } from "react";
import { useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";
import "../styles/NotesCreate.css";
import "../styles/Tiptap.css";
import { createPortal } from "react-dom";
import useNoteBuffer from "../hooks/useNoteBuffer";

export default function NotesCreate() {
  const { fetchNotes, registerSaveHandle } = useOutletContext();
  const { uuid, versionId } = useParams();
  const [note, setNote] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [slashCommandOpen, setSlashCommandOpen] = useState(false);
  const [slashCommandPosition, setSlashCommandPosition] = useState({
    x: 0,
    y: 0,
  });
  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [imageMenuPosition, setImageMenuPosition] = useState({ x: 0, y: 0 });
  const [imageMode, setImageMode] = useState("url");
  const [imageUrl, setImageUrl] = useState("");

  const titleRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: note.content || "",
    onUpdate: ({ editor }) => {
      setNote((prev) => ({ ...prev, content: editor.getHTML() }));
    },
    onCreate: ({ editor }) => {
      editor.view.dom.addEventListener("keydown", (event) => {
        if (event.key === "/") {
          const { from } = editor.state.selection;
          const coords = editor.view.coordsAtPos(from);
          const editorRect =
            editor.view.dom.parentElement.getBoundingClientRect();

          setSlashCommandPosition({ x: coords.left, y: coords.bottom });
          setImageMenuPosition({
            x: coords.left - editorRect.left,
            y: coords.bottom - editorRect.top + 30,
          });

          setSlashCommandOpen(true);
        } else {
          setSlashCommandOpen(false);
          setImageMenuOpen(false);
        }
      });
    },
  });

  useEffect(() => {
    if (!uuid) return;
    const endpoint =versionId?`/notes-api/notes/${uuid}/versions/${versionId}/`: `/notes-api/notes/${uuid}/`;
    api
      .get(endpoint, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      })
      .then((res) => {
        setNote(res.data);
        setLoading(true);
        fetchNotes();
      })
      .catch((err) => console.error("Помилка завантаження нотатки:", err));
  }, [uuid]);

  useNoteBuffer(uuid, note, loading);

  useEffect(() => {
    if (editor && note.content !== editor.getHTML()) {
      editor.commands.setContent(note.content || "");
    }
  }, [note.content, uuid, editor]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSlashCommandOpen(false);
        setImageMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const insertCommand = (type) => {
    if (!editor) return;
    const { state, commands } = editor;
    const { from } = state.selection;

    const textBefore = state.doc.textBetween(from - 1, from, "\n", "\n");

    if (textBefore === "/") {
      commands.command(({ tr }) => {
        tr.delete(from - 1, from);
        return true;
      });
    }

    switch (type) {
      case "Heading 1":
        editor.commands.setNode("heading", { level: 1 });
        break;
      case "Heading 2":
        editor.commands.setNode("heading", { level: 2 });
        break;
      case "Heading 3":
        editor.commands.setNode("heading", { level: 3 });
        break;
      case "Heading 4":
        editor.commands.setNode("heading", { level: 4 });
        break;
      case "Bullet list":
        editor.commands.toggleBulletList();
        break;
      case "Цитата":
        editor.commands.setBlockquote();
        break;
      case "Image":
        setSlashCommandOpen(false);
        setImageMenuOpen(true);
        break;
      default:
        break;
    }

    setSlashCommandOpen(false);
  };
  const saveHandle = useCallback(async () => {
    await api
      .put(
        `/notes-api/notes/${uuid}/?force_save=true`,
        {
          ...note,
          title: note.title || "Нова нотатка",
        },
        {
          headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        }
      )
      .then(fetchNotes)
      .catch(() => {});
  }, [uuid, note, fetchNotes]);
  
  useEffect(() => {
    registerSaveHandle(saveHandle);
    return () => registerSaveHandle(() => Promise.resolve());
  }, [registerSaveHandle, saveHandle]);
  return (
    <div className="notes-create-container hide-scrollbar">
      <textarea
        ref={titleRef}
        className="note-title hide-scrollbar"
        value={note.title}
        onChange={(e) => setNote({ ...note, title: e.target.value })}
        placeholder="Заголовок"
        rows={1}
      />

      <div className="note-content">
        <EditorContent editor={editor} className="note-editor" />

        {slashCommandOpen &&
          createPortal(
            <div
              className="slash-menu"
              style={{
                position: "absolute",
                left: slashCommandPosition.x,
                top: slashCommandPosition.y,
              }}
            >
              <div className="slash-menu-content">
                <div className="slash-menu-scroll">
                  <div className="slash-menu-group">
                    <div className="slash-menu-group-title">Основні</div>
                    <div onClick={() => insertCommand("Heading 1")}>
                      Heading 1
                    </div>
                    <div onClick={() => insertCommand("Heading 2")}>
                      Heading 2
                    </div>
                    <div onClick={() => insertCommand("Heading 3")}>
                      Heading 3
                    </div>
                    <div onClick={() => insertCommand("Heading 4")}>
                      Heading 4
                    </div>
                    <div onClick={() => insertCommand("Bullet list")}>
                      Bullet list
                    </div>
                    <div onClick={() => insertCommand("Цитата")}>Цитата</div>
                  </div>
                  <div className="slash-menu-group">
                    <div className="slash-menu-group-title">Медіа</div>
                    <div onClick={() => insertCommand("Image")}>Image</div>
                  </div>
                </div>
                <div
                  className="slash-menu-footer"
                  onClick={() => setSlashCommandOpen(false)}
                >
                  Натисни ESC
                </div>
              </div>
            </div>,
            document.body
          )}

        {imageMenuOpen && (
          <div
            className="image-menu"
            style={{
              position: "absolute",
              left: imageMenuPosition.x,
              top: imageMenuPosition.y,
            }}
          >
            <div className="image-menu-content">
              <button
                className="image-menu-buttons-choses"
                onClick={() => setImageMode("url")}
                disabled={imageMode === "url"}
              >
                З URL
              </button>
              <button
                className="image-menu-buttons-choses"
                onClick={() => setImageMode("upload")}
                disabled={imageMode === "upload"}
              >
                З ПК
              </button>
            </div>
            {imageMode === "url" ? (
              <input
                className="image-menu-input-url"
                type="text"
                placeholder="http://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && imageUrl && editor) {
                    editor.commands.setImage({ src: imageUrl });
                    setImageMenuOpen(false);
                    setImageUrl("");
                  }
                }}
                onBlur={() => {
                  if (imageUrl && editor) {
                    editor.commands.setImage({ src: imageUrl });
                    setImageMenuOpen(false);
                    setImageUrl("");
                  }
                }}
              />
            ) : (
              <label className="image-menu-input-file">
                Завантажити з ПК
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (editor) {
                        editor.commands.setImage({ src: reader.result });
                        setImageMenuOpen(false);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
