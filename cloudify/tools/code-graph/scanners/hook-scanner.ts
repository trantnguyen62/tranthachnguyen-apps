import { glob } from 'glob';
import * as path from 'path';
import { GraphNode } from '../types.js';

export async function scan(projectRoot: string): Promise<GraphNode[]> {
  const nodes: GraphNode[] = [];
  const pattern = path.join(projectRoot, 'hooks/*.ts');
  const files = await glob(pattern);

  for (const filePath of files) {
    const relative = path.relative(projectRoot, filePath);
    const filename = path.basename(filePath, '.ts');

    nodes.push({
      id: `hook:${filename}`,
      label: filename,
      type: 'hook',
      filePath: relative,
      metadata: {},
    });
  }

  return nodes;
}
