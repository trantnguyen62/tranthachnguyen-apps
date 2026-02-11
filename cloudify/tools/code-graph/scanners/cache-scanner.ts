import { GraphNode } from '../types.js';

const CACHE_NAMESPACES = [
  { key: 'kv', label: 'KV Store', prefix: 'kv:' },
  { key: 'kv_meta', label: 'KV Metadata', prefix: 'kv_meta:' },
  { key: 'cache', label: 'Cache', prefix: 'cache:' },
  { key: 'session', label: 'Session Cache', prefix: 'session:' },
  { key: 'rate', label: 'Rate Limiter', prefix: 'rate:' },
];

export async function scan(_projectRoot: string): Promise<GraphNode[]> {
  return CACHE_NAMESPACES.map(ns => ({
    id: `cache_key:${ns.key}`,
    label: `${ns.label} (${ns.prefix}*)`,
    type: 'cache_key' as const,
    metadata: {
      prefix: ns.prefix,
    },
  }));
}
