"use client";

import React, { useState } from "react";
import {
  Terminal,
  GitCommit,
  Copy,
  Check,
  Filter,
  Clock,
  Sparkles,
  FileCode,
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  Hash,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { ActionLog, postLog } from "@/lib/api";

interface ActivityChangelogProps {
  projectSlug: string;
  projectName?: string;
  logs: ActionLog[];
  selectedScope?: string;
  featureKey?: string;
  onRefresh: () => void;
  onNavigateHome?: () => void;
}

// Maps scope names to badges with distinct colors
const getScopeBadgeStyle = (scope: string) => {
  const normalized = (scope || "").toLowerCase();
  switch (normalized) {
    case "architecture":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    case "backend":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "frontend":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "dashboard":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
  }
};

// Formats log date into readable display
const formatLogDate = (dateString?: string): string => {
  if (!dateString) return "Recently";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// GitHub-style release / activity changelog page for AI Action Logs with Prominent Log ID and Git Commit Badges
export const ActivityChangelog: React.FC<ActivityChangelogProps> = ({
  projectSlug,
  projectName,
  logs,
  selectedScope = "all",
  featureKey,
  onRefresh,
  onNavigateHome,
}) => {
  const [activeScope, setActiveScope] = useState<string>(selectedScope);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  // Quick Ingestion Modal/Drawer State
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>("");
  const [scope, setScope] = useState<string>("frontend");
  const [action, setAction] = useState<string>("feature");
  const [files, setFiles] = useState<string>("");
  const [featKey, setFeatKey] = useState<string>(featureKey || "");
  const [promptText, setPromptText] = useState<string>("");
  const [commitHash, setCommitHash] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handles copying text with feedback
  const handleCopyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  // Toggles the expansion state of the AI Prompt accordion for a log entry
  const toggleAccordion = (id: string) => {
    setExpandedLogIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Submits a new AI action log directly to the Cloudflare D1 database
  const handleSubmitNewLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setIsSubmitting(true);
    try {
      await postLog(projectSlug, {
        summary,
        scope,
        action,
        featureKey: featKey ? featKey.trim() : undefined,
        changedFiles: files.split(",").map((f) => f.trim()).filter(Boolean),
        promptUsed: promptText.trim() || undefined,
        commitId: commitHash.trim() || undefined,
      });

      // Reset form
      setSummary("");
      setFiles("");
      setPromptText("");
      setCommitHash("");
      setShowLogModal(false);
      onRefresh();
    } catch (err) {
      console.error("Failed to submit action log:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filters logs based on active scope and search query
  const filteredLogs = logs.filter((log) => {
    if (featureKey && log.feature_key !== featureKey) return false;
    if (activeScope !== "all" && log.scope.toLowerCase() !== activeScope.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSummary = log.summary?.toLowerCase().includes(q);
      const matchId = log.id?.toLowerCase().includes(q);
      const matchCommit = log.commit_id?.toLowerCase().includes(q);
      const matchPrompt = log.prompt_used?.toLowerCase().includes(q);
      const matchFiles = (log.changed_files || []).some((f) => f.toLowerCase().includes(q));
      if (!matchSummary && !matchId && !matchCommit && !matchPrompt && !matchFiles) {
        return false;
      }
    }
    return true;
  });

  const scopeTabs = ["all", "architecture", "backend", "frontend", "dashboard"];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar font-sans theme-bg-primary theme-text-primary px-6 py-6 md:px-12 md:py-8">
      <div className="max-w-4xl w-full mx-auto pb-16">
        {/* 1. Subtle Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-6 font-mono select-none overflow-x-auto">
          <button
            onClick={onNavigateHome}
            className="hover:theme-accent transition-colors cursor-pointer shrink-0 font-medium"
            type="button"
          >
            {projectName || projectSlug}
          </button>
          <span className="opacity-40">/</span>
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Logs & Governance</span>
          <span className="opacity-40">/</span>
          <span className="theme-text-primary font-semibold truncate">Live Activity Logs</span>
          {featureKey && (
            <>
              <span className="opacity-40">/</span>
              <span className="text-cyan-500 font-mono font-semibold">{featureKey}</span>
            </>
          )}
        </nav>

        {/* 2. Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b theme-border">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Terminal className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight theme-text-primary">
                Live Activity Logs
              </h1>
            </div>
            <p className="text-xs md:text-sm theme-text-muted">
              GitHub-style continuous release and AI agent action changelog recorded in Cloudflare D1
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl theme-bg-card theme-bg-hover border theme-border theme-text-secondary hover:theme-text-primary transition-all cursor-pointer shadow-xs"
              title="Refresh Activity Stream"
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              type="button"
            >
              <Plus className="w-4 h-4" />
              <span>Record Log</span>
            </button>
          </div>
        </div>

        {/* 3. Filter Controls: Scope Tabs + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-8">
          {/* Scope Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
            {scopeTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveScope(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  activeScope === tab
                    ? "bg-purple-600 text-white shadow-xs"
                    : "theme-bg-card theme-text-muted hover:theme-text-primary border theme-border"
                }`}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 theme-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search changelog, IDs, files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs theme-bg-card border theme-border rounded-lg pl-8 pr-3 py-1.5 theme-text-primary placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
            />
          </div>
        </div>

        {/* 4. GitHub-Style Release / Activity Timeline */}
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed theme-border theme-bg-card text-center">
            <Terminal className="w-10 h-10 theme-text-muted mb-3 opacity-60" />
            <h3 className="text-sm font-semibold theme-text-primary">No activity logs found</h3>
            <p className="text-xs theme-text-muted mt-1 max-w-sm">
              No action logs matched your current filters. Record an action log or ingest one via CLI.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 md:pl-8 space-y-8 before:content-[''] before:absolute before:left-3 md:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {filteredLogs.map((log) => {
              const isExpanded = !!expandedLogIds[log.id];
              const shortId = log.id.slice(0, 8);
              const scopeStyle = getScopeBadgeStyle(log.scope);

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Bullet Marker */}
                  <div className="absolute -left-6 md:-left-8 top-1.5 w-6 h-6 rounded-full border-2 border-purple-500 bg-white dark:bg-zinc-950 flex items-center justify-center -translate-x-1/2 transition-transform group-hover:scale-110 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>

                  {/* Changelog Entry Card */}
                  <div className="p-5 md:p-6 rounded-2xl border theme-border theme-bg-card hover:border-purple-500/30 transition-all shadow-xs space-y-3.5">
                    {/* Top Row: Scope, Action, LOG ID, COMMIT ID, Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Scope Badge */}
                        <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-mono font-bold uppercase tracking-wide ${scopeStyle}`}>
                          {log.scope}
                        </span>

                        {/* Action Badge */}
                        <span className="px-2 py-0.5 rounded-md theme-bg-secondary text-zinc-600 dark:text-zinc-400 font-mono text-[10px] uppercase font-semibold border theme-border">
                          {log.action || "feature"}
                        </span>

                        {/* Feature / Epic Badge */}
                        {log.feature_key && (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/20">
                            {log.feature_key}
                          </span>
                        )}

                        {/* 🔥 PROMINENT LOG ID BADGE: # <id> [Copy] */}
                        <button
                          onClick={() => handleCopyText(log.id, `logid-${log.id}`)}
                          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md theme-bg-secondary hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] font-bold border theme-border cursor-pointer transition-all active:scale-95"
                          title={`Copy Full Log ID: ${log.id}`}
                          type="button"
                        >
                          <Hash className="w-3 h-3 text-purple-500" />
                          <span>#{shortId}</span>
                          {copiedKey === `logid-${log.id}` ? (
                            <span className="text-emerald-500 text-[10px] flex items-center gap-0.5">
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-[10px] flex items-center gap-0.5">
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copy</span>
                            </span>
                          )}
                        </button>

                        {/* 🔥 PROMINENT GIT COMMIT BADGE: Commit: <hash> [Copy] */}
                        {log.commit_id ? (
                          <button
                            onClick={() => handleCopyText(log.commit_id!, `commit-${log.id}`)}
                            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 text-zinc-100 hover:bg-zinc-800 font-mono text-[11px] font-bold border border-zinc-700 cursor-pointer transition-all active:scale-95"
                            title={`Copy Git Commit Hash: ${log.commit_id}`}
                            type="button"
                          >
                            <GitCommit className="w-3.5 h-3.5 text-purple-400" />
                            <span>Commit: {log.commit_id.slice(0, 7)}</span>
                            {copiedKey === `commit-${log.id}` ? (
                              <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                                <Check className="w-3 h-3" />
                                <span>Copied</span>
                              </span>
                            ) : (
                              <span className="text-zinc-400 hover:text-white text-[10px] flex items-center gap-0.5">
                                <Copy className="w-2.5 h-2.5" />
                                <span>Copy</span>
                              </span>
                            )}
                          </button>
                        ) : null}
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{formatLogDate(log.created_at)}</span>
                      </div>
                    </div>

                    {/* Summary Description */}
                    <div className="text-sm md:text-base font-semibold theme-text-primary leading-snug">
                      {log.summary}
                    </div>

                    {/* Clickable Modified File Paths */}
                    {log.changed_files && log.changed_files.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono font-medium mr-1">
                          Files:
                        </span>
                        {log.changed_files.map((file, idx) => {
                          const fileKey = `file-${log.id}-${idx}`;
                          const isCopied = copiedKey === fileKey;

                          return (
                            <button
                              key={idx}
                              onClick={() => handleCopyText(file, fileKey)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md theme-bg-secondary hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 border theme-border transition-colors cursor-pointer group/file"
                              title="Click to copy file path"
                              type="button"
                            >
                              <FileCode className="w-3 h-3 text-zinc-400 group-hover/file:text-emerald-500" />
                              <span>{file}</span>
                              {isCopied ? (
                                <Check className="w-2.5 h-2.5 text-emerald-500 ml-0.5" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 text-zinc-400 opacity-0 group-hover/file:opacity-100 ml-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Expandable AI Prompt Details */}
                    {log.prompt_used && (
                      <div className="pt-2 border-t theme-border">
                        <button
                          onClick={() => toggleAccordion(log.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:theme-text-primary transition-colors cursor-pointer"
                          type="button"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-purple-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
                          )}
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span>AI Prompt & Instructions Used</span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2.5 p-3.5 rounded-xl bg-zinc-950 text-zinc-200 border border-zinc-800 text-xs font-mono leading-relaxed select-text shadow-inner">
                            <pre className="whitespace-pre-wrap break-words">{log.prompt_used}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. Ingestion Modal Dialog */}
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-xl theme-bg-card border theme-border rounded-2xl shadow-2xl overflow-hidden font-sans">
              <div className="flex items-center justify-between px-6 py-4 border-b theme-border theme-bg-secondary">
                <div className="flex items-center gap-2 theme-text-primary font-bold text-base">
                  <Terminal className="w-4 h-4 text-purple-500" />
                  <span>Record AI Action Log</span>
                </div>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="p-1 rounded-lg theme-text-muted hover:theme-text-primary theme-bg-hover transition-colors"
                  type="button"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>

              <form onSubmit={handleSubmitNewLog} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
                    Summary / Action Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Added Cloudflare D1 connection pooling"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full theme-bg-primary border theme-border rounded-lg px-3 py-2 theme-text-primary text-sm font-semibold focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
                      Scope
                    </label>
                    <select
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      className="w-full theme-bg-primary border theme-border rounded-lg px-2.5 py-1.5 theme-text-primary focus:outline-none"
                    >
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="architecture">Architecture</option>
                      <option value="dashboard">Dashboard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
                      Action Type
                    </label>
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="w-full theme-bg-primary border theme-border rounded-lg px-2.5 py-1.5 theme-text-primary focus:outline-none"
                    >
                      <option value="feature">Feature</option>
                      <option value="bugfix">Bugfix</option>
                      <option value="refactor">Refactor</option>
                      <option value="config">Config</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
                      Feature Key (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="FEAT-1"
                      value={featKey}
                      onChange={(e) => setFeatKey(e.target.value)}
                      className="w-full theme-bg-primary border theme-border rounded-lg px-2.5 py-1.5 theme-text-primary font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
                      Git Commit Hash (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 7f8a91b"
                      value={commitHash}
                      onChange={(e) => setCommitHash(e.target.value)}
                      className="w-full theme-bg-primary border theme-border rounded-lg px-3 py-1.5 theme-text-primary font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
                      Changed Files (Comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="src/app/page.tsx, server/d1.ts"
                      value={files}
                      onChange={(e) => setFiles(e.target.value)}
                      className="w-full theme-bg-primary border theme-border rounded-lg px-3 py-1.5 theme-text-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold theme-text-muted mb-1 uppercase font-mono">
                    AI Prompt Used (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="AI prompt or instructions that created this change..."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="w-full theme-bg-primary border theme-border rounded-lg p-3 theme-text-primary font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t theme-border">
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="px-4 py-2 rounded-lg theme-text-muted hover:theme-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving to D1..." : "Save Log"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
