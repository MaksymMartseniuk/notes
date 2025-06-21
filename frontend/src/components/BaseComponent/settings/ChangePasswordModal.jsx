import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../../../api";

export default function ChangePasswordModal({ onClose }) {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState(null);

  const handlePasswordCheck = async (e) => {
    e.preventDefault();

    if (!passwordRegex.test(newPassword)) {
      setError("New password does not meet complexity requirements.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      await api.post("/api/user/change_password/", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      
      onClose();
    } catch (err) {
      setError("Failed to change password. Please check current password.");
    }
  };

  useEffect(() => {
    if (
      error &&
      passwordRegex.test(newPassword) &&
      newPassword === confirmNewPassword
    ) {
      setError(null);
    }
  }, [newPassword, confirmNewPassword, error]);

  return (
    <>
      <div className="dark-overlay" onClick={onClose}></div>
      <div className="change-modal">
        <div className="change-modal-header">
          <div className="change-modal-header-title">
            <h3>Change Password</h3>
            <X className="change-modal-close" onClick={onClose} />
          </div>
        </div>
        <form
          autoComplete="off"
          onSubmit={handlePasswordCheck}
          className="change-modal-form"
        >
          <label htmlFor="currentPassword">Enter current password</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
            }}
            required
          ></input>
          <label htmlFor="newPassword">Enter new password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
            }}
            autoComplete="new-password"
            required
          ></input>
          <label htmlFor="confirmNewPassword">Enter confirm new password</label>
          <input
            type="password"
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
            }}
            autoComplete="new-password"
            required
          ></input>
          {error && <div className="form-error">{error}</div>}
          <button type="submit">Change Password</button>
        </form>
      </div>
    </>
  );
}
