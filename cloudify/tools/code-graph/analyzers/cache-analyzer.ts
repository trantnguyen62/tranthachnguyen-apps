import * as fs from 'fs';
import * as path from 'path';
import { GraphNode, GraphEdge } from '../types.js';

export async function analyze(nodes: GraphNode[], projectRoot: string): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];

  // Build a set of cache_key node IDs
  const cacheNodeIds = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'cache_key') {
      cacheNodeIds.add(node.id);
    }
  }

  const defaultCacheTarget = 'cache_key:kv';

  const readRegex = /(?:redis|cache|kv)\.(?:get|mget|hget|hgetall)/gi;
  const readHelperRegex = /kvGet/g;
  const writeRegex = /(?:redis|cache|kv)\.(?:set|mset|hset|del|expire)/gi;
  const writeHelperRegex = /kvSet|kvDelete/g;

  // Regex to detect key prefix from nearby context
  const keyPrefixRegex = /['"](\w+)[:_]/g;

  for (const node of nodes) {
    if (!node.filePath) continue;

    const absolutePath = path.join(projectRoot, node.filePath);
    if (!fs.existsSync(absolutePath)) continue;

    const content = fs.readFileSync(absolutePath, 'utf-8');

    let hasRead = false;
    let hasWrite = false;

    if (readRegex.test(content) || readHelperRegex.test(content)) {
      hasRead = true;
    }

    // Reset lastIndex after test()
    readRegex.lastIndex = 0;
    readHelperRegex.lastIndex = 0;

    if (writeRegex.test(content) || writeHelperRegex.test(content)) {
      hasWrite = true;
    }

    writeRegex.lastIndex = 0;
    writeHelperRegex.lastIndex = 0;

    if (!hasRead && !hasWrite) continue;

    // Try to detect a specific cache key node from context
    let targetId = defaultCacheTarget;
    let match: RegExpExecArray | null;
    while ((match = keyPrefixRegex.exec(content)) !== null) {
      const candidateId = `cache_key:${match[1]}`;
      if (cacheNodeIds.has(candidateId)) {
        targetId = candidateId;
        break;
      }
    }
    keyPrefixRegex.lastIndex = 0;

    // Fall back to default if target doesn't exist
    if (!cacheNodeIds.has(targetId)) {
      targetId = defaultCacheTarget;
    }

    if (hasRead) {
      edges.push({
        source: node.id,
        target: targetId,
        type: 'cache_read',
      });
    }

    if (hasWrite) {
      edges.push({
        source: node.id,
        target: targetId,
        type: 'cache_write',
      });
    }
  }

  return edges;
}
