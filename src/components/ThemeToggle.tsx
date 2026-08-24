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
  { id: "midnight", name: "Midnight Obsidian", icon: Moon, accent: "#10b981", bg: "#050508" },
  { id: "slate", name: "Cyber Slate", icon: Monitor, accent: "#38bdf8", bg: "#0f172a" },
  { id: "synthwave", name: "Synthwave Violet", icon: Sparkles, accent: "#a855f7", bg: "#0d0915" },
  { id: "light", name: "Clean Light", icon: Sun, accent: "#059669", bg: "#ffffff" },
];

// Interactive Theme Switcher dropdown selector supporting multiple developer themes
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs"
        title="Change Theme"
      >
        <Palette className="w-3.5 h-3.5 text-zinc-400" />
        <span className="hidden sm:inline text-[11px] font-medium">{activeOption.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-1.5 z-50 text-xs font-sans animate-in fade-in zoom-in-95">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-semibold text-zinc-500 font-mono">
            Select Color Theme
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
                      ? "bg-zinc-800 text-white font-medium"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/20"
                      style={{ backgroundColor: opt.accent }}
                    />
                    <OptIcon className="w-3.5 h-3.5" />
                    <span>{opt.name}</span>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
