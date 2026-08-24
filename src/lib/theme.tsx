"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "midnight" | "slate" | "light" | "synthwave";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "midnight",
  setTheme: () => {},
  toggleTheme: () => {},
});

// Provides persistent theme context and synchronizes HTML data-theme attribute
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>("midnight");

  // Synchronizes theme from localStorage on initial mount
  useEffect(() => {
    const saved = localStorage.getItem("docs_theme") as ThemeMode;
    if (saved && ["midnight", "slate", "light", "synthwave"].includes(saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "midnight");
    }
  }, []);

  // Sets active theme and persists to localStorage
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem("docs_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Cycles through available themes sequentially
  const toggleTheme = () => {
    const themes: ThemeMode[] = ["midnight", "slate", "light", "synthwave"];
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
