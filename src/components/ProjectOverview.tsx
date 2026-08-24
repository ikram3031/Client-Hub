"use client";

import React from "react";
import {
  Layers,
  Folder,
  BookOpen,
  Terminal,
  Sparkles,
  ChevronRight,
  Plus,
  Copy,
  Check,
  Server,
  Database,
} from "lucide-react";
import { Project, DocItem, Feature } from "@/lib/api";
import { CodeBlock } from "@/components/CodeBlock";

interface ProjectOverviewProps {
  project: Project;
  docs: DocItem[];
  features: Feature[];
  onNavigateFolder: (category: string) => void;
  onNavigateDoc: (slug: string) => void;
  onNavigateLogs: () => void;
  onOpenNewDocModal: (category?: string) => void;
}

// Project dashboard overview showing documentation categories, stats, and CLI shortcuts
export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  docs,
  features,
  onNavigateFolder,
  onNavigateDoc,
  onNavigateLogs,
  onOpenNewDocModal,
}) => {
  const categories = project.docs_categories || ["Architecture", "Backend", "Frontend", "Dashboard"];

  // Finds the first overview document if available
  const overviewDoc = docs.find((d) => d.slug.includes("overview") || d.title.toLowerCase().includes("overview")) || docs[0];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-950 text-zinc-100 p-6 md:p-10 font-sans">
      {/* 1. Project Hero Header */}
      <div className="pb-8 mb-8 border-b border-zinc-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">{project.name}</h1>
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-xs font-mono">
                  {project.slug}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{project.description || "Central Documentation & Logs Registry"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {overviewDoc && (
              <button
                onClick={() => onNavigateDoc(overviewDoc.slug)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read {overviewDoc.title}</span>
              </button>
            )}
            <button
              onClick={() => onOpenNewDocModal()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-xl border border-zinc-800 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          </div>
        </div>

        {/* Status metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
            <span className="text-zinc-500 block text-[11px]">Database</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <Database className="w-3.5 h-3.5" /> Cloudflare D1
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
            <span className="text-zinc-500 block text-[11px]">Documents</span>
            <span className="text-white font-semibold text-sm mt-0.5">{docs.length} Pages</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
            <span className="text-zinc-500 block text-[11px]">Categories</span>
            <span className="text-amber-400 font-semibold text-sm mt-0.5">{categories.length} Folders</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
            <span className="text-zinc-500 block text-[11px]">Features</span>
            <span className="text-cyan-400 font-semibold text-sm mt-0.5">{features.length} Epics</span>
          </div>
        </div>
      </div>

      {/* 2. Documentation Folders Explorer */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Folder className="w-5 h-5 text-amber-400" />
            <span>Documentation Folders</span>
          </h2>
          <span className="text-xs text-zinc-500">Click folder to explore pages</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const catDocs = docs.filter((d) => d.category.toLowerCase() === cat.toLowerCase());

            return (
              <div
                key={cat}
                onClick={() => onNavigateFolder(cat)}
                className="group p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900 hover:border-amber-500/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                      <Folder className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                      {catDocs.length} doc{catDocs.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <h3 className="font-bold text-zinc-100 group-hover:text-amber-300 text-sm transition-colors">
                    {cat}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {catDocs.length > 0
                      ? catDocs.map((d) => d.title).slice(0, 2).join(", ")
                      : "Empty category"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-zinc-800/60 text-xs text-zinc-500 group-hover:text-amber-400">
                  <span>Browse files</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. AI Assistant & CLI Quick Copy Guide */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">AI Assistant & CLI Logging Integration</h3>
          </div>
          <button
            onClick={onNavigateLogs}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>View All Logs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 mb-4">
          To log changes automatically from terminal or external AI coding agents, use the direct copy CLI commands below:
        </p>

        <div className="space-y-3">
          <div>
            <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
              1. Initialize Client Workspace Config
            </span>
            <CodeBlock className="language-bash">node scripts/init-config.js</CodeBlock>
          </div>

          <div>
            <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">
              2. Record AI Action Log with Git Commit Hash
            </span>
            <CodeBlock className="language-bash">
              node scripts/log.js --scope frontend --feat FEAT-1 --task TASK-1-2 --summary "Implemented Tree-View Docs Frontend" --files "src/app/page.tsx,src/components/SidebarTree.tsx"
            </CodeBlock>
          </div>
        </div>
      </div>
    </div>
  );
};
