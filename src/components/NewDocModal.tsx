"use client";

import React, { useState, useEffect } from "react";
import { X, FileText, Plus, AlertCircle } from "lucide-react";
import { saveDoc } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface NewDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectSlug: string;
  categories: string[];
  defaultCategory?: string;
  onDocCreated: (slug: string) => void;
}

// Converts a raw document title string into an alphanumeric hyphenated URL slug
const createSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// Modal dialog for creating a new markdown documentation page
export const NewDocModal: React.FC<NewDocModalProps> = ({
  isOpen,
  onClose,
  projectSlug,
  categories,
  defaultCategory,
  onDocCreated,
}) => {
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>(defaultCategory || categories[0] || "Architecture");
  const [slug, setSlug] = useState<string>("");
  const [content, setContent] = useState<string>(
    "## Overview\n\nProvide an architectural overview and guidelines here.\n\n```ts\n// Example implementation snippet\nexport const example = () => {\n  console.log('docsNlogs Edge Hub');\n};\n```\n"
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Synchronizes default category whenever modal opens
  useEffect(() => {
    if (defaultCategory) {
      setCategory(defaultCategory);
    } else if (categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [defaultCategory, categories, isOpen]);

  if (!isOpen) return null;

  // Auto-generates URL slug from document title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(createSlugFromTitle(val));
  };

  // Handles form submission to persist new doc in Cloudflare D1
  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setError("Document title and slug are required");
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
        lastEditedBy: "AI Architect",
      });

      if (res.success) {
        setTitle("");
        setSlug("");
        onDocCreated(slug);
        onClose();
      } else {
        setError(res.error || "Failed to create document in D1");
      }
    } catch (err: any) {
      setError(err.message || "Network error while saving document");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in select-none">
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center space-x-2 text-foreground font-bold text-base">
            <FileText className="w-4 h-4 text-primary" />
            <span>Create Documentation Page</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-lg"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitDoc} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 bg-background border border-border rounded-lg px-3 py-1 text-xs text-foreground focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
                URL Slug
              </label>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
              Document Title
            </label>
            <Input
              type="text"
              placeholder="e.g. Cloudflare D1 Storage"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
              Initial Markdown Content
            </label>
            <Textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-border">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>{isSubmitting ? "Creating..." : "Create Page"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
