import "../styles/Notes.css";
import { useEffect, useState } from "react";
import useUser from "../hooks/useUser";
import api from "../api";
import { useNavigate } from "react-router-dom";
import useResentNotes from "../hooks/useResentNotes";
export default function Notes() {
  const [greeting, setGreeting] = useState("");
  const { user, loading } = useUser();
  const navigate = useNavigate();
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning,");
    } else if (hour < 18) {
      setGreeting("Good afternoon,");
    } else {
      setGreeting("Good evening,");
    }
  }, []);

const recentNotes = useResentNotes();
  if (loading) return <p>Завантаження...</p>;
  if (!user) return <p>Неавторизований користувач</p>;

  return (
    <div className="notes-container">
      <div className="notes-main">
        <div className="notes-greeting">
          <h1 className="user-greeting">
            {greeting} {user.username}!
          </h1>
        </div>
        <div className="notes-recent">
          <h2 className="recent-title">Recently visited</h2>
          <div className="recent-grid">
            {recentNotes.length === 0 ? (
              <p>No recently viewed notes.</p>
            ) : (
              recentNotes.map((note) => (
                <div
                  key={note.uuid}
                  className="recent-note-card"
                  onClick={() => {
                    navigate(`/notes/${note.uuid}`);
                  }}
                >
                  <h3 className="recent-note-title">
                    {note.title || "Untitled"}
                  </h3>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
