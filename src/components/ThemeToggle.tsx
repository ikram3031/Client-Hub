"use client";

import React, { useState, useRef, useEffect } from "react";
import { Moon, Sun, Monitor, Palette, Sparkles, Check } from "lucide-react";
import { useTheme, ThemeMode } from "@/lib/theme";

interface ThemeOption {
  id: ThemeMode;
  name: string;
  icon: React.ElementType;
  accent: string;
  bg: string;
}

const themeOptions: ThemeOption[] = [
  { id: "midnight", name: "Midnight Dark", icon: Moon, accent: "#10b981", bg: "#090a0f" },
  { id: "slate", name: "Cyber Slate", icon: Monitor, accent: "#38bdf8", bg: "#0f172a" },
  { id: "synthwave", name: "Synthwave Violet", icon: Sparkles, accent: "#c084fc", bg: "#0e0a1a" },
  { id: "light", name: "Clean Light", icon: Sun, accent: "#059669", bg: "#ffffff" },
];

// Interactive theme switcher dropdown selector supporting multiple developer themes
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Closes dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeOption = themeOptions.find((t) => t.id === theme) || themeOptions[0];
  const IconComponent = activeOption.icon;

  return (
    <div className="relative select-none font-sans" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg theme-bg-card theme-bg-hover border theme-border text-xs theme-text-primary transition-all cursor-pointer shadow-xs"
        title="Change Theme"
        type="button"
      >
        <Palette className="w-3.5 h-3.5 theme-accent" />
        <span className="text-[11px] font-medium hidden sm:inline">{activeOption.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl theme-bg-card border theme-border shadow-2xl p-1.5 z-50 text-xs font-sans animate-in fade-in zoom-in-95">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold theme-text-muted font-mono">
            Theme Palette
          </div>

          <div className="space-y-0.5 mt-1">
            {themeOptions.map((opt) => {
              const OptIcon = opt.icon;
              const isSelected = opt.id === theme;

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "theme-accent-bg theme-accent font-semibold"
                      : "theme-text-secondary hover:theme-text-primary theme-bg-hover"
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20"
                      style={{ backgroundColor: opt.accent }}
                    />
                    <OptIcon className="w-3.5 h-3.5" />
                    <span>{opt.name}</span>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 theme-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
