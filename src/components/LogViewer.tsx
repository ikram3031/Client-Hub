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
} from "lucide-react";
import { ActionLog, postLog } from "@/lib/api";

interface LogViewerProps {
  projectSlug: string;
  logs: ActionLog[];
  selectedScope?: string;
  featureKey?: string;
  onRefresh: () => void;
}

// AI Action Logs stream with commit hash direct copying, scope filters, and prompt details
export const LogViewer: React.FC<LogViewerProps> = ({
  projectSlug,
  logs,
  selectedScope = "all",
  featureKey,
  onRefresh,
}) => {
  const [activeScope, setActiveScope] = useState<string>(selectedScope);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<Record<string, boolean>>({});

  // Quick Ingest Log Form State
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [logSummary, setLogSummary] = useState("");
  const [logScope, setLogScope] = useState("frontend");
  const [logAction, setLogAction] = useState("feature");
  const [logFiles, setLogFiles] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handles copying commit hash or text with visual checkmark feedback
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  // Toggles expanded details for a specific log item
  const toggleExpand = (logId: string) => {
    setExpandedLogIds((prev) => ({
      ...prev,
      [logId]: !prev[logId],
    }));
  };

  // Submits a quick AI action log directly from the UI
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSummary.trim()) return;

    setIsSubmitting(true);
    try {
      await postLog(projectSlug, {
        summary: logSummary,
        scope: logScope,
        action: logAction,
        changedFiles: logFiles.split(",").map((f) => f.trim()).filter(Boolean),
      });
      setLogSummary("");
      setLogFiles("");
      setShowQuickLog(false);
      onRefresh();
    } catch (err) {
      console.error("Quick log error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (featureKey && l.feature_key !== featureKey) return false;
    if (activeScope !== "all" && l.scope.toLowerCase() !== activeScope.toLowerCase()) return false;
    return true;
  });

  const scopes = ["all", "architecture", "backend", "frontend", "dashboard"];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto theme-bg-primary theme-text-primary p-6 md:p-10 font-sans">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b theme-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight theme-text-primary">
              AI Action Logs
            </h1>
            {featureKey && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 text-xs font-mono border border-cyan-800/60">
                {featureKey}
              </span>
            )}
          </div>
          <p className="text-xs theme-text-muted">
            Real-time audit log of code modifications, AI prompts, file diffs, and Git commits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 theme-text-muted hover:theme-text-primary theme-bg-card hover:theme-bg-hover rounded-lg border theme-border transition-all cursor-pointer shadow-xs"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowQuickLog(!showQuickLog)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Log</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Log Ingestion Form (Collapsible) */}
      {showQuickLog && (
        <form
          onSubmit={handleQuickSubmit}
          className="mb-6 p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-4 text-xs font-sans animate-in fade-in"
        >
          <h3 className="font-semibold text-purple-500 text-sm">Record Action Log</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1">Scope</label>
              <select
                value={logScope}
                onChange={(e) => setLogScope(e.target.value)}
                className="w-full theme-bg-card border theme-border rounded-lg px-2.5 py-1.5 theme-text-primary"
              >
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="architecture">Architecture</option>
                <option value="dashboard">Dashboard</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1">Action</label>
              <select
                value={logAction}
                onChange={(e) => setLogAction(e.target.value)}
                className="w-full theme-bg-card border theme-border rounded-lg px-2.5 py-1.5 theme-text-primary"
              >
                <option value="feature">Feature</option>
                <option value="bugfix">Bugfix</option>
                <option value="refactor">Refactor</option>
                <option value="config">Config</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1">Changed Files</label>
              <input
                type="text"
                placeholder="src/app/page.tsx, server/d1.ts"
                value={logFiles}
                onChange={(e) => setLogFiles(e.target.value)}
                className="w-full theme-bg-card border theme-border rounded-lg px-2.5 py-1.5 theme-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-muted mb-1">Summary</label>
            <input
              type="text"
              placeholder="e.g. Implemented direct copy button on code blocks"
              value={logSummary}
              onChange={(e) => setLogSummary(e.target.value)}
              className="w-full theme-bg-card border theme-border rounded-lg px-3 py-1.5 theme-text-primary focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowQuickLog(false)}
              className="px-3 py-1 theme-text-muted hover:theme-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Log to D1"}
            </button>
          </div>
        </form>
      )}

      {/* 3. Scope Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b theme-border">
        <span className="text-xs theme-text-muted flex items-center gap-1 font-mono">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {scopes.map((s) => (
          <button
            key={s}
            onClick={() => setActiveScope(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
              activeScope === s
                ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40"
                : "theme-bg-card theme-text-muted hover:theme-text-primary border theme-border"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 4. Logs Timeline Stream */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed theme-border theme-bg-card text-center">
          <Terminal className="w-10 h-10 theme-text-muted mb-3" />
          <h3 className="text-sm font-semibold theme-text-primary">No action logs found</h3>
          <p className="text-xs theme-text-muted mt-1">
            Run <code className="theme-bg-card px-1.5 py-0.5 rounded font-mono theme-text-primary border theme-border">node scripts/log.js</code> to ingest logs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const isExpanded = !!expandedLogIds[log.id];

            return (
              <div
                key={log.id}
                className="p-5 rounded-2xl border theme-border theme-bg-card theme-bg-hover transition-all shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Scope & Action Header */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 font-mono text-[10px] uppercase font-bold border border-purple-500/30">
                        {log.scope}
                      </span>
                      <span className="px-2 py-0.5 rounded-md theme-bg-secondary theme-text-muted font-mono text-[10px] uppercase border theme-border">
                        {log.action}
                      </span>
                      {log.feature_key && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] border border-cyan-500/30">
                          {log.feature_key}
                        </span>
                      )}
                      {log.commit_id && (
                        <button
                          onClick={() => handleCopy(log.commit_id!, `commit-${log.id}`)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md theme-accent-bg hover:opacity-80 theme-accent font-mono text-[10px] border theme-accent-border cursor-pointer transition-colors"
                          title="Direct copy Git Commit hash"
                        >
                          <GitCommit className="w-3 h-3" />
                          <span>{log.commit_id.slice(0, 7)}</span>
                          {copiedId === `commit-${log.id}` ? (
                            <Check className="w-2.5 h-2.5 theme-accent" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-70" />
                          )}
                        </button>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold theme-text-primary leading-snug">
                      {log.summary}
                    </h3>
                  </div>

                  <div className="text-[11px] theme-text-muted font-mono flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Changed Files List */}
                {log.changed_files && log.changed_files.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] theme-text-muted font-mono">Files:</span>
                    {log.changed_files.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCopy(file, `file-${log.id}-${idx}`)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded theme-bg-secondary theme-text-secondary text-[11px] font-mono border theme-border hover:theme-accent transition-colors cursor-pointer"
                        title="Click to copy file path"
                      >
                        <FileCode className="w-3 h-3 theme-text-muted" />
                        <span>{file}</span>
                        {copiedId === `file-${log.id}-${idx}` && (
                          <Check className="w-2.5 h-2.5 theme-accent" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Prompt Used / More Details Accordion */}
                {log.prompt_used && (
                  <div className="mt-3 pt-3 border-t theme-border">
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="flex items-center gap-1 text-[11px] theme-text-muted hover:theme-text-primary cursor-pointer transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 theme-text-muted" />
                      ) : (
                        <ChevronRight className="w-3 h-3 theme-text-muted" />
                      )}
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>AI Prompt Used</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-xl theme-bg-secondary border theme-border text-xs font-mono theme-text-secondary leading-relaxed">
                        {log.prompt_used}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
