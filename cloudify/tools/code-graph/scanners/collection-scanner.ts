import * as fs from 'fs';
import * as path from 'path';
import { GraphNode } from '../types.js';

export async function scan(projectRoot: string): Promise<GraphNode[]> {
  const nodes: GraphNode[] = [];
  const schemaPath = path.join(projectRoot, 'prisma/schema.prisma');

  if (!fs.existsSync(schemaPath)) return nodes;

  const content = fs.readFileSync(schemaPath, 'utf-8');
  const modelRegex = /^model\s+(\w+)\s*\{([^}]*)}/gm;
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const body = match[2];
    const fields = body.split('\n').filter(line => line.trim().length > 0);
    const fieldCount = fields.length;

    const relations: string[] = [];
    const relationRegex = /@relation\(/g;
    for (const field of fields) {
      if (relationRegex.test(field)) {
        // Extract the type from the field line: e.g. "  project Project @relation(...)"
        const typeMatch = field.trim().match(/^\w+\s+(\w+)/);
        if (typeMatch) {
          relations.push(typeMatch[1]);
        }
      }
      relationRegex.lastIndex = 0;
    }

    nodes.push({
      id: `collection:${modelName}`,
      label: modelName,
      type: 'collection',
      filePath: path.relative(projectRoot, schemaPath),
      metadata: {
        fieldCount,
        relations,
      },
    });
  }

  return nodes;
}
