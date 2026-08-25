"use client";

import React, { useState } from "react";
import {
  Terminal,
  GitCommit,
  Copy,
  Check,
  Sparkles,
  FileCode,
  Plus,
  RefreshCw,
  Search,
  Clock,
} from "lucide-react";
import { ActionLog, postLog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ActivityChangelogProps {
  projectSlug: string;
  projectName?: string;
  logs: ActionLog[];
  selectedScope?: string;
  featureKey?: string;
  onRefresh: () => void;
  onNavigateHome?: () => void;
}

// Maps scope names to variant colors
const getScopeVariant = (scope: string): "purple" | "emerald" | "cyan" | "amber" | "secondary" => {
  const normalized = (scope || "").toLowerCase();
  switch (normalized) {
    case "architecture":
      return "purple";
    case "backend":
      return "cyan";
    case "frontend":
      return "emerald";
    case "dashboard":
      return "amber";
    default:
      return "secondary";
  }
};

// Formats log timestamp into clean human-readable date
const formatLogDate = (dateString?: string): string => {
  if (!dateString) return "Recently";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// AI Action Logs changelog page rendering an elegant GitHub-style continuous release timeline
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

  // Ingestion Modal State
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>("");
  const [scope, setScope] = useState<string>("frontend");
  const [action, setAction] = useState<string>("feature");
  const [files, setFiles] = useState<string>("");
  const [featKey, setFeatKey] = useState<string>(featureKey || "");
  const [promptText, setPromptText] = useState<string>("");
  const [commitHash, setCommitHash] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Copies text to clipboard with temporary feedback state
  const handleCopyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error("Clipboard copy error:", e);
    }
  };

  // Toggles the expansion state of the prompt box for a specific log
  const togglePrompt = (id: string) => {
    setExpandedLogIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Submits a new AI action log directly to the server
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

  // Filters logs according to active scope and search query
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar font-sans bg-background text-foreground px-6 py-8 md:px-12 md:py-10">
      <div className="max-w-4xl w-full mx-auto pb-16">
        {/* 1. Header with Breadcrumb */}
        <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-border">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                AI Action Logs
              </h1>
              {featureKey && (
                <Badge variant="cyan">{featureKey}</Badge>
              )}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Live changelog of AI modifications and architectural updates for {projectName || projectSlug}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              title="Refresh Logs"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              onClick={() => setShowLogModal(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Record Log</span>
            </Button>
          </div>
        </div>

        {/* 2. Filter Controls: Scope Tabs + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
            {scopeTabs.map((tab) => (
              <Button
                key={tab}
                variant={activeScope === tab ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveScope(tab)}
                className="capitalize"
              >
                {tab}
              </Button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search changelog, IDs, files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* 3. Sleek Timeline Stream */}
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border bg-card text-center">
            <Terminal className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-foreground">No activity logs found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              No action logs matched your current filters. Record an action log or ingest one via CLI.
            </p>
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 md:before:left-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {filteredLogs.map((log) => {
              const isExpanded = !!expandedLogIds[log.id];
              const shortId = log.id.slice(0, 8);
              const scopeVariant = getScopeVariant(log.scope);

              return (
                <div key={log.id} className="relative flex items-start gap-4 group">
                  {/* Timeline dot */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted text-muted-foreground shadow-xs shrink-0 z-10 mt-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>

                  {/* Card content */}
                  <div className="flex-1 p-5 rounded-xl border border-border bg-card shadow-xs hover:shadow-md transition-shadow space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Scope Badge */}
                        <Badge variant={scopeVariant} className="capitalize">{log.scope}</Badge>

                        {/* Log ID Badge: # <id> [Copy] */}
                        <div
                          className="flex items-center space-x-1.5 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors font-mono font-medium"
                          onClick={() => handleCopyText(log.id, `id-${log.id}`)}
                          title={`Click to copy Log ID: ${log.id}`}
                        >
                          <span>#{shortId}</span>
                          {copiedKey === `id-${log.id}` ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-70" />
                          )}
                        </div>

                        {/* Git Commit Badge: Commit: <hash> [Copy] */}
                        {log.commit_id ? (
                          <div
                            className="flex items-center space-x-1.5 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors font-mono font-medium"
                            onClick={() => handleCopyText(log.commit_id!, `commit-${log.id}`)}
                            title={`Click to copy Git Commit Hash: ${log.commit_id}`}
                          >
                            <GitCommit className="h-3 w-3 text-primary" />
                            <span>{log.commit_id.slice(0, 7)}</span>
                            {copiedKey === `commit-${log.id}` ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-70" />
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{formatLogDate(log.created_at)}</span>
                      </div>
                    </div>

                    {/* Summary */}
                    <h3 className="text-sm md:text-base font-semibold text-foreground leading-snug">
                      {log.summary}
                    </h3>

                    {/* Modified Files */}
                    {log.changed_files && log.changed_files.length > 0 && (
                      <div>
                        <p className="text-[11px] font-medium text-muted-foreground mb-1.5 font-mono">
                          Modified Files:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {log.changed_files.map((file, idx) => {
                            const fileKey = `file-${log.id}-${idx}`;
                            const isCopied = copiedKey === fileKey;

                            return (
                              <span
                                key={idx}
                                onClick={() => handleCopyText(file, fileKey)}
                                className="inline-flex items-center gap-1 text-[11px] font-mono bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-0.5 rounded border border-border/50 cursor-pointer transition-colors"
                                title="Click to copy file path"
                              >
                                <FileCode className="h-3 w-3 opacity-70" />
                                <span>{file}</span>
                                {isCopied && <Check className="h-2.5 w-2.5 text-emerald-500" />}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Prompt Used Accordion */}
                    {log.prompt_used && (
                      <div className="pt-2.5 border-t border-border/60">
                        <button
                          className="flex items-center justify-between w-full text-left focus:outline-none group/prompt cursor-pointer"
                          onClick={() => togglePrompt(log.id)}
                          type="button"
                        >
                          <p className="text-xs font-medium text-muted-foreground group-hover/prompt:text-foreground transition-colors flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span>Prompt Used</span>
                          </p>
                          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
                            {isExpanded ? "Hide" : "Show"}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="mt-2.5 text-xs text-foreground/90 bg-muted/30 p-3 rounded-lg border border-border/40 font-mono leading-relaxed select-text">
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

        {/* 4. Ingestion Modal Dialog */}
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in select-none">
            <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2 text-foreground font-bold text-base">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span>Record AI Action Log</span>
                </div>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-lg"
                  type="button"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitNewLog} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
                    Summary / Action Title
                  </label>
                  <Input
                    placeholder="e.g. Migrated user session storage to Cloudflare D1"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
                      Scope
                    </label>
                    <select
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      className="w-full h-9 bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="architecture">Architecture</option>
                      <option value="dashboard">Dashboard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
                      Action Type
                    </label>
                    <select
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="w-full h-9 bg-background border border-border rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none"
                    >
                      <option value="feature">Feature</option>
                      <option value="bugfix">Bugfix</option>
                      <option value="refactor">Refactor</option>
                      <option value="config">Config</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
                      Feature Key (Optional)
                    </label>
                    <Input
                      placeholder="FEAT-1"
                      value={featKey}
                      onChange={(e) => setFeatKey(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
                      Git Commit Hash (Optional)
                    </label>
                    <Input
                      placeholder="e.g. f8e4d3a"
                      value={commitHash}
                      onChange={(e) => setCommitHash(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
                      Changed Files (Comma-separated)
                    </label>
                    <Input
                      placeholder="src/auth.ts, db/schema.sql"
                      value={files}
                      onChange={(e) => setFiles(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
                    AI Prompt Used (Optional)
                  </label>
                  <Textarea
                    rows={3}
                    placeholder="AI prompt or instructions that executed this change..."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowLogModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Log"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
