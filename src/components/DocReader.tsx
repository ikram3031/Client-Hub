"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  Share2,
  Eye,
  BookOpen,
  Info,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { DocItem, updateDoc, deleteDoc } from "@/lib/api";
import { CodeBlock } from "@/components/CodeBlock";
import { TableOfContents } from "@/components/TableOfContents";

interface DocReaderProps {
  doc: DocItem;
  allDocs?: DocItem[];
  projectSlug: string;
  onDocUpdated: () => void;
  onDocDeleted: () => void;
  onNavigateFolder: (category: string) => void;
  onNavigateDoc?: (slug: string) => void;
  onNavigateHome?: () => void;
}

// Calculates estimated reading time in minutes based on word count
const calculateReadingTime = (text: string): number => {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

// Formats timestamp into clean human-readable date
const formatTimestamp = (dateString?: string): string => {
  if (!dateString) return "Recently";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Converts text into a clean URL-friendly anchor ID
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// Main Content Reader Engine rendering full GFM Markdown, interactive CodeBlocks, and bottom navigation
export const DocReader: React.FC<DocReaderProps> = ({
  doc,
  allDocs = [],
  projectSlug,
  onDocUpdated,
  onDocDeleted,
  onNavigateFolder,
  onNavigateDoc,
  onNavigateHome,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedTitle, setEditedTitle] = useState<string>(doc.title);
  const [editedCategory, setEditedCategory] = useState<string>(doc.category);
  const [editedContent, setEditedContent] = useState<string>(doc.content);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");

  // Synchronizes local state whenever the active document changes
  useEffect(() => {
    setEditedTitle(doc.title);
    setEditedCategory(doc.category);
    setEditedContent(doc.content);
    setIsEditing(false);
    setEditorTab("write");
  }, [doc]);

  // Calculates sequential previous and next documentation pages for continuous flow
  const { prevDoc, nextDoc } = useMemo(() => {
    if (!allDocs || allDocs.length === 0) return { prevDoc: null, nextDoc: null };

    // Sort documents with same category grouped together
    const sorted = [...allDocs].sort((a, b) => {
      if (a.category === b.category) {
        return a.title.localeCompare(b.title);
      }
      return a.category.localeCompare(b.category);
    });

    const currentIndex = sorted.findIndex((d) => d.slug === doc.slug);
    if (currentIndex === -1) return { prevDoc: null, nextDoc: null };

    const prev = currentIndex > 0 ? sorted[currentIndex - 1] : null;
    const next = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

    return { prevDoc: prev, nextDoc: next };
  }, [allDocs, doc.slug]);

  // Saves modified markdown content and metadata to Cloudflare D1
  const handleSaveDoc = async () => {
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
      console.error("Failed to save document:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Prompts confirmation and deletes the current document
  const handleDeleteDoc = async () => {
    if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      try {
        await deleteDoc(projectSlug, doc.slug);
        onDocDeleted();
      } catch (err) {
        console.error("Failed to delete document:", err);
      }
    }
  };

  // Copies the current document reference URL to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Copy link error:", err);
    }
  };

  const readingTime = calculateReadingTime(doc.content);
  const authorBadge = doc.last_edited_by || "AI Architect";

  return (
    <div className="flex-1 flex overflow-hidden font-sans theme-bg-primary theme-text-primary">
      {/* Center Reading Container */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar px-6 py-6 md:px-12 md:py-8">
        <div className="max-w-4xl w-full mx-auto pb-16">
          {/* 1. Subtle Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-6 font-mono select-none overflow-x-auto">
            <button
              onClick={onNavigateHome}
              className="hover:theme-accent transition-colors cursor-pointer shrink-0 font-medium"
              type="button"
            >
              Docs
            </button>
            <span className="opacity-40">/</span>
            <button
              onClick={() => onNavigateFolder(doc.category)}
              className="hover:theme-accent transition-colors cursor-pointer flex items-center gap-1 shrink-0 font-medium"
              type="button"
            >
              <Folder className="w-3 h-3 text-amber-500" />
              <span>{doc.category}</span>
            </button>
            <span className="opacity-40">/</span>
            <span className="theme-text-primary font-semibold truncate shrink-0">
              {doc.title}
            </span>
          </nav>

          {/* 2. Document Header & Actions Bar */}
          <div className="flex items-start justify-between gap-4 pb-6 mb-8 border-b theme-border">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase theme-text-muted mb-1 font-mono">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full text-2xl md:text-3xl font-black theme-bg-card border theme-border rounded-xl px-4 py-2 theme-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase theme-text-muted mb-1 font-mono">
                      Category
                    </label>
                    <input
                      type="text"
                      value={editedCategory}
                      onChange={(e) => setEditedCategory(e.target.value)}
                      className="w-full max-w-xs text-xs theme-bg-card border theme-border rounded-lg px-3 py-1.5 theme-text-primary focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20">
                      {doc.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md theme-bg-secondary theme-text-muted text-[11px] font-mono border theme-border">
                      /{doc.slug}
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight theme-text-primary mb-4 leading-[1.15]">
                    {doc.title}
                  </h1>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs theme-text-secondary">
                    {/* Author Badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{authorBadge}</span>
                    </div>

                    {/* Last Updated */}
                    <div className="flex items-center gap-1.5 theme-text-muted">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Updated {formatTimestamp(doc.updated_at || doc.created_at)}</span>
                    </div>

                    {/* Reading Time */}
                    <div className="flex items-center gap-1.5 theme-text-muted">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{readingTime} min read</span>
                    </div>

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md theme-bg-secondary text-[11px] font-mono theme-text-muted border theme-border"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium theme-bg-card theme-bg-hover theme-text-secondary rounded-lg border theme-border transition-all cursor-pointer"
                    type="button"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSaveDoc}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                    type="button"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving..." : "Save Doc"}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-lg theme-bg-card theme-bg-hover border theme-border theme-text-secondary hover:theme-text-primary transition-all cursor-pointer"
                    title="Copy Page URL"
                    type="button"
                  >
                    {linkCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold theme-bg-card theme-bg-hover theme-text-primary rounded-lg border theme-border transition-all cursor-pointer shadow-xs"
                    type="button"
                  >
                    <Edit3 className="w-3.5 h-3.5 theme-accent" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDeleteDoc}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                    title="Delete Document"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 3. Main Content Viewport (Markdown Engine vs Fast Editor) */}
          {isEditing ? (
            <div className="space-y-4">
              {/* Tab Navigation: Write vs Preview */}
              <div className="flex items-center gap-2 border-b theme-border pb-2">
                <button
                  onClick={() => setEditorTab("write")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    editorTab === "write"
                      ? "theme-accent-bg theme-accent border theme-accent-border"
                      : "theme-text-muted hover:theme-text-primary"
                  }`}
                  type="button"
                >
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Write Markdown</span>
                  </span>
                </button>
                <button
                  onClick={() => setEditorTab("preview")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    editorTab === "preview"
                      ? "theme-accent-bg theme-accent border theme-accent-border"
                      : "theme-text-muted hover:theme-text-primary"
                  }`}
                  type="button"
                >
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </span>
                </button>
              </div>

              {editorTab === "write" ? (
                <div>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={20}
                    className="w-full p-4 font-mono text-sm leading-relaxed theme-bg-card border theme-border rounded-xl theme-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-y custom-scrollbar"
                    placeholder="Write documentation using GitHub Flavored Markdown..."
                  />
                </div>
              ) : (
                <div className="p-6 rounded-xl border theme-border theme-bg-card">
                  <div className="prose prose-zinc dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {editedContent}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <article className="prose-container">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // 1. Code block renderer with dark sleek container & 1-click copy
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match && typeof children === "string" && !children.includes("\n");

                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md theme-bg-secondary text-emerald-600 dark:text-emerald-400 font-mono text-[13px] font-semibold border theme-border"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return <CodeBlock className={className}>{children}</CodeBlock>;
                  },

                  // 2. Headings with anchor IDs for Table of Contents
                  h1({ children }) {
                    const text = String(children || "");
                    const id = slugify(text);
                    return (
                      <h1 id={id} className="text-2xl md:text-3xl font-bold tracking-tight theme-text-primary mt-8 mb-4 border-b theme-border pb-2">
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    const text = String(children || "");
                    const id = slugify(text);
                    return (
                      <h2 id={id} className="group flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight theme-text-primary mt-8 mb-4 border-b theme-border pb-2 scroll-mt-6">
                        <span>{children}</span>
                        <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 theme-text-muted hover:theme-accent text-sm font-mono transition-opacity">
                          #
                        </a>
                      </h2>
                    );
                  },
                  h3({ children }) {
                    const text = String(children || "");
                    const id = slugify(text);
                    return (
                      <h3 id={id} className="text-lg md:text-xl font-bold tracking-tight theme-text-primary mt-6 mb-3 scroll-mt-6">
                        {children}
                      </h3>
                    );
                  },

                  // 3. Paragraphs
                  p({ children }) {
                    return (
                      <p className="text-sm md:text-base leading-relaxed theme-text-secondary mb-4">
                        {children}
                      </p>
                    );
                  },

                  // 4. Blockquotes formatted as callout notes
                  blockquote({ children }) {
                    return (
                      <blockquote className="my-5 p-4 rounded-xl border-l-4 border-emerald-500 theme-bg-card border theme-border theme-text-secondary text-sm leading-relaxed shadow-xs">
                        <div className="flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="flex-1">{children}</div>
                        </div>
                      </blockquote>
                    );
                  },

                  // 5. GFM Tables
                  table({ children }) {
                    return (
                      <div className="my-6 overflow-x-auto rounded-xl border theme-border shadow-xs">
                        <table className="w-full text-left text-xs md:text-sm theme-bg-card">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return (
                      <thead className="theme-bg-secondary border-b theme-border font-mono text-[11px] uppercase tracking-wider theme-text-muted">
                        {children}
                      </thead>
                    );
                  },
                  th({ children }) {
                    return <th className="px-4 py-3 font-semibold">{children}</th>;
                  },
                  td({ children }) {
                    return (
                      <td className="px-4 py-3 border-b theme-border last:border-0 theme-text-secondary">
                        {children}
                      </td>
                    );
                  },

                  // 6. Lists
                  ul({ children }) {
                    return <ul className="list-disc pl-6 space-y-1.5 my-4 text-sm md:text-base theme-text-secondary">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-6 space-y-1.5 my-4 text-sm md:text-base theme-text-secondary">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="leading-relaxed">{children}</li>;
                  },

                  // 7. Links
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline underline-offset-4 decoration-emerald-500/40 hover:decoration-emerald-500 transition-colors"
                        target={href?.startsWith("http") ? "_blank" : undefined}
                        rel={href?.startsWith("http") ? "noreferrer" : undefined}
                      >
                        {children}
                      </a>
                    );
                  },

                  // 8. Horizontal Rules
                  hr() {
                    return <hr className="my-8 border-t theme-border" />;
                  },
                }}
              >
                {doc.content}
              </ReactMarkdown>
            </article>
          )}

          {/* 4. Bottom Navigation: "← Previous Page" & "Next Page →" Cards */}
          {!isEditing && (
            <div className="mt-14 pt-8 border-t theme-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Previous Page Card */}
                {prevDoc ? (
                  <button
                    onClick={() => onNavigateDoc && onNavigateDoc(prevDoc.slug)}
                    className="group flex flex-col items-start p-4 rounded-xl border theme-border theme-bg-card theme-bg-hover hover:border-emerald-500/40 transition-all cursor-pointer text-left shadow-xs"
                    type="button"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1.5 group-hover:theme-accent transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                      <span>Previous Page</span>
                    </div>
                    <span className="text-sm font-bold theme-text-primary group-hover:theme-accent transition-colors truncate w-full">
                      {prevDoc.title}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {prevDoc.category}
                    </span>
                  </button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {/* Next Page Card */}
                {nextDoc ? (
                  <button
                    onClick={() => onNavigateDoc && onNavigateDoc(nextDoc.slug)}
                    className="group flex flex-col items-end p-4 rounded-xl border theme-border theme-bg-card theme-bg-hover hover:border-emerald-500/40 transition-all cursor-pointer text-right shadow-xs sm:col-start-2"
                    type="button"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1.5 group-hover:theme-accent transition-colors">
                      <span>Next Page</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <span className="text-sm font-bold theme-text-primary group-hover:theme-accent transition-colors truncate w-full">
                      {nextDoc.title}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {nextDoc.category}
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar Table of Contents ("On this page") */}
      {!isEditing && (
        <TableOfContents
          content={doc.content}
          onEditClick={() => setIsEditing(true)}
        />
      )}
    </div>
  );
};
