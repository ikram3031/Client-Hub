"use client";

import React from "react";
import { ActionLog } from "@/lib/api";
import { ActivityChangelog } from "@/components/ActivityChangelog";

interface LogViewerProps {
  projectSlug: string;
  projectName?: string;
  logs: ActionLog[];
  selectedScope?: string;
  featureKey?: string;
  onRefresh: () => void;
  onNavigateHome?: () => void;
}

// LogViewer component acting as the unified AI Action Changelog interface
export const LogViewer: React.FC<LogViewerProps> = (props) => {
  return <ActivityChangelog {...props} />;
};
