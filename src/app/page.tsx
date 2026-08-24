"use client";

import React, { useState, useEffect } from "react";
import {
  fetchProjects,
  fetchDocs,
  fetchFeatures,
  fetchLogs,
  Project,
  DocItem,
  Feature,
  ActionLog,
} from "@/lib/api";
import { SidebarTree, ViewSelection } from "@/components/SidebarTree";
import { DocViewer } from "@/components/DocViewer";
import { FolderOverview } from "@/components/FolderOverview";
import { LogViewer } from "@/components/LogViewer";
import { ProjectOverview } from "@/components/ProjectOverview";
import { NewDocModal } from "@/components/NewDocModal";
import { NewProjectModal } from "@/components/NewProjectModal";
import { Database, Sparkles, Terminal, BookOpen, Layers, Menu, X } from "lucide-react";

// Main Hub Page layout connecting hierarchical sidebar tree with dynamic content viewports
const HomePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectSlug, setActiveProjectSlug] = useState<string>("docsnlogs");
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // View state selection
  const [currentSelection, setCurrentSelection] = useState<ViewSelection>({
    type: "project-overview",
    projectSlug: "docsnlogs",
  });

  // Modal dialog states
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [docModalCategory, setDocModalCategory] = useState<string | undefined>();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);

  // Loads all registered projects on initial mount
  const loadProjects = async () => {
    try {
      const projs = await fetchProjects();
      setProjects(projs);
      if (projs.length > 0) {
        const found = projs.find((p) => p.slug === activeProjectSlug) || projs[0];
        setActiveProjectSlug(found.slug);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  // Loads docs, features, and action logs for the currently selected project
  const loadProjectData = async (slug: string) => {
    setIsLoading(true);
    try {
      const [docsData, featsData, logsData] = await Promise.all([
        fetchDocs(slug),
        fetchFeatures(slug),
        fetchLogs(slug),
      ]);
      setDocs(docsData);
      setFeatures(featsData);
      setLogs(logsData);
    } catch (err) {
      console.error("Failed to load project details", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (activeProjectSlug) {
      loadProjectData(activeProjectSlug);
    }
  }, [activeProjectSlug]);

  // Handles changing the active project
  const handleSelectProject = (slug: string) => {
    setActiveProjectSlug(slug);
    setCurrentSelection({ type: "project-overview", projectSlug: slug });
  };

  // Opens new document modal with optional pre-selected category
  const handleOpenNewDocModal = (category?: string) => {
    setDocModalCategory(category);
    setIsDocModalOpen(true);
  };

  // Callback when a document is created
  const handleDocCreated = async (newDocSlug: string) => {
    await loadProjectData(activeProjectSlug);
    setCurrentSelection({
      type: "doc",
      projectSlug: activeProjectSlug,
      docSlug: newDocSlug,
    });
  };

  // Callback when a project is created
  const handleProjectCreated = async (newSlug: string) => {
    await loadProjects();
    setActiveProjectSlug(newSlug);
    setCurrentSelection({ type: "project-overview", projectSlug: newSlug });
  };

  const activeProject = projects.find((p) => p.slug === activeProjectSlug) || {
    id: "default",
    name: "docsNlogs",
    slug: "docsnlogs",
    description: "Centralized AI Documentation and Action Logs Hub",
    docs_categories: ["Architecture", "Backend", "Frontend", "Dashboard"],
    log_scopes: ["frontend", "backend", "dashboard"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const selectedDoc =
    currentSelection.type === "doc"
      ? docs.find((d) => d.slug === currentSelection.docSlug)
      : null;

  return (
    <div className="flex h-screen w-screen bg-black text-zinc-100 overflow-hidden font-sans select-none">
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-3 right-3 z-50 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Left Sidebar Tree */}
      <div
        className={`${
          mobileMenuOpen ? "fixed inset-y-0 left-0 z-40 flex" : "hidden md:flex"
        } h-full shrink-0`}
      >
        <SidebarTree
          projects={projects}
          activeProjectSlug={activeProjectSlug}
          onSelectProject={(slug) => {
            handleSelectProject(slug);
            setMobileMenuOpen(false);
          }}
          docs={docs}
          features={features}
          currentSelection={currentSelection}
          onSelect={(sel) => {
            setCurrentSelection(sel);
            setMobileMenuOpen(false);
          }}
          onOpenNewDocModal={handleOpenNewDocModal}
          onOpenNewProjectModal={() => setIsProjectModalOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-zinc-950">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
            <span className="text-xs font-mono">Syncing with Cloudflare D1...</span>
          </div>
        ) : (
          <>
            {currentSelection.type === "project-overview" && (
              <ProjectOverview
                project={activeProject}
                docs={docs}
                features={features}
                onNavigateFolder={(category) =>
                  setCurrentSelection({
                    type: "folder-overview",
                    projectSlug: activeProjectSlug,
                    category,
                  })
                }
                onNavigateDoc={(slug) =>
                  setCurrentSelection({
                    type: "doc",
                    projectSlug: activeProjectSlug,
                    docSlug: slug,
                  })
                }
                onNavigateLogs={() =>
                  setCurrentSelection({
                    type: "logs",
                    projectSlug: activeProjectSlug,
                  })
                }
                onOpenNewDocModal={handleOpenNewDocModal}
              />
            )}

            {currentSelection.type === "folder-overview" && (
              <FolderOverview
                projectSlug={activeProjectSlug}
                category={currentSelection.category}
                docs={docs}
                onSelectDoc={(slug) =>
                  setCurrentSelection({
                    type: "doc",
                    projectSlug: activeProjectSlug,
                    docSlug: slug,
                  })
                }
                onOpenNewDocModal={(cat) => handleOpenNewDocModal(cat)}
              />
            )}

            {currentSelection.type === "doc" && selectedDoc && (
              <DocViewer
                doc={selectedDoc}
                projectSlug={activeProjectSlug}
                onDocUpdated={() => loadProjectData(activeProjectSlug)}
                onDocDeleted={() => {
                  loadProjectData(activeProjectSlug);
                  setCurrentSelection({
                    type: "project-overview",
                    projectSlug: activeProjectSlug,
                  });
                }}
                onNavigateFolder={(cat) =>
                  setCurrentSelection({
                    type: "folder-overview",
                    projectSlug: activeProjectSlug,
                    category: cat,
                  })
                }
              />
            )}

            {currentSelection.type === "logs" && (
              <LogViewer
                projectSlug={activeProjectSlug}
                logs={logs}
                featureKey={currentSelection.featureKey}
                onRefresh={() => loadProjectData(activeProjectSlug)}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <NewDocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        projectSlug={activeProjectSlug}
        categories={activeProject.docs_categories || ["Architecture", "Backend", "Frontend", "Dashboard"]}
        defaultCategory={docModalCategory}
        onDocCreated={handleDocCreated}
      />

      <NewProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default HomePage;
