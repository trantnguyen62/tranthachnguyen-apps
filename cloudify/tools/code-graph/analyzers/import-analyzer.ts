import * as fs from 'fs';
import * as path from 'path';
import { GraphNode, GraphEdge } from '../types.js';

export async function analyze(nodes: GraphNode[], projectRoot: string): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];

  // Build a map of filePath → nodeId for fast lookups
  const filePathToNodeId = new Map<string, string>();
  for (const node of nodes) {
    if (node.filePath) {
      filePathToNodeId.set(node.filePath, node.id);
    }
  }

  // Build a map of nodeId → node for type lookups
  const nodeById = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeById.set(node.id, node);
  }

  const importRegex = /import\s+.*?\s+from\s+['"](@\/[^'"]+|\.\.?\/[^'"]+)['"]/g;

  for (const node of nodes) {
    if (!node.filePath) continue;

    const absolutePath = path.join(projectRoot, node.filePath);
    if (!fs.existsSync(absolutePath)) continue;

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const fileDir = path.dirname(node.filePath);
    let match: RegExpExecArray | null;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      let resolvedPath: string;

      if (importPath.startsWith('@/')) {
        // @/ maps to project root
        resolvedPath = importPath.slice(2);
      } else {
        // Relative import
        resolvedPath = path.normalize(path.join(fileDir, importPath));
      }

      // Try to find matching node with various extensions
      const candidates = [
        resolvedPath,
        resolvedPath + '.ts',
        resolvedPath + '.tsx',
        path.join(resolvedPath, 'index.ts'),
        path.join(resolvedPath, 'index.tsx'),
      ];

      let targetNodeId: string | undefined;
      for (const candidate of candidates) {
        const normalized = candidate.replace(/\\/g, '/');
        if (filePathToNodeId.has(normalized)) {
          targetNodeId = filePathToNodeId.get(normalized);
          break;
        }
      }

      if (!targetNodeId || targetNodeId === node.id) continue;

      const sourceNode = node;
      const targetNode = nodeById.get(targetNodeId);
      if (!targetNode) continue;

      // Determine edge type
      const sourceIsHandler = sourceNode.type === 'endpoint' || sourceNode.type === 'webhook';
      const targetIsImpl = targetNode.type === 'service' || targetNode.type === 'utility' || targetNode.type === 'file';
      const edgeType = sourceIsHandler && targetIsImpl ? 'endpoint_handler' : 'imports';

      edges.push({
        source: node.id,
        target: targetNodeId,
        type: edgeType,
        metadata: { importPath: match[1] },
      });
    }
  }

  return edges;
}
