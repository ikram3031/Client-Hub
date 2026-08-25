"use client";

import React from "react";
import {
  Menu,
  X,
  Search,
  BookOpen,
  Terminal,
  Sparkles,
  Plus,
  Layers,
  ArrowUpRight,
  Database,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Project } from "@/lib/api";

interface TopNavbarProps {
  activeProject: Project;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onNavigateHome: () => void;
  onNavigateLogs: () => void;
  onNavigateFeatures: () => void;
  onOpenSearch: () => void;
  onOpenNewDocModal: () => void;
}

// Global top navigation bar with project switcher context, quick navigation links, and theme toggle
export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeProject,
  mobileMenuOpen,
  onToggleMobileMenu,
  onNavigateHome,
  onNavigateLogs,
  onNavigateFeatures,
  onOpenSearch,
  onOpenNewDocModal,
}) => {
  return (
    <header className="h-14 px-4 md:px-6 border-b theme-border theme-bg-secondary flex items-center justify-between shrink-0 z-20 select-none font-sans shadow-2xs">
      {/* Left: Mobile Toggle & Project Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg theme-bg-card border theme-border theme-text-primary hover:theme-bg-hover transition-colors"
          type="button"
          aria-label="Toggle Navigation Drawer"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        <div
          onClick={onNavigateHome}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="flex items-center gap-2 font-black text-sm md:text-base tracking-tight theme-text-primary group-hover:theme-accent transition-colors">
            <span className="text-lg">📖</span>
            <span className="font-extrabold tracking-tight">docsNlogs</span>
          </div>
          <span className="text-zinc-400 font-mono text-xs hidden sm:inline">/</span>
          <span className="text-xs font-bold theme-accent font-mono hidden sm:inline px-2 py-0.5 rounded-md theme-accent-bg border theme-accent-border">
            {activeProject.name}
          </span>
        </div>
      </div>

      {/* Center: Navigation Links (Desktop) */}
      <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold theme-text-secondary">
        <button
          onClick={onNavigateHome}
          className="px-3 py-1.5 rounded-lg theme-bg-hover hover:theme-text-primary transition-colors cursor-pointer flex items-center gap-1.5"
          type="button"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
          <span>Documentation</span>
        </button>
        <button
          onClick={onNavigateLogs}
          className="px-3 py-1.5 rounded-lg theme-bg-hover hover:theme-text-primary transition-colors cursor-pointer flex items-center gap-1.5"
          type="button"
        >
          <Terminal className="w-3.5 h-3.5 text-purple-500" />
          <span>Activity Logs</span>
        </button>
        <button
          onClick={onNavigateFeatures}
          className="px-3 py-1.5 rounded-lg theme-bg-hover hover:theme-text-primary transition-colors cursor-pointer flex items-center gap-1.5"
          type="button"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>Roadmap</span>
        </button>
      </nav>

      {/* Right: Search, Status, New Doc, Theme */}
      <div className="flex items-center gap-2.5">
        {/* Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg theme-bg-card hover:theme-bg-hover border theme-border text-xs text-zinc-500 dark:text-zinc-400 hover:theme-text-primary transition-all cursor-pointer shadow-xs"
          type="button"
        >
          <Search className="w-3.5 h-3.5 theme-accent" />
          <span>Search...</span>
          <kbd className="px-1.5 py-0.2 rounded theme-bg-secondary text-[10px] font-mono border theme-border">
            ⌘K
          </kbd>
        </button>

        {/* Database Health Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full theme-bg-card border theme-border text-[11px] font-mono theme-text-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>D1 Edge Live</span>
        </div>

        {/* New Doc Action */}
        <button
          onClick={onOpenNewDocModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
          type="button"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Page</span>
        </button>

        {/* Theme Selector */}
        <ThemeToggle />
      </div>
    </header>
  );
};
