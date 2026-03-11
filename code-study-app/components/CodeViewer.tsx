import { useState, useCallback, memo, useMemo, useRef, useEffect } from 'react';
import { FileNode } from '../types';
import { Copy, Check, Code2 } from 'lucide-react';

const LANG_COLORS: Record<string, string> = {
  typescript: 'bg-blue-500/20 text-blue-400',
  javascript: 'bg-yellow-500/20 text-yellow-400',
  python: 'bg-green-500/20 text-green-400',
  html: 'bg-orange-500/20 text-orange-400',
  css: 'bg-pink-500/20 text-pink-400',
  json: 'bg-amber-500/20 text-amber-400',
  markdown: 'bg-slate-500/30 text-slate-300',
  shell: 'bg-green-500/20 text-green-400',
  yaml: 'bg-purple-500/20 text-purple-400',
  rust: 'bg-orange-600/20 text-orange-400',
  go: 'bg-cyan-500/20 text-cyan-400',
};

interface CodeViewerProps {
  file: FileNode | null;
  onCodeSelect?: (code: string) => void;
}

const LINE_HEIGHT = 20; // px — matches text-sm line-height (1.25rem)
const BUFFER = 15;      // extra lines rendered above/below viewport

const CodeViewer = memo<CodeViewerProps>(({ file, onCodeSelect }) => {
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  const lines = useMemo(() => file?.content?.split('\n') || [], [file?.content]);

  // Reset scroll and measure viewport when file changes
  useEffect(() => {
    setScrollTop(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      setViewportHeight(scrollRef.current.clientHeight);
    }
  }, [file?.path]);

  // Track viewport height changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [file]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleCopy = useCallback(async () => {
    if (file?.content) {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [file?.content]);

  const handleTextSelect = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() && onCodeSelect) {
      onCodeSelect(selection.toString());
    }
  }, [onCodeSelect]);

  // Virtual window — only render lines visible in the viewport + buffer
  const visibleStart = Math.max(0, Math.floor(scrollTop / LINE_HEIGHT) - BUFFER);
  const visibleEnd = Math.min(lines.length, Math.ceil((scrollTop + viewportHeight) / LINE_HEIGHT) + BUFFER);
  const paddingTop = visibleStart * LINE_HEIGHT;
  const paddingBottom = Math.max(0, (lines.length - visibleEnd) * LINE_HEIGHT);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-800/50 rounded-lg">
        <div className="text-center text-slate-500 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto">
            <Code2 className="w-8 h-8 opacity-30" />
          </div>
          <div>
            <p className="text-base font-medium text-slate-400">No file selected</p>
            <p className="text-sm mt-1">Pick a file from the sidebar to view it here</p>
          </div>
          <p className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 inline-block">
            Tip: highlight any code to add it as context before starting a session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-700/50 border-b border-slate-600/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="code-font text-sm min-w-0 flex items-baseline gap-0">
            {file.path.includes('/') && (
              <span className="text-slate-500 text-xs truncate hidden sm:inline">
                {file.path.split('/').slice(0, -1).join('/')}/
              </span>
            )}
            <span className="text-slate-200 font-medium flex-shrink-0">{file.name}</span>
          </span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${LANG_COLORS[file.language] || 'bg-slate-600/50 text-slate-400'}`}>
            {file.language}
          </span>
          <span className="text-xs text-slate-500 flex-shrink-0">{lines.length.toLocaleString()} lines</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-slate-600/50 rounded transition-colors"
          title={copied ? 'Copied!' : 'Copy code'}
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" aria-hidden="true" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Code content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-4"
        onMouseUp={handleTextSelect}
        onScroll={handleScroll}
        aria-label={`Code content for ${file.path}`}
        role="region"
        tabIndex={0}
      >
        <pre className="code-font text-sm">
          <code>
            <div style={{ height: `${paddingTop}px` }} />
            {lines.slice(visibleStart, visibleEnd).map((line, i) => {
              const lineIndex = visibleStart + i;
              const lineNumWidth = lines.length >= 10000 ? 'w-16' : lines.length >= 1000 ? 'w-14' : 'w-10';
              return (
                <div key={lineIndex} className="flex hover:bg-slate-700/40 group" style={{ height: `${LINE_HEIGHT}px` }}>
                  <span className={`${lineNumWidth} text-right pr-3 text-slate-600 group-hover:text-slate-500 select-none leading-5 flex-shrink-0`} aria-hidden="true">
                    {lineIndex + 1}
                  </span>
                  <span className="text-slate-300 whitespace-pre leading-5">{line || ' '}</span>
                </div>
              );
            })}
            <div style={{ height: `${paddingBottom}px` }} />
          </code>
        </pre>
      </div>
    </div>
  );
});

CodeViewer.displayName = 'CodeViewer';

export default CodeViewer;
