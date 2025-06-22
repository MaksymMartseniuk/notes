import { useState, useEffect } from "react";
import api from "../../../api";
import ChangeEmailModal from "./changeEmailModal";
import ChangePasswordModal from "./ChangePasswordModal";
import ChangeUsernameModal from "./ChangeUsernameModal";

export default function AccountSecurity() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [showUsernameModal, setUsernameModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("api/user/me");
        setEmail(response.data.email);
        setUsername(response.data.username);
      } catch (error) {
        console.error("Помилка при отриманні email користувача:", error);
      }
    };
    fetchUser();
  }, []);

  return (
  <div className="account-security">
    <h3>Account security</h3>

    <div className="security-row">
      <div>
        <p className="security-label">Username</p>
        <p className="security-value">{username}</p>
      </div>
      <button onClick={() => setUsernameModal(true)}>Change username</button>
    </div>

    <div className="security-row">
      <div>
        <p className="security-label">Email</p>
        <p className="security-value">{email}</p>
      </div>
      <button onClick={() => setShowEmailModal(true)}>Change email</button>
    </div>

    <div className="security-row">
      <div>
        <p className="security-label">Password</p>
        <p className="security-description">
          Change your password to login to your account.
        </p>
      </div>
      <button onClick={() => setShowPasswordModal(true)}>
        Change password
      </button>
    </div>

    {showUsernameModal && (
      <ChangeUsernameModal
        username={username}
        onClose={() => setUsernameModal(false)}
      />
    )}

    {showEmailModal && (
      <ChangeEmailModal
        email={email}
        onClose={() => setShowEmailModal(false)}
      />
    )}

    {showPasswordModal && (
      <ChangePasswordModal
        onClose={() => setShowPasswordModal(false)}
      />
    )}
  </div>
);

}
