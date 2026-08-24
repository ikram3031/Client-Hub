"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Edit3,
  Trash2,
  Save,
  X,
  Clock,
  User,
  Tag,
  Folder,
} from "lucide-react";
import { DocItem, updateDoc, deleteDoc } from "@/lib/api";
import { CodeBlock } from "@/components/CodeBlock";
import { Breadcrumb } from "@/components/Breadcrumb";

interface DocViewerProps {
  doc: DocItem;
  projectSlug: string;
  onDocUpdated: () => void;
  onDocDeleted: () => void;
  onNavigateFolder: (category: string) => void;
  onNavigateHome?: () => void;
}

// Full Markdown document reader and inline editor with direct-copy code blocks and high-clarity breadcrumbs
export const DocViewer: React.FC<DocViewerProps> = ({
  doc,
  projectSlug,
  onDocUpdated,
  onDocDeleted,
  onNavigateFolder,
  onNavigateHome,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(doc.title);
  const [editedCategory, setEditedCategory] = useState(doc.category);
  const [editedContent, setEditedContent] = useState(doc.content);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedTitle(doc.title);
    setEditedCategory(doc.category);
    setEditedContent(doc.content);
    setIsEditing(false);
  }, [doc]);

  // Saves updated markdown content to Cloudflare D1
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(projectSlug, doc.slug, {
        title: editedTitle,
        category: editedCategory,
        content: editedContent,
      });
      setIsEditing(false);
      onDocUpdated();
    } catch (err) {
      console.error("Save document failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handles document deletion after confirmation
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      try {
        await deleteDoc(projectSlug, doc.slug);
        onDocDeleted();
      } catch (err) {
        console.error("Delete document failed", err);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto theme-bg-primary theme-text-primary p-6 md:p-10 font-sans">
      {/* 1. Prominent Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Projects", onClick: onNavigateHome },
          { label: projectSlug, onClick: onNavigateHome },
          { label: doc.category, onClick: () => onNavigateFolder(doc.category), icon: Folder },
          { label: doc.title, icon: FileText },
        ]}
      />

      {/* 2. Top Actions Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b theme-border">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md theme-bg-secondary text-xs font-mono theme-text-muted border theme-border font-semibold">
            /{doc.slug}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
            {doc.category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium theme-bg-card theme-bg-hover theme-text-secondary rounded-lg transition-all cursor-pointer border theme-border"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold theme-bg-card theme-bg-hover theme-text-primary rounded-lg border theme-border transition-all cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5 theme-text-muted" />
                <span>Edit Document</span>
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                title="Delete Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3. Document Title & Metadata */}
      {isEditing ? (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase theme-text-muted mb-1 font-mono">Title</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full text-2xl font-bold theme-bg-card border theme-border rounded-lg px-4 py-2 theme-text-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase theme-text-muted mb-1 font-mono">Category</label>
              <input
                type="text"
                value={editedCategory}
                onChange={(e) => setEditedCategory(e.target.value)}
                className="w-full text-xs theme-bg-card border theme-border rounded-lg px-3 py-2 theme-text-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight theme-text-primary mb-4 leading-tight">
            {doc.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs theme-text-secondary pb-4 border-b theme-border">
            <div className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 theme-accent" />
              <span>Author: {doc.last_edited_by || "AI Assistant"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 theme-text-muted" />
              <span>Updated: {new Date(doc.updated_at || doc.created_at).toLocaleString()}</span>
            </div>
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <div className="flex gap-1">
                  {doc.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full theme-bg-card theme-text-secondary text-[11px] font-mono font-medium border theme-border">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Document Content (Editor vs Rich Markdown Viewer) */}
      {isEditing ? (
        <div className="flex-1 flex flex-col">
          <label className="block text-xs font-semibold uppercase theme-text-muted mb-2 font-mono">
            Markdown Editor
          </label>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="flex-1 w-full min-h-[450px] p-4 font-mono text-sm leading-relaxed theme-bg-card border theme-border rounded-xl theme-text-primary focus:outline-none resize-y"
          />
        </div>
      ) : (
        <div className="prose max-w-none theme-text-primary leading-relaxed text-sm md:text-base space-y-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom direct copy CodeBlock component for all code and commands
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match && typeof children === "string" && !children.includes("\n");

                if (isInline) {
                  return (
                    <code className="px-1.5 py-0.5 rounded theme-bg-card theme-accent font-mono text-[13px] font-semibold border theme-border" {...props}>
                      {children}
                    </code>
                  );
                }

                return <CodeBlock className={className}>{children}</CodeBlock>;
              },
            }}
          >
            {doc.content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};
