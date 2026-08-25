"use client";

import React from "react";
import { Project, DocItem, Feature } from "@/lib/api";
import { SidebarNavigation, ViewSelection } from "@/components/SidebarNavigation";

export type { ViewSelection };

interface SidebarTreeProps {
  projects: Project[];
  activeProjectSlug: string;
  onSelectProject: (slug: string) => void;
  docs: DocItem[];
  features: Feature[];
  currentSelection: ViewSelection;
  onSelect: (selection: ViewSelection) => void;
  onOpenNewDocModal: (defaultCategory?: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenSearch?: () => void;
  onCloseMobileDrawer?: () => void;
}

// SidebarTree component providing backwards compatibility for the sidebar tree
export const SidebarTree: React.FC<SidebarTreeProps> = (props) => {
  return (
    <SidebarNavigation
      {...props}
      onOpenSearch={props.onOpenSearch || (() => {})}
    />
  );
};
