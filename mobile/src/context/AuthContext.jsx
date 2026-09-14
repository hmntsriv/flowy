import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  DeviceEventEmitter,
} from "react-native";

import * as SecureStore from "expo-secure-store";

import api from "../services/api";
import {
  AUTH_EXPIRED_EVENT,
} from "../services/authEvents";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] =
    useState(null);

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    restoreSession();

    const subscription =
      DeviceEventEmitter.addListener(
        AUTH_EXPIRED_EVENT,
        async () => {
          await clearSession();
        },
      );

    return () => subscription.remove();
  }, []);

  const restoreSession = async () => {
    try {
      const storedToken =
        await SecureStore.getItemAsync(
          "flowy-token",
        );

      const storedUser =
        await SecureStore.getItemAsync(
          "flowy-user",
        );

      if (storedToken) {
        setToken(storedToken);
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error(
        "Failed to restore Flowy session:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    await SecureStore.deleteItemAsync(
      "flowy-token",
    );

    await SecureStore.deleteItemAsync(
      "flowy-user",
    );

    setToken(null);
    setUser(null);
  };

  const login = async (
    email,
    password,
  ) => {
    const response =
      await api.post(
        "/auth/login",
        {
          email,
          password,
        },
      );

    const {
      token: newToken,
      user: newUser,
    } = response.data;

    await SecureStore.setItemAsync(
      "flowy-token",
      newToken,
    );

    await SecureStore.setItemAsync(
      "flowy-user",
      JSON.stringify(newUser),
    );

    setToken(newToken);
    setUser(newUser);

    return response.data;
  };

  const logout = async () => {
    await clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}