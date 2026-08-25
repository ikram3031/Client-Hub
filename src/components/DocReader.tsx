"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Edit3,
  Trash2,
  Save,
  X,
  Clock,
  User,
  Folder,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Eye,
  BookOpen,
  Info,
  Layers,
  Lock,
} from "lucide-react";
import { DocItem, updateDoc, deleteDoc } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CodeBlock } from "@/components/CodeBlock";
import { TableOfContents } from "@/components/TableOfContents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DocReaderProps {
  doc: DocItem;
  allDocs?: DocItem[];
  projectSlug: string;
  projectName?: string;
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
  projectName,
  onDocUpdated,
  onDocDeleted,
  onNavigateFolder,
  onNavigateDoc,
  onNavigateHome,
}) => {
  const { isUnlocked, requireAuth } = useAuth();
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
    <div className="flex-1 flex overflow-hidden font-sans bg-background text-foreground">
      {/* Center Reading Container */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar px-6 py-8 md:px-12 md:py-10">
        <div className="max-w-4xl w-full mx-auto pb-16">
          {/* 1. Subtle Breadcrumb */}
          <nav className="flex items-center space-x-2 text-xs text-muted-foreground mb-8 select-none overflow-x-auto">
            <button
              onClick={onNavigateHome}
              className="hover:text-foreground transition-colors cursor-pointer font-medium"
              type="button"
            >
              Docs
            </button>
            <ChevronRight className="h-3.5 w-3.5 opacity-50 shrink-0" />
            <button
              onClick={onNavigateHome}
              className="hover:text-foreground transition-colors cursor-pointer font-medium shrink-0"
              type="button"
            >
              {projectName || projectSlug}
            </button>
            <ChevronRight className="h-3.5 w-3.5 opacity-50 shrink-0" />
            <button
              onClick={() => onNavigateFolder(doc.category)}
              className="hover:text-foreground transition-colors cursor-pointer flex items-center gap-1 shrink-0 font-medium"
              type="button"
            >
              <span>{doc.category}</span>
            </button>
            <ChevronRight className="h-3.5 w-3.5 opacity-50 shrink-0" />
            <span className="text-foreground font-semibold truncate shrink-0">
              {doc.title}
            </span>
          </nav>

          {/* 2. Document Header & Metadata */}
          <div className="flex items-start justify-between gap-4 pb-8 mb-8 border-b border-border">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 font-mono">
                      Document Title
                    </label>
                    <Input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-xl md:text-2xl font-bold h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 font-mono">
                      Category
                    </label>
                    <Input
                      type="text"
                      value={editedCategory}
                      onChange={(e) => setEditedCategory(e.target.value)}
                      className="max-w-xs text-xs"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="amber">{doc.category}</Badge>
                    <Badge variant="outline" className="font-mono text-[11px]">/{doc.slug}</Badge>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
                    {doc.title}
                  </h1>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-muted-foreground">
                    {/* Author Badge */}
                    <div className="flex items-center space-x-1.5 bg-muted px-2.5 py-1 rounded-full text-xs font-medium text-foreground">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{authorBadge}</span>
                    </div>

                    <span>•</span>

                    {/* Last Updated */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Last Updated {formatTimestamp(doc.updated_at || doc.created_at)}</span>
                    </div>

                    <span>•</span>

                    {/* Reading Time */}
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{readingTime} min read</span>
                    </div>

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex items-center gap-1 ml-1">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-mono text-muted-foreground border border-border/50"
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    <span>Cancel</span>
                  </Button>
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={handleSaveDoc}
                    disabled={isSaving}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    <span>{isSaving ? "Saving..." : "Save Doc"}</span>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    title="Copy Page URL"
                  >
                    {linkCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </Button>
                  {isUnlocked && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        title="Edit Document"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-primary" />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDeleteDoc}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 3. Main Content Viewport (Markdown Engine vs Fast Editor) */}
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <button
                  onClick={() => setEditorTab("write")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    editorTab === "write"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
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
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
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
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={20}
                    className="font-mono text-sm leading-relaxed min-h-[420px]"
                    placeholder="Write documentation using GitHub Flavored Markdown..."
                  />
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-border bg-card">
                  <div className="prose prose-zinc dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {editedContent}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <article className="prose prose-zinc dark:prose-invert max-w-none leading-relaxed text-sm md:text-base">
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
                          className="bg-muted text-foreground px-1.5 py-0.5 rounded-md font-mono text-[13px] font-semibold border border-border"
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
                      <h1 id={id} className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mt-8 mb-4 border-b border-border pb-2">
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    const text = String(children || "");
                    const id = slugify(text);
                    return (
                      <h2 id={id} className="group flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight text-foreground mt-8 mb-4 border-b border-border pb-2 scroll-mt-6">
                        <span>{children}</span>
                        <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground text-sm font-mono transition-opacity">
                          #
                        </a>
                      </h2>
                    );
                  },
                  h3({ children }) {
                    const text = String(children || "");
                    const id = slugify(text);
                    return (
                      <h3 id={id} className="text-lg md:text-xl font-bold tracking-tight text-foreground mt-6 mb-3 scroll-mt-6">
                        {children}
                      </h3>
                    );
                  },

                  // 3. Paragraphs
                  p({ children }) {
                    return (
                      <p className="text-sm md:text-base leading-relaxed text-foreground/90 mb-4">
                        {children}
                      </p>
                    );
                  },

                  // 4. Blockquotes formatted as callout notes
                  blockquote({ children }) {
                    return (
                      <blockquote className="my-5 p-4 rounded-xl border-l-4 border-primary bg-muted/40 border border-border text-foreground/90 text-sm leading-relaxed shadow-xs">
                        <div className="flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div className="flex-1 not-italic">{children}</div>
                        </div>
                      </blockquote>
                    );
                  },

                  // 5. GFM Tables
                  table({ children }) {
                    return (
                      <div className="my-6 overflow-x-auto rounded-xl border border-border shadow-xs">
                        <table className="w-full text-left text-xs md:text-sm bg-card">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  thead({ children }) {
                    return (
                      <thead className="bg-muted/60 border-b border-border font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {children}
                      </thead>
                    );
                  },
                  th({ children }) {
                    return <th className="px-4 py-3 font-semibold text-foreground">{children}</th>;
                  },
                  td({ children }) {
                    return (
                      <td className="px-4 py-3 border-b border-border last:border-0 text-foreground/90">
                        {children}
                      </td>
                    );
                  },

                  // 6. Lists
                  ul({ children }) {
                    return <ul className="list-disc pl-6 space-y-1.5 my-4 text-sm md:text-base text-foreground/90">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal pl-6 space-y-1.5 my-4 text-sm md:text-base text-foreground/90">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="leading-relaxed">{children}</li>;
                  },

                  // 7. Links
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        className="text-primary font-medium hover:underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors"
                        target={href?.startsWith("http") ? "_blank" : undefined}
                        rel={href?.startsWith("http") ? "noreferrer" : undefined}
                      >
                        {children}
                      </a>
                    );
                  },

                  // 8. Horizontal Rules
                  hr() {
                    return <hr className="my-8 border-t border-border" />;
                  },
                }}
              >
                {doc.content}
              </ReactMarkdown>
            </article>
          )}

          {/* 4. Bottom Navigation: "← Previous Page" & "Next Page →" */}
          {!isEditing && (
            <footer className="mt-16 pt-8 border-t border-border flex items-center justify-between gap-4">
              {prevDoc ? (
                <Button
                  variant="outline"
                  onClick={() => onNavigateDoc && onNavigateDoc(prevDoc.slug)}
                  className="flex items-center space-x-2 h-auto py-2.5 px-4 text-left"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Previous</p>
                    <p className="text-xs font-semibold text-foreground truncate">{prevDoc.title}</p>
                  </div>
                </Button>
              ) : (
                <div />
              )}

              {nextDoc ? (
                <Button
                  variant="outline"
                  onClick={() => onNavigateDoc && onNavigateDoc(nextDoc.slug)}
                  className="flex items-center space-x-2 h-auto py-2.5 px-4 text-right ml-auto"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase font-mono">Next</p>
                    <p className="text-xs font-semibold text-foreground truncate">{nextDoc.title}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Button>
              ) : null}
            </footer>
          )}
        </div>
      </div>

      {/* Right Sidebar Table of Contents ("On this page") */}
      {!isEditing && (
        <TableOfContents
          content={doc.content}
          onEditClick={isUnlocked ? () => setIsEditing(true) : undefined}
        />
      )}
    </div>
  );
};
