import { useState, memo, useCallback } from 'react';
import { FileNode } from '../types';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

interface FileTreeProps {
  nodes: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedPath?: string;
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  onFileSelect: (file: FileNode) => void;
  selectedPath?: string;
}

// Icon colors moved outside component
const ICON_COLORS: Record<string, string> = {
  ts: 'text-blue-400',
  tsx: 'text-blue-400',
  js: 'text-yellow-400',
  jsx: 'text-yellow-400',
  json: 'text-yellow-500',
  html: 'text-orange-400',
  css: 'text-pink-400',
  md: 'text-slate-400',
  py: 'text-green-400',
  sh: 'text-green-500',
} as const;

const getFileIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ICON_COLORS[ext || ''] || 'text-slate-400';
};

const TreeNode = memo<TreeNodeProps>(({ node, depth, onFileSelect, selectedPath }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const isSelected = selectedPath === node.path;

  const handleToggle = useCallback(() => setIsExpanded(e => !e), []);
  const handleSelect = useCallback(() => onFileSelect(node), [onFileSelect, node]);

  if (node.type === 'directory') {
    return (
      <div>
        <button
          role="treeitem"
          aria-expanded={isExpanded}
          onClick={handleToggle}
          className="flex items-center gap-1 w-full px-2 py-1 hover:bg-slate-700/50 rounded text-left text-sm transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          aria-label={`${node.name} folder, ${isExpanded ? 'expanded' : 'collapsed'}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" aria-hidden="true" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-400" aria-hidden="true" />
          ) : (
            <Folder className="w-4 h-4 text-amber-400" aria-hidden="true" />
          )}
          <span className="text-slate-200 font-medium truncate">{node.name}</span>
          {!isExpanded && node.children && node.children.length > 0 && (
            <span className="ml-auto text-xs text-slate-500 bg-slate-700/60 rounded px-1.5 py-0.5 flex-shrink-0 leading-none">{node.children.length}</span>
          )}
        </button>
        {isExpanded && node.children && (
          <div role="group">
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                onFileSelect={onFileSelect}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleSelect}
      role="treeitem"
      aria-selected={isSelected}
      aria-label={`${node.name}${isSelected ? ', selected' : ''}`}
      className={`flex items-center gap-2 w-full px-2 py-1 hover:bg-slate-700/50 rounded text-left text-sm transition-colors ${
        isSelected ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : 'border-l-2 border-transparent'
      }`}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
    >
      <File className={`w-4 h-4 ${getFileIcon(node.name)}`} aria-hidden="true" />
      <span className={`truncate ${isSelected ? 'text-emerald-300 font-medium' : 'text-slate-300'}`}>{node.name}</span>
    </button>
  );
});

TreeNode.displayName = 'TreeNode';

const FileTree = memo<FileTreeProps>(({ nodes, onFileSelect, selectedPath }) => {
  if (nodes.length === 0) {
    return (
      <div className="text-center text-slate-500 py-6 space-y-2">
        <File className="w-6 h-6 mx-auto opacity-30" aria-hidden="true" />
        <p className="text-sm">No files found</p>
      </div>
    );
  }

  return (
    <div role="tree" aria-label="File tree" className="space-y-0.5">
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          onFileSelect={onFileSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
});

FileTree.displayName = 'FileTree';

export default FileTree;
