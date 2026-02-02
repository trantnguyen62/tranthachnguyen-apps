/**
 * Performance Recommendations Engine
 * Analyzes speed insights and generates actionable recommendations
 */

import { prisma } from "@/lib/prisma";
import { VITALS_THRESHOLDS } from "./speed-insights";

interface RecommendationRule {
  id: string;
  check: (metrics: MetricsSummary) => boolean;
  category: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  impact: string;
  metric?: string;
}

interface MetricsSummary {
  lcp?: { p75: number };
  fcp?: { p75: number };
  cls?: { p75: number };
  ttfb?: { p75: number };
  fid?: { p75: number };
  inp?: { p75: number };
  jsExecutionTime?: { p75: number };
  imageLoadTime?: { p75: number };
  fontLoadTime?: { p75: number };
  thirdPartyTime?: { p75: number };
}

const RECOMMENDATION_RULES: RecommendationRule[] = [
  // LCP Recommendations
  {
    id: "lcp-critical",
    check: (m) => (m.lcp?.p75 || 0) > VITALS_THRESHOLDS.lcp.needsImprovement,
    category: "images",
    severity: "critical",
    title: "Largest Contentful Paint is too slow",
    description:
      "Your LCP is over 4 seconds, which significantly impacts user experience and SEO. The main causes are usually large unoptimized images, slow server response, or render-blocking resources. Consider: 1) Optimizing hero images with modern formats (WebP, AVIF), 2) Implementing lazy loading for below-fold images, 3) Preloading critical resources, 4) Using a CDN for static assets.",
    impact: "Improving LCP below 2.5s can increase conversion rates by up to 15%",
    metric: "lcp",
  },
  {
    id: "lcp-warning",
    check: (m) =>
      (m.lcp?.p75 || 0) > VITALS_THRESHOLDS.lcp.good &&
      (m.lcp?.p75 || 0) <= VITALS_THRESHOLDS.lcp.needsImprovement,
    category: "images",
    severity: "warning",
    title: "Largest Contentful Paint needs improvement",
    description:
      "Your LCP is between 2.5s and 4s. While not critical, there's room for improvement. Focus on optimizing your largest visible element (usually a hero image or heading). Consider using responsive images with srcset and implementing priority hints for critical resources.",
    impact: "Reaching 'good' LCP can improve bounce rates by 5-10%",
    metric: "lcp",
  },

  // CLS Recommendations
  {
    id: "cls-critical",
    check: (m) => (m.cls?.p75 || 0) > VITALS_THRESHOLDS.cls.needsImprovement,
    category: "layout",
    severity: "critical",
    title: "High Cumulative Layout Shift detected",
    description:
      "Your CLS score indicates significant layout instability that frustrates users. Common causes: 1) Images without explicit dimensions, 2) Dynamically injected content (ads, embeds), 3) Web fonts causing FOUT/FOIT, 4) Animations that trigger layout. Fix by adding width/height to all images, reserving space for dynamic content, and using font-display: swap.",
    impact: "Reducing CLS improves perceived performance and user trust",
    metric: "cls",
  },
  {
    id: "cls-warning",
    check: (m) =>
      (m.cls?.p75 || 0) > VITALS_THRESHOLDS.cls.good &&
      (m.cls?.p75 || 0) <= VITALS_THRESHOLDS.cls.needsImprovement,
    category: "layout",
    severity: "warning",
    title: "Layout shifts detected",
    description:
      "Your CLS is above the 'good' threshold. Review your page for elements that shift during load. Use browser DevTools Performance panel to identify the specific elements causing shifts.",
    impact: "Improving CLS leads to better user experience and higher engagement",
    metric: "cls",
  },

  // TTFB Recommendations
  {
    id: "ttfb-critical",
    check: (m) => (m.ttfb?.p75 || 0) > VITALS_THRESHOLDS.ttfb.needsImprovement,
    category: "server",
    severity: "critical",
    title: "Server response time is very slow",
    description:
      "Your Time to First Byte exceeds 1.8 seconds, indicating server-side performance issues. This affects all other metrics. Consider: 1) Implementing server-side caching, 2) Using a CDN, 3) Optimizing database queries, 4) Upgrading server resources, 5) Using edge functions for dynamic content.",
    impact: "Reducing TTFB below 800ms dramatically improves all Core Web Vitals",
    metric: "ttfb",
  },
  {
    id: "ttfb-warning",
    check: (m) =>
      (m.ttfb?.p75 || 0) > VITALS_THRESHOLDS.ttfb.good &&
      (m.ttfb?.p75 || 0) <= VITALS_THRESHOLDS.ttfb.needsImprovement,
    category: "server",
    severity: "warning",
    title: "Server response time could be faster",
    description:
      "Your TTFB is between 800ms and 1.8s. While acceptable, there's room for optimization. Consider implementing stale-while-revalidate caching strategies and reviewing your server configuration.",
    impact: "Faster server response improves perceived performance",
    metric: "ttfb",
  },

  // FID/INP Recommendations
  {
    id: "inp-critical",
    check: (m) => (m.inp?.p75 || 0) > VITALS_THRESHOLDS.inp.needsImprovement,
    category: "javascript",
    severity: "critical",
    title: "Interaction responsiveness is poor",
    description:
      "Your Interaction to Next Paint exceeds 500ms, making the site feel unresponsive. This is typically caused by heavy JavaScript execution blocking the main thread. Solutions: 1) Break up long tasks with yield to main, 2) Use web workers for heavy computation, 3) Reduce JavaScript bundle size, 4) Defer non-critical scripts.",
    impact: "Better interactivity increases user engagement and conversions",
    metric: "inp",
  },

  // JavaScript Recommendations
  {
    id: "js-heavy",
    check: (m) => (m.jsExecutionTime?.p75 || 0) > 1000,
    category: "javascript",
    severity: "warning",
    title: "JavaScript execution time is high",
    description:
      "JavaScript is taking over 1 second to execute. This blocks the main thread and delays interactivity. Consider: 1) Code splitting and lazy loading, 2) Tree shaking unused code, 3) Moving work to web workers, 4) Auditing third-party scripts.",
    impact: "Reducing JS execution time improves FID and INP scores",
    metric: "jsExecutionTime",
  },

  // Third-party Recommendations
  {
    id: "third-party-heavy",
    check: (m) => (m.thirdPartyTime?.p75 || 0) > 500,
    category: "javascript",
    severity: "warning",
    title: "Third-party scripts are slowing down your site",
    description:
      "Third-party scripts are adding significant load time. Review each third-party script and assess if it's necessary. Consider: 1) Loading non-critical scripts async or defer, 2) Self-hosting critical third-party resources, 3) Using Partytown to run scripts in web workers.",
    impact: "Optimizing third-party scripts can improve load time by 20-40%",
    metric: "thirdPartyTime",
  },

  // Image Recommendations
  {
    id: "images-slow",
    check: (m) => (m.imageLoadTime?.p75 || 0) > 2000,
    category: "images",
    severity: "warning",
    title: "Images are taking too long to load",
    description:
      "Image loading is contributing significantly to page load time. Optimize images by: 1) Using modern formats (WebP, AVIF), 2) Implementing responsive images with srcset, 3) Lazy loading below-fold images, 4) Using a CDN with automatic optimization.",
    impact: "Optimizing images typically provides the biggest performance gains",
    metric: "imageLoadTime",
  },

  // Font Recommendations
  {
    id: "fonts-slow",
    check: (m) => (m.fontLoadTime?.p75 || 0) > 500,
    category: "fonts",
    severity: "info",
    title: "Web fonts are impacting load time",
    description:
      "Web fonts are adding noticeable load time. Consider: 1) Using font-display: swap to prevent invisible text, 2) Preloading critical fonts, 3) Subsetting fonts to include only needed characters, 4) Using system fonts as fallbacks.",
    impact: "Optimizing fonts improves perceived load time and CLS",
    metric: "fontLoadTime",
  },
];

