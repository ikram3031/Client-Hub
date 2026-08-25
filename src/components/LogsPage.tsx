import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  GitCommit,
  Copy,
  Check,
  Sparkles,
  Terminal,
  LayoutGrid,
  List,
  GitCommitVertical,
  ChevronDown,
  ChevronRight,
  FileCode,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Log {
  id: string;
  commitHash?: string;
  commit_id?: string;
  scope: string;
  action?: string;
  summary: string;
  modifiedFiles?: string[];
  changedFiles?: string[];
  promptUsed?: string;
  prompt_used?: string;
  timestamp?: string;
  created_at?: string;
}

interface LogsPageProps {
  projectSlug: string;
}

export const LogsPage: React.FC<LogsPageProps> = ({ projectSlug }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<'all' | 'backend' | 'frontend' | 'architecture'>('all');
  
  // View mode switcher: timeline | grid | list (accordion) - default to 'list'
  const [viewMode, setViewMode] = useState<'timeline' | 'grid' | 'list'>('list');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatSummary = (raw: string) => {
    if (!raw) return '';
    const trimmed = raw.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectSlug}/logs?limit=100`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.logs || []);
        setLogs(list);
      } catch (err) {
        console.error("Failed to load logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [projectSlug]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const togglePrompt = (id: string) => {
    setExpandedPrompt(expandedPrompt === id ? null : id);
  };

  const toggleListItem = (id: string) => {
    // Single-open accordion: opening one closes any previously open item
    setExpandedId(prev => (prev === id ? null : id));
  };

  const copyFullChangelog = async () => {
    let md = `# 📝 AI Action Logs Changelog for ${projectSlug}\n\n`;
    filteredLogs.forEach(l => {
      const commit = (l.commitHash || l.commit_id) ? ` (\`${(l.commitHash || l.commit_id)!.slice(0, 7)}\`)` : '';
      md += `- **#${l.id}** (${l.action || 'feat'}): ${formatSummary(l.summary)}${commit}\n`;
    });
    await handleCopy(md, 'full-changelog');
  };

  const filteredLogs = logs.filter(l => {
    if (scopeFilter === 'all') return true;
    return (l.scope || '').toLowerCase() === scopeFilter.toLowerCase();
  });

  const uniqueScopes = Array.from(new Set(logs.map(l => (l.scope || '').toLowerCase()).filter(Boolean)));

  const formatScopeLabel = (scope: string) => {
    if (!scope) return '';
    const map: Record<string, string> = {
      itc: 'ITC',
      serimachan: 'SeriMachan',
      flightbangla: 'FlightBangla',
      tripleader: 'TripLeader',
      projectsetup: 'ProjectSetup',
      optimization: 'Optimization',
      frontend: 'Frontend',
      backend: 'Backend',
      architecture: 'Architecture',
    };
    return map[scope.toLowerCase()] || (scope.charAt(0).toUpperCase() + scope.slice(1));
  };

  const getScopeBadgeStyle = (id: string, scope: string) => {
    const s = (scope || '').toLowerCase();
    if (s.includes('itc') || id.startsWith('ITC')) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (s.includes('seri') || id.startsWith('SM')) return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    if (s.includes('opt') || id.startsWith('O')) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (s.includes('flight') || id.startsWith('FB')) return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    if (s.includes('trip') || id.startsWith('TL')) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (s.includes('setup') || id.startsWith('R') || id.startsWith('RH')) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (s.includes('back') || id.startsWith('AB')) return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-background text-foreground space-y-6">
      
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20">
            <Terminal className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Action Logs</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Live changelog & track history for {projectSlug}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle: Timeline, Grid, List */}
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition cursor-pointer",
                viewMode === 'timeline' ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
              title="Timeline View"
            >
              <GitCommitVertical className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>

            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition cursor-pointer",
                viewMode === 'grid' ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition cursor-pointer",
                viewMode === 'list' ? "bg-background text-foreground shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
              title="List Accordion View"
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Copy Changelog Button */}
          <Button variant="outline" size="sm" onClick={copyFullChangelog} className="h-8 gap-1.5 text-xs cursor-pointer">
            {copiedId === 'full-changelog' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-primary" />}
            <span className="hidden sm:inline">Changelog</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Scope Filter Pills */}
      {uniqueScopes.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Scope Filter:</span>
          <button
            onClick={() => setScopeFilter('all')}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border",
              scopeFilter === 'all'
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted"
            )}
          >
            All ({logs.length})
          </button>
          {uniqueScopes.map(scope => {
            const count = logs.filter(l => (l.scope || '').toLowerCase() === scope).length;
            const isSelected = scopeFilter.toLowerCase() === scope;
            return (
              <button
                key={scope}
                onClick={() => setScopeFilter(isSelected ? 'all' : (scope as any))}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1.5",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                )}
              >
                <span>{formatScopeLabel(scope)}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* No Logs State */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-xl">
          <p className="text-sm font-medium">No action logs found for this filter.</p>
          <p className="text-xs text-muted-foreground mt-1">Run <code className="text-primary font-mono">node client-kit/log.js</code> to ingest a new log.</p>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. TIMELINE VIEW                                                          */}
          {/* ========================================================================= */}
          {viewMode === 'timeline' && (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {filteredLogs.map((log) => {
                const commitHash = log.commitHash || log.commit_id || '';
                const files = log.modifiedFiles || log.changedFiles || [];
                const prompt = log.promptUsed || log.prompt_used || '';
                const timeStr = log.timestamp || log.created_at || new Date().toISOString();
                const formattedDate = format(new Date(timeStr), 'MMM d, h:mm a');
                const capitalizedSummary = formatSummary(log.summary);

                return (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    {/* Timeline icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-card text-primary shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Sparkles className="h-4 w-4" />
                    </div>

                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn("font-mono font-bold text-xs px-2.5 py-0.5 rounded border", getScopeBadgeStyle(log.id, log.scope))}>
                            #{log.id}
                          </span>
                          <Badge variant="secondary" className="capitalize text-[11px] font-semibold">
                            {log.action || 'feat'}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground px-2 py-0.5 bg-muted/60 rounded border border-border/40 capitalize">
                            {log.scope}
                          </span>
                        </div>

                        {commitHash && (
                          <div
                            className="flex items-center space-x-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded cursor-pointer hover:bg-accent hover:text-foreground transition-colors"
                            onClick={() => handleCopy(commitHash, `hash-${log.id}`)}
                            title="Copy commit hash"
                          >
                            <GitCommit className="h-3 w-3 text-primary" />
                            <span className="font-mono">{commitHash.slice(0, 7)}</span>
                            {copiedId === `hash-${log.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-60" />}
                          </div>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-foreground leading-relaxed">
                        {capitalizedSummary}
                      </h3>

                      {files.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Modified Files ({files.length}):</p>
                          <div className="flex flex-wrap gap-1">
                            {files.slice(0, 4).map(file => (
                              <span key={file} className="text-[10px] font-mono bg-muted/70 text-muted-foreground px-1.5 py-0.5 rounded border border-border/40 truncate max-w-[200px]">
                                {file}
                              </span>
                            ))}
                            {files.length > 4 && (
                              <span className="text-[10px] text-muted-foreground">+{files.length - 4} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {prompt && (
                        <div className="pt-2 border-t border-border/40">
                          <button
                            className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer group/prompt"
                            onClick={() => togglePrompt(log.id)}
                          >
                            <span className="text-[11px] font-medium text-muted-foreground group-hover/prompt:text-foreground transition">AI Prompt</span>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {expandedPrompt === log.id ? 'Hide' : 'View'}
                            </span>
                          </button>
                          {expandedPrompt === log.id && (
                            <p className="mt-2 text-xs text-foreground/80 bg-muted/40 p-2.5 rounded-lg italic border border-border/40">
                              "{prompt}"
                            </p>
                          )}
                        </div>
                      )}

                      <div className="text-[10px] text-muted-foreground text-right pt-1 font-mono">
                        {formattedDate}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. GRID VIEW                                                              */}
          {/* ========================================================================= */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLogs.map((log) => {
                const commitHash = log.commitHash || log.commit_id || '';
                const files = log.modifiedFiles || log.changedFiles || [];
                const prompt = log.promptUsed || log.prompt_used || '';
                const timeStr = log.timestamp || log.created_at || new Date().toISOString();
                const formattedDate = format(new Date(timeStr), 'MMM d, h:mm a');
                const capitalizedSummary = formatSummary(log.summary);

                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn("font-mono font-bold text-xs px-2.5 py-0.5 rounded border", getScopeBadgeStyle(log.id, log.scope))}>
                            #{log.id}
                          </span>
                          <Badge variant="secondary" className="capitalize text-[11px] font-semibold">
                            {log.action || 'feat'}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground px-2 py-0.5 bg-muted/60 rounded border border-border/40 capitalize">
                            {log.scope}
                          </span>
                        </div>

                        {commitHash && (
                          <div
                            className="flex items-center space-x-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded cursor-pointer hover:bg-accent hover:text-foreground transition-colors"
                            onClick={() => handleCopy(commitHash, `hash-${log.id}`)}
                            title="Copy commit hash"
                          >
                            <GitCommit className="h-3 w-3 text-primary" />
                            <span className="font-mono">{commitHash.slice(0, 7)}</span>
                            {copiedId === `hash-${log.id}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-60" />}
                          </div>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-foreground leading-snug">
                        {capitalizedSummary}
                      </h3>

                      {files.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Files ({files.length}):</p>
                          <div className="flex flex-wrap gap-1">
                            {files.slice(0, 3).map(file => (
                              <span key={file} className="text-[10px] font-mono bg-muted/70 text-muted-foreground px-1.5 py-0.5 rounded border border-border/40 truncate max-w-[180px]">
                                {file}
                              </span>
                            ))}
                            {files.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">+{files.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {prompt && (
                        <div className="pt-2 border-t border-border/40">
                          <button
                            className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer group/prompt"
                            onClick={() => togglePrompt(log.id)}
                          >
                            <span className="text-[11px] font-medium text-muted-foreground group-hover/prompt:text-foreground transition">AI Prompt</span>
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {expandedPrompt === log.id ? 'Hide' : 'View'}
                            </span>
                          </button>
                          {expandedPrompt === log.id && (
                            <p className="mt-2 text-xs text-foreground/80 bg-muted/40 p-2.5 rounded-lg italic border border-border/40">
                              "{prompt}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-muted-foreground text-right pt-2 border-t border-border/30 font-mono">
                      {formattedDate}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. LIST (ACCORDION) VIEW                                                  */}
          {/* ========================================================================= */}
          {viewMode === 'list' && (
            <div className="space-y-2">
              {filteredLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                const commitHash = log.commitHash || log.commit_id || '';
                const files = log.modifiedFiles || log.changedFiles || [];
                const prompt = log.promptUsed || log.prompt_used || '';
                const timeStr = log.timestamp || log.created_at || new Date().toISOString();
                const formattedDate = format(new Date(timeStr), 'MMM d, h:mm a');
                const capitalizedSummary = formatSummary(log.summary);

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "rounded-xl border border-border bg-card transition-all overflow-hidden",
                      isExpanded ? "shadow-md ring-1 ring-primary/20" : "hover:border-primary/40 shadow-sm"
                    )}
                  >
                    {/* Clickable Accordion Row Header */}
                    <div
                      onClick={() => toggleListItem(log.id)}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Expand Chevron */}
                        <div className="text-muted-foreground shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-primary transition-transform" />
                          ) : (
                            <ChevronRight className="w-4 h-4 transition-transform" />
                          )}
                        </div>

                        {/* ID Badge */}
                        <span className={cn("font-mono font-bold text-xs px-2 py-0.5 rounded border shrink-0", getScopeBadgeStyle(log.id, log.scope))}>
                          #{log.id}
                        </span>

                        {/* Action Badge */}
                        <Badge variant="secondary" className="capitalize text-[10px] font-semibold shrink-0 hidden sm:inline-flex">
                          {log.action || 'feat'}
                        </Badge>

                        {/* Summary */}
                        <span className="text-xs font-semibold text-foreground truncate flex-1">
                          {capitalizedSummary}
                        </span>
                      </div>

                      {/* Right metadata: Commit Hash + Timestamp */}
                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        {commitHash && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(commitHash, `list-hash-${log.id}`);
                            }}
                            className="hidden sm:flex items-center gap-1 font-mono text-[11px] bg-muted/70 px-2 py-0.5 rounded border border-border/50 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Copy commit hash"
                          >
                            <GitCommit className="w-3 h-3 text-primary" />
                            <span>{commitHash.slice(0, 7)}</span>
                            {copiedId === `list-hash-${log.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-60" />}
                          </div>
                        )}
                        <span className="text-[11px] text-muted-foreground font-mono hidden md:inline">
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    {/* Accordion Expanded Details Drawer */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border/50 bg-muted/15 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                        
                        {/* Scope & Full Summary */}
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground font-semibold">Scope:</span>
                          <span className="text-xs capitalize font-medium text-foreground bg-muted px-2 py-0.5 rounded border border-border/40">
                            {log.scope}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto font-mono">
                            Recorded: {formattedDate}
                          </span>
                        </div>

                        {/* Modified Files */}
                        {files.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                              <FileCode className="w-3.5 h-3.5 text-primary" />
                              Modified Files ({files.length}):
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {files.map(file => (
                                <span
                                  key={file}
                                  className="text-xs font-mono bg-muted text-foreground px-2 py-0.5 rounded border border-border/50"
                                >
                                  {file}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Prompt Used */}
                        {prompt && (
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase text-muted-foreground">AI Prompt Used:</p>
                            <div className="p-3 bg-card rounded-lg border border-border/60 text-xs italic text-foreground/90 font-mono leading-relaxed">
                              "{prompt}"
                            </div>
                          </div>
                        )}

                        {/* Commit hash quick copy */}
                        {commitHash && (
                          <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/30">
                            <span>Commit Reference: <code className="font-mono text-primary">{commitHash}</code></span>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => handleCopy(commitHash, `drawer-hash-${log.id}`)}
                              className="cursor-pointer gap-1"
                            >
                              {copiedId === `drawer-hash-${log.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-primary" />}
                              <span>Copy Hash</span>
                            </Button>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

    </div>
  );
};
