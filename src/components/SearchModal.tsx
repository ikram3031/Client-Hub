"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, FileText, Folder, Terminal, ArrowRight, X } from "lucide-react";
import { DocItem, ActionLog } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

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
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 bg-muted/20">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documentation, guides, categories, logs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm text-foreground bg-transparent focus:outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="px-1.5 py-0.5 rounded-md text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border bg-muted"
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
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-primary" />
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
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted text-left transition-colors cursor-pointer group"
                    type="button"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground block truncate">
                          {doc.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {doc.category} · /{doc.slug}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories Section */}
          {matchedCategories.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
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
                    className="flex items-center space-x-2 p-2.5 rounded-xl hover:bg-muted text-left transition-colors cursor-pointer group"
                    type="button"
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-medium text-foreground truncate">{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Activity Logs Section */}
          {matchedLogs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
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
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted text-left transition-colors cursor-pointer group"
                    type="button"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Badge variant="purple" className="text-[10px]">
                        {log.scope}
                      </Badge>
                      <span className="font-medium text-foreground truncate">
                        {log.summary}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      #{log.id.slice(0, 6)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedDocs.length === 0 && matchedCategories.length === 0 && matchedLogs.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p>No results found for &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>Navigate with mouse or keyboard</span>
          <span>docsNlogs Hub</span>
        </div>
      </div>
    </div>
  );
};
