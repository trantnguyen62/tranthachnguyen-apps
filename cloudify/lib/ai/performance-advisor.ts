/**
 * AI Performance Advisor
 *
 * Analyzes Web Vitals and provides AI-powered performance recommendations
 */

import { prisma } from "@/lib/prisma";
import { analyzeWithPrompt, parseAIJson, isAIAvailable } from "./client";
import { PERFORMANCE_RECOMMENDATION_PROMPT } from "./prompts";

export interface WebVitals {
  lcp?: number; // Largest Contentful Paint (ms)
  fid?: number; // First Input Delay (ms)
  cls?: number; // Cumulative Layout Shift (score)
  ttfb?: number; // Time to First Byte (ms)
  fcp?: number; // First Contentful Paint (ms)
  inp?: number; // Interaction to Next Paint (ms)
}

export interface PerformanceRecommendation {
  category: "lcp" | "fid" | "cls" | "ttfb" | "fcp" | "inp" | "bundle" | "general";
  severity: "low" | "medium" | "high" | "critical";
  issue: string;
  suggestion: string;
  codeExample?: string;
  impact: string;
  estimatedImprovement?: string;
}

export interface PerformanceAnalysis {
  overallScore: number;
  summary: string;
  criticalIssues: Array<{
    metric: string;
    currentValue: number;
    targetValue: number;
    issue: string;
    solution: string;
    expectedImprovement: string;
  }>;
  quickWins: string[];
  longTermImprovements: string[];
}

/**
 * Calculate performance score from Web Vitals
 */
