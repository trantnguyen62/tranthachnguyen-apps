#!/usr/bin/env tsx
import * as fs from 'fs';
import * as path from 'path';
import { GraphNode, GraphEdge, GraphOutput } from './types.js';

// Scanners
import { scan as scanEndpoints } from './scanners/endpoint-scanner.js';
import { scan as scanCollections } from './scanners/collection-scanner.js';
import { scan as scanPages } from './scanners/page-scanner.js';
import { scan as scanComponents } from './scanners/component-scanner.js';
import { scan as scanHooks } from './scanners/hook-scanner.js';
import { scan as scanLib } from './scanners/lib-scanner.js';
import { scan as scanCache } from './scanners/cache-scanner.js';
import { scan as scanEvents } from './scanners/event-scanner.js';

// Analyzers
import { analyze as analyzeImports } from './analyzers/import-analyzer.js';
import { analyze as analyzePrisma } from './analyzers/prisma-analyzer.js';
import { analyze as analyzeApiCalls } from './analyzers/api-call-analyzer.js';
import { analyze as analyzeCache } from './analyzers/cache-analyzer.js';
import { analyze as analyzeEvents } from './analyzers/event-analyzer.js';

function parseArgs(): { root: string; output: string } {
  const args = process.argv.slice(2);
  let root = process.cwd();
  let output = 'code_graph.json';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--root' && args[i + 1]) {
      root = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      output = args[i + 1];
      i++;
    }
  }

  return { root, output };
}

function deduplicateEdges(edges: GraphEdge[]): GraphEdge[] {
  const seen = new Map<string, GraphEdge>();

  for (const edge of edges) {
    const key = `${edge.source}|${edge.target}|${edge.type}`;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      const occurrences = ((existing.metadata?.occurrences as number) || 1) + 1;
      existing.metadata = { ...existing.metadata, occurrences };
    } else {
      seen.set(key, { ...edge, metadata: { ...edge.metadata, occurrences: 1 } });
    }
  }

  return Array.from(seen.values());
}

function countByType<T extends { type: string }>(items: T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.type] = (counts[item.type] || 0) + 1;
  }
  return counts;
}

async function main() {
  const { root, output } = parseArgs();
  const startTime = Date.now();

  console.log(`\n  Code Graph Generator`);
  console.log(`  Project root: ${root}`);
  console.log(`  Output: ${output}\n`);

  // Phase 1: Scan nodes
  console.log('  Phase 1: Scanning nodes...');

  const scanners = [
    { name: 'endpoints', fn: scanEndpoints },
    { name: 'collections', fn: scanCollections },
    { name: 'pages', fn: scanPages },
    { name: 'components', fn: scanComponents },
    { name: 'hooks', fn: scanHooks },
    { name: 'lib modules', fn: scanLib },
    { name: 'cache keys', fn: scanCache },
    { name: 'events', fn: scanEvents },
  ];

  const allNodes: GraphNode[] = [];

  for (const scanner of scanners) {
    try {
      const nodes = await scanner.fn(root);
      allNodes.push(...nodes);
      console.log(`    ${scanner.name}: ${nodes.length} nodes`);
    } catch (err) {
      console.error(`    ${scanner.name}: ERROR - ${(err as Error).message}`);
    }
  }

  console.log(`  Total nodes: ${allNodes.length}\n`);

  // Phase 2: Analyze edges
  console.log('  Phase 2: Analyzing edges...');

  const analyzers = [
    { name: 'imports', fn: analyzeImports },
    { name: 'prisma ops', fn: analyzePrisma },
    { name: 'api calls', fn: analyzeApiCalls },
    { name: 'cache ops', fn: analyzeCache },
    { name: 'events', fn: analyzeEvents },
  ];

  const allEdges: GraphEdge[] = [];

  for (const analyzer of analyzers) {
    try {
      const edges = await analyzer.fn(allNodes, root);
      allEdges.push(...edges);
      console.log(`    ${analyzer.name}: ${edges.length} edges`);
    } catch (err) {
      console.error(`    ${analyzer.name}: ERROR - ${(err as Error).message}`);
    }
  }

  // Phase 3: Deduplicate
  const dedupedEdges = deduplicateEdges(allEdges);
  console.log(`\n  Total edges: ${allEdges.length} (${dedupedEdges.length} after dedup)\n`);

  // Phase 4: Build output
  const nodesByType = countByType(allNodes);
  const edgesByType = countByType(dedupedEdges);

  const graphOutput: GraphOutput = {
    metadata: {
      generated: new Date().toISOString(),
      projectName: path.basename(root),
      projectRoot: root,
      stats: {
        totalNodes: allNodes.length,
        totalEdges: dedupedEdges.length,
        nodesByType,
        edgesByType,
      },
    },
    nodes: allNodes,
    links: dedupedEdges,
  };

  // Write output
  const outputPath = path.resolve(output);
  fs.writeFileSync(outputPath, JSON.stringify(graphOutput, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Time: ${elapsed}s\n`);

  // Summary table
  console.log('  Node breakdown:');
  for (const [type, count] of Object.entries(nodesByType).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${type.padEnd(15)} ${count}`);
  }

  console.log('\n  Edge breakdown:');
  for (const [type, count] of Object.entries(edgesByType).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${type.padEnd(20)} ${count}`);
  }

  console.log('\n  Done!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
