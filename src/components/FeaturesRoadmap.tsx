"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Terminal,
  Layers,
  Tag,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Feature } from "@/lib/api";

interface FeaturesRoadmapProps {
  projectSlug: string;
  projectName?: string;
  features: Feature[];
  onSelectFeatureLogs: (featureKey: string) => void;
  onNavigateHome?: () => void;
}

// Maps status string to badge colors and icons
const getStatusMeta = (status: string) => {
  switch (status) {
    case "done":
      return { label: "Completed", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    case "in_progress":
      return { label: "In Progress", icon: Clock, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" };
    default:
      return { label: "To Do", icon: AlertCircle, color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20" };
  }
};

// Features & Epics Roadmap view showing JIRA-style epic tracking and nested subtasks
export const FeaturesRoadmap: React.FC<FeaturesRoadmapProps> = ({
  projectSlug,
  projectName,
  features,
  onSelectFeatureLogs,
  onNavigateHome,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Toggles the expansion state of a specific feature card
  const toggleFeature = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar font-sans theme-bg-primary theme-text-primary px-6 py-6 md:px-12 md:py-8">
      <div className="max-w-4xl w-full mx-auto pb-16">
        {/* Breadcrumb */}
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
          <span className="theme-text-primary font-semibold truncate">Features & Epics</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b theme-border">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight theme-text-primary">
                Features & Epics Roadmap
              </h1>
            </div>
            <p className="text-xs md:text-sm theme-text-muted">
              JIRA-style feature keys, epic scopes, and granular subtask progress
            </p>
          </div>
        </div>

        {/* Features List */}
        {features.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed theme-border theme-bg-card text-center">
            <Sparkles className="w-10 h-10 theme-text-muted mb-3 opacity-60" />
            <h3 className="text-sm font-semibold theme-text-primary">No features registered</h3>
            <p className="text-xs theme-text-muted mt-1 max-w-sm">
              Features are automatically registered when you ingest AI logs with a <code className="font-mono text-zinc-400">--feat FEAT-X</code> flag.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {features.map((feat) => {
              const isExpanded = !!expandedKeys[feat.key];
              const statusMeta = getStatusMeta(feat.status);
              const StatusIcon = statusMeta.icon;
              const subtasks = feat.subtasks || [];

              return (
                <div
                  key={feat.id}
                  className="rounded-2xl border theme-border theme-bg-card transition-all shadow-xs overflow-hidden"
                >
                  {/* Feature Main Header Row */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => toggleFeature(feat.key)}
                        className="p-1 rounded-lg theme-bg-secondary text-zinc-400 hover:theme-text-primary mt-0.5"
                        type="button"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                            {feat.key}
                          </span>
                          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-bold theme-bg-secondary text-zinc-500 border theme-border">
                            {feat.scope}
                          </span>
                          <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusMeta.label}</span>
                          </span>
                        </div>

                        <h3 className="text-base font-bold theme-text-primary truncate">
                          {feat.title}
                        </h3>
                        {feat.description && (
                          <p className="text-xs theme-text-muted mt-1 leading-relaxed">
                            {feat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: View Logs Button */}
                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      <button
                        onClick={() => onSelectFeatureLogs(feat.key)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold theme-bg-secondary hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl border theme-border transition-all cursor-pointer shadow-xs"
                        type="button"
                      >
                        <Terminal className="w-3.5 h-3.5 text-purple-500" />
                        <span>View Logs</span>
                      </button>
                    </div>
                  </div>

                  {/* Subtasks Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t theme-border theme-bg-secondary/40 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider theme-text-muted font-mono">
                        Subtasks & Work Items ({subtasks.length})
                      </div>

                      {subtasks.length === 0 ? (
                        <div className="p-3 text-xs theme-text-muted italic">
                          No subtasks recorded for this feature epic yet.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {subtasks.map((st) => {
                            const subStatus = getStatusMeta(st.status);
                            const SubIcon = subStatus.icon;

                            return (
                              <div
                                key={st.id}
                                className="flex items-center justify-between p-3 rounded-xl theme-bg-card border theme-border text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="font-mono text-[11px] font-bold text-zinc-500">
                                    {st.key}
                                  </span>
                                  <span className="font-medium theme-text-primary truncate">
                                    {st.title}
                                  </span>
                                </div>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${subStatus.color}`}>
                                  <SubIcon className="w-2.5 h-2.5" />
                                  <span>{subStatus.label}</span>
                                </span>
                              </div>
                            );
                          })}
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
    </div>
  );
};
