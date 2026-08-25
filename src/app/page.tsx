"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
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
import { AuthModal } from "@/components/AuthModal";

// Documentation hub connecting public read-only reader with developer auth gating and deep-linking
const DocsApp: React.FC = () => {
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

  // Synchronizes view selection with URL query parameters for public shareable URLs
  const updateUrlParams = useCallback((selection: ViewSelection) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);

    url.searchParams.set("project", selection.projectSlug);

    if (selection.type === "doc") {
      url.searchParams.set("doc", selection.docSlug);
      url.searchParams.delete("view");
      url.searchParams.delete("category");
    } else if (selection.type === "folder-overview") {
      url.searchParams.set("category", selection.category);
      url.searchParams.delete("doc");
      url.searchParams.delete("view");
    } else if (selection.type === "logs") {
      url.searchParams.set("view", "logs");
      if (selection.featureKey) {
        url.searchParams.set("feat", selection.featureKey);
      } else {
        url.searchParams.delete("feat");
      }
      url.searchParams.delete("doc");
      url.searchParams.delete("category");
    } else if (selection.type === "features") {
      url.searchParams.set("view", "features");
      url.searchParams.delete("doc");
      url.searchParams.delete("category");
    } else {
      url.searchParams.delete("doc");
      url.searchParams.delete("category");
      url.searchParams.delete("view");
    }

    window.history.replaceState({}, "", url.toString());
  }, []);

  // Loads all registered projects and resolves initial view from URL query params
  const loadProjectsAndResolveRoute = async () => {
    try {
      const projs = await fetchProjects();
      setProjects(projs);

      if (projs.length > 0) {
        const params = new URLSearchParams(window.location.search);
        const urlProject = params.get("project");
        const urlDoc = params.get("doc");
        const urlCat = params.get("category");
        const urlView = params.get("view");
        const urlFeat = params.get("feat");

        const matchedProject = projs.find((p) => p.slug === urlProject) || projs[0];
        const projSlug = matchedProject.slug;
        setActiveProjectSlug(projSlug);

        if (urlDoc) {
          setCurrentSelection({ type: "doc", projectSlug: projSlug, docSlug: urlDoc });
        } else if (urlCat) {
          setCurrentSelection({ type: "folder-overview", projectSlug: projSlug, category: urlCat });
        } else if (urlView === "logs") {
          setCurrentSelection({ type: "logs", projectSlug: projSlug, featureKey: urlFeat || undefined });
        } else if (urlView === "features") {
          setCurrentSelection({ type: "features", projectSlug: projSlug });
        } else {
          setCurrentSelection({ type: "project-overview", projectSlug: projSlug });
        }
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
    loadProjectsAndResolveRoute();
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
    const newSel: ViewSelection = { type: "project-overview", projectSlug: slug };
    setCurrentSelection(newSel);
    updateUrlParams(newSel);
  };

  // Handles selecting a view and synchronizing URL
  const handleSelectView = (selection: ViewSelection) => {
    setCurrentSelection(selection);
    updateUrlParams(selection);
  };

  // Opens new document modal with optional pre-selected category
  const handleOpenNewDocModal = (category?: string) => {
    setDocModalCategory(category);
    setIsDocModalOpen(true);
  };

  // Callback when a document is created
  const handleDocCreated = async (newDocSlug: string) => {
    await loadProjectData(activeProjectSlug);
    const newSel: ViewSelection = {
      type: "doc",
      projectSlug: activeProjectSlug,
      docSlug: newDocSlug,
    };
    handleSelectView(newSel);
  };

  // Callback when a project is created
  const handleProjectCreated = async (newSlug: string) => {
    await loadProjectsAndResolveRoute();
    setActiveProjectSlug(newSlug);
    const newSel: ViewSelection = { type: "project-overview", projectSlug: newSlug };
    handleSelectView(newSel);
  };

  // Navigates back to project root
  const handleNavigateHome = () => {
    handleSelectView({ type: "project-overview", projectSlug: activeProjectSlug });
  };

  // Navigates to live activity logs view
  const handleNavigateLogs = () => {
    handleSelectView({ type: "logs", projectSlug: activeProjectSlug });
  };

  // Navigates to features and roadmap view
  const handleNavigateFeatures = () => {
    handleSelectView({ type: "features", projectSlug: activeProjectSlug });
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
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden font-sans select-none">
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
              handleSelectView(sel);
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
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
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
                    handleSelectView({
                      type: "folder-overview",
                      projectSlug: activeProjectSlug,
                      category,
                    })
                  }
                  onNavigateDoc={(slug) =>
                    handleSelectView({
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
                    handleSelectView({
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
                  projectName={activeProject.name}
                  onDocUpdated={() => loadProjectData(activeProjectSlug)}
                  onDocDeleted={() => {
                    loadProjectData(activeProjectSlug);
                    handleSelectView({
                      type: "project-overview",
                      projectSlug: activeProjectSlug,
                    });
                  }}
                  onNavigateFolder={(cat) =>
                    handleSelectView({
                      type: "folder-overview",
                      projectSlug: activeProjectSlug,
                      category: cat,
                    })
                  }
                  onNavigateDoc={(slug) =>
                    handleSelectView({
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
                    handleSelectView({
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

      {/* 3. Global Modals & Auth Challenge */}
      <AuthModal />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        docs={docs}
        logs={logs}
        onSelectDoc={(slug) => {
          handleSelectView({
            type: "doc",
            projectSlug: activeProjectSlug,
            docSlug: slug,
          });
        }}
        onSelectCategory={(cat) => {
          handleSelectView({
            type: "folder-overview",
            projectSlug: activeProjectSlug,
            category: cat,
          });
        }}
        onSelectLogs={() => {
          handleSelectView({
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

export default function Page() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-background text-foreground font-mono text-xs">Loading documentation engine...</div>}>
      <DocsApp />
    </Suspense>
  );
}
