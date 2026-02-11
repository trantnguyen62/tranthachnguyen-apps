import * as fs from 'fs';
import * as path from 'path';
import { GraphNode, GraphEdge } from '../types.js';

export async function analyze(nodes: GraphNode[], projectRoot: string): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];

  // Build lookup maps for target nodes
  const nodeById = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeById.set(node.id, node);
  }

  const activityCreateRegex = /prisma\.activity\.create/g;
  const eventTypeRegex = /type:\s*["'](\w+)["']/;
  const webhookSendRegex = /send(?:Slack|Discord|Webhook|Email)Notification/g;

  for (const node of nodes) {
    if (!node.filePath) continue;

    const absolutePath = path.join(projectRoot, node.filePath);
    if (!fs.existsSync(absolutePath)) continue;

    const content = fs.readFileSync(absolutePath, 'utf-8');

    // Detect activity/event publishing
    let match: RegExpExecArray | null;
    while ((match = activityCreateRegex.exec(content)) !== null) {
      // Try to extract event type from nearby context (within ~200 chars after match)
      const contextStart = match.index;
      const contextEnd = Math.min(content.length, contextStart + 300);
      const nearbyContent = content.slice(contextStart, contextEnd);

      const typeMatch = eventTypeRegex.exec(nearbyContent);
      const eventType = typeMatch ? typeMatch[1] : 'activity';
      const targetId = `event:${eventType}`;

      // Only create edge if target node exists, otherwise use generic activity
      const finalTargetId = nodeById.has(targetId) ? targetId : 'event:activity';

      edges.push({
        source: node.id,
        target: finalTargetId,
        type: 'event_publish',
        metadata: { eventType },
      });
    }
    activityCreateRegex.lastIndex = 0;

    // Detect webhook/notification sends
    while ((match = webhookSendRegex.exec(content)) !== null) {
      const functionName = match[0];
      // Determine target based on function name
      let targetId: string;

      if (functionName.includes('Slack')) {
        targetId = 'external_api:slack';
      } else if (functionName.includes('Discord')) {
        targetId = 'external_api:discord';
      } else if (functionName.includes('Email')) {
        targetId = 'external_api:email';
      } else {
        targetId = 'webhook:outgoing';
      }

      // Only create edge if target node exists
      if (!nodeById.has(targetId)) continue;

      edges.push({
        source: node.id,
        target: targetId,
        type: 'webhook_send',
        metadata: { notificationType: functionName },
      });
    }
    webhookSendRegex.lastIndex = 0;
  }

  return edges;
}
