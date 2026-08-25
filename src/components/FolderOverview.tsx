"use client";

import React from "react";
import { Folder, FileText, Plus, ChevronRight, BookOpen, Clock } from "lucide-react";
import { DocItem } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
  const { requireAuth } = useAuth();
  const categoryDocs = docs.filter(
    (d) => d.category.toLowerCase() === category.toLowerCase()
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar font-sans bg-background text-foreground px-6 py-8 md:px-12 md:py-10">
      <div className="max-w-4xl w-full mx-auto pb-16">
        {/* 1. Subtle Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-muted-foreground mb-8 select-none">
          <button
            onClick={onNavigateHome}
            className="hover:text-foreground transition-colors cursor-pointer font-medium"
            type="button"
          >
            {projectName || projectSlug}
          </button>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span>Docs</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="text-foreground font-semibold truncate">{category}</span>
        </nav>

        {/* 2. Top Header */}
        <div className="flex items-center justify-between pb-8 mb-8 border-b border-border">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
              <Folder className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                {category}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {categoryDocs.length} documentation page{categoryDocs.length !== 1 ? "s" : ""} in this section
              </p>
            </div>
          </div>

          <Button
            onClick={() => requireAuth(() => onOpenNewDocModal(category))}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New {category} Doc</span>
          </Button>
        </div>

        {/* 3. Document Cards Grid */}
        {categoryDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border bg-card text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-foreground">No documents found in {category}</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Create your first documentation page in this category to share architectural designs and guides.
            </p>
            <Button
              variant="outline"
              onClick={() => requireAuth(() => onOpenNewDocModal(category))}
              className="mt-4"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Document</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryDocs.map((doc) => (
              <Card
                key={doc.id}
                onClick={() => onSelectDoc(doc.slug)}
                className="group p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between hover:border-primary/40"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {doc.title}
                      </h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                    {doc.content.replace(/[#*`_]/g, "").slice(0, 140)}...
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border text-[11px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(doc.updated_at || doc.created_at).toLocaleDateString()}</span>
                  </div>
                  <span>/{doc.slug}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
