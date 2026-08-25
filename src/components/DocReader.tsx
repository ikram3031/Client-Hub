"use client";

import React, { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  BookOpen,
  Info,
} from "lucide-react";
import { DocItem } from "@/lib/api";
import { CodeBlock } from "@/components/CodeBlock";
import { TableOfContents } from "@/components/TableOfContents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DocReaderProps {
  doc: DocItem;
  allDocs?: DocItem[];
  projectSlug: string;
  projectName?: string;
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

// Lightweight, pure documentation reader engine with GFM markdown, code copy, and table of contents
export const DocReader: React.FC<DocReaderProps> = ({
  doc,
  allDocs = [],
  projectSlug,
  projectName,
  onNavigateFolder,
  onNavigateDoc,
  onNavigateHome,
}) => {
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

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
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="amber">{doc.category}</Badge>
                <Badge variant="outline" className="font-mono text-[11px]">/{doc.slug}</Badge>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
                {doc.title}
              </h1>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1.5 bg-muted px-2.5 py-1 rounded-full text-xs font-medium text-foreground">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{authorBadge}</span>
                </div>

                <span>•</span>

                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last Updated {formatTimestamp(doc.updated_at || doc.created_at)}</span>
                </div>

                <span>•</span>

                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{readingTime} min read</span>
                </div>

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
            </div>

            {/* Share Link Button */}
            <div className="flex items-center gap-2 shrink-0">
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
            </div>
          </div>

          {/* 3. Main Markdown Article */}
          <article className="prose prose-zinc dark:prose-invert max-w-none leading-relaxed text-sm md:text-base">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // 1. Code block renderer with dark container & 1-click copy
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

          {/* 4. Bottom Navigation: "← Previous Page" & "Next Page →" */}
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
        </div>
      </div>

      {/* Right Sidebar Table of Contents ("On this page") */}
      <TableOfContents content={doc.content} />
    </div>
  );
};
