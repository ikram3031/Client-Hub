import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router';
import { BookOpen, History, Menu, FileText, ChevronDown, Plus, ChevronRight, Layers, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

interface SidebarProps {
  projects: { id: string; slug: string; name: string }[];
  currentProject: string;
  onProjectChange: (slug: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  currentProject,
  onProjectChange,
  isOpen,
  onClose,
}) => {
  const [docs, setDocs] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentProjectName = projects.find(p => p.slug === currentProject)?.name || 'docsNlogs';

  useEffect(() => {
    if (!currentProject) return;
    fetch(`/api/projects/${currentProject}/docs`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.docs || []);
        setDocs(list);
      })
      .catch(err => console.error("Error fetching docs in sidebar:", err));
  }, [currentProject]);

  // Group docs by category
  const categories: Record<string, any[]> = {};
  docs.forEach(d => {
    const cat = d.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(d);
  });

  const searchParams = new URLSearchParams(location.search);
  const activeDocSlug = searchParams.get('doc') || (docs[0]?.slug);

  const handleDocClick = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    const currentScroll = scrollContainerRef.current?.scrollTop || 0;
    navigate(`/${currentProject}/docs?doc=${slug}`);
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = currentScroll;
      }
    }, 10);
  };

  const NavItems = () => (
    <div className="flex flex-col h-full bg-card border-r border-border text-foreground select-none">
      {/* Brand, Close Button & Project Selector */}
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-foreground">docs<span className="text-primary font-extrabold">N</span>logs</span>
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] uppercase font-bold bg-primary/10 text-primary border border-primary/20 rounded">Hub</span>
            </div>
          </div>

          {/* Rounded Border Accent Close Cross Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full border border-primary/60 text-primary hover:bg-primary/10 hover:border-primary transition-all active:scale-90 cursor-pointer flex items-center justify-center shrink-0"
            title="Collapse Sidebar"
            aria-label="Collapse Sidebar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-between text-xs font-medium cursor-pointer" />}>
            <span className="truncate">{currentProjectName}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {projects.map(p => (
              <DropdownMenuItem key={p.id} onClick={() => onProjectChange(p.slug)} className="cursor-pointer text-xs">
                <span className="font-medium truncate">{p.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">({p.slug})</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Navigation links & Doc Tree */}
      <div ref={scrollContainerRef} className="p-3 flex-1 overflow-y-auto space-y-4 text-xs">
        
        {/* Navigation Section */}
        <div className="space-y-1">
          <NavLink
            to={`/${currentProject}/docs`}
            className={({ isActive }) => cn(
              "flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              isActive && !location.pathname.includes('/edit') ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>Documentation Hub</span>
          </NavLink>

          <NavLink
            to={`/${currentProject}/docs/edit`}
            className={({ isActive }) => cn(
              "flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Plus className="h-4 w-4 text-primary" />
            <span>New Document</span>
          </NavLink>

          <NavLink
            to={`/${currentProject}/logs`}
            className={({ isActive }) => cn(
              "flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <History className="h-4 w-4 text-emerald-500" />
            <span>Live Action Logs</span>
          </NavLink>
        </div>

        {/* Categorized Docs Tree */}
        <div className="pt-3 border-t border-border/60 space-y-3">
          <p className="px-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Documentation Tree
          </p>

          {Object.keys(categories).length === 0 ? (
            <div className="px-2 text-[11px] text-muted-foreground italic">No documents yet.</div>
          ) : (
            Object.keys(categories).map(cat => (
              <div key={cat} className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                  <span>{cat}</span>
                  <span className="text-[10px] text-muted-foreground/70 font-mono">({categories[cat].length})</span>
                </div>
                <div className="space-y-0.5 pl-2 border-l border-border/40 ml-2">
                  {categories[cat].map(d => {
                    const isSelected = location.pathname.includes('/docs') && !location.pathname.includes('/edit') && activeDocSlug === d.slug;
                    return (
                      <button
                        key={d.id || d.slug}
                        onClick={(e) => handleDocClick(e, d.slug)}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition flex items-center justify-between group cursor-pointer",
                          isSelected
                            ? "bg-primary/15 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <span className="truncate">{d.title}</span>
                        <ChevronRight className={cn("h-3 w-3 opacity-0 group-hover:opacity-100 transition", isSelected && "opacity-100 text-primary")} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Footer / Theme Toggle */}
      <div className="p-3 border-t border-border flex items-center justify-between bg-muted/20 shrink-0">
        <span className="text-xs text-muted-foreground font-medium">Theme Mode</span>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
              <Menu className="h-4 w-4" />
            </Button>}>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64" showCloseButton={false}>
              <NavItems />
            </SheetContent>
          </Sheet>
          <span className="font-bold text-sm text-foreground">docs<span className="text-primary">N</span>logs</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Desktop Collapsible Sidebar */}
      <div
        className={cn(
          "hidden md:block shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "w-64 opacity-100" : "w-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="w-64 h-full">
          <NavItems />
        </div>
      </div>
    </>
  );
};
