"use client";

import React, { useState } from "react";
import { X, FileText, Plus, AlertCircle } from "lucide-react";
import { saveDoc } from "@/lib/api";

interface NewDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectSlug: string;
  categories: string[];
  defaultCategory?: string;
  onDocCreated: (slug: string) => void;
}

// Modal dialog for creating a new markdown documentation page
export const NewDocModal: React.FC<NewDocModalProps> = ({
  isOpen,
  onClose,
  projectSlug,
  categories,
  defaultCategory,
  onDocCreated,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(defaultCategory || categories[0] || "Architecture");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("# Title\n\nWrite documentation here...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Auto-generates url slug from document title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(generated);
  };

  // Handles form submission to create the doc in Cloudflare D1
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setError("Title and slug are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await saveDoc(projectSlug, {
        category,
        title,
        slug,
        content,
        tags: [category.toLowerCase()],
      });

      if (res.success) {
        onDocCreated(slug);
        onClose();
      } else {
        setError(res.error || "Failed to create document");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-xl theme-bg-card border theme-border rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b theme-border theme-bg-secondary">
          <div className="flex items-center gap-2 theme-text-primary font-bold text-base">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>Create New Document</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg theme-text-muted hover:theme-text-primary theme-bg-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full theme-bg-primary border theme-border rounded-lg px-3 py-2 theme-text-primary focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
                Slug (URL Identifier)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full theme-bg-primary border theme-border rounded-lg px-3 py-2 theme-text-primary font-mono focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
              Document Title
            </label>
            <input
              type="text"
              placeholder="e.g. D1 Database Clustering"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full theme-bg-primary border theme-border rounded-lg px-3 py-2 theme-text-primary text-sm font-semibold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
              Initial Markdown Content
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full theme-bg-primary border theme-border rounded-lg p-3 theme-text-primary font-mono text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t theme-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg theme-text-muted hover:theme-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Creating..." : "Create Document"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
