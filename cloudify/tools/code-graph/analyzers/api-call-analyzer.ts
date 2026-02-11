import * as fs from 'fs';
import * as path from 'path';
import { GraphNode, GraphEdge } from '../types.js';

export async function analyze(nodes: GraphNode[], projectRoot: string): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];

  // Build a set of endpoint node IDs for matching
  const endpointNodeIds = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'endpoint') {
      endpointNodeIds.add(node.id);
    }
  }

  const fetchStringRegex = /fetch\s*\(\s*['"`]\/api\/([^'"`]+)['"`]/g;
  const fetchTemplateRegex = /fetch\s*\(\s*`\/api\/([^`]+)`/g;

  for (const node of nodes) {
    if (!node.filePath) continue;
    // Focus on hook and component nodes where fetch calls happen
    if (node.type !== 'hook' && node.type !== 'component') continue;

    const absolutePath = path.join(projectRoot, node.filePath);
    if (!fs.existsSync(absolutePath)) continue;

    const content = fs.readFileSync(absolutePath, 'utf-8');
    let match: RegExpExecArray | null;

    const apiPaths = new Set<string>();

    // Match string literal fetches
    while ((match = fetchStringRegex.exec(content)) !== null) {
      apiPaths.add(match[1]);
    }

    // Match template literal fetches
    while ((match = fetchTemplateRegex.exec(content)) !== null) {
      apiPaths.add(match[1]);
    }

    for (const apiPath of apiPaths) {
      // Replace template expressions ${...} with :param
      const normalizedPath = apiPath.replace(/\$\{[^}]+\}/g, ':param');

      // Build the endpoint ID: api-path-segments with params normalized
      const segments = normalizedPath.split('/');
      const idSegments = segments.map(s =>
        s.startsWith(':') ? s.slice(1) : s
      );
      const targetId = `endpoint:api-${idSegments.join('-')}`;

      if (!endpointNodeIds.has(targetId)) continue;

      edges.push({
        source: node.id,
        target: targetId,
        type: 'api_call',
        metadata: { apiPath: `/api/${normalizedPath}` },
      });
    }
  }

  return edges;
}
