"use client";

import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  BookOpen,
  History,
  Sparkles,
  Plus,
  Search,
  Compass,
  X,
  Lock,
  Unlock,
} from "lucide-react";
import { Project, DocItem, Feature } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export type ViewSelection =
  | { type: "project-overview"; projectSlug: string }
  | { type: "folder-overview"; projectSlug: string; category: string }
  | { type: "doc"; projectSlug: string; docSlug: string }
  | { type: "logs"; projectSlug: string; scope?: string; featureKey?: string }
  | { type: "features"; projectSlug: string };

interface SidebarNavigationProps {
  projects: Project[];
  activeProjectSlug: string;
  onSelectProject: (slug: string) => void;
  docs: DocItem[];
  features: Feature[];
  currentSelection: ViewSelection;
  onSelect: (selection: ViewSelection) => void;
  onOpenNewDocModal: (defaultCategory?: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenSearch: () => void;
  onCloseMobileDrawer?: () => void;
}

// Hierarchical documentation sidebar with project dropdown, categories, and governance links
export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  projects,
  activeProjectSlug,
  onSelectProject,
  docs,
  features,
  currentSelection,
  onSelect,
  onOpenNewDocModal,
  onOpenNewProjectModal,
  onOpenSearch,
  onCloseMobileDrawer,
}) => {
  const { isUnlocked, requireAuth, openAuthModal } = useAuth();
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    Architecture: true,
    Backend: true,
    Frontend: true,
    Dashboard: true,
  });

  // Toggles folder expand/collapse state
  const toggleFolder = (folderKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderKey]: prev[folderKey] === undefined ? false : !prev[folderKey],
    }));
  };

  const activeProject = projects.find((p) => p.slug === activeProjectSlug);
  const categories = activeProject?.docs_categories || ["Architecture", "Backend", "Frontend", "Dashboard"];

  // Groups docs by category
  const docsByCategory: Record<string, DocItem[]> = {};
  categories.forEach((cat) => {
    docsByCategory[cat] = [];
  });
  docs.forEach((d) => {
    if (!docsByCategory[d.category]) {
      docsByCategory[d.category] = [];
    }
    docsByCategory[d.category].push(d);
  });

  return (
    <aside className="w-64 md:w-72 h-full flex flex-col bg-card border-r border-border text-foreground select-none font-sans">
      {/* 1. Top Project Switcher */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-base">📖</span>
            <span className="text-xs font-bold tracking-tight text-foreground uppercase font-mono">
              docsNlogs
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => requireAuth(onOpenNewProjectModal)}
              className="h-7 px-2 text-[11px]"
              title="Onboard New Project (Requires Passkey)"
            >
              <Plus className="w-3 h-3 mr-1" />
              <span>New</span>
            </Button>
            {onCloseMobileDrawer && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCloseMobileDrawer}
                className="md:hidden h-7 w-7"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Project Selector */}
        <select
          value={activeProjectSlug}
          onChange={(e) => onSelectProject(e.target.value)}
          className="w-full text-xs font-medium bg-muted border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none cursor-pointer"
        >
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name} ({p.slug})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Quick Search Button */}
      <div className="p-3 border-b border-border">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg bg-muted/60 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-2xs"
          type="button"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Search docs & logs...</span>
          </div>
          <kbd className="px-1.5 py-0.2 rounded bg-background border border-border text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* 3. Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
        {/* SECTION 1: OVERVIEW */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Getting Started
          </p>

          <button
            onClick={() => onSelect({ type: "project-overview", projectSlug: activeProjectSlug })}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              currentSelection.type === "project-overview"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            type="button"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <Compass className="h-4 w-4 shrink-0" />
              <span className="truncate">Project Overview</span>
            </div>
          </button>
        </div>

        {/* SECTION 2: DOCUMENTATION */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Documentation
            </p>
            <button
              onClick={() => requireAuth(() => onOpenNewDocModal())}
              className="p-0.5 rounded text-muted-foreground hover:text-foreground cursor-pointer"
              title="Add New Document (Requires Passkey)"
              type="button"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-0.5">
            {categories.map((category) => {
              const catDocs = docsByCategory[category] || [];
              const isExpanded = expandedFolders[category] !== false;
              const isFolderSelected =
                currentSelection.type === "folder-overview" &&
                currentSelection.category === category;

              return (
                <div key={category} className="space-y-0.5">
                  {/* Category Header Row */}
                  <div
                    onClick={() => onSelect({ type: "folder-overview", projectSlug: activeProjectSlug, category })}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                      isFolderSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <button
                        onClick={(e) => toggleFolder(category, e)}
                        className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                        type="button"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="truncate text-xs font-medium text-foreground">{category}</span>
                    </div>

                    <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.2 rounded">
                      {catDocs.length}
                    </span>
                  </div>

                  {/* Sub-documents */}
                  {isExpanded && catDocs.length > 0 && (
                    <div className="pl-6 space-y-0.5 my-0.5 border-l border-border ml-4">
                      {catDocs.map((doc) => {
                        const isDocSelected =
                          currentSelection.type === "doc" &&
                          currentSelection.docSlug === doc.slug;

                        return (
                          <button
                            key={doc.id}
                            onClick={() =>
                              onSelect({
                                type: "doc",
                                projectSlug: activeProjectSlug,
                                docSlug: doc.slug,
                              })
                            }
                            className={`w-full flex items-center space-x-2 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer text-left truncate ${
                              isDocSelected
                                ? "bg-primary/15 text-primary font-semibold"
                                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                            }`}
                            type="button"
                          >
                            <FileText className="w-3 h-3 shrink-0 opacity-70" />
                            <span className="truncate">{doc.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: LOGS & GOVERNANCE */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Logs & Governance
          </p>

          <div className="space-y-0.5">
            {/* Live Activity Logs */}
            <button
              onClick={() => onSelect({ type: "logs", projectSlug: activeProjectSlug })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                currentSelection.type === "logs" && !currentSelection.featureKey
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              type="button"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <History className="h-4 w-4 shrink-0" />
                <span className="truncate text-xs">Live Activity Logs</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.2 rounded">
                {features.length > 0 ? "live" : "logs"}
              </span>
            </button>

            {/* Features & Epics Roadmap */}
            <button
              onClick={() => onSelect({ type: "features", projectSlug: activeProjectSlug })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                currentSelection.type === "features"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              type="button"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Sparkles className="h-4 w-4 text-cyan-500 shrink-0" />
                <span className="truncate text-xs">Features & Epics</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.2 rounded">
                {features.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Footer */}
      <div className="p-3.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cloudflare D1</span>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
};
