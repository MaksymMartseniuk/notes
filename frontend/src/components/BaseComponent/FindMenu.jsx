import api from "../../api";
import { useState, useEffect } from "react";
import "../../styles/findMenu.css";
import { ACCESS_TOKEN } from "../../constants";
import { useNavigate } from "react-router-dom";
export default function FindMenu({ onClose }) {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("title");
  const [results, setResults] = useState([]);
  const handleSearch = async () => {
    try {
      const res = await api.get("/notes-api/notes/search", {
        params: { query, filter },
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      });

      setResults(res.data);
    } catch (error) {
      console.error("Помилка при пошуку нотаток:", error);
      setResults([]);
    }
  };

  useEffect(() => {
    if (query.trim()) handleSearch();
    else setResults([]);
  }, [query, filter]);
  return (
    <>
      <div className="overlay-blur" onClick={onClose}></div>
      <div className="search-menu">
        <h1>Find notes</h1>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="title">Title</option>
            <option value="tag">Tag</option>
          </select>
        </div>
        <div className="search-results">
          {results.length > 0 ? (
            results.map((note) => (
              <div
                key={note.uuid}
                className="note-card"
                onClick={() => {
                  nav(`/notes/${note.uuid}`);
                  onClose();
                }}
              >
                <h3>{note.title}</h3>
                {note.is_deleted ? <p>Note is deleted</p> : <></>}
              </div>
            ))
          ) : (
            <p className="no-results">Нічого не знайдено</p>
          )}
        </div>
      </div>
    </>
  );
}
