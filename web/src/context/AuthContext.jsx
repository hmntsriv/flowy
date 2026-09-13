import { createContext, useEffect, useState } from "react";
import socket from "../services/socket";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("flowy-user");

    return storedUser
      ? JSON.parse(storedUser)
      : null;
  });

  useEffect(() => {
    if (!token) {
      if (socket.connected) {
        socket.disconnect();
      }

      return;
    }

    socket.auth = {
      token,
    };

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect");
    };
  }, [token]);

  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);

    if (newUser) {
      localStorage.setItem(
        "flowy-user",
        JSON.stringify(newUser)
      );
    }

    setToken(newToken);
    setUser(newUser || null);
  };

  const logout = () => {
    socket.disconnect();

    localStorage.removeItem("token");
    localStorage.removeItem("flowy-user");

    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}