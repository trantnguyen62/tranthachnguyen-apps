import * as fs from 'fs';
import * as path from 'path';
import { GraphNode, GraphEdge } from '../types.js';

export async function analyze(nodes: GraphNode[], projectRoot: string): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];

  // Build a set of known collection node IDs for validation
  const collectionNodeIds = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'collection') {
      collectionNodeIds.add(node.id);
    }
  }

  const readRegex = /prisma\.(\w+)\.(findMany|findUnique|findFirst|count|aggregate|groupBy)/g;
  const writeRegex = /prisma\.(\w+)\.(create|update|delete|upsert|createMany|updateMany|deleteMany)/g;

  // Track unique edges: key = source|target|type
  const edgeMap = new Map<string, { edge: GraphEdge; occurrences: number }>();

  for (const node of nodes) {
    if (!node.filePath || node.type === 'collection') continue;

    const absolutePath = path.join(projectRoot, node.filePath);
    if (!fs.existsSync(absolutePath)) continue;

    const content = fs.readFileSync(absolutePath, 'utf-8');
    let match: RegExpExecArray | null;

    // Detect read operations
    while ((match = readRegex.exec(content)) !== null) {
      const modelName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      const targetId = `collection:${modelName}`;

      if (!collectionNodeIds.has(targetId)) continue;

      const key = `${node.id}|${targetId}|db_read`;
      const existing = edgeMap.get(key);
      if (existing) {
        existing.occurrences++;
      } else {
        edgeMap.set(key, {
          edge: {
            source: node.id,
            target: targetId,
            type: 'db_read',
            metadata: { operation: match[2] },
          },
          occurrences: 1,
        });
      }
    }

    // Detect write operations
    while ((match = writeRegex.exec(content)) !== null) {
      const modelName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      const targetId = `collection:${modelName}`;

      if (!collectionNodeIds.has(targetId)) continue;

      const key = `${node.id}|${targetId}|db_write`;
      const existing = edgeMap.get(key);
      if (existing) {
        existing.occurrences++;
      } else {
        edgeMap.set(key, {
          edge: {
            source: node.id,
            target: targetId,
            type: 'db_write',
            metadata: { operation: match[2] },
          },
          occurrences: 1,
        });
      }
    }
  }

  for (const { edge, occurrences } of edgeMap.values()) {
    edge.metadata = { ...edge.metadata, occurrences };
    edges.push(edge);
  }

  return edges;
}
