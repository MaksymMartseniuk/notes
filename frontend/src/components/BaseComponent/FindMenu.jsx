import api from "../../api";
import { useState, useEffect } from "react";
import "../../styles/findMenu.css";
import { ACCESS_TOKEN } from "../../constants";
export default function FindMenu({ onClose }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("title");
  const [results, setResults] = useState([]);
  const handleSearch = async () => {
    // make a api for search 
    const res = await api.get("/notes-api/notes/search", {
      params: { query, filter },
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    setResults(res.data)
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
              <div key={note.uuid} className="note-card">
                <h3>{note.title}</h3>
                <p>{note.preview || note.content?.slice(0, 100)}...</p>
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
