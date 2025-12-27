import { useState, useCallback, memo, useMemo } from 'react';
import { FileNode } from '../types';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  file: FileNode | null;
  onCodeSelect?: (code: string) => void;
}

const CodeViewer = memo<CodeViewerProps>(({ file, onCodeSelect }) => {
  const [copied, setCopied] = useState(false);

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

  const lines = useMemo(() => file?.content?.split('\n') || [], [file?.content]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-800/50 rounded-lg">
        <div className="text-center text-slate-500">
          <p className="text-lg mb-2">Select a file to view</p>
          <p className="text-sm">Browse the file tree on the left</p>
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
        className="flex-1 overflow-auto p-4"
        onMouseUp={handleTextSelect}
      >
        <pre className="code-font text-sm">
          <code>
            {lines.map((line, index) => (
              <div key={index} className="flex hover:bg-slate-700/30">
                <span className="w-12 text-right pr-4 text-slate-500 select-none">
                  {index + 1}
                </span>
                <span className="text-slate-300 whitespace-pre">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
});

CodeViewer.displayName = 'CodeViewer';

export default CodeViewer;
