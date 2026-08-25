"use client";

import React, { useState } from "react";
import { X, Layers, Plus, AlertCircle } from "lucide-react";
import { createProject } from "@/lib/api";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (slug: string) => void;
}

// Converts a project name into a clean hyphenated URL slug
const createProjectSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// Modal dialog for onboarding and seeding a new project into Cloudflare D1
export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [categories, setCategories] = useState<string>("Architecture, Backend, Frontend, Dashboard");
  const [scopes, setScopes] = useState<string>("frontend, backend, dashboard");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  // Auto-generates slug as project name is typed
  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(createProjectSlug(val));
  };

  // Handles onboarding form submission
  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError("Project name and slug are required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await createProject({
        name,
        slug,
        description,
        docsCategories: categories.split(",").map((c) => c.trim()).filter(Boolean),
        logScopes: scopes.split(",").map((s) => s.trim()).filter(Boolean),
      });

      if (res.success) {
        setName("");
        setSlug("");
        setDescription("");
        onProjectCreated(slug);
        onClose();
      } else {
        setError(res.error || "Failed to onboard project");
      }
    } catch (err: any) {
      setError(err.message || "Network error while onboarding project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in select-none">
      <div className="w-full max-w-lg theme-bg-card border theme-border rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b theme-border theme-bg-secondary">
          <div className="flex items-center gap-2.5 theme-text-primary font-bold text-base">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>Onboard New Project</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg theme-text-muted hover:theme-text-primary theme-bg-hover transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitProject} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
              Project Name
            </label>
            <input
              type="text"
              placeholder="e.g. Acme ERP System"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full theme-bg-primary border theme-border rounded-lg px-3 py-2 theme-text-primary text-sm font-semibold focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
              Project Slug (Unique identifier)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full theme-bg-primary border theme-border rounded-lg px-3 py-2 theme-text-primary font-mono focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the workspace project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full theme-bg-primary border theme-border rounded-lg p-3 theme-text-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
              Documentation Categories (Comma-separated)
            </label>
            <input
              type="text"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              className="w-full theme-bg-primary border theme-border rounded-lg px-3 py-2 theme-text-primary focus:outline-none"
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Onboarding..." : "Onboard Project"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
