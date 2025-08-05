import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faEllipsis,
  faPlus,
  faArrowDown,
  faArrowRight,
  faClockRotateLeft,
  faStar as faStarSolid,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { v4 as uuidv4, validate as validateUUID } from "uuid";
import { ACCESS_TOKEN } from "../constants";

import "../styles/Base.css";
import useUser from "../hooks/useUser";
import api from "../api";

import SettingsMenu from "./BaseComponent/SettingsMenu";
import DeleteMenu from "./BaseComponent/DeleteMenu";
import ContentMenu from "./BaseComponent/ContentMenu";
import VersionNote from "./BaseComponent/VersionNote";
import ImportSaveModal from "./BaseComponent/ImportSaveModal";
import FindMenu from "./BaseComponent/FindMenu";
import TagModal from "./BaseComponent/TagModal";
import { useParams } from "react-router-dom";

import NoteAccessContext from "../contexts/NoteAccessContext";

export default function Base() {
  const { user, loading } = useUser();
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const { pathname } = useLocation();
  const uuidMatch = pathname.match(/\/notes\/([0-9a-fA-F-]{36})/);
  const isUuidInPath = !!uuidMatch;
  const [selectedNoteUuid, setSelectedNoteUuid] = useState("");
  const [openSelectVersionNote, setOpenSelectVersionNote] = useState(false);
  const clockButtonRef = useRef(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [noteVersions, setNoteVersions] = useState([]);
  const [openContentMenu, setOpenContentMenu] = useState(false);
  const [contentMenuPosition, setContentMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const [selectedNoteContentMenu, setSelectedNoteContentMenu] = useState(null);
  const [openDeleteMenuNote, setOpenDeleteMenuNote] = useState(false);
  const [deleteMenuNotePosition, setDeleteMenuNotePosition] = useState({
    top: 0,
    left: 0,
  });

  const [deletedNotes, setDeletedNotes] = useState([]);
  const [openSettingsMenu, setOpenSettingsMenu] = useState(false);
  const [importSaveModalOpen, setImportSaveModalOpen] = useState(false);
  const [importSaveModalPosition, setimportSaveModalPosition] = useState({
    top: 0,
    left: 0,
  });

  const saveHandleRef = useRef(() => Promise.resolve());
  const [expandedNotes, setExpandedNotes] = useState({});

  const [findMenuOpen, setFindMenuOpen] = useState(false);
  const [openTagModal, setOpenTagModal] = useState(false);

  const { uuid, versionId } = useParams();
  const isReadOnly = Boolean(versionId);
  const navigate = useNavigate();

  const updatedNoteWithDraft = (note) => {
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

      if (Array.isArray(note.children) && note.children.length > 0) {
        updatedNote = {
          ...updatedNote,
          children: note.children.map(updatedNoteWithDraft),
        };
      }
    }
    return updatedNote;
  };

  const fetchNotes = async () => {
    await api
      .get("/notes-api/notes/")
      .then((res) => {
        const updatedNotes = res.data.map(updatedNoteWithDraft);
        console.log(res.data);
        setNotes(updatedNotes);
      })
      .catch((err) => console.error("Помилка отримання нотаток:", err));
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchDeletedNotes = () => {
    api
      .get("/notes-api/notes/deleted/")
      .then((res) => setDeletedNotes(res.data))
      .catch((err) =>
        console.error("Помилка завантаження видалених нотаток:", err)
      );
  };

  const fetchNoteVersions = (uuid) => {
    api
      .get(`/notes-api/notes/${uuid}/versions/`)
      .then((res) => {
        setNoteVersions(res.data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    if (isUuidInPath && selectedNoteUuid) {
      fetchNoteVersions(selectedNoteUuid);
    }
  }, [isUuidInPath, selectedNoteUuid]);

  useEffect(() => {
    if (versionId) return;

    const uuidFromPath = pathname.split("/").at(-1);
    if (!validateUUID(uuidFromPath)) {
      setNoteTitle("");
      setSelectedNoteUuid("");
      return;
    }
    const foundInNotes = notes.find((note) => note.uuid === uuidFromPath);
    const foundInDeletedNotes = deletedNotes.find(
      (note) => note.uuid === uuidFromPath
    );
    if (foundInNotes) {
      const bufferKey = `note-draft-${foundInNotes.uuid}`;
      const buffer = localStorage.getItem(bufferKey);
      const bufferedData = buffer ? JSON.parse(buffer) : null;
      const title = bufferedData?.title || foundInNotes.title;
      setNoteTitle(title);
      setIsFavorite(foundInNotes.is_favorite);
      setSelectedNoteUuid(foundInNotes.uuid);
      fetchNoteVersions(foundInNotes.uuid);
    } else if (foundInDeletedNotes) {
      setNoteTitle(foundInDeletedNotes.title);
      setIsFavorite(foundInDeletedNotes.is_favorite);
      setSelectedNoteUuid(foundInDeletedNotes.uuid);
      fetchNoteVersions(foundInDeletedNotes.uuid);
    } else {
      setSelectedNoteUuid(uuidFromPath);
      setNoteTitle("");
    }
  }, [uuid, versionId, notes, deletedNotes]);

  const toggleFavorite = async () => {
    if (!selectedNoteUuid) return;
    try {
      const updatedValue = !isFavorite;
      await api.put(`/notes-api/notes/${selectedNoteUuid}/`, {
        is_favorite: updatedValue,
      });
      setIsFavorite(updatedValue);

      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.uuid === selectedNoteUuid
            ? { ...note, is_favorite: updatedValue }
            : note
        )
      );
    } catch (error) {
      console.error("Failed to update favorite status", error);
    }
  };

  const handleClockButtonClick = () => {
    if (clockButtonRef.current) {
      const rect = clockButtonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setOpenSelectVersionNote(true);
  };

  const handleImportSaveButtonClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setimportSaveModalPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });

    setImportSaveModalOpen(true);
  };

  const handleDeleteButtonClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    setDeleteMenuNotePosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });

    setOpenDeleteMenuNote(true);
  };

  const handleCreateNote = () => {
    const newNoteId = uuidv4();
    api
      .post(
        `/notes-api/notes/${newNoteId}/`,
        { title: "Нова нотатка", content: "" },
        { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
      )
      .then((res) => {
        const createdNote = res.data;
        setNotes((prev) => [createdNote, ...prev]);
        navigate(`/notes/${createdNote.uuid}`);
      })
      .catch((err) => console.error("Помилка створення нотатки:", err));
  };
  const handleCreateSubNote = (parentId) => {
    const newNoteId = uuidv4();
    api
      .post(
        `/notes-api/notes/${newNoteId}/`,
        { title: "Нова піднотатка", content: "", parent: parentId },
        { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
      )
      .then((res) => {
        const createdNote = res.data;
        setNotes((prev) => [createdNote, ...prev]);
        navigate(`/notes/${createdNote.uuid}`);
      })
      .catch((err) => console.error("Помилка створення піднотатки:", err));
  };
  const handleContentMenuClick = (e, uuid) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContentMenuPosition({
      top: rect.top + window.scrollY,
      left: rect.right + window.scrollX,
    });
    setSelectedNoteContentMenu(uuid);
    setOpenContentMenu(true);
  };
  const handleDeleteNote = (uuid) => {
    if (!uuid) return;
    api
      .delete(`/notes-api/notes/${uuid}/`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      })
      .then(() => {
        setNotes((prevNotes) => prevNotes.filter((note) => note.uuid !== uuid));
        if (isUuidInPath && selectedNoteUuid === uuid) {
          navigate("/notes");
        }
        setOpenContentMenu(false);
        setSelectedNoteContentMenu(null);
      })
      .catch((err) => console.error("Помилка видалення нотатки:", err));
  };
  const handleRestoreNote = (uuid) => {
    if (!uuid) return;

    api
      .post(
        `/notes-api/notes/${uuid}/restore/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        }
      )
      .then(() => {
        fetchDeletedNotes();
        fetchNotes();
        setOpenDeleteMenuNote(false);
      })
      .catch((err) => console.error("Помилка відновлення нотатки:", err));
  };

  const registerSaveHandle = (fn) => {
    saveHandleRef.current = fn;
  };

  const handleSaveHandle = async () => {
    try {
      await saveHandleRef.current();
    } catch (error) {
      console.error("Error executing save handle:", error);
    }
  };

  const toggleChildren = (id, e) => {
    e.stopPropagation();
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExportToPDF = async () => {
    try {
      const response = await api.get(
        `/notes-api/notes/${selectedNoteUuid}/export/pdf/`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${noteTitle || "note"}.pdf`;
      link.click();
    } catch (error) {
      console.error("Помилка експорту у PDF:", error);
    }
  };
  const handleExportToWord = async () => {
    try {
      const response = await api.get(
        `/notes-api/notes/${selectedNoteUuid}/export/word/`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${noteTitle || "note"}.docx`;
      link.click();
    } catch (error) {
      console.error("Помилка експорту у Word:", error);
    }
  };
  if (loading) return;
  if (!user) return;

  return (
    <NoteAccessContext.Provider value={{ isReadOnly }}>
      <div className="container">
        <nav className="sidebar-container">
          <div className="notes-sidebar-swicher">
            <span className="notes-sidebar-username">
              {user.username.length > 15
                ? user.username.slice(0, 15) + "..."
                : user.username}
            </span>
            <button
              className="notes-sidebar-swicher-button"
              onClick={handleCreateNote}
            >
              <FontAwesomeIcon icon={faPen} className="button-icon" />
            </button>
          </div>

          <div className="notes-sidebar-menu">
            <ul className="top-list">
              <li onClick={() => setFindMenuOpen(true)}>Search</li>
              <li>
                <Link to="/notes">Home</Link>
              </li>
            </ul>

            <h1>Private</h1>
            <ul className="notes-sidebar-menu">
              {notes.map((note) => (
                <li key={note.id}>
                  <div
                    className="note-sidebar-item"
                    onClick={() => navigate(`/notes/${note.uuid}`)}
                  >
                    <span className="note-sidebar-item-title">
                      {note.title.length > 15
                        ? note.title.slice(0, 15) + "…"
                        : note.title}
                    </span>

                    <div className="icons-wrapper">
                      {Array.isArray(note.children) &&
                        note.children.length > 0 && (
                          <FontAwesomeIcon
                            className="button-icon note-sidebar-icon"
                            icon={
                              expandedNotes[note.id]
                                ? faArrowDown
                                : faArrowRight
                            }
                            onClick={(e) => toggleChildren(note.id, e)}
                          />
                        )}

                      {!openContentMenu && (
                        <FontAwesomeIcon
                          icon={faEllipsis}
                          className="note-sidebar-icon button-icon"
                          onClick={(e) => {
                            setOpenContentMenu(true);
                            handleContentMenuClick(e, note.uuid);
                          }}
                        />
                      )}

                      {!openContentMenu && (
                        <FontAwesomeIcon
                          icon={faPlus}
                          className="note-sidebar-icon button-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateSubNote(note.id);
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {expandedNotes[note.id] && note.children.length > 0 && (
                    <ul>
                      {note.children.map((child) => (
                        <li key={child.uuid}>
                          <div
                            className="note-sidebar-item"
                            onClick={() => navigate(`/notes/${child.uuid}`)}
                          >
                            <span className="note-sidebar-item-title">
                              {child.title.length > 15
                                ? child.title.slice(0, 15) + "…"
                                : child.title}
                            </span>
                            <div className="icons-wrapper">
                              <FontAwesomeIcon
                                icon={faEllipsis}
                                className="note-sidebar-icon button-icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleContentMenuClick(e, child.uuid);
                                }}
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>

            <ul className="bottom-list top-list">
              <li
                onClick={(e) => {
                  setOpenSettingsMenu(true);
                }}
              >
                Settings
              </li>
              <li
                onClick={(e) => {
                  handleDeleteButtonClick(e);
                  fetchDeletedNotes();
                }}
              >
                Trash
              </li>
            </ul>
          </div>
        </nav>

        <div className="div-content">
          {isUuidInPath && (
            <header className="header-notes-container">
              <h2 className="header-notes-title">
                {noteTitle.length > 25
                  ? noteTitle.slice(0, 25) + "…"
                  : noteTitle}
              </h2>
              <div className="header-note-icons">
                <FontAwesomeIcon
                  className="button-icon"
                  icon={faClockRotateLeft}
                  ref={clockButtonRef}
                  onClick={handleClockButtonClick}
                  style={{ cursor: "pointer" }}
                />
                <FontAwesomeIcon
                  className="button-icon"
                  icon={isFavorite ? faStarSolid : faStarRegular}
                  onClick={toggleFavorite}
                  style={{
                    cursor: "pointer",
                    color: isFavorite ? "gold" : "white",
                  }}
                />
                <FontAwesomeIcon
                  className="button-icon"
                  icon={faEllipsis}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    handleImportSaveButtonClick(e);
                  }}
                />
              </div>
            </header>
          )}

          <main className="main-notes-container">
            <Outlet
              context={{
                fetchNotes,
                registerSaveHandle,
                notes,
                setNotes,
                selectedNoteUuid,
                setNoteTitle,
              }}
            />
          </main>
        </div>

        {openSelectVersionNote && (
          <VersionNote
            position={popoverPosition}
            versions={noteVersions}
            selectedUuid={selectedNoteUuid}
            onClose={() => setOpenSelectVersionNote(false)}
          />
        )}

        {openContentMenu && (
          <ContentMenu
            position={contentMenuPosition}
            selectedUuid={selectedNoteContentMenu}
            onClose={() => setOpenContentMenu(false)}
            onDelete={handleDeleteNote}
            setOpenTagModal={setOpenTagModal}
          />
        )}

        {openDeleteMenuNote && (
          <DeleteMenu
            position={deleteMenuNotePosition}
            deletedNotes={deletedNotes}
            onClose={() => setOpenDeleteMenuNote(false)}
            onRestore={handleRestoreNote}
            onNavigate={(uuid) => navigate(`/notes/${uuid}`)}
          />
        )}

        {openSettingsMenu && (
          <SettingsMenu onClose={() => setOpenSettingsMenu(false)} />
        )}
        {importSaveModalOpen && (
          <ImportSaveModal
            position={importSaveModalPosition}
            onClose={() => setImportSaveModalOpen(false)}
            onSave={handleSaveHandle}
            onImportWord={handleExportToWord}
            onImportPDF={handleExportToPDF}
          />
        )}

        {findMenuOpen && (
          <FindMenu
            onClose={() => {
              setFindMenuOpen(false);
            }}
          ></FindMenu>
        )}

        {openTagModal && (
          <TagModal
            onClose={() => {
              setOpenTagModal(false);
            }}
            selectedUuid={selectedNoteContentMenu}
          ></TagModal>
        )}
      </div>
    </NoteAccessContext.Provider>
  );
}
