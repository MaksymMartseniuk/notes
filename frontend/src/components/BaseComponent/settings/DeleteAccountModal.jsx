import { useState } from "react";
import api from "../../../api";
import "../../../styles/settings.css";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../../../constants";

export default function DeleteAccountModal({ onClose }) {
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    const accessToken = localStorage.getItem('access');
    try {
      await api.post("/api/users/delete_account/", { password: password }, {headers: {
        Authorization: `Bearer ${accessToken}`,}
      });
      localStorage.clear();
      navigate("/");
    } catch (err) {
      setError("Невірний пароль або помилка сервера.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="dark-overlay" onClick={onClose}></div>

      <div className="delete-account-modal">
        <h3>Are you sure you want to delete your account? This action cannot be undone.</h3>

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="delete-account-input"
        />

        {error && <p className="delete-account-error">{error}</p>}

        <div className="logout-modal-buttons">
          <button
            onClick={handleDelete}
            disabled={!password || isDeleting}
            className="delete-account-confirm"
          >
            {isDeleting ? "Deleting..." : "Yes, delete account"}
          </button>

          <button
            style={{ background: "gray" }}
            onClick={onClose}
            className="delete-account-cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