/**
 * Generate recommendations for a project
 */
export async function generateRecommendations(
  projectId: string,
  metrics: MetricsSummary,
  path?: string
) {
  const recommendations: Array<{
    category: string;
    severity: string;
    title: string;
    description: string;
    impact: string;
    metric?: string;
    currentValue?: number;
    targetValue?: number;
  }> = [];

  for (const rule of RECOMMENDATION_RULES) {
    if (rule.check(metrics)) {
      const currentValue = rule.metric
        ? (metrics as any)[rule.metric]?.p75
        : undefined;
      const targetValue = rule.metric
        ? (VITALS_THRESHOLDS as any)[rule.metric]?.good
        : undefined;

      recommendations.push({
        category: rule.category,
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        impact: rule.impact,
        metric: rule.metric,
        currentValue,
        targetValue,
      });
    }
  }

  // Store recommendations in database
  for (const rec of recommendations) {
    // Check if similar recommendation already exists
    const existing = await prisma.performanceRecommendation.findFirst({
      where: {
        projectId,
        path: path || null,
        title: rec.title,
        resolved: false,
        dismissed: false,
      },
    });

    if (!existing) {
      await prisma.performanceRecommendation.create({
        data: {
          projectId,
          path,
          category: rec.category,
          severity: rec.severity,
          title: rec.title,
          description: rec.description,
          impact: rec.impact,
          metric: rec.metric,
          currentValue: rec.currentValue,
          targetValue: rec.targetValue,
        },
      });
    } else {
      // Update current value if changed significantly
      if (
        rec.currentValue &&
        existing.currentValue &&
        Math.abs(rec.currentValue - existing.currentValue) > existing.currentValue * 0.1
      ) {
        await prisma.performanceRecommendation.update({
          where: { id: existing.id },
          data: { currentValue: rec.currentValue },
        });
      }
    }
  }

  return recommendations;
}

/**
 * Get recommendations for a project
 */
export async function getRecommendations(
  projectId: string,
  options?: {
    path?: string;
    severity?: string;
    resolved?: boolean;
    dismissed?: boolean;
  }
) {
  const where: any = { projectId };

  if (options?.path) where.path = options.path;
  if (options?.severity) where.severity = options.severity;
  if (options?.resolved !== undefined) where.resolved = options.resolved;
  if (options?.dismissed !== undefined) where.dismissed = options.dismissed;

  return prisma.performanceRecommendation.findMany({
    where,
    orderBy: [
      { severity: "asc" }, // critical first
      { createdAt: "desc" },
    ],
  });
}

/**
 * Dismiss a recommendation
 */
export async function dismissRecommendation(id: string) {
  return prisma.performanceRecommendation.update({
    where: { id },
    data: { dismissed: true },
  });
}

/**
 * Mark a recommendation as resolved
 */
export async function resolveRecommendation(id: string) {
  return prisma.performanceRecommendation.update({
    where: { id },
    data: { resolved: true },
  });
}
