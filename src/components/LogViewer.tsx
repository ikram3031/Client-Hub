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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-950 text-zinc-100 p-6 md:p-10 font-sans">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              AI Action Logs
            </h1>
            {featureKey && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 text-xs font-mono border border-cyan-800/60">
                {featureKey}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Real-time audit log of code modifications, AI prompts, file diffs, and Git commits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-all cursor-pointer"
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
          className="mb-6 p-5 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-4 text-xs font-sans animate-in fade-in"
        >
          <h3 className="font-semibold text-purple-300 text-sm">Record Action Log</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Scope</label>
              <select
                value={logScope}
                onChange={(e) => setLogScope(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200"
              >
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="architecture">Architecture</option>
                <option value="dashboard">Dashboard</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Action</label>
              <select
                value={logAction}
                onChange={(e) => setLogAction(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200"
              >
                <option value="feature">Feature</option>
                <option value="bugfix">Bugfix</option>
                <option value="refactor">Refactor</option>
                <option value="config">Config</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Changed Files</label>
              <input
                type="text"
                placeholder="src/app/page.tsx, server/d1.ts"
                value={logFiles}
                onChange={(e) => setLogFiles(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Summary</label>
            <input
              type="text"
              placeholder="e.g. Implemented direct copy button on code blocks"
              value={logSummary}
              onChange={(e) => setLogSummary(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowQuickLog(false)}
              className="px-3 py-1 text-zinc-400 hover:text-white"
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
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-zinc-900">
        <span className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {scopes.map((s) => (
          <button
            key={s}
            onClick={() => setActiveScope(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
              activeScope === s
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 4. Logs Timeline Stream */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center">
          <Terminal className="w-10 h-10 text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">No action logs found</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Run <code className="bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-zinc-300">node scripts/log.js</code> to ingest logs.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const isExpanded = !!expandedLogIds[log.id];

            return (
              <div
                key={log.id}
                className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Scope & Action Header */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 font-mono text-[10px] uppercase font-bold border border-purple-800/50">
                        {log.scope}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[10px] uppercase">
                        {log.action}
                      </span>
                      {log.feature_key && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-400 font-mono text-[10px] border border-cyan-800/50">
                          {log.feature_key}
                        </span>
                      )}
                      {log.commit_id && (
                        <button
                          onClick={() => handleCopy(log.commit_id!, `commit-${log.id}`)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 font-mono text-[10px] border border-emerald-800/50 cursor-pointer transition-colors"
                          title="Direct copy Git Commit hash"
                        >
                          <GitCommit className="w-3 h-3" />
                          <span>{log.commit_id.slice(0, 7)}</span>
                          {copiedId === `commit-${log.id}` ? (
                            <Check className="w-2.5 h-2.5 text-emerald-300" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 text-emerald-500/70" />
                          )}
                        </button>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-zinc-100 leading-snug">
                      {log.summary}
                    </h3>
                  </div>

                  <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Changed Files List */}
                {log.changed_files && log.changed_files.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500 font-mono">Files:</span>
                    {log.changed_files.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCopy(file, `file-${log.id}-${idx}`)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 text-[11px] font-mono border border-zinc-700/50 transition-colors cursor-pointer"
                        title="Click to copy file path"
                      >
                        <FileCode className="w-3 h-3 text-zinc-500" />
                        <span>{file}</span>
                        {copiedId === `file-${log.id}-${idx}` && (
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Prompt Used / More Details Accordion */}
                {log.prompt_used && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/60">
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-zinc-500" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                      )}
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>AI Prompt Used</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 leading-relaxed">
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
