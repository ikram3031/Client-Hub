"use client";

import React from "react";
import { DocItem } from "@/lib/api";
import { DocReader } from "@/components/DocReader";

interface DocViewerProps {
  doc: DocItem;
  allDocs?: DocItem[];
  projectSlug: string;
  onDocUpdated: () => void;
  onDocDeleted: () => void;
  onNavigateFolder: (category: string) => void;
  onNavigateDoc?: (slug: string) => void;
  onNavigateHome?: () => void;
}

// DocViewer component delegating to the DocReader engine
export const DocViewer: React.FC<DocViewerProps> = (props) => {
  return <DocReader {...props} />;
};
