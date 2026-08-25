import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, User, Edit3, Clock, Tag } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router';

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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-background text-foreground">
      
      {/* Functional Clickable Breadcrumbs & Actions Bar */}
      <div className="flex items-center justify-between gap-4 mb-8">
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

        {onEditDoc && (
          <Button variant="outline" size="sm" onClick={onEditDoc} className="h-8 gap-1.5 text-xs cursor-pointer">
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Document</span>
          </Button>
        )}
      </div>

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
      <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:underline prose-code:font-mono prose-pre:p-0 prose-pre:bg-transparent">
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
