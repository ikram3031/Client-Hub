"use client";

import React from "react";
import { Folder, FileText, Plus, ChevronRight, BookOpen, Clock } from "lucide-react";
import { DocItem } from "@/lib/api";
import { Breadcrumb } from "@/components/Breadcrumb";

interface FolderOverviewProps {
  projectSlug: string;
  category: string;
  docs: DocItem[];
  onSelectDoc: (slug: string) => void;
  onOpenNewDocModal: (category: string) => void;
  onNavigateHome?: () => void;
}

// Category folder overview displaying documents cards, stats, and creation triggers
export const FolderOverview: React.FC<FolderOverviewProps> = ({
  projectSlug,
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto theme-bg-primary theme-text-primary p-6 md:p-10 font-sans">
      {/* 1. Prominent Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: "Projects", onClick: onNavigateHome },
          { label: projectSlug, onClick: onNavigateHome },
          { label: "DOCs" },
          { label: category, icon: Folder },
        ]}
      />

      {/* 2. Top Actions Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b theme-border">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight theme-text-primary">
              {category} Category
            </h1>
            <p className="text-xs theme-text-muted mt-0.5">
              Contains {categoryDocs.length} documentation page{categoryDocs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenNewDocModal(category)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New {category} Doc</span>
        </button>
      </div>

      {/* 3. Document Cards Grid */}
      {categoryDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed theme-border theme-bg-card text-center">
          <BookOpen className="w-10 h-10 theme-text-muted mb-3" />
          <h3 className="text-sm font-semibold theme-text-primary">No documents found in {category}</h3>
          <p className="text-xs theme-text-muted mt-1 max-w-sm">
            Create your first document in this category to start documenting your system.
          </p>
          <button
            onClick={() => onOpenNewDocModal(category)}
            className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold theme-bg-card theme-bg-hover theme-text-primary rounded-lg border theme-border transition-all cursor-pointer"
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
              className="group p-5 rounded-2xl border theme-border theme-bg-card theme-bg-hover transition-all cursor-pointer shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg theme-bg-secondary theme-text-secondary group-hover:theme-accent transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold theme-text-primary group-hover:theme-accent transition-colors">
                      {doc.title}
                    </h3>
                  </div>
                  <ChevronRight className="w-4 h-4 theme-text-muted group-hover:theme-accent group-hover:translate-x-0.5 transition-all" />
                </div>

                <p className="text-xs theme-text-secondary line-clamp-2 leading-relaxed mb-4">
                  {doc.content.replace(/[#*`_]/g, "").slice(0, 140)}...
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t theme-border text-[11px] theme-text-muted font-mono">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(doc.updated_at || doc.created_at).toLocaleDateString()}</span>
                </div>
                <span className="font-mono text-[10px] theme-text-muted">/{doc.slug}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
