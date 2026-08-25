"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Terminal,
  AlertCircle,
} from "lucide-react";
import { Feature } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface FeaturesRoadmapProps {
  projectSlug: string;
  projectName?: string;
  features: Feature[];
  onSelectFeatureLogs: (featureKey: string) => void;
  onNavigateHome?: () => void;
}

// Maps status string to badge variants
const getStatusBadge = (status: string) => {
  switch (status) {
    case "done":
      return { label: "Completed", variant: "emerald" as const, icon: CheckCircle2 };
    case "in_progress":
      return { label: "In Progress", variant: "amber" as const, icon: Clock };
    default:
      return { label: "To Do", variant: "secondary" as const, icon: AlertCircle };
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar font-sans bg-background text-foreground px-6 py-8 md:px-12 md:py-10">
      <div className="max-w-4xl w-full mx-auto pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-muted-foreground mb-8 select-none">
          <button
            onClick={onNavigateHome}
            className="hover:text-foreground transition-colors cursor-pointer font-medium"
            type="button"
          >
            {projectName || projectSlug}
          </button>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span>Logs & Governance</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="text-foreground font-semibold">Features & Epics</span>
        </nav>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-border">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-500 rounded-xl border border-cyan-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              Features & Epics Roadmap
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              JIRA-style feature keys, epic scopes, and granular subtask progress
            </p>
          </div>
        </div>

        {/* Features List */}
        {features.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border bg-card text-center">
            <Sparkles className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
            <h3 className="text-sm font-semibold text-foreground">No features registered</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Features are automatically registered when you ingest AI logs with a <code className="font-mono text-foreground">--feat FEAT-X</code> flag.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {features.map((feat) => {
              const isExpanded = !!expandedKeys[feat.key];
              const statusMeta = getStatusBadge(feat.status);
              const StatusIcon = statusMeta.icon;
              const subtasks = feat.subtasks || [];

              return (
                <Card
                  key={feat.id}
                  className="transition-all shadow-xs overflow-hidden"
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFeature(feat.key)}
                        className="h-7 w-7 mt-0.5"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <Badge variant="cyan">{feat.key}</Badge>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">{feat.scope}</Badge>
                          <Badge variant={statusMeta.variant} className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusMeta.label}</span>
                          </Badge>
                        </div>

                        <h3 className="text-base font-bold text-foreground truncate">
                          {feat.title}
                        </h3>
                        {feat.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {feat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectFeatureLogs(feat.key)}
                      >
                        <Terminal className="w-3.5 h-3.5 mr-1 text-primary" />
                        <span>View Logs</span>
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-3 border-t border-border bg-muted/20 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                        Subtasks & Work Items ({subtasks.length})
                      </div>

                      {subtasks.length === 0 ? (
                        <div className="p-3 text-xs text-muted-foreground italic">
                          No subtasks recorded for this feature epic yet.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {subtasks.map((st) => {
                            const subStatus = getStatusBadge(st.status);
                            const SubIcon = subStatus.icon;

                            return (
                              <div
                                key={st.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border text-xs"
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <span className="font-mono text-[11px] font-bold text-muted-foreground">
                                    {st.key}
                                  </span>
                                  <span className="font-medium text-foreground truncate">
                                    {st.title}
                                  </span>
                                </div>
                                <Badge variant={subStatus.variant} className="text-[10px]">
                                  <SubIcon className="w-2.5 h-2.5 mr-1" />
                                  <span>{subStatus.label}</span>
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
