"use client";

import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Layers,
  Terminal,
  Plus,
  Search,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Compass,
  GitBranch,
  X,
} from "lucide-react";
import { Project, DocItem, Feature } from "@/lib/api";

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

// Hierarchical documentation sidebar organizing navigation into Getting Started, Categories, and Governance
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
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    Architecture: true,
    Backend: true,
    Frontend: true,
    Dashboard: true,
  });

  // Toggles expand/collapse state for a given category folder
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
    <aside className="w-72 md:w-80 h-full flex flex-col theme-bg-secondary border-r theme-border theme-text-secondary select-none font-sans">
      {/* 1. Top Project Switcher */}
      <div className="p-3.5 border-b theme-border theme-bg-primary">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg theme-accent-bg theme-accent border theme-accent-border">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold theme-text-muted font-mono">
                Project Hub
              </span>
              <p className="text-[11px] theme-text-muted font-mono">{projects.length} Registered</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenNewProjectModal}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold theme-bg-card theme-bg-hover theme-text-primary rounded-md border theme-border transition-all cursor-pointer shadow-xs"
              title="Onboard New Project"
              type="button"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
            {onCloseMobileDrawer && (
              <button
                onClick={onCloseMobileDrawer}
                className="md:hidden p-1 rounded-md theme-bg-card theme-text-muted hover:theme-text-primary"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Project Selector Dropdown */}
        <select
          value={activeProjectSlug}
          onChange={(e) => onSelectProject(e.target.value)}
          className="w-full text-xs font-semibold theme-bg-secondary border theme-border rounded-lg px-2.5 py-1.5 theme-text-primary focus:outline-none cursor-pointer"
        >
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>
              📦 {p.name} ({p.slug})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Quick Search Trigger */}
      <div className="p-3 border-b theme-border">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg theme-bg-primary border theme-border theme-text-muted hover:border-emerald-500/40 hover:theme-text-primary transition-all cursor-pointer shadow-xs"
          type="button"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 theme-accent" />
            <span>Search docs & logs...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded theme-bg-secondary border theme-border text-[10px] font-mono text-zinc-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* 3. Navigation Tree Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar text-xs">
        {/* SECTION 1: GETTING STARTED */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider theme-text-muted font-mono">
            Getting Started
          </div>

          <button
            onClick={() => onSelect({ type: "project-overview", projectSlug: activeProjectSlug })}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
              currentSelection.type === "project-overview"
                ? "theme-accent-bg theme-accent font-semibold border-l-2 theme-accent-border"
                : "theme-bg-hover theme-text-secondary hover:theme-text-primary"
            }`}
            type="button"
          >
            <div className="flex items-center gap-2 truncate">
              <Compass className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">Overview & Setup</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded theme-bg-secondary text-zinc-400 font-mono">
              home
            </span>
          </button>
        </div>

        {/* SECTION 2: DOCUMENTATION */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-bold uppercase tracking-wider theme-text-muted font-mono">
            <span>Documentation</span>
            <button
              onClick={() => onOpenNewDocModal()}
              className="p-0.5 rounded theme-bg-hover text-zinc-400 hover:theme-text-primary"
              title="Add New Document"
              type="button"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

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
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                    isFolderSelected
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                      : "theme-bg-hover theme-text-secondary hover:theme-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <button
                      onClick={(e) => toggleFolder(category, e)}
                      className="p-0.5 rounded text-zinc-400 hover:theme-text-primary"
                      type="button"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    {isExpanded ? (
                      <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate font-medium">{category}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-400 font-mono group-hover:hidden">
                      {catDocs.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNewDocModal(category);
                      }}
                      className="hidden group-hover:flex p-0.5 rounded theme-bg-hover text-zinc-400 hover:theme-text-primary"
                      title={`Add doc to ${category}`}
                      type="button"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Sub-documents inside category */}
                {isExpanded && catDocs.length > 0 && (
                  <div className="pl-4 ml-3 border-l theme-border space-y-0.5 my-1">
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
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer text-left text-[11px] transition-all truncate ${
                            isDocSelected
                              ? "theme-accent-bg theme-accent font-semibold border-l-2 theme-accent-border"
                              : "theme-text-muted hover:theme-text-primary theme-bg-hover"
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

        {/* SECTION 3: LOGS & GOVERNANCE */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider theme-text-muted font-mono">
            Logs & Governance
          </div>

          {/* Live Activity Logs */}
          <button
            onClick={() => onSelect({ type: "logs", projectSlug: activeProjectSlug })}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
              currentSelection.type === "logs" && !currentSelection.featureKey
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold border-l-2 border-purple-500"
                : "theme-bg-hover theme-text-secondary hover:theme-text-primary"
            }`}
            type="button"
          >
            <div className="flex items-center gap-2 truncate">
              <Terminal className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span className="truncate">Live Activity Logs</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-500 font-mono">
              changelog
            </span>
          </button>

          {/* Features & Epics Roadmap */}
          <button
            onClick={() => onSelect({ type: "features", projectSlug: activeProjectSlug })}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
              currentSelection.type === "features"
                ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold border-l-2 border-cyan-500"
                : "theme-bg-hover theme-text-secondary hover:theme-text-primary"
            }`}
            type="button"
          >
            <div className="flex items-center gap-2 truncate">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span className="truncate">Features & Epics</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded theme-bg-secondary text-zinc-400 font-mono">
              {features.length}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Bottom Footer */}
      <div className="p-3.5 border-t theme-border theme-bg-primary text-[11px] theme-text-muted flex items-center justify-between font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cloudflare D1 Live</span>
        </div>
        <span className="text-zinc-500">v0.1.0</span>
      </div>
    </aside>
  );
};
