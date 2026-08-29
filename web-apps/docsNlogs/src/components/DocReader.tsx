import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Edit3, 
  Clock, 
  Tag, 
  BookOpen, 
  Code2, 
  Columns, 
  Copy, 
  Check, 
  Download, 
  Maximize2,
  FileCode,
  Sparkles
} from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { CodeEditorView } from './CodeEditorView';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router';
import { cn } from '@/lib/utils';

type ViewMode = 'reader' | 'editor' | 'split';

interface DocReaderProps {
  doc: {
    slug: string;
    title: string;
    category?: string;
    author?: string;
    lastUpdated?: string;
    content: string;
    tags?: string[];
  };
  projectSlug: string;
  prevDoc?: { title: string; slug: string } | null;
  nextDoc?: { title: string; slug: string } | null;
  onNavigateDoc?: (slug: string) => void;
  onNavigateCategory?: (cat: string) => void;
  onEditDoc?: () => void;
}

export const DocReader: React.FC<DocReaderProps> = ({
  doc,
  projectSlug,
  prevDoc,
  nextDoc,
  onNavigateDoc,
  onNavigateCategory,
  onEditDoc,
}) => {
  const navigate = useNavigate();
  const formattedDate = doc.lastUpdated ? format(new Date(doc.lastUpdated), 'MMM d, yyyy') : 'Recent';

  // Load view mode preference from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('docsnlogs:doc_view_mode') as ViewMode) || 'reader';
  });

  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    localStorage.setItem('docsnlogs:doc_view_mode', viewMode);
  }, [viewMode]);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(doc.content || '');
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadMd = () => {
    const blob = new Blob([doc.content || ''], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.slug || 'document'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn(
      "mx-auto py-6 px-4 sm:px-6 lg:px-8 bg-background text-foreground transition-all",
      viewMode === 'split' ? "max-w-[98%] 2xl:max-w-[1800px]" : "max-w-5xl"
    )}>
      
      {/* Top Header: Breadcrumbs & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/80">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex text-xs text-muted-foreground" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-1.5 flex-wrap">
            <li>
              <button
                onClick={() => navigate(`/${projectSlug}/docs`)}
                className="font-semibold text-muted-foreground hover:text-foreground hover:underline transition cursor-pointer"
              >
                {projectSlug}
              </button>
            </li>
            <li><ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" /></li>
            {doc.category && (
              <>
                <li>
                  <button
                    onClick={() => onNavigateCategory ? onNavigateCategory(doc.category!) : navigate(`/${projectSlug}/docs?category=${encodeURIComponent(doc.category!)}`)}
                    className="text-muted-foreground hover:text-foreground hover:underline transition cursor-pointer"
                  >
                    {doc.category}
                  </button>
                </li>
                <li><ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" /></li>
              </>
            )}
            <li className="font-medium text-foreground truncate max-w-[200px]" aria-current="page">
              {doc.title}
            </li>
          </ol>
        </nav>

        {/* View Mode Segmented Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Segmented Controller: Reader | Code Editor | Split */}
          <div className="flex items-center bg-muted/80 p-1 rounded-xl border border-border/80 shadow-sm">
            <button
              onClick={() => setViewMode('reader')}
              title="Formatted Reader View"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === 'reader' 
                  ? "bg-background text-foreground shadow-sm font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Reader</span>
            </button>

            <button
              onClick={() => setViewMode('editor')}
              title="VS Code IDE Editor View"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                viewMode === 'editor' 
                  ? "bg-background text-foreground shadow-sm font-bold text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>IDE Code View</span>
            </button>

            <button
              onClick={() => setViewMode('split')}
              title="Side-by-side Dual Pane View"
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer hidden md:flex",
                viewMode === 'split' 
                  ? "bg-background text-foreground shadow-sm font-bold text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split Pane</span>
            </button>
          </div>

          {/* Quick Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            className="h-8 gap-1.5 text-xs cursor-pointer"
            title="Copy entire markdown code"
          >
            {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedAll ? 'Copied' : 'Copy All'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadMd}
            className="h-8 gap-1.5 text-xs cursor-pointer"
            title="Download document as .md"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">.md</span>
          </Button>

          {onEditDoc && (
            <Button variant="secondary" size="sm" onClick={onEditDoc} className="h-8 gap-1.5 text-xs cursor-pointer font-medium">
              <Edit3 className="h-3.5 w-3.5 text-primary" />
              <span>Edit</span>
            </Button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: PURE CODE EDITOR VIEW */}
      {viewMode === 'editor' && (
        <div className="space-y-4">
          <CodeEditorView
            doc={doc}
            projectSlug={projectSlug}
          />
        </div>
      )}

      {/* VIEW MODE 2: SPLIT VIEW (Code on Left, Rendered on Right) */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Left Pane: IDE Code Editor */}
          <div className="sticky top-6">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                <span>Source Code (Markdown)</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {doc.slug}.md
              </span>
            </div>
            <CodeEditorView
              doc={doc}
              projectSlug={projectSlug}
              className="min-h-[750px] max-h-[85vh]"
            />
          </div>

          {/* Right Pane: Live Rendered Output */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm overflow-y-auto max-h-[85vh] sticky top-6">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-border/80">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                <span>Live Rendered Preview</span>
              </span>
              {doc.category && (
                <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                  {doc.category}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-6">
              {doc.title}
            </h1>

            <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:underline prose-code:font-mono prose-pre:p-0 prose-pre:bg-transparent text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <CodeBlock
                        language={match[1]}
                        code={String(children).replace(/\n$/, '')}
                      />
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs text-primary font-medium" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {doc.content || '*No content.*'}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: STANDARD FORMATTED READER VIEW */}
      {viewMode === 'reader' && (
        <>
          {/* Document Header */}
          <header className="mb-10 pb-6 border-b border-border/80 space-y-3">
            <div className="flex items-center gap-2">
              {doc.category && (
                <Badge
                  variant="secondary"
                  onClick={() => onNavigateCategory ? onNavigateCategory(doc.category!) : navigate(`/${projectSlug}/docs?category=${encodeURIComponent(doc.category!)}`)}
                  className="text-xs font-semibold px-2.5 py-0.5 uppercase tracking-wider cursor-pointer hover:bg-muted"
                >
                  {doc.category}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {doc.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <div className="flex items-center space-x-1.5 bg-muted/60 px-2.5 py-1 rounded-full border border-border/40">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">{doc.author || 'AI Assistant'}</span>
              </div>

              <div className="flex items-center space-x-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Last Updated: {formattedDate}</span>
              </div>

              {doc.tags && doc.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {doc.tags.map(t => (
                    <span key={t} className="px-1.5 py-0.2 bg-muted rounded font-mono text-[10px] text-muted-foreground">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Markdown Content */}
          <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:underline prose-code:font-mono prose-pre:p-0 prose-pre:bg-transparent leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock
                      language={match[1]}
                      code={String(children).replace(/\n$/, '')}
                    />
                  ) : (
                    <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs text-primary font-medium" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {doc.content || '*No content.*'}
            </ReactMarkdown>
          </article>
        </>
      )}

      {/* Footer Navigation: Previous / Next page */}
      <footer className="mt-16 pt-8 border-t border-border flex items-center justify-between gap-4">
        {prevDoc && onNavigateDoc ? (
          <Button
            variant="outline"
            onClick={() => onNavigateDoc(prevDoc.slug)}
            className="flex items-center space-x-2.5 text-xs text-left max-w-[240px] sm:max-w-xs truncate cursor-pointer border-amber-400/60 dark:border-amber-400/50 hover:border-amber-500 dark:hover:border-amber-300 bg-amber-50/80 dark:bg-amber-950/20 hover:bg-amber-100/90 dark:hover:bg-amber-900/30 text-foreground transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="truncate text-left">
              <span className="block text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">Previous</span>
              <span className="truncate block font-semibold text-foreground">{prevDoc.title}</span>
            </div>
          </Button>
        ) : <div />}

        {nextDoc && onNavigateDoc ? (
          <Button
            variant="outline"
            onClick={() => onNavigateDoc(nextDoc.slug)}
            className="flex items-center space-x-2.5 text-xs text-right max-w-[240px] sm:max-w-xs truncate ml-auto cursor-pointer border-amber-400/60 dark:border-amber-400/50 hover:border-amber-500 dark:hover:border-amber-300 bg-amber-50/80 dark:bg-amber-950/20 hover:bg-amber-100/90 dark:hover:bg-amber-900/30 text-foreground transition-all shadow-sm active:scale-95"
          >
            <div className="truncate text-right">
              <span className="block text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">Next</span>
              <span className="truncate block font-semibold text-foreground">{nextDoc.title}</span>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          </Button>
        ) : <div />}
      </footer>

    </div>
  );
};
