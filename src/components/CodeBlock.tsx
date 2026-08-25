import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Maximize2, 
  Minimize2, 
  WrapText, 
  Download, 
  FileCode2, 
  Terminal, 
  FileJson, 
  FileText, 
  Braces, 
  Code2
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  language: string;
  code: string;
  filename?: string;
  showLineNumbers?: boolean;
}

const getLanguageIcon = (lang: string) => {
  const l = (lang || '').toLowerCase();
  if (['bash', 'sh', 'zsh', 'shell', 'terminal', 'powershell', 'cmd'].includes(l)) {
    return <Terminal className="h-3.5 w-3.5 text-emerald-400" />;
  }
  if (['json', 'json5'].includes(l)) {
    return <FileJson className="h-3.5 w-3.5 text-amber-400" />;
  }
  if (['javascript', 'js', 'jsx', 'ts', 'typescript', 'tsx'].includes(l)) {
    return <FileCode2 className="h-3.5 w-3.5 text-cyan-400" />;
  }
  if (['html', 'xml', 'svg'].includes(l)) {
    return <Code2 className="h-3.5 w-3.5 text-orange-400" />;
  }
  if (['css', 'scss', 'less', 'tailwind'].includes(l)) {
    return <Braces className="h-3.5 w-3.5 text-pink-400" />;
  }
  if (['markdown', 'md'].includes(l)) {
    return <FileText className="h-3.5 w-3.5 text-blue-400" />;
  }
  return <FileCode2 className="h-3.5 w-3.5 text-purple-400" />;
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ 
  language, 
  code, 
  filename,
  showLineNumbers = true 
}) => {
  const [copied, setCopied] = useState(false);
  const [isWrap, setIsWrap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const cleanLang = (language || 'text').toLowerCase();
  const lineCount = (code || '').split('\n').length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `snippet.${cleanLang === 'typescript' ? 'ts' : cleanLang === 'javascript' ? 'js' : cleanLang === 'json' ? 'json' : cleanLang === 'bash' ? 'sh' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div 
        className={cn(
          "relative my-6 rounded-xl bg-zinc-950/95 backdrop-blur shadow-2xl border border-zinc-800/80 overflow-hidden transition-all group font-mono",
          isFullscreen && "fixed inset-4 z-50 my-0 shadow-2xl border-zinc-700 flex flex-col bg-zinc-950"
        )}
      >
        {/* Editor Chrome Window Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/90 border-b border-zinc-800/90 select-none shrink-0">
          
          {/* Left: macOS Traffic Lights + Tab Name */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 pl-1 opacity-75 group-hover:opacity-100 transition-opacity">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-950/70 border border-zinc-800/80 text-xs font-mono text-zinc-300">
              {getLanguageIcon(cleanLang)}
              <span className="font-semibold tracking-wide text-zinc-200">
                {filename || cleanLang}
              </span>
              <span className="text-[10px] text-zinc-500 font-sans ml-1">
                ({lineCount} {lineCount === 1 ? 'line' : 'lines'})
              </span>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title={isWrap ? "Disable Word Wrap" : "Enable Word Wrap"}
              className={cn(
                "h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition cursor-pointer",
                isWrap && "text-primary bg-primary/10 hover:bg-primary/20"
              )}
              onClick={() => setIsWrap(!isWrap)}
            >
              <WrapText className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              title="Download Snippet"
              className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition cursor-pointer"
              onClick={handleDownload}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
              className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition cursor-pointer"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className={cn(
                "h-7 px-2.5 gap-1.5 text-xs font-mono font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700/80 hover:text-zinc-100 transition-all cursor-pointer",
                copied && "text-emerald-400 bg-emerald-950/60 border border-emerald-800/80"
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
                  <span className="text-[11px]">Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Code Content Container */}
        <div 
          className={cn(
            "overflow-x-auto text-[13px] leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent",
            isWrap && "whitespace-pre-wrap break-words",
            isFullscreen && "flex-1 overflow-y-auto p-2"
          )}
        >
          <SyntaxHighlighter
            language={cleanLang}
            style={vscDarkPlus}
            showLineNumbers={showLineNumbers}
            wrapLines={isWrap}
            wrapLongLines={isWrap}
            lineNumberStyle={{
              minWidth: '2.5rem',
              paddingRight: '1rem',
              color: '#52525b',
              fontSize: '11px',
              userSelect: 'none',
              textAlign: 'right',
            }}
            customStyle={{
              margin: 0,
              padding: '1rem 1rem 1rem 0.5rem',
              background: 'transparent',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
            PreTag="div"
          >
            {code}
          </SyntaxHighlighter>
        </div>

        {/* Status Bar Footer (in Fullscreen mode) */}
        {isFullscreen && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-t border-zinc-800 text-[11px] text-zinc-500 font-mono select-none">
            <span>{cleanLang.toUpperCase()}</span>
            <span>{lineCount} lines • {new Blob([code]).size} bytes</span>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setIsFullscreen(false)} 
              className="h-auto p-0 text-[11px] text-zinc-400 hover:text-white"
            >
              Press to Close ✕
            </Button>
          </div>
        )}
      </div>

      {/* Backdrop overlay for fullscreen */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
};
