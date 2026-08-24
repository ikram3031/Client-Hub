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

    // Ensure all standard categories exist in map
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
    <aside className="w-72 md:w-80 h-full flex flex-col bg-zinc-900 border-r border-zinc-800 text-zinc-300 select-none">
      {/* 1. Projects Root Header */}
      <div className="p-3.5 border-b border-zinc-800 bg-zinc-950/70">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">All Projects</span>
              <p className="text-[11px] text-zinc-500">{projects.length} Registered</p>
            </div>
          </div>

          <button
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-md border border-zinc-700/80 transition-all cursor-pointer"
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
          className="w-full text-xs font-medium bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500/80 cursor-pointer"
        >
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>
              📦 {p.name} ({p.slug})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Quick Search */}
      <div className="px-3 pt-3 pb-2 border-b border-zinc-800/60">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search docs, features, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-zinc-950/60 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1.5 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* 3. Hierarchical Project Tree View */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3 font-sans text-xs custom-scrollbar">
        {/* Project Root Node */}
        <div
          onClick={() => onSelect({ type: "project-overview", projectSlug: activeProjectSlug })}
          className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
            currentSelection.type === "project-overview"
              ? "bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20"
              : "hover:bg-zinc-800/60 text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-base">📦</span>
            <span className="font-semibold truncate">{activeProj?.name || activeProjectSlug}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">root</span>
        </div>

        {/* --- SECTION A: DOCs Tree --- */}
        <div className="space-y-1">
          {/* Root DOCs Folder */}
          <div
            onClick={() => toggleFolder("docs_root")}
            className="flex items-center justify-between px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-md cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-1.5 font-medium">
              {expandedFolders.docs_root ? (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              )}
              {expandedFolders.docs_root ? (
                <FolderOpen className="w-4 h-4 text-amber-400" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400" />
              )}
              <span>DOCs</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenNewDocModal();
              }}
              className="p-1 hover:bg-zinc-700/60 rounded text-zinc-400 hover:text-white"
              title="Add New Document"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Nested Categories and Docs */}
          {expandedFolders.docs_root && (
            <div className="pl-4 space-y-1 border-l border-zinc-800/80 ml-3.5 my-1">
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
                          ? "bg-amber-500/15 text-amber-300 font-medium"
                          : "hover:bg-zinc-800/50 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <button
                          onClick={(e) => toggleFolder(category, e)}
                          className="p-0.5 text-zinc-500 hover:text-zinc-300 rounded"
                        >
                          {isCatExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>
                        {isCatExpanded ? (
                          <FolderOpen className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                        ) : (
                          <Folder className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                        )}
                        <span className="truncate">{category}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-500 group-hover:hidden">
                          {catDocs.length}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenNewDocModal(category);
                          }}
                          className="hidden group-hover:flex p-0.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                          title={`Add doc in ${category}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Docs inside Category */}
                    {isCatExpanded && catDocs.length > 0 && (
                      <div className="pl-4 space-y-0.5 border-l border-zinc-800/60 ml-3 my-0.5">
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
                                  ? "bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30"
                                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
                              }`}
                            >
                              <FileText className="w-3 h-3 shrink-0 text-zinc-500" />
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
            className="flex items-center justify-between px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-md cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-1.5 font-medium">
              {expandedFolders.features_root ? (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
              )}
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Features & Epics</span>
            </div>
            <span className="text-[10px] text-zinc-500">{features.length}</span>
          </div>

          {expandedFolders.features_root && (
            <div className="pl-4 space-y-1 border-l border-zinc-800/80 ml-3.5 my-1">
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
                          ? "bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30"
                          : "text-zinc-300 hover:bg-zinc-800/40 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                          {feat.key}
                        </span>
                        <span className="truncate">{feat.title}</span>
                      </div>
                      {feat.status === "done" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-400 shrink-0" />
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
                ? "bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30"
                : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
            }`}
          >
            <Terminal className="w-4 h-4 text-purple-400" />
            <span className="font-medium">AI Action Logs Stream</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Footer Info */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 text-[11px] text-zinc-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Cloudflare D1 Live</span>
        </div>
        <span className="font-mono text-[10px] text-zinc-400">v0.1.0</span>
      </div>
    </aside>
  );
};
