import { useState } from "react";
import { X } from "lucide-react";
import api from "../../../api";

export default function ChangeUsernameModal({ username, onClose }) {
  const [newUsername, setNewUsername] = useState("");
  const handleChangeUsername = async (e) => {
    e.preventDefault();
    try {
      await api.put("/api/user/change_username/", {
        username: newUsername,
      });
    } catch (ex) {}
  };
  return (
    <>
      <div className="dark-overlay" onClick={onClose}></div>
      <div className="change-modal">
        <div className="change-modal-header">
          <div className="change-modal-header-title">
            <h3>Change Username</h3>
            <X className="change-modal-close" onClick={onClose} />
          </div>
          <p>Your current username is {username}</p>
        </div>

        <form onSubmit={handleChangeUsername} className="change-modal-form">
          <label htmlFor="newUsername">Enter new username</label>
          <input
            type="text"
            id="newUsername"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={!newUsername || newUsername === username}
          >
            Change username
          </button>
        </form>
      </div>
    </>
  );
}
