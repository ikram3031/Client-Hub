"use client";

import React, { useState } from "react";
import { X, Layers, Plus, AlertCircle } from "lucide-react";
import { createProject } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const [name, setName] = useState<string>("Client ERP");
  const [slug, setSlug] = useState<string>("client-erp");
  const [description, setDescription] = useState<string>("Client ERP System and Core Business Logic");
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
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center space-x-2 text-foreground font-bold text-base">
            <Layers className="w-4 h-4 text-primary" />
            <span>Onboard New Project</span>
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
        <form onSubmit={handleSubmitProject} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
              Project Name
            </label>
            <Input
              placeholder="e.g. Core API"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
              Project Slug (Unique identifier)
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
              Description
            </label>
            <Textarea
              rows={2}
              placeholder="Brief description of the workspace project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
              Documentation Categories (Comma-separated)
            </label>
            <Input
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
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
              <span>{isSubmitting ? "Onboarding..." : "Onboard Project"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
