"use client";

import React, { useState } from "react";
import { X, Layers, Plus, AlertCircle } from "lucide-react";
import { createProject } from "@/lib/api";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (slug: string) => void;
}

// Modal dialog for onboarding a new client / white-label project to the central hub
export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState("Architecture, Backend, Frontend, Dashboard");
  const [scopes, setScopes] = useState("frontend, backend, dashboard");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Automatically generates lowercase slug from project name
  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(generated);
  };

  // Handles project onboarding submission to Cloudflare D1
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required");
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
        onProjectCreated(slug);
        onClose();
      } else {
        setError(res.error || "Failed to create project");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-base">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Onboard New Project</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
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

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase font-mono">
              Project Name
            </label>
            <input
              type="text"
              placeholder="e.g. Client ERP System"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm font-semibold focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase font-mono">
              Project Slug (Unique identifier)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase font-mono">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the workspace"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1 uppercase font-mono">
              Documentation Categories (Comma-separated)
            </label>
            <input
              type="text"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all disabled:opacity-50"
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
