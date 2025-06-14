import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faEllipsis,
  faPlus,
  faArrowDown,
  faClockRotateLeft,
  faStar as faStarSolid,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { v4 as uuidv4, validate as validateUUID } from "uuid";
import { ACCESS_TOKEN } from "../constants";

import "../styles/Base.css";
import useUser from "../hooks/useUser";
import api from "../api";

export default function Base() {
  const { user, loading } = useUser();
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const { pathname } = useLocation();
  const lastPathSegment = pathname.split("/").at(-1);
  const isUuidInPath = validateUUID(lastPathSegment);
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
  const contentMenuRef = useRef(null);
  const [selectedNoteContentMenu, setSelectedNoteContentMenu] = useState(null);
  const [openDeleteMenuNote, setOpenDeleteMenuNote] = useState(false);
  const [deleteMenuNotePosition, setDeleteMenuNotePosition] = useState({
    top: 0,
    left: 0,
  });
  const deleteMenuRef = useRef(null);
  const [deletedNotes, setDeletedNotes] = useState([]);
  const navigate = useNavigate();

  const fetchNotes = () => {
    api
      .get("/notes-api/notes/")
      .then((res) => setNotes(res.data))
      .catch((err) => console.error(err));
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
      setNoteTitle(foundInNotes.title);
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
  }, [pathname, notes]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contentMenuRef.current &&
        !contentMenuRef.current.contains(event.target)
      ) {
        setOpenContentMenu(false);
      }
    };

    if (openContentMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openContentMenu]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        deleteMenuRef.current &&
        !deleteMenuRef.current.contains(event.target)
      ) {
        setOpenDeleteMenuNote(false);
      }
    };

    if (openDeleteMenuNote) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDeleteMenuNote]);
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

  if (loading) return;
  if (!user) return;

  return (
    <div className="container">
      <nav className="sidebar-container">
        <div className="notes-sidebar-swicher">
          <span className="notes-sidebar-username">{user.username}</span>
          <button
            className="notes-sidebar-swicher-button"
            onClick={handleCreateNote}
          >
            <FontAwesomeIcon icon={faPen} />
          </button>
        </div>

        <div className="notes-sidebar-menu">
          <ul>
            <li>Search</li>
            <li>
              <Link to="/notes">Home</Link>
            </li>
          </ul>

          <h1>Private</h1>
          <ul>
            {notes.map((note) => (
              <li key={note.id} onClick={() => navigate(`/notes/${note.uuid}`)}>
                {note.title.length > 15
                  ? note.title.slice(0, 15) + "…"
                  : note.title}
                <div className="icons-wrapper">
                  {/* 
                  <FontAwesomeIcon
                    icon={faArrowDown}
                    className="note-sidebar-icon"
                    onClick={(e) => e.stopPropagation()}
                  /> 
                  */}

                  {!openContentMenu && (
                    <FontAwesomeIcon
                      icon={faEllipsis}
                      className="note-sidebar-icon"
                      onClick={(e) => {
                        setOpenContentMenu(true);
                        handleContentMenuClick(e, note.uuid);
                      }}
                    />
                  )}
                  {!openContentMenu && (
                    <FontAwesomeIcon
                      icon={faPlus}
                      className="note-sidebar-icon"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          <h1>Public</h1>
          <ul>
            <li>Note A</li>
            <li>Note B</li>
          </ul>

          <ul className="bottom-list">
            <li>Settings</li>
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
              {noteTitle.length > 25 ? noteTitle.slice(0, 25) + "…" : noteTitle}
            </h2>
            <div className="header-note-icons">
              <FontAwesomeIcon
                icon={faClockRotateLeft}
                ref={clockButtonRef}
                onClick={handleClockButtonClick}
                style={{ cursor: "pointer" }}
              />
              <FontAwesomeIcon
                icon={isFavorite ? faStarSolid : faStarRegular}
                onClick={toggleFavorite}
                style={{
                  cursor: "pointer",
                  color: isFavorite ? "gold" : "gray",
                }}
              />
            </div>
          </header>
        )}

        <main className="main-notes-container">
          <Outlet context={{ fetchNotes }} />
        </main>
      </div>

      {openSelectVersionNote && (
        <div
          className="popover-version-window"
          style={{
            top: popoverPosition.top + 10,
            left: popoverPosition.left - 220,
          }}
        >
          <h4>Версії нотатки</h4>
          <ul>
            {noteVersions.map((version) => (
              <li
                key={version.id}
                onClick={() => {
                  navigate(`/notes/${selectedNoteUuid}/versions/${version.id}`);
                  setOpenSelectVersionNote(false);
                }}
              >
                {new Date(version.created_at).toLocaleDateString()} -{" "}
                {version.title.length > 20
                  ? version.title.slice(0, 20) + "…"
                  : version.title}
              </li>
            ))}
          </ul>
          <button onClick={() => setOpenSelectVersionNote(false)}>
            Закрити
          </button>
        </div>
      )}

      {openContentMenu && (
        <div
          className="content-menu"
          ref={contentMenuRef}
          style={{
            top: contentMenuPosition.top,
            left: contentMenuPosition.left,
          }}
        >
          <ul className="content-menu-list">
            <li
              className="content-menu-list-item"
              onClick={() => handleDeleteNote(selectedNoteContentMenu)}
            >
              Видалити
            </li>
          </ul>
        </div>
      )}

      {openDeleteMenuNote && (
        <div
          className="delete-menu"
          ref={deleteMenuRef}
          style={{
            top: deleteMenuNotePosition.top - 200,
            left: deleteMenuNotePosition.left + 200,
          }}
        >
          <p className="delete-menu-header">Deleted notes</p>

          <div className="delete-menu-scroll-container">
            <ul className="delete-menu-list">
              {deletedNotes.map((note) => (
                <span key={note.uuid} className="delete-menu-list-item-wrapper">
                  <li
                    className="delete-menu-list-item"
                    onClick={() => {
                      setOpenDeleteMenuNote(false);
                      navigate(`/notes/${note.uuid}`);
                    }}
                  >
                    {note.title.length > 20
                      ? note.title.slice(0, 20) + "…"
                      : note.title}
                  </li>
                  <button
                    className="delete-menu-restore-button"
                    onClick={() => handleRestoreNote(note.uuid)}
                  >
                    Відновити
                  </button>
                </span>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
