"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);

  // Extract raw string content
  const extractText = (node: any): string => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (node && node.props && node.props.children) return extractText(node.props.children);
    return "";
  };

  const rawCode = extractText(children).trim();
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const handleCopy = async () => {
    if (!rawCode) return;
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const isTerminalCmd = language === "bash" || language === "sh" || language === "shell" || rawCode.startsWith("npm") || rawCode.startsWith("node") || rawCode.startsWith("git") || rawCode.startsWith("npx");

  return (
    <div className="relative group my-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 overflow-hidden shadow-sm font-mono text-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800/80 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          {isTerminalCmd ? (
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <div className="flex gap-1.5 items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
          )}
          <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">
            {language || (isTerminalCmd ? "terminal" : "code")}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer border border-zinc-700 active:scale-95"
          title="Direct Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed select-text">
        <pre className="m-0 font-mono text-zinc-200">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
};
