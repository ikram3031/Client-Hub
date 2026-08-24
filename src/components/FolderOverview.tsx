"use client";

import React from "react";
import { Folder, FileText, Plus, ChevronRight, BookOpen, Clock, Tag } from "lucide-react";
import { DocItem } from "@/lib/api";

interface FolderOverviewProps {
  projectSlug: string;
  category: string;
  docs: DocItem[];
  onSelectDoc: (slug: string) => void;
  onOpenNewDocModal: (category: string) => void;
}

// Category folder overview displaying documents cards, stats, and creation triggers
export const FolderOverview: React.FC<FolderOverviewProps> = ({
  projectSlug,
  category,
  docs,
  onSelectDoc,
  onOpenNewDocModal,
}) => {
  const categoryDocs = docs.filter(
    (d) => d.category.toLowerCase() === category.toLowerCase()
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-950 text-zinc-100 p-6 md:p-10 font-sans">
      {/* 1. Breadcrumbs */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <span>Projects</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-emerald-400 font-semibold">{projectSlug}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-zinc-200">DOCs</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-amber-400 font-semibold">{category}</span>
        </div>

        <button
          onClick={() => onOpenNewDocModal(category)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New {category} Doc</span>
        </button>
      </div>

      {/* 2. Category Title Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {category} Folder
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Contains {categoryDocs.length} documentation page{categoryDocs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Document Cards Grid */}
      {categoryDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center">
          <BookOpen className="w-10 h-10 text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">No documents found in {category}</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Create your first document in this category to start documenting your system.
          </p>
          <button
            onClick={() => onOpenNewDocModal(category)}
            className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg border border-zinc-700 transition-all cursor-pointer"
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
              className="group p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                      {doc.title}
                    </h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                  {doc.content.replace(/[#*`_]/g, "").slice(0, 140)}...
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(doc.updated_at || doc.created_at).toLocaleDateString()}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-400">/{doc.slug}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
