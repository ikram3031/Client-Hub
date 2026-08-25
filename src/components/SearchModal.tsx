"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, FileText, Folder, Terminal, ArrowRight, X, Sparkles } from "lucide-react";
import { DocItem, ActionLog } from "@/lib/api";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  docs: DocItem[];
  logs: ActionLog[];
  onSelectDoc: (slug: string) => void;
  onSelectCategory: (category: string) => void;
  onSelectLogs: () => void;
}

// Global Command Palette / Search Modal providing fast fuzzy search across docs, folders, and changelogs
export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  docs,
  logs,
  onSelectDoc,
  onSelectCategory,
  onSelectLogs,
}) => {
  const [query, setQuery] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Handles Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  // Matched docs
  const matchedDocs = docs
    .filter(
      (d) =>
        !normalizedQuery ||
        d.title.toLowerCase().includes(normalizedQuery) ||
        d.category.toLowerCase().includes(normalizedQuery) ||
        d.content.toLowerCase().includes(normalizedQuery)
    )
    .slice(0, 5);

  // Matched categories
  const allCategories = Array.from(new Set(docs.map((d) => d.category)));
  const matchedCategories = allCategories
    .filter((c) => !normalizedQuery || c.toLowerCase().includes(normalizedQuery))
    .slice(0, 3);

  // Matched logs
  const matchedLogs = logs
    .filter(
      (l) =>
        !normalizedQuery ||
        l.summary.toLowerCase().includes(normalizedQuery) ||
        l.scope.toLowerCase().includes(normalizedQuery) ||
        l.id.toLowerCase().includes(normalizedQuery) ||
        (l.commit_id && l.commit_id.toLowerCase().includes(normalizedQuery))
    )
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-xs animate-in fade-in select-none">
      <div
        className="w-full max-w-2xl theme-bg-card border theme-border rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b theme-border gap-3">
          <Search className="w-4 h-4 theme-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documentation, guides, categories, logs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm theme-text-primary bg-transparent focus:outline-none placeholder:text-zinc-500"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-xs font-mono theme-text-muted hover:theme-text-primary border theme-border theme-bg-secondary"
            type="button"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 custom-scrollbar text-xs">
          {/* Docs Section */}
          {matchedDocs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider theme-text-muted font-mono flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-emerald-500" />
                <span>Documentation Pages</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchedDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      onSelectDoc(doc.slug);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl theme-bg-hover text-left transition-colors cursor-pointer group"
                    type="button"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg theme-bg-secondary text-zinc-500 group-hover:theme-accent transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold theme-text-primary block truncate">
                          {doc.title}
                        </span>
                        <span className="text-[11px] theme-text-muted font-mono">
                          {doc.category} · /{doc.slug}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 theme-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories Section */}
          {matchedCategories.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider theme-text-muted font-mono flex items-center gap-1.5">
                <Folder className="w-3 h-3 text-amber-500" />
                <span>Categories</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                {matchedCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      onSelectCategory(cat);
                      onClose();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl theme-bg-hover text-left transition-colors cursor-pointer group"
                    type="button"
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-medium theme-text-primary truncate">{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Activity Logs Section */}
          {matchedLogs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider theme-text-muted font-mono flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-purple-500" />
                <span>Changelog & Action Logs</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchedLogs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => {
                      onSelectLogs();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl theme-bg-hover text-left transition-colors cursor-pointer group"
                    type="button"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        {log.scope}
                      </span>
                      <span className="font-medium theme-text-primary truncate">
                        {log.summary}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                      #{log.id.slice(0, 6)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedDocs.length === 0 && matchedCategories.length === 0 && matchedLogs.length === 0 && (
            <div className="p-8 text-center theme-text-muted">
              <p>No results found for &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 border-t theme-border theme-bg-secondary flex items-center justify-between text-[11px] theme-text-muted font-mono">
          <span>Navigate with mouse or keyboard</span>
          <span>docsNlogs Hub</span>
        </div>
      </div>
    </div>
  );
};
