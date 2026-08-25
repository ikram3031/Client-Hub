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
import { SidebarNavigation, ViewSelection } from "@/components/SidebarNavigation";
import { DocReader } from "@/components/DocReader";
import { FolderOverview } from "@/components/FolderOverview";
import { ActivityChangelog } from "@/components/ActivityChangelog";
import { FeaturesRoadmap } from "@/components/FeaturesRoadmap";
import { ProjectOverview } from "@/components/ProjectOverview";
import { NewDocModal } from "@/components/NewDocModal";
import { NewProjectModal } from "@/components/NewProjectModal";
import { SearchModal } from "@/components/SearchModal";
import { TopNavbar } from "@/components/TopNavbar";

// Main documentation hub connecting hierarchical sidebar navigation with the reader engine and changelog
const HomePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectSlug, setActiveProjectSlug] = useState<string>("docsnlogs");
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // View state selection
  const [currentSelection, setCurrentSelection] = useState<ViewSelection>({
    type: "project-overview",
    projectSlug: "docsnlogs",
  });

  // Modal dialog states
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [docModalCategory, setDocModalCategory] = useState<string | undefined>();
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);

  // Loads all registered projects on mount
  const loadProjects = async () => {
    try {
      const projs = await fetchProjects();
      setProjects(projs);
      if (projs.length > 0) {
        const found = projs.find((p) => p.slug === activeProjectSlug) || projs[0];
        setActiveProjectSlug(found.slug);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
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
      console.error("Failed to load project details:", err);
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

  // Global keyboard shortcut listener for Command/Ctrl + K to open search palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Navigates back to project root
  const handleNavigateHome = () => {
    setCurrentSelection({ type: "project-overview", projectSlug: activeProjectSlug });
  };

  // Navigates to live activity logs view
  const handleNavigateLogs = () => {
    setCurrentSelection({ type: "logs", projectSlug: activeProjectSlug });
  };

  // Navigates to features and roadmap view
  const handleNavigateFeatures = () => {
    setCurrentSelection({ type: "features", projectSlug: activeProjectSlug });
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
    <div className="flex flex-col h-screen w-screen theme-bg-primary theme-text-primary overflow-hidden font-sans select-none">
      {/* 1. Global Top Navigation Bar */}
      <TopNavbar
        activeProject={activeProject}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onNavigateHome={handleNavigateHome}
        onNavigateLogs={handleNavigateLogs}
        onNavigateFeatures={handleNavigateFeatures}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewDocModal={() => handleOpenNewDocModal()}
      />

      {/* 2. Main Workspace (Sidebar + Dynamic Viewport) */}
      <div className="flex-1 flex h-[calc(100vh-3.5rem)] overflow-hidden relative">
        {/* Mobile Drawer Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in"
          />
        )}

        {/* Left Sidebar Navigation */}
        <div
          className={`${
            mobileMenuOpen
              ? "fixed inset-y-0 left-0 z-40 flex shadow-2xl animate-in slide-in-from-left duration-200"
              : "hidden md:flex"
          } h-full shrink-0`}
        >
          <SidebarNavigation
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
            onOpenNewDocModal={(cat) => {
              handleOpenNewDocModal(cat);
              setMobileMenuOpen(false);
            }}
            onOpenNewProjectModal={() => {
              setIsProjectModalOpen(true);
              setMobileMenuOpen(false);
            }}
            onOpenSearch={() => {
              setIsSearchOpen(true);
              setMobileMenuOpen(false);
            }}
            onCloseMobileDrawer={() => setMobileMenuOpen(false)}
          />
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 flex flex-col h-full overflow-hidden theme-bg-primary relative">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center theme-text-muted gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <span className="text-xs font-mono font-medium">Syncing with Cloudflare D1...</span>
            </div>
          ) : (
            <>
              {/* Overview View */}
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
                  onNavigateLogs={handleNavigateLogs}
                  onOpenNewDocModal={handleOpenNewDocModal}
                />
              )}

              {/* Folder / Category Overview View */}
              {currentSelection.type === "folder-overview" && (
                <FolderOverview
                  projectSlug={activeProjectSlug}
                  projectName={activeProject.name}
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
                  onNavigateHome={handleNavigateHome}
                />
              )}

              {/* 📄 Main Content Reader Engine (`DocReader.tsx`) */}
              {currentSelection.type === "doc" && selectedDoc && (
                <DocReader
                  doc={selectedDoc}
                  allDocs={docs}
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
                  onNavigateDoc={(slug) =>
                    setCurrentSelection({
                      type: "doc",
                      projectSlug: activeProjectSlug,
                      docSlug: slug,
                    })
                  }
                  onNavigateHome={handleNavigateHome}
                />
              )}

              {/* 📜 AI Action Logs / Changelog Page */}
              {currentSelection.type === "logs" && (
                <ActivityChangelog
                  projectSlug={activeProjectSlug}
                  projectName={activeProject.name}
                  logs={logs}
                  featureKey={currentSelection.featureKey}
                  onRefresh={() => loadProjectData(activeProjectSlug)}
                  onNavigateHome={handleNavigateHome}
                />
              )}

              {/* Features & Epics Roadmap */}
              {currentSelection.type === "features" && (
                <FeaturesRoadmap
                  projectSlug={activeProjectSlug}
                  projectName={activeProject.name}
                  features={features}
                  onSelectFeatureLogs={(featKey) =>
                    setCurrentSelection({
                      type: "logs",
                      projectSlug: activeProjectSlug,
                      featureKey: featKey,
                    })
                  }
                  onNavigateHome={handleNavigateHome}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        docs={docs}
        logs={logs}
        onSelectDoc={(slug) => {
          setCurrentSelection({
            type: "doc",
            projectSlug: activeProjectSlug,
            docSlug: slug,
          });
        }}
        onSelectCategory={(cat) => {
          setCurrentSelection({
            type: "folder-overview",
            projectSlug: activeProjectSlug,
            category: cat,
          });
        }}
        onSelectLogs={() => {
          setCurrentSelection({
            type: "logs",
            projectSlug: activeProjectSlug,
          });
        }}
      />

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
