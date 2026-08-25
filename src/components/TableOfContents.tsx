"use client";

import React, { useEffect, useState } from "react";
import { AlignLeft, ArrowUpRight, Edit3, MessageSquare } from "lucide-react";

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  onEditClick?: () => void;
}

// Extracts heading anchors and text from markdown source
const parseHeadings = (markdown: string): HeadingItem[] => {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: HeadingItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim().replace(/[#*`_]/g, "");
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    headings.push({ id, text, level });
  }

  return headings;
};

// Right-sidebar Table of Contents displaying interactive heading navigation
export const TableOfContents: React.FC<TableOfContentsProps> = ({
  content,
  onEditClick,
}) => {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Re-computes headings when markdown content changes
  useEffect(() => {
    setHeadings(parseHeadings(content));
  }, [content]);

  // Smoothly scrolls to the targeted section heading element
  const handleScrollToHeading = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block w-64 shrink-0 pl-6 py-6 sticky top-0 h-fit max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar select-none">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b theme-border text-xs font-bold uppercase tracking-wider theme-text-muted font-mono">
        <AlignLeft className="w-3.5 h-3.5 theme-accent" />
        <span>On this page</span>
      </div>

      <nav className="space-y-1.5 text-xs">
        {headings.map((h, i) => (
          <button
            key={`${h.id}-${i}`}
            onClick={() => handleScrollToHeading(h.id)}
            className={`block w-full text-left transition-all py-1 px-2 rounded-md truncate cursor-pointer ${
              h.level === 3 ? "pl-5 text-[11px]" : "font-medium"
            } ${
              activeId === h.id
                ? "theme-accent font-semibold theme-accent-bg border-l-2 theme-accent-border"
                : "theme-text-muted hover:theme-text-primary hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
            }`}
            title={h.text}
            type="button"
          >
            {h.text}
          </button>
        ))}
      </nav>

      {/* Quick Community & Edit Actions */}
      <div className="mt-8 pt-4 border-t theme-border space-y-2 text-xs">
        {onEditClick && (
          <button
            onClick={onEditClick}
            className="flex items-center gap-2 theme-text-muted hover:theme-accent transition-colors w-full text-left py-1 cursor-pointer"
            type="button"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit this page</span>
          </button>
        )}
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 theme-text-muted hover:theme-text-primary transition-colors py-1"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Documentation Feedback</span>
          <ArrowUpRight className="w-3 h-3 ml-auto opacity-60" />
        </a>
      </div>
    </aside>
  );
};
