export type NodeType =
  | 'endpoint'
  | 'collection'
  | 'file'
  | 'router'
  | 'script'
  | 'service'
  | 'cache_key'
  | 'utility'
  | 'webhook'
  | 'event'
  | 'external_api'
  | 'component'
  | 'hook';

export type EdgeType =
  | 'db_read'
  | 'db_write'
  | 'endpoint_handler'
  | 'imports'
  | 'api_call'
  | 'cache_read'
  | 'cache_write'
  | 'webhook_receive'
  | 'webhook_send'
  | 'event_publish';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  filePath?: string;
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  metadata?: Record<string, unknown>;
}

export interface GraphOutput {
  metadata: {
    generated: string;
    projectName: string;
    projectRoot: string;
    stats: {
      totalNodes: number;
      totalEdges: number;
      nodesByType: Record<string, number>;
      edgesByType: Record<string, number>;
    };
  };
  nodes: GraphNode[];
  links: GraphEdge[];
}

export interface ScannerConfig {
  projectRoot: string;
  outputPath: string;
}
