"use client";

import React, { useState, useRef, useEffect } from "react";
import { Moon, Sun, Monitor, Sparkles, Check, Palette } from "lucide-react";
import { useTheme, ThemeMode } from "@/lib/theme";
import { Button } from "@/components/ui/button";

interface ThemeOption {
  id: ThemeMode;
  name: string;
  icon: React.ElementType;
}

const themeOptions: ThemeOption[] = [
  { id: "dark", name: "Dark Mode", icon: Moon },
  { id: "light", name: "Light Mode", icon: Sun },
  { id: "midnight", name: "Midnight Obsidian", icon: Sparkles },
  { id: "slate", name: "Cyber Slate", icon: Monitor },
];

// Interactive theme switcher dropdown supporting clean Light, Dark, Midnight, and Slate modes
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
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        title="Toggle Theme"
      >
        <IconComponent className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-card border border-border shadow-xl p-1 z-50 text-xs font-sans animate-in fade-in zoom-in-95">
          <div className="px-2 py-1 text-[10px] uppercase font-semibold text-muted-foreground font-mono">
            Color Theme
          </div>

          <div className="space-y-0.5 mt-0.5">
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
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <OptIcon className="w-3.5 h-3.5" />
                    <span>{opt.name}</span>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
