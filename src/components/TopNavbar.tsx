"use client";

import React from "react";
import {
  Menu,
  X,
  Search,
  BookOpen,
  History,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Project } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopNavbarProps {
  activeProject: Project;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onNavigateHome: () => void;
  onNavigateLogs: () => void;
  onOpenSearch: () => void;
}

// Global top navbar providing clean documentation and AI activity logs links
export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeProject,
  mobileMenuOpen,
  onToggleMobileMenu,
  onNavigateHome,
  onNavigateLogs,
  onOpenSearch,
}) => {
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
      <nav className="hidden sm:flex items-center space-x-1 text-xs font-semibold text-muted-foreground">
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
          <span>AI Action Logs</span>
        </button>
      </nav>

      {/* Right: Search & Theme Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted border border-border text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
          type="button"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search docs &amp; logs...</span>
          <span className="md:hidden">Search...</span>
          <kbd className="px-1.5 py-0.2 rounded bg-background text-[10px] font-mono border border-border">
            ⌘K
          </kbd>
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
};
