"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "midnight" | "slate";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

// Provides persistent theme context and synchronizes HTML classes and attributes
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  // Applies active theme classes and attributes to document element
  const applyThemeToDOM = (mode: ThemeMode) => {
    document.documentElement.setAttribute("data-theme", mode);
    if (mode === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  // Synchronizes theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("docs_theme") as ThemeMode;
    if (saved && ["light", "dark", "midnight", "slate"].includes(saved)) {
      setThemeState(saved);
      applyThemeToDOM(saved);
    } else {
      setThemeState("dark");
      applyThemeToDOM("dark");
    }
  }, []);

  // Sets active theme and persists to localStorage
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem("docs_theme", newTheme);
    applyThemeToDOM(newTheme);
  };

  // Cycles through available themes sequentially
  const toggleTheme = () => {
    const themes: ThemeMode[] = ["dark", "light", "midnight", "slate"];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for consuming theme state and mutators
export const useTheme = () => useContext(ThemeContext);
