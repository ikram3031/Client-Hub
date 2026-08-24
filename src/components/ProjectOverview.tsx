"use client";

import React from "react";
import {
  Layers,
  Folder,
  BookOpen,
  Terminal,
  ChevronRight,
  Plus,
  Database,
} from "lucide-react";
import { Project, DocItem, Feature } from "@/lib/api";
import { CodeBlock } from "@/components/CodeBlock";
import { Breadcrumb } from "@/components/Breadcrumb";

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
    <div className="flex-1 flex flex-col h-full overflow-y-auto theme-bg-primary theme-text-primary p-6 md:p-10 font-sans">
      {/* 1. Prominent Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: "Projects" },
          { label: project.name, icon: Layers },
          { label: "Overview" },
        ]}
      />

      {/* 2. Project Hero Header */}
      <div className="pb-8 mb-8 border-b theme-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl theme-accent-bg theme-accent border theme-accent-border shadow-xs">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight theme-text-primary">{project.name}</h1>
                <span className="px-2.5 py-0.5 rounded-md theme-bg-card theme-text-muted text-xs font-mono font-semibold border theme-border">
                  {project.slug}
                </span>
              </div>
              <p className="text-xs md:text-sm theme-text-muted mt-1">{project.description || "Central Documentation & Logs Registry"}</p>
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold theme-bg-card theme-bg-hover theme-text-primary rounded-xl border theme-border transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          </div>
        </div>

        {/* Status metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl theme-bg-card border theme-border text-xs">
            <span className="theme-text-muted block text-[11px] font-medium">Database</span>
            <span className="theme-accent font-bold flex items-center gap-1 mt-0.5 text-sm">
              <Database className="w-4 h-4" /> Cloudflare D1
            </span>
          </div>
          <div className="p-3.5 rounded-xl theme-bg-card border theme-border text-xs">
            <span className="theme-text-muted block text-[11px] font-medium">Documents</span>
            <span className="theme-text-primary font-bold text-sm mt-0.5">{docs.length} Pages</span>
          </div>
          <div className="p-3.5 rounded-xl theme-bg-card border theme-border text-xs">
            <span className="theme-text-muted block text-[11px] font-medium">Categories</span>
            <span className="text-amber-500 font-bold text-sm mt-0.5">{categories.length} Folders</span>
          </div>
          <div className="p-3.5 rounded-xl theme-bg-card border theme-border text-xs">
            <span className="theme-text-muted block text-[11px] font-medium">Features</span>
            <span className="text-cyan-500 font-bold text-sm mt-0.5">{features.length} Epics</span>
          </div>
        </div>
      </div>

      {/* 3. Documentation Folders Explorer */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold theme-text-primary flex items-center gap-2">
            <Folder className="w-5 h-5 text-amber-500" />
            <span>Documentation Folders</span>
          </h2>
          <span className="text-xs theme-text-muted">Click folder to explore pages</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const catDocs = docs.filter((d) => d.category.toLowerCase() === cat.toLowerCase());

            return (
              <div
                key={cat}
                onClick={() => onNavigateFolder(cat)}
                className="group p-5 rounded-2xl border theme-border theme-bg-card theme-bg-hover transition-all cursor-pointer flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                      <Folder className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full theme-bg-secondary theme-text-muted border theme-border font-semibold">
                      {catDocs.length} doc{catDocs.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <h3 className="font-bold theme-text-primary group-hover:text-amber-500 text-sm transition-colors">
                    {cat}
                  </h3>
                  <p className="text-xs theme-text-muted mt-1">
                    {catDocs.length > 0
                      ? catDocs.map((d) => d.title).slice(0, 2).join(", ")
                      : "Empty category"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t theme-border text-xs theme-text-muted group-hover:text-amber-500 font-semibold">
                  <span>Browse files</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. AI Assistant & CLI Quick Copy Guide */}
      <div className="rounded-2xl border theme-border theme-bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold theme-text-primary">AI Assistant & CLI Logging Integration</h3>
          </div>
          <button
            onClick={onNavigateLogs}
            className="text-xs text-purple-500 hover:opacity-80 flex items-center gap-1 cursor-pointer font-semibold"
          >
            <span>View All Logs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs theme-text-muted mb-4">
          To log changes automatically from terminal or external AI coding agents, use the direct copy CLI commands below:
        </p>

        <div className="space-y-3">
          <div>
            <span className="text-[11px] font-mono theme-text-muted uppercase font-semibold">
              1. Initialize Client Workspace Config
            </span>
            <CodeBlock className="language-bash">node scripts/init-config.js</CodeBlock>
          </div>

          <div>
            <span className="text-[11px] font-mono theme-text-muted uppercase font-semibold">
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
