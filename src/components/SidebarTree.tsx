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
  GitCommit,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Project, DocItem, Feature } from "@/lib/api";

export type ViewSelection =
  | { type: "project-overview"; projectSlug: string }
  | { type: "folder-overview"; projectSlug: string; category: string }
  | { type: "doc"; projectSlug: string; docSlug: string }
  | { type: "logs"; projectSlug: string; scope?: string; featureKey?: string }
  | { type: "features"; projectSlug: string };

interface SidebarTreeProps {
  projects: Project[];
  activeProjectSlug: string;
  onSelectProject: (slug: string) => void;
  docs: DocItem[];
  features: Feature[];
  currentSelection: ViewSelection;
  onSelect: (selection: ViewSelection) => void;
  onOpenNewDocModal: (defaultCategory?: string) => void;
  onOpenNewProjectModal: () => void;
}

// Tree view sidebar with collapsible projects, category folders, docs, and logs
export const SidebarTree: React.FC<SidebarTreeProps> = ({
  projects,
  activeProjectSlug,
  onSelectProject,
  docs,
  features,
  currentSelection,
  onSelect,
  onOpenNewDocModal,
  onOpenNewProjectModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    docs_root: true,
    features_root: true,
    Architecture: true,
    Backend: true,
    Frontend: true,
    Dashboard: true,
  });

  // Toggles the expand/collapse state of a folder node
  const toggleFolder = (folderKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderKey]: !prev[folderKey],
    }));
  };

  // Groups documents by their assigned category
  const getDocsByCategory = () => {
    const map: Record<string, DocItem[]> = {};
    const filteredDocs = docs.filter((d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeProj = projects.find((p) => p.slug === activeProjectSlug);
    const categories = activeProj?.docs_categories || ["Architecture", "Backend", "Frontend", "Dashboard"];

    categories.forEach((cat) => {
      map[cat] = [];
    });

    filteredDocs.forEach((doc) => {
      if (!map[doc.category]) {
        map[doc.category] = [];
      }
      map[doc.category].push(doc);
    });

    return map;
  };

  const docsByCategory = getDocsByCategory();
  const activeProj = projects.find((p) => p.slug === activeProjectSlug);

  return (
    <aside className="w-72 md:w-80 h-full flex flex-col theme-bg-secondary border-r theme-border theme-text-secondary select-none">
      {/* 1. Projects Root Header */}
      <div className="p-3.5 border-b theme-border theme-bg-primary">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg theme-accent-bg theme-accent border theme-accent-border">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold theme-text-muted">All Projects</span>
              <p className="text-[11px] theme-text-muted">{projects.length} Registered</p>
            </div>
          </div>

          <button
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium theme-bg-card theme-bg-hover theme-text-primary rounded-md border theme-border transition-all cursor-pointer shadow-xs"
            title="Onboard New Project"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Project Switcher Select */}
        <select
          value={activeProjectSlug}
          onChange={(e) => onSelectProject(e.target.value)}
          className="w-full text-xs font-medium theme-bg-secondary border theme-border rounded-lg px-2.5 py-1.5 theme-text-primary focus:outline-none cursor-pointer"
        >
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>
              📦 {p.name} ({p.slug})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Quick Search */}
      <div className="px-3 pt-3 pb-2 border-b theme-border">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 theme-text-muted absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search docs, features, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs theme-bg-primary border theme-border rounded-md pl-8 pr-2.5 py-1.5 theme-text-primary placeholder:opacity-50 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Hierarchical Project Tree View */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3 font-sans text-xs custom-scrollbar">
        {/* Project Root Node */}
        <div
          onClick={() => onSelect({ type: "project-overview", projectSlug: activeProjectSlug })}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
            currentSelection.type === "project-overview"
              ? "theme-accent-bg theme-accent font-medium border theme-accent-border"
              : "theme-bg-hover theme-text-primary"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-base">📦</span>
            <span className="font-semibold truncate">{activeProj?.name || activeProjectSlug}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded theme-bg-accent theme-text-muted font-mono">root</span>
        </div>

        {/* --- SECTION A: DOCs Tree --- */}
        <div className="space-y-1">
          {/* Root DOCs Folder */}
          <div
            onClick={() => toggleFolder("docs_root")}
            className="flex items-center justify-between px-2 py-1 theme-text-secondary theme-bg-hover rounded-md cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-1.5 font-medium">
              {expandedFolders.docs_root ? (
                <ChevronDown className="w-3.5 h-3.5 theme-text-muted" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 theme-text-muted" />
              )}
              {expandedFolders.docs_root ? (
                <FolderOpen className="w-4 h-4 text-amber-500" />
              ) : (
                <Folder className="w-4 h-4 text-amber-500" />
              )}
              <span>DOCs</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenNewDocModal();
              }}
              className="p-1 theme-bg-hover rounded theme-text-muted hover:theme-text-primary"
              title="Add New Document"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Nested Categories and Docs */}
          {expandedFolders.docs_root && (
            <div className="pl-4 space-y-1 border-l theme-border ml-3.5 my-1">
              {Object.entries(docsByCategory).map(([category, catDocs]) => {
                const isCatExpanded = !!expandedFolders[category];
                const isCatSelected =
                  currentSelection.type === "folder-overview" &&
                  currentSelection.category === category;

                return (
                  <div key={category} className="space-y-0.5">
                    {/* Category Folder Row */}
                    <div
                      onClick={() => onSelect({ type: "folder-overview", projectSlug: activeProjectSlug, category })}
                      className={`group flex items-center justify-between px-2 py-1 rounded-md cursor-pointer transition-all ${
                        isCatSelected
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 font-medium"
                          : "theme-bg-hover theme-text-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <button
                          onClick={(e) => toggleFolder(category, e)}
                          className="p-0.5 theme-text-muted hover:theme-text-primary rounded"
                        >
                          {isCatExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>
                        {isCatExpanded ? (
                          <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : (
                          <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className="truncate">{category}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] theme-text-muted group-hover:hidden">
                          {catDocs.length}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenNewDocModal(category);
                          }}
                          className="hidden group-hover:flex p-0.5 rounded theme-bg-hover theme-text-muted hover:theme-text-primary"
                          title={`Add doc in ${category}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Docs inside Category */}
                    {isCatExpanded && catDocs.length > 0 && (
                      <div className="pl-4 space-y-0.5 border-l theme-border ml-3 my-0.5">
                        {catDocs.map((doc) => {
                          const isDocSelected =
                            currentSelection.type === "doc" &&
                            currentSelection.docSlug === doc.slug;

                          return (
                            <div
                              key={doc.id}
                              onClick={() =>
                                onSelect({
                                  type: "doc",
                                  projectSlug: activeProjectSlug,
                                  docSlug: doc.slug,
                                })
                              }
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-[11px] transition-all ${
                                isDocSelected
                                  ? "theme-accent-bg theme-accent font-semibold border theme-accent-border"
                                  : "theme-text-muted hover:theme-text-primary theme-bg-hover"
                              }`}
                            >
                              <FileText className="w-3 h-3 shrink-0 theme-text-muted" />
                              <span className="truncate">{doc.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- SECTION B: Features & Tasks Tree --- */}
        <div className="space-y-1 pt-1">
          <div
            onClick={() => toggleFolder("features_root")}
            className="flex items-center justify-between px-2 py-1 theme-text-secondary theme-bg-hover rounded-md cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-1.5 font-medium">
              {expandedFolders.features_root ? (
                <ChevronDown className="w-3.5 h-3.5 theme-text-muted" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 theme-text-muted" />
              )}
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>Features & Epics</span>
            </div>
            <span className="text-[10px] theme-text-muted">{features.length}</span>
          </div>

          {expandedFolders.features_root && (
            <div className="pl-4 space-y-1 border-l theme-border ml-3.5 my-1">
              {features.map((feat) => {
                const isFeatSelected =
                  currentSelection.type === "logs" &&
                  currentSelection.featureKey === feat.key;

                return (
                  <div key={feat.id} className="space-y-0.5">
                    <div
                      onClick={() =>
                        onSelect({
                          type: "logs",
                          projectSlug: activeProjectSlug,
                          featureKey: feat.key,
                        })
                      }
                      className={`flex items-center justify-between px-2 py-1 rounded-md cursor-pointer text-[11px] transition-all ${
                        isFeatSelected
                          ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-medium border border-cyan-500/30"
                          : "theme-text-secondary theme-bg-hover hover:theme-text-primary"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono text-[10px] px-1 py-0.2 rounded theme-bg-card text-cyan-500 border theme-border">
                          {feat.key}
                        </span>
                        <span className="truncate">{feat.title}</span>
                      </div>
                      {feat.status === "done" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- SECTION C: Action Logs Stream Node --- */}
        <div className="pt-1">
          <div
            onClick={() => onSelect({ type: "logs", projectSlug: activeProjectSlug })}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-all ${
              currentSelection.type === "logs" && !currentSelection.featureKey
                ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 font-medium border border-purple-500/30"
                : "theme-text-secondary theme-bg-hover hover:theme-text-primary"
            }`}
          >
            <Terminal className="w-4 h-4 text-purple-500" />
            <span className="font-medium">AI Action Logs Stream</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Footer Info */}
      <div className="p-3 border-t theme-border theme-bg-primary text-[11px] theme-text-muted flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cloudflare D1 Live</span>
        </div>
        <span className="font-mono text-[10px] theme-text-muted">v0.1.0</span>
      </div>
    </aside>
  );
};
