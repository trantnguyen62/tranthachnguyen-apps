import { glob } from 'glob';
import * as path from 'path';
import { GraphNode } from '../types.js';

export async function scan(projectRoot: string): Promise<GraphNode[]> {
  const nodes: GraphNode[] = [];
  const pattern = path.join(projectRoot, 'components/**/*.tsx');
  const files = await glob(pattern);

  for (const filePath of files) {
    const relative = path.relative(projectRoot, filePath);
    // e.g. components/dashboard/header.tsx
    const segments = relative.split(path.sep);
    // Remove 'components' prefix
    const innerSegments = segments.slice(1);
    const filename = path.basename(filePath, '.tsx');

    // Category is the parent directory under components/
    const category = innerSegments.length > 1 ? innerSegments[0] : 'root';

    nodes.push({
      id: `component:${category}-${filename}`,
      label: filename,
      type: 'component',
      filePath: relative,
      metadata: {
        category,
      },
    });
  }

  return nodes;
}
