import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router';
import { Sidebar } from './Sidebar';
import { ChevronRight, BookOpen, History, Plus, Layers, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

export const Layout: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectDocs, setProjectDocs] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // Closed by default as requested
  const navigate = useNavigate();
  const location = useLocation();

  // Extract project slug from URL, default to first project if not present
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentProject = pathParts[0] || 'docsnlogs';

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.projects || []);
        setProjects(list);
        if (!pathParts[0] && list.length > 0) {
          navigate(`/${list[0].slug}/docs`, { replace: true });
        }
      })
      .catch(err => console.error("Error fetching projects:", err));
  }, []);

  // Fetch docs for current project to populate top nav dynamic categories
  useEffect(() => {
    if (!currentProject) return;
    fetch(`/api/projects/${currentProject}/docs`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.docs || []);
        setProjectDocs(list);
      })
      .catch(err => console.error("Error fetching project docs:", err));
  }, [currentProject, location.pathname]);

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

          {/* Right Side: New Doc CTA + Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
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
