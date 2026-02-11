import { glob } from 'glob';
import * as path from 'path';
import { GraphNode } from '../types.js';

export async function scan(projectRoot: string): Promise<GraphNode[]> {
  const nodes: GraphNode[] = [];
  const pattern = path.join(projectRoot, 'app/**/page.tsx');
  const files = await glob(pattern);

  for (const filePath of files) {
    const relative = path.relative(projectRoot, filePath);

    // Skip files under app/api/
    if (relative.startsWith(path.join('app', 'api'))) continue;

    const segments = relative.split(path.sep);
    // Remove 'app' at start and 'page.tsx' at end
    const routeSegments = segments.slice(1, -1);

    // Strip route groups like (dashboard), (auth)
    const filtered = routeSegments.filter(s => !s.startsWith('('));

    const routePattern = '/' + filtered
      .map(s => s.replace(/\[(\w+)\]/g, ':$1'))
      .join('/');

    const idSegments = filtered.map(s => s.replace(/\[(\w+)\]/g, '$1'));
    const idSuffix = idSegments.join('-') || 'root';

    nodes.push({
      id: `router:${idSuffix}`,
      label: routePattern,
      type: 'router',
      filePath: relative,
      metadata: {
        routePattern,
      },
    });
  }

  return nodes;
}
