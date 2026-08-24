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
} from "lucide-react";
import { ActionLog, postLog } from "@/lib/api";
import { Breadcrumb } from "@/components/Breadcrumb";

interface LogViewerProps {
  projectSlug: string;
  logs: ActionLog[];
  selectedScope?: string;
  featureKey?: string;
  onRefresh: () => void;
  onNavigateHome?: () => void;
}

// AI Action Logs stream with prominent Log IDs, commit hash copying, scope filters, and prompt details
export const LogViewer: React.FC<LogViewerProps> = ({
  projectSlug,
  logs,
  selectedScope = "all",
  featureKey,
  onRefresh,
  onNavigateHome,
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

  // Handles copying text with visual checkmark feedback
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
      {/* 1. Prominent Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Projects", onClick: onNavigateHome },
          { label: projectSlug, onClick: onNavigateHome },
          { label: "AI Action Logs", icon: Terminal },
          ...(featureKey ? [{ label: featureKey }] : []),
        ]}
      />

      {/* 2. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b theme-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight theme-text-primary">
              AI Action Logs Stream
            </h1>
            {featureKey && (
              <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-semibold border border-cyan-500/30">
                {featureKey}
              </span>
            )}
          </div>
          <p className="text-xs theme-text-muted mt-1">
            Showing {filteredLogs.length} activity log record{filteredLogs.length !== 1 ? "s" : ""} registered in Cloudflare D1
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
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Log</span>
          </button>
        </div>
      </div>

      {/* 3. Quick Log Ingestion Form (Collapsible) */}
      {showQuickLog && (
        <form
          onSubmit={handleQuickSubmit}
          className="mb-6 p-5 rounded-2xl border border-purple-500/30 theme-bg-card space-y-4 text-xs font-sans animate-in fade-in shadow-md"
        >
          <h3 className="font-semibold text-purple-600 dark:text-purple-400 text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Record New AI Action Log</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1 font-mono">Scope</label>
              <select
                value={logScope}
                onChange={(e) => setLogScope(e.target.value)}
                className="w-full theme-bg-primary border theme-border rounded-lg px-2.5 py-1.5 theme-text-primary focus:outline-none"
              >
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="architecture">Architecture</option>
                <option value="dashboard">Dashboard</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1 font-mono">Action</label>
              <select
                value={logAction}
                onChange={(e) => setLogAction(e.target.value)}
                className="w-full theme-bg-primary border theme-border rounded-lg px-2.5 py-1.5 theme-text-primary focus:outline-none"
              >
                <option value="feature">Feature</option>
                <option value="bugfix">Bugfix</option>
                <option value="refactor">Refactor</option>
                <option value="config">Config</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold theme-text-muted mb-1 font-mono">Changed Files</label>
              <input
                type="text"
                placeholder="src/app/page.tsx, server/d1.ts"
                value={logFiles}
                onChange={(e) => setLogFiles(e.target.value)}
                className="w-full theme-bg-primary border theme-border rounded-lg px-2.5 py-1.5 theme-text-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold theme-text-muted mb-1 font-mono">Summary</label>
            <input
              type="text"
              placeholder="e.g. Implemented direct copy button on code blocks"
              value={logSummary}
              onChange={(e) => setLogSummary(e.target.value)}
              className="w-full theme-bg-primary border theme-border rounded-lg px-3 py-1.5 theme-text-primary focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t theme-border">
            <button
              type="button"
              onClick={() => setShowQuickLog(false)}
              className="px-3 py-1.5 rounded-lg theme-text-muted hover:theme-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? "Saving to D1..." : "Save Log to D1"}
            </button>
          </div>
        </form>
      )}

      {/* 4. Scope Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b theme-border">
        <span className="text-xs theme-text-muted flex items-center gap-1 font-mono">
          <Filter className="w-3 h-3" /> Scope Filter:
        </span>
        {scopes.map((s) => (
          <button
            key={s}
            onClick={() => setActiveScope(s)}
            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
              activeScope === s
                ? "bg-purple-600 text-white shadow-xs"
                : "theme-bg-card theme-text-muted hover:theme-text-primary border theme-border"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 5. Logs Timeline Stream with Prominent LOG IDs */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed theme-border theme-bg-card text-center">
          <Terminal className="w-10 h-10 theme-text-muted mb-3" />
          <h3 className="text-sm font-semibold theme-text-primary">No action logs found for this scope</h3>
          <p className="text-xs theme-text-muted mt-1">
            Run <code className="theme-bg-secondary px-1.5 py-0.5 rounded font-mono theme-text-primary border theme-border">node scripts/log.js</code> to ingest logs.
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
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  {/* Badges: Scope, Action, Feature, LOG ID, COMMIT ID */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Scope Badge */}
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 font-mono text-[11px] uppercase font-bold border border-purple-500/30">
                      {log.scope}
                    </span>

                    {/* Action Badge */}
                    <span className="px-2 py-0.5 rounded-md theme-bg-secondary theme-text-secondary font-mono text-[10px] uppercase font-semibold border theme-border">
                      {log.action}
                    </span>

                    {/* Feature Badge */}
                    {log.feature_key && (
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/30">
                        {log.feature_key}
                      </span>
                    )}

                    {/* 🔥 PROMINENT LOG ID BADGE */}
                    <button
                      onClick={() => handleCopy(log.id, `logid-${log.id}`)}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-md theme-bg-secondary hover:theme-bg-hover theme-text-primary font-mono text-[11px] font-bold border theme-border cursor-pointer transition-colors"
                      title={`Copy Full Log ID: ${log.id}`}
                    >
                      <Hash className="w-3 h-3 theme-accent" />
                      <span>Log ID: {log.id.slice(0, 8)}...</span>
                      {copiedId === `logid-${log.id}` ? (
                        <Check className="w-3 h-3 theme-accent" />
                      ) : (
                        <Copy className="w-3 h-3 theme-text-muted hover:theme-text-primary" />
                      )}
                    </button>

                    {/* 🔥 PROMINENT GIT COMMIT ID BADGE */}
                    {log.commit_id && (
                      <button
                        onClick={() => handleCopy(log.commit_id!, `commit-${log.id}`)}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-md theme-accent-bg hover:opacity-80 theme-accent font-mono text-[11px] font-bold border theme-accent-border cursor-pointer transition-colors"
                        title={`Copy Commit Hash: ${log.commit_id}`}
                      >
                        <GitCommit className="w-3.5 h-3.5" />
                        <span>Commit: {log.commit_id.slice(0, 7)}</span>
                        {copiedId === `commit-${log.id}` ? (
                          <Check className="w-3 h-3 theme-accent" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-70" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="text-[11px] theme-text-muted font-mono flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Summary */}
                <h3 className="text-sm md:text-base font-semibold theme-text-primary leading-snug">
                  {log.summary}
                </h3>

                {/* Changed Files List */}
                {log.changed_files && log.changed_files.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] theme-text-muted font-mono font-semibold">Modified Files:</span>
                    {log.changed_files.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCopy(file, `file-${log.id}-${idx}`)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md theme-bg-secondary theme-text-secondary text-[11px] font-mono border theme-border hover:theme-accent transition-colors cursor-pointer"
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
                  <div className="mt-3.5 pt-3 border-t theme-border">
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold theme-text-secondary hover:theme-text-primary cursor-pointer transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 theme-text-muted" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 theme-text-muted" />
                      )}
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI Prompt Used</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3.5 rounded-xl theme-bg-secondary border theme-border text-xs font-mono theme-text-secondary leading-relaxed select-text">
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
