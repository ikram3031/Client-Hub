"use client";

import React from "react";
import {
  Menu,
  X,
  Search,
  BookOpen,
  History,
  Sparkles,
  Plus,
  Lock,
  Unlock,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Project } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

// Global top navigation bar with project switcher context, quick navigation links, developer auth gate, and theme toggle
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
  const { isUnlocked, openAuthModal, lock, requireAuth } = useAuth();

  return (
    <header className="h-14 px-4 md:px-6 border-b border-border bg-card flex items-center justify-between shrink-0 z-20 select-none font-sans shadow-2xs">
      {/* Left: Mobile Toggle & Project Branding */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMobileMenu}
          className="md:hidden h-8 w-8"
          aria-label="Toggle Navigation Drawer"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        <div
          onClick={onNavigateHome}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="flex items-center gap-2 font-black text-sm md:text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
            <span className="text-lg">📖</span>
            <span className="font-extrabold tracking-tight">docsNlogs</span>
          </div>
          <span className="text-muted-foreground font-mono text-xs hidden sm:inline">/</span>
          <Badge variant="outline" className="hidden sm:inline-flex text-xs font-mono">
            {activeProject.name}
          </Badge>
        </div>
      </div>

      {/* Center: Navigation Links (Desktop) */}
      <nav className="hidden lg:flex items-center space-x-1 text-xs font-semibold text-muted-foreground">
        <button
          onClick={onNavigateHome}
          className="px-3 py-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors cursor-pointer flex items-center space-x-1.5"
          type="button"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Documentation</span>
        </button>
        <button
          onClick={onNavigateLogs}
          className="px-3 py-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors cursor-pointer flex items-center space-x-1.5"
          type="button"
        >
          <History className="w-3.5 h-3.5" />
          <span>Activity Logs</span>
        </button>
        <button
          onClick={onNavigateFeatures}
          className="px-3 py-1.5 rounded-md hover:bg-muted hover:text-foreground transition-colors cursor-pointer flex items-center space-x-1.5"
          type="button"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>Roadmap</span>
        </button>
      </nav>

      {/* Right: Search, Auth Gate, Status, New Doc, Theme */}
      <div className="flex items-center gap-2">
        {/* Quick Search Button */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted border border-border text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
          type="button"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <kbd className="px-1.5 py-0.2 rounded bg-background text-[10px] font-mono border border-border">
            ⌘K
          </kbd>
        </button>

        {/* Developer Auth Status Gate */}
        {isUnlocked ? (
          <div className="flex items-center space-x-1">
            <Badge variant="emerald" className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Developer Unlocked</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={lock}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
              title="Lock Developer Dashboard"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              <span className="hidden md:inline">Lock</span>
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAuthModal()}
            className="h-8 px-2.5 text-xs border-dashed text-muted-foreground hover:text-foreground"
            title="Authenticate to unlock developer controls"
          >
            <Lock className="w-3.5 h-3.5 mr-1 text-amber-500" />
            <span className="hidden sm:inline">Guest (Unlock)</span>
            <span className="sm:hidden">Unlock</span>
          </Button>
        )}

        {/* Database Health Badge */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/30 text-[11px] font-mono text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>D1 Live</span>
        </div>

        {/* New Doc Action */}
        <Button
          size="sm"
          onClick={() => requireAuth(onOpenNewDocModal)}
          className="hidden sm:inline-flex h-8 px-3"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>New Page</span>
        </Button>

        {/* Theme Selector */}
        <ThemeToggle />
      </div>
    </header>
  );
};
