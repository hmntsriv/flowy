import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";

const ThemeContext = createContext(null);
const STORAGE_KEY = "flowy-theme-mode";

const LIGHT = {
  mode: "light",
  background: "#EEF4F8",
  backgroundStrong: "#E7EEF5",
  surface: "rgba(255,255,255,0.76)",
  surfaceSolid: "#FFFFFF",
  surfaceSoft: "rgba(255,255,255,0.58)",
  glassBorder: "rgba(255,255,255,0.82)",
  text: "#142033",
  textMuted: "#667085",
  textSoft: "#98A2B3",
  accent: "#3E7BF2",
  accentSoft: "rgba(62,123,242,0.12)",
  accentStrong: "#245FD1",
  iconButton: "rgba(255,255,255,0.72)",
  divider: "rgba(20,32,51,0.08)",
  input: "rgba(255,255,255,0.80)",
  activePill: "#142033",
  activePillText: "#FFFFFF",
  danger: "#C43D5B",
  dangerSoft: "rgba(196,61,91,0.10)",
  star: "#D99916",
  editorBackground: "#FFFFFF",
  editorText: "#172033",
  shadow: "rgba(37,53,78,0.12)",
};

const DARK = {
  mode: "dark",
  background: "#0B111A",
  backgroundStrong: "#111A27",
  surface: "rgba(20,29,42,0.82)",
  surfaceSolid: "#141D2A",
  surfaceSoft: "rgba(29,40,56,0.72)",
  glassBorder: "rgba(255,255,255,0.08)",
  text: "#F5F7FA",
  textMuted: "#AAB4C3",
  textSoft: "#748196",
  accent: "#79A9FF",
  accentSoft: "rgba(121,169,255,0.14)",
  accentStrong: "#9AC0FF",
  iconButton: "rgba(22,31,44,0.78)",
  divider: "rgba(255,255,255,0.08)",
  input: "rgba(21,30,43,0.86)",
  activePill: "#F5F7FA",
  activePillText: "#101722",
  danger: "#FF7F99",
  dangerSoft: "rgba(255,127,153,0.11)",
  star: "#F2C14E",
  editorBackground: "#111A27",
  editorText: "#F5F7FA",
  shadow: "rgba(0,0,0,0.32)",
};

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    let mounted = true;

    SecureStore.getItemAsync(STORAGE_KEY)
      .then((saved) => {
        if (mounted && (saved === "light" || saved === "dark")) {
          setMode(saved);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const setTheme = async (nextMode) => {
    const next = nextMode === "dark" ? "dark" : "light";
    setMode(next);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, next);
    } catch {}
  };

  const toggleTheme = () => setTheme(mode === "dark" ? "light" : "dark");

  const colors = mode === "dark" ? DARK : LIGHT;

  const value = useMemo(
    () => ({ mode, isDark: mode === "dark", colors, setTheme, toggleTheme }),
    [mode, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return value;
}
