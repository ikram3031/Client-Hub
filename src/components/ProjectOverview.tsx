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
} from "lucide-react";
import { Project, DocItem, Feature } from "@/lib/api";
import { CodeBlock } from "@/components/CodeBlock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar font-sans bg-background text-foreground px-6 py-8 md:px-12 md:py-10">
      <div className="max-w-4xl w-full mx-auto pb-16">
        {/* 1. Subtle Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-muted-foreground mb-8 select-none">
          <span>Projects</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="text-foreground font-semibold truncate">{project.name}</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span>Overview</span>
        </nav>

        {/* 2. Project Hero Section */}
        <div className="pb-8 mb-8 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3.5">
              <div className="p-3.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Layers className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                    {project.name}
                  </h1>
                  <Badge variant="outline" className="font-mono">{project.slug}</Badge>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                  {project.description || "Central Documentation & AI Action Logging Engine"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {overviewDoc && (
                <Button
                  onClick={() => onNavigateDoc(overviewDoc.slug)}
                >
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  <span>Read {overviewDoc.title}</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => onOpenNewDocModal()}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>New Doc</span>
              </Button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono block">
                Database
              </span>
              <span className="text-primary font-bold flex items-center gap-1.5 mt-1 text-sm">
                <Database className="w-4 h-4" /> Cloudflare D1
              </span>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono block">
                Documents
              </span>
              <span className="text-foreground font-bold text-base mt-1 block">
                {docs.length} Pages
              </span>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono block">
                Categories
              </span>
              <span className="text-amber-500 font-bold text-base mt-1 block">
                {categories.length} Folders
              </span>
            </Card>

            <Card className="p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono block">
                Features
              </span>
              <span className="text-cyan-500 font-bold text-base mt-1 block">
                {features.length} Epics
              </span>
            </Card>
          </div>
        </div>

        {/* 3. Documentation Categories Explorer */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center space-x-2">
              <Folder className="h-5 w-5 text-amber-500" />
              <span>Documentation Categories</span>
            </h2>
            <span className="text-xs text-muted-foreground">Click to browse pages</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const catDocs = docs.filter((d) => d.category.toLowerCase() === cat.toLowerCase());

              return (
                <Card
                  key={cat}
                  onClick={() => onNavigateFolder(cat)}
                  className="group p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between hover:border-amber-500/40"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                        <Folder className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {catDocs.length} doc{catDocs.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-foreground group-hover:text-amber-500 text-base transition-colors">
                      {cat}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {catDocs.length > 0
                        ? catDocs.map((d) => d.title).join(" · ")
                        : "No documents published yet"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-border text-xs text-muted-foreground group-hover:text-amber-500 font-semibold">
                    <span>Browse {cat} docs</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 4. AI Assistant & CLI Ingestion Guide */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                AI Assistant & CLI Logging Integration
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateLogs}
              className="text-xs text-primary"
            >
              <span>View Changelog</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Push documentation updates and AI action logs directly from your terminal or AI coding workflows:
          </p>

          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-mono text-muted-foreground uppercase font-bold">
                1. Initialize Client Workspace Configuration
              </span>
              <CodeBlock className="language-bash">node scripts/init-config.js</CodeBlock>
            </div>

            <div>
              <span className="text-[11px] font-mono text-muted-foreground uppercase font-bold">
                2. Record AI Action Log with Git Commit Hash
              </span>
              <CodeBlock className="language-bash">
                node scripts/log.js --scope frontend --feat FEAT-1 --task TASK-1-2 --summary &quot;Re-implemented modern documentation reader frontend&quot; --files &quot;src/components/DocReader.tsx,src/components/ActivityChangelog.tsx&quot;
              </CodeBlock>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
