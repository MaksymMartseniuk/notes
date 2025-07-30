import React, { useState, useEffect, useCallback } from "react";
import UserContext from "./UserContexts.jsx";
import { useLocation } from "react-router-dom";
import api from "../../api.js";
import { ACCESS_TOKEN } from "../../constants";

const EXCLUDED_PATHS = import.meta.env.VITE_REACT_APP_EXCLUDED_PATHS?.split(",") || [];

const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const location = useLocation();

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setChecked(true);
      return;
    }

    try {
      const res = await api.get("api/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(res.data);
    } catch (error) {
      console.error("Не вдалося отримати профіль:", error);
      localStorage.removeItem(ACCESS_TOKEN);
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const matchExcluded = EXCLUDED_PATHS.some((p) => {
      if (p.includes(":")) {
        // динамічні маршрути типу /reset-password/:uid/:token
        const regex = new RegExp(
          "^" + p.replace(/:[^/]+/g, "[^/]+") + "$"
        );
        return regex.test(path);
      }
      return p === path;
    });

    if (!matchExcluded) {
      loadUser();
    } else {
      setChecked(true);
    }
  }, [location.pathname, loadUser]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem(ACCESS_TOKEN);
  };

  if (!checked) return null;

  return (
    <UserContext.Provider value={{ user, setUser, logout, loadUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;
