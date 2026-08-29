import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router';
import { Sidebar } from './Sidebar';
import { ChevronRight, BookOpen, History, Plus, Layers, ChevronDown, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

export const Layout: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectDocs, setProjectDocs] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // Closed by default as requested
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract project slug from URL, default to first project if not present
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentProject = pathParts[0] || 'docsnlogs';

  const fetchProjectsAndDocs = async () => {
    try {
      const pRes = await fetch('/api/projects');
      const pData = await pRes.json();
      const pList = Array.isArray(pData) ? pData : (pData.projects || []);
      setProjects(pList);
      if (!pathParts[0] && pList.length > 0) {
        navigate(`/${pList[0].slug}/docs`, { replace: true });
      }

      if (currentProject) {
        const dRes = await fetch(`/api/projects/${currentProject}/docs`);
        const dData = await dRes.json();
        const dList = Array.isArray(dData) ? dData : (dData.docs || []);
        setProjectDocs(dList);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchProjectsAndDocs();
      // Dispatch global event for active page views (DocsPage, LogsPage) to re-fetch
      window.dispatchEvent(new CustomEvent('docsnlogs:refresh'));
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchProjectsAndDocs();
  }, [currentProject]);

  const handleProjectChange = (slug: string) => {
    navigate(`/${slug}/docs`);
  };

  const currentProjectName = projects.find(p => p.slug === currentProject)?.name || currentProject;

  // Extract unique categories from docs
  const docCategories = Array.from(new Set(projectDocs.map(d => d.category || 'General')));
  if (docCategories.length === 0) {
    docCategories.push('Architecture', 'Backend', 'Frontend', 'Dashboard');
  }

  const handleCategorySelect = (category: string) => {
    const matchedDoc = projectDocs.find(d => (d.category || '').toLowerCase() === category.toLowerCase());
    if (matchedDoc) {
      navigate(`/${currentProject}/docs?doc=${matchedDoc.slug}`);
    } else {
      navigate(`/${currentProject}/docs?category=${encodeURIComponent(category)}`);
    }
  };

  const isDocsActive = location.pathname.includes('/docs') && !location.pathname.includes('/edit');
  const isLogsActive = location.pathname.includes('/logs');

  return (
    <div className="flex min-h-screen bg-background text-foreground relative">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        projects={projects}
        currentProject={currentProject}
        onProjectChange={handleProjectChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area with Top Navbar */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Sleek Top Navbar */}
        <header className="sticky top-0 z-30 h-12 bg-card/85 backdrop-blur-md border-b border-border px-4 flex items-center justify-between gap-3 shrink-0">
          
          {/* Left Side: Sidebar Toggle + Project + Dynamic Docs Submenu + Logs */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* Small Rounded Accent Arrow Button when Sidebar is closed */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="hidden md:flex items-center justify-center w-7 h-7 rounded-full border border-primary/60 text-primary bg-primary/10 hover:bg-primary/20 hover:border-primary transition-all active:scale-95 cursor-pointer shadow-sm"
                title="Open Sidebar"
                aria-label="Open Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Current Project Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-xs font-semibold text-foreground">
              <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate max-w-[140px] sm:max-w-xs">{currentProjectName}</span>
            </div>

            <div className="h-4 w-px bg-border hidden sm:block" />

            {/* Docs Dropdown with Dynamic Submenus */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant={isDocsActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 gap-1.5 text-xs font-semibold px-2.5 cursor-pointer",
                      isDocsActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  />
                }
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Docs</span>
                <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Categories ({docCategories.length})
                </div>
                {docCategories.map(cat => (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => handleCategorySelect(cat)}
                    className="cursor-pointer text-xs font-medium flex items-center justify-between"
                  >
                    <span>{cat}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {projectDocs.filter(d => (d.category || '').toLowerCase() === cat.toLowerCase()).length || 0} docs
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logs Direct Button */}
            <NavLink
              to={`/${currentProject}/logs`}
              className={({ isActive }) => cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <History className="w-3.5 h-3.5 text-emerald-500" />
              <span>Logs</span>
            </NavLink>
          </div>

          {/* Right Side: Refresh Button + New Doc CTA + Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Refresh Data Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-card hover:bg-muted border border-border text-foreground transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-xs"
              title="Refresh Data (fetch latest docs & logs from Cloudflare D1)"
              aria-label="Refresh Data"
            >
              <RotateCw className={cn("w-3.5 h-3.5 text-primary", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <NavLink
              to={`/${currentProject}/docs/edit`}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Doc</span>
            </NavLink>

            <ThemeToggle />
          </div>

        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-x-hidden relative">
          <Outlet context={{ currentProject }} />
        </main>

      </div>
    </div>
  );
};
