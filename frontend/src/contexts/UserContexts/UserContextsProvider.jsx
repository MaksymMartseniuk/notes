import React, { useState,useEffect } from "react";
import UserContext from "./UserContexts.jsx";
import api from "../../api.js";
import { ACCESS_TOKEN,REFRESH_TOKEN } from "../../constants";

const UserContextProvider = ({ children }) => {
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const Profile = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('api/user/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data);
      } catch (error) {
        console.error("Не вдалося отримати профіль:", error);
        localStorage.removeItem("access_token");
      } finally {
        setLoading(false);
      }
    };
    Profile();
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("access_token");
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;