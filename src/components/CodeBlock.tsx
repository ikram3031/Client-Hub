"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal, Code2, FileCode, Database, Braces } from "lucide-react";

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
}

// Maps code block language to specific icon and badge color styling
const getLanguageMeta = (lang: string) => {
  const normalized = (lang || "").toLowerCase();
  switch (normalized) {
    case "bash":
    case "sh":
    case "shell":
    case "zsh":
      return { label: "bash", icon: Terminal, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" };
    case "ts":
    case "typescript":
      return { label: "ts", icon: FileCode, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" };
    case "tsx":
    case "jsx":
      return { label: "tsx", icon: Code2, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" };
    case "js":
    case "javascript":
      return { label: "js", icon: FileCode, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" };
    case "sql":
    case "sqlite":
    case "d1":
      return { label: "sql", icon: Database, color: "text-orange-400 border-orange-500/30 bg-orange-500/10" };
    case "json":
      return { label: "json", icon: Braces, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" };
    case "yaml":
    case "yml":
      return { label: "yaml", icon: FileCode, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" };
    case "python":
    case "py":
      return { label: "python", icon: Code2, color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" };
    default:
      return { label: normalized || "code", icon: Code2, color: "text-zinc-400 border-zinc-700 bg-zinc-800/50" };
  }
};

// Extracts plain text recursively from React children nodes
const extractCodeString = (node: any): string => {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractCodeString).join("");
  if (node && node.props && node.props.children) return extractCodeString(node.props.children);
  return "";
};

// Sleek dark code container with language tag badge and 1-click direct copy button
export const CodeBlock: React.FC<CodeBlockProps> = ({ children, className }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const rawCode = extractCodeString(children).trim();
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : (rawCode.startsWith("npm") || rawCode.startsWith("node") || rawCode.startsWith("npx") || rawCode.startsWith("git") ? "bash" : "");
  const meta = getLanguageMeta(lang);
  const IconComponent = meta.icon;

  // Copies the raw code snippet to the clipboard with temporary feedback
  const handleCopyCode = async () => {
    if (!rawCode) return;
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="relative group my-5 rounded-xl border border-zinc-800 bg-[#0d1117] text-zinc-100 overflow-hidden shadow-lg font-mono text-[13px] transition-all">
      {/* Sleek Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-zinc-800 text-xs select-none">
        {/* Left: Window Controls + Language Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold tracking-wider uppercase font-mono ${meta.color}`}>
            <IconComponent className="w-3 h-3" />
            <span>{meta.label}</span>
          </div>
        </div>

        {/* Right: 1-Click Copy Button */}
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/80 transition-all cursor-pointer active:scale-95 shadow-xs"
          title="Copy to clipboard"
          type="button"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-50" />
              <span className="text-emerald-400 font-semibold text-[11px]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
              <span className="text-zinc-300 group-hover:text-white text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed select-text custom-scrollbar">
        <pre className="m-0 font-mono text-zinc-200 font-normal">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
};
