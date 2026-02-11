import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { GraphNode } from '../types.js';

export async function scan(projectRoot: string): Promise<GraphNode[]> {
  const pattern = path.join(projectRoot, '**/*.ts');
  const files = await glob(pattern, { ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'] });

  const eventTypes = new Set<string>();

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Look for prisma.activity.create patterns
    if (!content.includes('activity.create')) continue;

    // Find type: "..." within activity.create calls
    const typeRegex = /type:\s*["'](\w+)["']/g;
    let match: RegExpExecArray | null;

    while ((match = typeRegex.exec(content)) !== null) {
      eventTypes.add(match[1]);
    }
  }

  return Array.from(eventTypes).sort().map(eventType => ({
    id: `event:${eventType}`,
    label: `Event: ${eventType}`,
    type: 'event' as const,
    metadata: {
      eventType,
    },
  }));
}
