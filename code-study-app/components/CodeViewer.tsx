import { useState, useCallback, memo, useMemo, useRef, useEffect } from 'react';
import { FileNode } from '../types';
import { Copy, Check, Code2 } from 'lucide-react';

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
        <div className="text-center text-slate-500 space-y-2">
          <Code2 className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-base font-medium text-slate-400">No file selected</p>
          <p className="text-sm">Pick a file from the sidebar to view it here</p>
          <p className="text-xs text-slate-600">Tip: select any code text to give the AI tutor specific context</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-700/50 border-b border-slate-600/50">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-300 code-font">{file.path}</span>
          <span className="text-xs px-2 py-0.5 bg-slate-600/50 rounded text-slate-400">
            {file.language}
          </span>
          <span className="text-xs text-slate-500">{lines.length} lines</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-slate-600/50 rounded transition-colors"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Code content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-4"
        onMouseUp={handleTextSelect}
        onScroll={handleScroll}
      >
        <pre className="code-font text-sm">
          <code>
            <div style={{ height: `${paddingTop}px` }} />
            {lines.slice(visibleStart, visibleEnd).map((line, i) => {
              const lineIndex = visibleStart + i;
              return (
                <div key={lineIndex} className="flex hover:bg-slate-700/30" style={{ height: `${LINE_HEIGHT}px` }}>
                  <span className="w-12 text-right pr-4 text-slate-500 select-none leading-5">
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
