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
  FileText,
  Sparkles,
  ArrowRight,
  Compass,
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

// Project dashboard overview presenting categories, metrics, and CLI ingestion commands
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

  // Locates the first featured or overview document
  const overviewDoc =
    docs.find((d) => d.slug.includes("overview") || d.title.toLowerCase().includes("overview")) ||
    docs[0];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar font-sans theme-bg-primary theme-text-primary px-6 py-6 md:px-12 md:py-8">
      <div className="max-w-4xl w-full mx-auto pb-16">
        {/* 1. Subtle Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-6 font-mono select-none">
          <span className="font-medium">Projects</span>
          <span className="opacity-40">/</span>
          <span className="theme-text-primary font-semibold truncate">{project.name}</span>
          <span className="opacity-40">/</span>
          <span className="text-zinc-500 font-medium">Overview</span>
        </nav>

        {/* 2. Project Hero Section */}
        <div className="pb-8 mb-8 border-b theme-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 rounded-2xl theme-accent-bg theme-accent border theme-accent-border shadow-xs">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight theme-text-primary">
                    {project.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-md theme-bg-secondary text-zinc-500 text-xs font-mono font-bold border theme-border">
                    {project.slug}
                  </span>
                </div>
                <p className="text-xs md:text-sm theme-text-muted mt-1 leading-relaxed">
                  {project.description || "Central Documentation & AI Action Logging Engine"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {overviewDoc && (
                <button
                  onClick={() => onNavigateDoc(overviewDoc.slug)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  type="button"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read {overviewDoc.title}</span>
                </button>
              )}
              <button
                onClick={() => onOpenNewDocModal()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold theme-bg-card theme-bg-hover theme-text-primary rounded-xl border theme-border transition-all cursor-pointer shadow-xs active:scale-95"
                type="button"
              >
                <Plus className="w-4 h-4" />
                <span>New Doc</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl theme-bg-card border theme-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider theme-text-muted font-mono block">
                Database
              </span>
              <span className="theme-accent font-bold flex items-center gap-1.5 mt-1 text-sm">
                <Database className="w-4 h-4" /> Cloudflare D1
              </span>
            </div>

            <div className="p-4 rounded-xl theme-bg-card border theme-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider theme-text-muted font-mono block">
                Documents
              </span>
              <span className="theme-text-primary font-bold text-base mt-1 block">
                {docs.length} Pages
              </span>
            </div>

            <div className="p-4 rounded-xl theme-bg-card border theme-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider theme-text-muted font-mono block">
                Categories
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-bold text-base mt-1 block">
                {categories.length} Folders
              </span>
            </div>

            <div className="p-4 rounded-xl theme-bg-card border theme-border shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider theme-text-muted font-mono block">
                Features
              </span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold text-base mt-1 block">
                {features.length} Epics
              </span>
            </div>
          </div>
        </div>

        {/* 3. Documentation Categories Explorer */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold theme-text-primary flex items-center gap-2">
              <Folder className="w-5 h-5 text-amber-500" />
              <span>Documentation Categories</span>
            </h2>
            <span className="text-xs theme-text-muted">Click to browse pages</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const catDocs = docs.filter((d) => d.category.toLowerCase() === cat.toLowerCase());

              return (
                <div
                  key={cat}
                  onClick={() => onNavigateFolder(cat)}
                  className="group p-5 rounded-2xl border theme-border theme-bg-card theme-bg-hover transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:border-amber-500/30"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                        <Folder className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full theme-bg-secondary theme-text-muted border theme-border font-semibold">
                        {catDocs.length} doc{catDocs.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <h3 className="font-bold theme-text-primary group-hover:text-amber-500 text-base transition-colors">
                      {cat}
                    </h3>
                    <p className="text-xs theme-text-muted mt-1 leading-relaxed line-clamp-2">
                      {catDocs.length > 0
                        ? catDocs.map((d) => d.title).join(" · ")
                        : "No documents published yet"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t theme-border text-xs theme-text-muted group-hover:text-amber-500 font-semibold">
                    <span>Browse {cat} docs</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. AI Assistant & CLI Ingestion Guide */}
        <div className="rounded-2xl border theme-border theme-bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-500" />
              <h3 className="text-sm font-bold theme-text-primary">
                AI Assistant & CLI Logging Integration
              </h3>
            </div>
            <button
              onClick={onNavigateLogs}
              className="text-xs text-purple-500 hover:opacity-80 flex items-center gap-1 cursor-pointer font-semibold"
              type="button"
            >
              <span>View Changelog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs theme-text-muted mb-4">
            Push documentation updates and AI action logs directly from your terminal or AI coding workflows:
          </p>

          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase font-bold">
                1. Initialize Client Workspace Configuration
              </span>
              <CodeBlock className="language-bash">node scripts/init-config.js</CodeBlock>
            </div>

            <div>
              <span className="text-[11px] font-mono text-zinc-500 uppercase font-bold">
                2. Record AI Action Log with Git Commit Hash
              </span>
              <CodeBlock className="language-bash">
                node scripts/log.js --scope frontend --feat FEAT-1 --task TASK-1-2 --summary &quot;Re-implemented modern documentation reader frontend&quot; --files &quot;src/components/DocReader.tsx,src/components/ActivityChangelog.tsx&quot;
              </CodeBlock>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
