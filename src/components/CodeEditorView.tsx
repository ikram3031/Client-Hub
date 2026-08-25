import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Download, 
  WrapText, 
  Maximize2, 
  Minimize2, 
  FileText, 
  ZoomIn, 
  ZoomOut,
  Terminal,
  Search,
  Sparkles
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CodeEditorViewProps {
  doc: {
    slug: string;
    title: string;
    category?: string;
    content: string;
    lastUpdated?: string;
    author?: string;
  };
  projectSlug: string;
  className?: string;
}

export const CodeEditorView: React.FC<CodeEditorViewProps> = ({
  doc,
  projectSlug,
  className
}) => {
  const [copied, setCopied] = useState(false);
  const [isWrap, setIsWrap] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState<number>(13);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const rawContent = doc.content || '';
  const lines = rawContent.split('\n');
  const lineCount = lines.length;
  const wordCount = rawContent.trim() ? rawContent.trim().split(/\s+/).length : 0;
  const byteSize = new Blob([rawContent]).size;
  const kbSize = (byteSize / 1024).toFixed(1);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([rawContent], { type: 'text/markdown;charset=utf-8' });
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
    <div 
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col font-mono select-text",
        isFullscreen ? "fixed inset-2 z-50 rounded-xl" : "min-h-[700px] my-4",
        className
      )}
    >
      {/* VS Code Window Chrome Tab Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/95 border-b border-zinc-800 select-none shrink-0 flex-wrap gap-2">
        
        {/* Left: Window Dots & Active Tab */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 pl-1">
            <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block shadow-sm"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block shadow-sm"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block shadow-sm"></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-inner">
            <FileText className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="text-xs font-semibold text-zinc-200 truncate max-w-[240px]">
              {doc.slug ? `${doc.slug}.md` : 'document.md'}
            </span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-zinc-800 text-zinc-400 border-0">
              {doc.category || 'Markdown'}
            </Badge>
          </div>
        </div>

        {/* Right: Editor Action Controls */}
        <div className="flex items-center gap-1 text-zinc-400">
          {/* Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            title="Find in document"
            className={cn(
              "h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer",
              showSearch && "text-primary bg-primary/10"
            )}
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-3.5 w-3.5" />
          </Button>

          {/* Font Size Adjusters */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800/80 rounded-md px-1 h-7">
            <button
              onClick={() => setFontSize(s => Math.max(11, s - 1))}
              title="Decrease Font Size"
              className="p-1 hover:text-zinc-100 transition cursor-pointer text-xs"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="text-[10px] px-1 text-zinc-500 select-none">{fontSize}px</span>
            <button
              onClick={() => setFontSize(s => Math.min(20, s + 1))}
              title="Increase Font Size"
              className="p-1 hover:text-zinc-100 transition cursor-pointer text-xs"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
          </div>

          {/* Word Wrap */}
          <Button
            variant="ghost"
            size="icon"
            title={isWrap ? "Disable Word Wrap" : "Enable Word Wrap"}
            className={cn(
              "h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer",
              isWrap && "text-primary bg-primary/10 hover:bg-primary/20"
            )}
            onClick={() => setIsWrap(!isWrap)}
          >
            <WrapText className="h-3.5 w-3.5" />
          </Button>

          {/* Download Raw File */}
          <Button
            variant="ghost"
            size="icon"
            title="Download .md File"
            className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>

          {/* Copy Full Code */}
          <Button
            variant="secondary"
            size="sm"
            className={cn(
              "h-7 px-3 gap-1.5 text-xs font-mono font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-100 transition-all cursor-pointer ml-1",
              copied && "text-emerald-400 bg-emerald-950/80 border border-emerald-700"
            )}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="text-[11px]">Copy All</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Inline Search Bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs shrink-0">
          <Search className="h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search text in document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-zinc-200 placeholder:text-zinc-600 focus:outline-none flex-1 text-xs font-mono"
            autoFocus
          />
          {searchQuery && (
            <span className="text-[10px] text-zinc-500">
              {rawContent.toLowerCase().split(searchQuery.toLowerCase()).length - 1} matches
            </span>
          )}
          <button 
            onClick={() => { setSearchQuery(''); setShowSearch(false); }}
            className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Code Editor Body */}
      <div 
        className={cn(
          "flex-1 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-zinc-950",
          isWrap && "whitespace-pre-wrap break-words"
        )}
      >
        <SyntaxHighlighter
          language="markdown"
          style={vscDarkPlus}
          showLineNumbers={true}
          wrapLines={isWrap}
          wrapLongLines={isWrap}
          lineNumberStyle={{
            minWidth: '3.2rem',
            paddingRight: '1.2rem',
            color: '#475569',
            fontSize: `${fontSize - 2}px`,
            userSelect: 'none',
            textAlign: 'right',
            borderRight: '1px solid #27272a',
            marginRight: '0.75rem',
          }}
          customStyle={{
            margin: 0,
            padding: '1.25rem 1rem 1.25rem 0.5rem',
            background: 'transparent',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: `${fontSize}px`,
            lineHeight: '1.65',
          }}
          PreTag="div"
        >
          {rawContent}
        </SyntaxHighlighter>
      </div>

      {/* VS Code Style Status Bar Footer */}
      <div className="flex items-center justify-between px-3 py-1 bg-zinc-900 border-t border-zinc-800 text-[11px] text-zinc-400 font-mono select-none shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Terminal className="h-3 w-3 text-primary" />
            <span>{projectSlug}</span>
          </span>
          <span className="text-zinc-600">•</span>
          <span>{lineCount} lines</span>
          <span className="text-zinc-600">•</span>
          <span>{wordCount} words</span>
          <span className="text-zinc-600">•</span>
          <span>{kbSize} KB</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-500">UTF-8</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-300">Markdown (GFM)</span>
          <span className="text-zinc-600">•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>Live Sync</span>
          </span>
        </div>
      </div>
    </div>
  );
};
