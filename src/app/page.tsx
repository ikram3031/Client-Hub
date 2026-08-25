"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import {
  fetchProjects,
  fetchDocs,
  fetchLogs,
  Project,
  DocItem,
  ActionLog,
} from "@/lib/api";
import { SidebarNavigation, ViewSelection } from "@/components/SidebarNavigation";
import { DocReader } from "@/components/DocReader";
import { FolderOverview } from "@/components/FolderOverview";
import { ActivityChangelog } from "@/components/ActivityChangelog";
import { SearchModal } from "@/components/SearchModal";
import { TopNavbar } from "@/components/TopNavbar";

// Lightweight documentation reader and AI activity logs viewer
const DocsApp: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectSlug, setActiveProjectSlug] = useState<string>("docsnlogs");
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // View state selection: defaults to reading view
  const [currentSelection, setCurrentSelection] = useState<ViewSelection>({
    type: "doc",
    projectSlug: "docsnlogs",
    docSlug: "",
  });

  // Synchronizes view selection with URL query parameters for public shareable links
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
      url.searchParams.delete("doc");
      url.searchParams.delete("category");
    }

    window.history.replaceState({}, "", url.toString());
  }, []);

  // Loads docs and action logs for the currently selected project
  const loadProjectData = async (slug: string, initialDocSlug?: string) => {
    setIsLoading(true);
    try {
      const [docsData, logsData] = await Promise.all([
        fetchDocs(slug),
        fetchLogs(slug),
      ]);
      setDocs(docsData);
      setLogs(logsData);

      // Ensure a valid document is selected for reading view
      setCurrentSelection((prev) => {
        if (prev.type === "doc") {
          const targetSlug = initialDocSlug || prev.docSlug;
          const found = docsData.find((d) => d.slug === targetSlug) || docsData[0];
          if (found) {
            return { type: "doc", projectSlug: slug, docSlug: found.slug };
          }
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to load project details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Loads all registered projects and resolves initial view from URL parameters
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

        const matchedProject = projs.find((p) => p.slug === urlProject) || projs[0];
        const projSlug = matchedProject.slug;
        setActiveProjectSlug(projSlug);

        if (urlDoc) {
          setCurrentSelection({ type: "doc", projectSlug: projSlug, docSlug: urlDoc });
          await loadProjectData(projSlug, urlDoc);
        } else if (urlCat) {
          setCurrentSelection({ type: "folder-overview", projectSlug: projSlug, category: urlCat });
          await loadProjectData(projSlug);
        } else if (urlView === "logs") {
          setCurrentSelection({ type: "logs", projectSlug: projSlug });
          await loadProjectData(projSlug);
        } else {
          // Public Default: Open first doc in the reader
          setCurrentSelection({ type: "doc", projectSlug: projSlug, docSlug: "" });
          await loadProjectData(projSlug);
        }
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  useEffect(() => {
    loadProjectsAndResolveRoute();
  }, []);

  // Global keyboard shortcut for Command/Ctrl + K search modal
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
    loadProjectData(slug).then(() => {
      fetchDocs(slug).then((newDocs) => {
        if (newDocs.length > 0) {
          const newSel: ViewSelection = { type: "doc", projectSlug: slug, docSlug: newDocs[0].slug };
          setCurrentSelection(newSel);
          updateUrlParams(newSel);
        }
      });
    });
  };

  // Handles selecting a view and updating URL
  const handleSelectView = (selection: ViewSelection) => {
    setCurrentSelection(selection);
    updateUrlParams(selection);
  };

  // Navigates to public documentation root (first doc)
  const handleNavigateHome = () => {
    const firstDoc = docs[0];
    if (firstDoc) {
      handleSelectView({ type: "doc", projectSlug: activeProjectSlug, docSlug: firstDoc.slug });
    } else {
      handleSelectView({ type: "folder-overview", projectSlug: activeProjectSlug, category: "Architecture" });
    }
  };

  // Navigates to live activity logs view
  const handleNavigateLogs = () => {
    handleSelectView({ type: "logs", projectSlug: activeProjectSlug });
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
      ? docs.find((d) => d.slug === currentSelection.docSlug) || docs[0]
      : null;

  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden font-sans select-none">
      {/* 1. Top Navigation Bar */}
      <TopNavbar
        activeProject={activeProject}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onNavigateHome={handleNavigateHome}
        onNavigateLogs={handleNavigateLogs}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 2. Main Workspace (Sidebar + Reader Viewport) */}
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
            currentSelection={currentSelection}
            onSelect={(sel) => {
              handleSelectView(sel);
              setMobileMenuOpen(false);
            }}
            onOpenSearch={() => {
              setIsSearchOpen(true);
              setMobileMenuOpen(false);
            }}
            onCloseMobileDrawer={() => setMobileMenuOpen(false)}
          />
        </div>

        {/* Main Reading Viewport */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <span className="text-xs font-mono font-medium">Loading documentation engine...</span>
            </div>
          ) : (
            <>
              {/* 📄 Main Content Reader Engine (`DocReader.tsx`) */}
              {currentSelection.type === "doc" && selectedDoc && (
                <DocReader
                  doc={selectedDoc}
                  allDocs={docs}
                  projectSlug={activeProjectSlug}
                  projectName={activeProject.name}
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

              {/* Empty state if in doc view but no docs exist in project */}
              {currentSelection.type === "doc" && !selectedDoc && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                  <span className="text-4xl mb-3">📄</span>
                  <h2 className="text-base font-bold text-foreground">No documents published yet</h2>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    This project does not have any documentation pages created yet.
                  </p>
                </div>
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
                  onNavigateHome={handleNavigateHome}
                />
              )}

              {/* 📜 AI Action Logs / Activity Changelog View */}
              {currentSelection.type === "logs" && (
                <ActivityChangelog
                  projectSlug={activeProjectSlug}
                  projectName={activeProject.name}
                  logs={logs}
                  onRefresh={() => loadProjectData(activeProjectSlug)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. Global Search Modal */}
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
