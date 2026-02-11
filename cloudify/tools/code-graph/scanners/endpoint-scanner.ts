import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { GraphNode } from '../types.js';

export async function scan(projectRoot: string): Promise<GraphNode[]> {
  const nodes: GraphNode[] = [];
  const pattern = path.join(projectRoot, 'app/api/**/route.ts');
  const files = await glob(pattern);

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const methodRegex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/g;
    const methods: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1]);
    }

    if (methods.length === 0) continue;

    const relative = path.relative(projectRoot, filePath);
    // e.g. app/api/deployments/[id]/logs/route.ts
    const segments = relative.split(path.sep);
    // Remove 'app' at start and 'route.ts' at end
    const routeSegments = segments.slice(1, -1); // ['api', 'deployments', '[id]', 'logs']

    const routePattern = '/' + routeSegments
      .map(s => s.replace(/\[(\w+)\]/g, ':$1'))
      .join('/');

    // kebab: skip 'app' and 'route.ts', join remaining with '-'
    const idSegments = routeSegments.map(s => s.replace(/\[(\w+)\]/g, '$1'));
    const idSuffix = idSegments.join('-');

    const isWebhook = relative.includes(path.join('app', 'api', 'webhooks'));
    const nodeType = isWebhook ? 'webhook' : 'endpoint';

    nodes.push({
      id: `endpoint:${idSuffix}`,
      label: `${methods.join(',')} ${routePattern}`,
      type: nodeType,
      filePath: relative,
      metadata: {
        methods,
        routePattern,
      },
    });
  }

  return nodes;
}
