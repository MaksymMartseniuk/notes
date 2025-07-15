import { useState, useEffect } from "react";
import api from "../../../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../../../constants";
export default function LogOutModal({ onClose }) {
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh");
    try {
      const response = await api.post(
        "api/user/logout/",
        { refresh: refreshToken },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <div className="dark-overlay" onClick={onClose}></div>
      <div className="logout-modal">
        <h3>Are you sure you want to log out?</h3>
        <div className="logout-modal-buttons">
          <button onClick={handleLogout}>Yes, log out</button>
          <button style={{ background: "gray" }} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
