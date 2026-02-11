import { glob } from 'glob';
import * as path from 'path';
import { GraphNode, NodeType } from '../types.js';

const SERVICE_NAME_MAP: Record<string, string> = {
  'github-app': 'GitHub',
  'github': 'GitHub',
  'stripe': 'Stripe',
  'cloudflare': 'Cloudflare',
  'docker': 'Docker',
  'minio': 'MinIO',
  'redis': 'Redis',
};

const UTILITY_DIRS = new Set(['security', 'logging', 'monitoring']);

export async function scan(projectRoot: string): Promise<GraphNode[]> {
  const nodes: GraphNode[] = [];
  const pattern = path.join(projectRoot, 'lib/**/*.ts');
  const files = await glob(pattern);

  for (const filePath of files) {
    const relative = path.relative(projectRoot, filePath);
    // e.g. lib/auth/api-auth.ts or lib/prisma.ts
    const segments = relative.split(path.sep);
    // segments: ['lib', 'auth', 'api-auth.ts'] or ['lib', 'prisma.ts']
    const filename = path.basename(filePath, '.ts');
    const category = segments.length > 2 ? segments[1] : 'root';

    let nodeType: NodeType;
    let id: string;
    let label: string;

    if (category === 'integrations') {
      nodeType = 'external_api';
      const serviceName = SERVICE_NAME_MAP[filename] || filename.charAt(0).toUpperCase() + filename.slice(1);
      id = `external_api:${filename}`;
      label = serviceName;
    } else if (UTILITY_DIRS.has(category)) {
      nodeType = 'utility';
      id = `utility:${category}-${filename}`;
      label = `${category.charAt(0).toUpperCase() + category.slice(1)}: ${filename}`;
    } else if (relative === path.join('lib', 'prisma.ts')) {
      nodeType = 'file';
      id = `file:lib-prisma`;
      label = 'prisma';
    } else {
      nodeType = 'service';
      id = `service:${category}-${filename}`;
      label = `${category.charAt(0).toUpperCase() + category.slice(1)}: ${filename}`;
    }

    nodes.push({
      id,
      label,
      type: nodeType,
      filePath: relative,
      metadata: {
        category,
      },
    });
  }

  return nodes;
}