export function calculatePerformanceScore(vitals: WebVitals): number {
  let score = 100;
  let factorsCount = 0;

  // LCP scoring (target: < 2500ms)
  if (vitals.lcp !== undefined) {
    factorsCount++;
    if (vitals.lcp > 4000) score -= 25;
    else if (vitals.lcp > 2500) score -= 15;
    else if (vitals.lcp > 1800) score -= 5;
  }

  // FID scoring (target: < 100ms)
  if (vitals.fid !== undefined) {
    factorsCount++;
    if (vitals.fid > 300) score -= 25;
    else if (vitals.fid > 100) score -= 15;
    else if (vitals.fid > 50) score -= 5;
  }

  // CLS scoring (target: < 0.1)
  if (vitals.cls !== undefined) {
    factorsCount++;
    if (vitals.cls > 0.25) score -= 25;
    else if (vitals.cls > 0.1) score -= 15;
    else if (vitals.cls > 0.05) score -= 5;
  }

  // TTFB scoring (target: < 800ms)
  if (vitals.ttfb !== undefined) {
    factorsCount++;
    if (vitals.ttfb > 1800) score -= 20;
    else if (vitals.ttfb > 800) score -= 10;
    else if (vitals.ttfb > 500) score -= 5;
  }

  // FCP scoring (target: < 1800ms)
  if (vitals.fcp !== undefined) {
    factorsCount++;
    if (vitals.fcp > 3000) score -= 20;
    else if (vitals.fcp > 1800) score -= 10;
    else if (vitals.fcp > 1200) score -= 5;
  }

  // INP scoring (target: < 200ms)
  if (vitals.inp !== undefined) {
    factorsCount++;
    if (vitals.inp > 500) score -= 25;
    else if (vitals.inp > 200) score -= 15;
    else if (vitals.inp > 100) score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get performance status for a metric
 */
export function getMetricStatus(
  metric: keyof WebVitals,
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds: Record<keyof WebVitals, [number, number]> = {
    lcp: [2500, 4000],
    fid: [100, 300],
    cls: [0.1, 0.25],
    ttfb: [800, 1800],
    fcp: [1800, 3000],
    inp: [200, 500],
  };

  const [good, poor] = thresholds[metric] || [0, 0];

  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

/**
 * Fetch project analytics for performance analysis
 */
export async function getProjectPerformanceData(projectId: string): Promise<{
  vitals: WebVitals;
  recentMetrics: Array<{
    name: string;
    value: number;
    timestamp: Date;
  }>;
}> {
  // Fetch recent web vitals from analytics
  const recentVitals = await prisma.webVital.findMany({
    where: {
      projectId,
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Calculate averages
  const metrics: Record<string, number[]> = {};
  for (const vital of recentVitals) {
    if (!metrics[vital.metric]) {
      metrics[vital.metric] = [];
    }
    metrics[vital.metric].push(vital.value);
  }

  const averages: WebVitals = {};
  for (const [name, values] of Object.entries(metrics)) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    switch (name.toUpperCase()) {
      case "LCP":
        averages.lcp = avg;
        break;
      case "FID":
        averages.fid = avg;
        break;
      case "CLS":
        averages.cls = avg;
        break;
      case "TTFB":
        averages.ttfb = avg;
        break;
      case "FCP":
        averages.fcp = avg;
        break;
      case "INP":
        averages.inp = avg;
        break;
    }
  }

  return {
    vitals: averages,
    recentMetrics: recentVitals.map((v) => ({
      name: v.metric,
      value: v.value,
      timestamp: v.createdAt,
    })),
  };
}

/**
 * Analyze performance and get AI recommendations
 */
export async function analyzePerformance(
  projectId: string,
  vitals?: WebVitals
): Promise<{
  score: number;
  analysis: PerformanceAnalysis | null;
  recommendations: PerformanceRecommendation[];
}> {
  // Get vitals from database if not provided
  let metricsToAnalyze = vitals;

  if (!metricsToAnalyze) {
    const { vitals: fetchedVitals } = await getProjectPerformanceData(projectId);
    metricsToAnalyze = fetchedVitals;
  }

  // Calculate score
  const score = calculatePerformanceScore(metricsToAnalyze);

  // Generate recommendations based on metrics
  const recommendations: PerformanceRecommendation[] = [];

  // LCP recommendations
  if (metricsToAnalyze.lcp && metricsToAnalyze.lcp > 2500) {
    recommendations.push({
      category: "lcp",
      severity: metricsToAnalyze.lcp > 4000 ? "critical" : "high",
      issue: `Largest Contentful Paint is ${metricsToAnalyze.lcp}ms (target: <2500ms)`,
      suggestion: "Optimize the largest element on the page (usually a hero image or heading)",
      codeExample: `// Optimize images with next/image
import Image from 'next/image'

<Image
  src="/hero.jpg"
  priority
  width={1200}
  height={600}
  sizes="100vw"
/>`,
      impact: "Faster perceived load time",
      estimatedImprovement: `${Math.round((metricsToAnalyze.lcp - 2500) * 0.5)}ms reduction possible`,
    });
  }

  // CLS recommendations
  if (metricsToAnalyze.cls && metricsToAnalyze.cls > 0.1) {
    recommendations.push({
      category: "cls",
      severity: metricsToAnalyze.cls > 0.25 ? "critical" : "high",
      issue: `Cumulative Layout Shift is ${metricsToAnalyze.cls.toFixed(3)} (target: <0.1)`,
      suggestion: "Add explicit dimensions to images and embeds, avoid inserting content above existing content",
      codeExample: `// Always specify image dimensions
<Image
  src="/photo.jpg"
  width={800}
  height={600}
  // or use CSS aspect-ratio
  style={{ aspectRatio: '4/3' }}
/>`,
      impact: "Better visual stability",
    });
  }

  // TTFB recommendations
  if (metricsToAnalyze.ttfb && metricsToAnalyze.ttfb > 800) {
    recommendations.push({
      category: "ttfb",
      severity: metricsToAnalyze.ttfb > 1800 ? "high" : "medium",
      issue: `Time to First Byte is ${metricsToAnalyze.ttfb}ms (target: <800ms)`,
      suggestion: "Optimize server response time with caching, CDN, or edge functions",
      codeExample: `// Use edge runtime for faster TTFB
export const runtime = 'edge';

// Enable caching
export const revalidate = 3600; // ISR with 1 hour cache`,
      impact: "Faster initial response",
    });
  }

  // FID/INP recommendations
  if ((metricsToAnalyze.fid && metricsToAnalyze.fid > 100) ||
      (metricsToAnalyze.inp && metricsToAnalyze.inp > 200)) {
    recommendations.push({
      category: metricsToAnalyze.inp ? "inp" : "fid",
      severity: "medium",
      issue: "Input responsiveness needs improvement",
      suggestion: "Break up long tasks, defer non-critical JavaScript, optimize event handlers",
      codeExample: `// Use useTransition for non-urgent updates
import { useTransition } from 'react';

const [isPending, startTransition] = useTransition();

function handleClick() {
  startTransition(() => {
    // Non-urgent state update
    setExpensiveState(newValue);
  });
}`,
      impact: "More responsive interactions",
    });
  }

  // If AI is available, get enhanced analysis
  let analysis: PerformanceAnalysis | null = null;

  if (isAIAvailable() && Object.keys(metricsToAnalyze).length > 0) {
    const metricsInfo = `
Performance Metrics:
- LCP (Largest Contentful Paint): ${metricsToAnalyze.lcp || "N/A"}ms
- FID (First Input Delay): ${metricsToAnalyze.fid || "N/A"}ms
- CLS (Cumulative Layout Shift): ${metricsToAnalyze.cls || "N/A"}
- TTFB (Time to First Byte): ${metricsToAnalyze.ttfb || "N/A"}ms
- FCP (First Contentful Paint): ${metricsToAnalyze.fcp || "N/A"}ms
- INP (Interaction to Next Paint): ${metricsToAnalyze.inp || "N/A"}ms

Current Performance Score: ${score}/100
`;

    try {
      const aiResponse = await analyzeWithPrompt({
        prompt: PERFORMANCE_RECOMMENDATION_PROMPT,
        content: metricsInfo,
      });

      analysis = parseAIJson<PerformanceAnalysis>(aiResponse);
    } catch (error) {
      console.error("[Performance Advisor] AI analysis failed:", error);
    }
  }

  return {
    score,
    analysis,
    recommendations,
  };
}
