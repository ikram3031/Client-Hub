import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router';
import { DocReader } from '../components/DocReader';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DocsPage: React.FC = () => {
  const { currentProject } = useOutletContext<{ currentProject: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const activeDocSlug = searchParams.get('doc');
  const activeCategory = searchParams.get('category');
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      setRefreshCount(c => c + 1);
    };
    window.addEventListener('docsnlogs:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('docsnlogs:refresh', handleGlobalRefresh);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${currentProject}/docs`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.docs || []);
        setDocs(list);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load docs:", err);
        setLoading(false);
      });
  }, [currentProject, refreshCount]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-[400px] w-full mt-8 rounded-xl" />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="p-16 text-center text-muted-foreground max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground">No Documentation Found</h3>
        <p className="text-xs text-muted-foreground">This project doesn't have any documentation pages yet.</p>
        <Button onClick={() => navigate(`/${currentProject}/docs/edit`)} className="text-xs cursor-pointer">
          <Plus className="w-4 h-4 mr-1.5" />
          Create First Document
        </Button>
      </div>
    );
  }

  // Determine active doc based on ?doc or ?category or default to first
  let activeIndex = 0;
  if (activeDocSlug) {
    const idx = docs.findIndex(d => d.slug === activeDocSlug);
    if (idx !== -1) activeIndex = idx;
  } else if (activeCategory) {
    const idx = docs.findIndex(d => (d.category || '').toLowerCase() === activeCategory.toLowerCase());
    if (idx !== -1) activeIndex = idx;
  }

  const currentDoc = docs[activeIndex] || docs[0];
  const prevDoc = activeIndex > 0 ? docs[activeIndex - 1] : null;
  const nextDoc = activeIndex < docs.length - 1 ? docs[activeIndex + 1] : null;

  return (
    <DocReader
      doc={currentDoc}
      projectSlug={currentProject}
      prevDoc={prevDoc}
      nextDoc={nextDoc}
      onNavigateDoc={(slug) => navigate(`/${currentProject}/docs?doc=${slug}`)}
      onNavigateCategory={(cat) => navigate(`/${currentProject}/docs?category=${encodeURIComponent(cat)}`)}
      onEditDoc={() => navigate(`/${currentProject}/docs/edit?doc=${currentDoc.slug}`)}
    />
  );
};
