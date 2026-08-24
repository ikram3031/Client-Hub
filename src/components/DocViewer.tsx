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
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { DocItem, updateDoc, deleteDoc } from "@/lib/api";
import { CodeBlock } from "@/components/CodeBlock";

interface DocViewerProps {
  doc: DocItem;
  projectSlug: string;
  onDocUpdated: () => void;
  onDocDeleted: () => void;
  onNavigateFolder: (category: string) => void;
}

// Full Markdown document reader and inline editor with direct-copy code blocks
export const DocViewer: React.FC<DocViewerProps> = ({
  doc,
  projectSlug,
  onDocUpdated,
  onDocDeleted,
  onNavigateFolder,
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-950 text-zinc-100 p-6 md:p-10 font-sans">
      {/* 1. Breadcrumbs & Top Actions */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
          <span>Projects</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-emerald-400 font-semibold">{projectSlug}</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <button
            onClick={() => onNavigateFolder(doc.category)}
            className="flex items-center gap-1 hover:text-amber-400 cursor-pointer transition-colors"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>{doc.category}</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-zinc-200">{doc.slug}</span>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Edit Doc</span>
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                title="Delete Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Document Header / Title & Metadata */}
      {isEditing ? (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1 font-mono">Title</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full text-xl font-bold bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1 font-mono">Category</label>
              <input
                type="text"
                value={editedCategory}
                onChange={(e) => setEditedCategory(e.target.value)}
                className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
            {doc.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 pb-4 border-b border-zinc-900">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{doc.last_edited_by || "AI Assistant"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>{new Date(doc.updated_at || doc.created_at).toLocaleString()}</span>
            </div>
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <div className="flex gap-1">
                  {doc.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 text-[10px] font-mono border border-zinc-800">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Document Content (Editor vs Rich Markdown Viewer) */}
      {isEditing ? (
        <div className="flex-1 flex flex-col">
          <label className="block text-xs font-semibold uppercase text-zinc-400 mb-2 font-mono">
            Markdown Content
          </label>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="flex-1 w-full min-h-[450px] p-4 font-mono text-sm leading-relaxed bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-emerald-500 resize-y"
          />
        </div>
      ) : (
        <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-emerald-400 prose-pre:p-0 prose-pre:bg-transparent">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom direct copy CodeBlock component for all code and commands
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match && typeof children === "string" && !children.includes("\n");

                if (isInline) {
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-[13px] border border-zinc-700/60" {...props}>
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
