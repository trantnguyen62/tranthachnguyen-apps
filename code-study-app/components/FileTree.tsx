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
          onClick={handleToggle}
          className="flex items-center gap-1 w-full px-2 py-1 hover:bg-slate-700/50 rounded text-left text-sm"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-400" />
          ) : (
            <Folder className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-slate-300 truncate">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div>
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
      className={`flex items-center gap-2 w-full px-2 py-1 hover:bg-slate-700/50 rounded text-left text-sm ${
        isSelected ? 'bg-slate-700/70 text-white' : ''
      }`}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
    >
      <File className={`w-4 h-4 ${getFileIcon(node.name)}`} />
      <span className="text-slate-300 truncate">{node.name}</span>
    </button>
  );
});

TreeNode.displayName = 'TreeNode';

const FileTree = memo<FileTreeProps>(({ nodes, onFileSelect, selectedPath }) => {
  if (nodes.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-4">
        No files found
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
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
