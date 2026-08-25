"use client";

import React from "react";
import { Folder, FileText, Plus, ChevronRight, BookOpen, Clock } from "lucide-react";
import { DocItem } from "@/lib/api";

interface FolderOverviewProps {
  projectSlug: string;
  projectName?: string;
  category: string;
  docs: DocItem[];
  onSelectDoc: (slug: string) => void;
  onOpenNewDocModal: (category: string) => void;
  onNavigateHome?: () => void;
}

// Category folder overview displaying list of documents under the selected section
export const FolderOverview: React.FC<FolderOverviewProps> = ({
  projectSlug,
  projectName,
  category,
  docs,
  onSelectDoc,
  onOpenNewDocModal,
  onNavigateHome,
}) => {
  const categoryDocs = docs.filter(
    (d) => d.category.toLowerCase() === category.toLowerCase()
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar font-sans theme-bg-primary theme-text-primary px-6 py-6 md:px-12 md:py-8">
      <div className="max-w-4xl w-full mx-auto pb-16">
        {/* 1. Subtle Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-6 font-mono select-none">
          <button
            onClick={onNavigateHome}
            className="hover:theme-accent transition-colors cursor-pointer shrink-0 font-medium"
            type="button"
          >
            {projectName || projectSlug}
          </button>
          <span className="opacity-40">/</span>
          <span className="text-zinc-500 font-medium">Docs</span>
          <span className="opacity-40">/</span>
          <span className="theme-text-primary font-semibold truncate">{category}</span>
        </nav>

        {/* 2. Top Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b theme-border">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs">
              <Folder className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight theme-text-primary">
                {category}
              </h1>
              <p className="text-xs md:text-sm theme-text-muted mt-1">
                {categoryDocs.length} documentation page{categoryDocs.length !== 1 ? "s" : ""} under this category
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenNewDocModal(category)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            type="button"
          >
            <Plus className="w-4 h-4" />
            <span>New {category} Doc</span>
          </button>
        </div>

        {/* 3. Document Cards Grid */}
        {categoryDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed theme-border theme-bg-card text-center">
            <BookOpen className="w-10 h-10 theme-text-muted mb-3 opacity-60" />
            <h3 className="text-sm font-semibold theme-text-primary">No documents found in {category}</h3>
            <p className="text-xs theme-text-muted mt-1 max-w-sm">
              Create your first documentation page in this category to share architectural designs and guides.
            </p>
            <button
              onClick={() => onOpenNewDocModal(category)}
              className="mt-4 flex items-center gap-1.5 px-4 py-2 text-xs font-semibold theme-bg-card theme-bg-hover theme-text-primary rounded-xl border theme-border transition-all cursor-pointer shadow-xs"
              type="button"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Document</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDoc(doc.slug)}
                className="group p-5 rounded-2xl border theme-border theme-bg-card theme-bg-hover transition-all cursor-pointer shadow-xs flex flex-col justify-between hover:border-emerald-500/30"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg theme-bg-secondary text-zinc-500 group-hover:theme-accent transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold theme-text-primary group-hover:theme-accent transition-colors">
                        {doc.title}
                      </h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:theme-accent group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <p className="text-xs theme-text-secondary line-clamp-3 leading-relaxed mb-4">
                    {doc.content.replace(/[#*`_]/g, "").slice(0, 140)}...
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t theme-border text-[11px] theme-text-muted font-mono">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(doc.updated_at || doc.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">/{doc.slug}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
