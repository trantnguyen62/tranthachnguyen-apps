import type { MetadataRoute } from "next";

const BASE_URL = "https://cloudify.tranthachnguyen.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Marketing / public pages
  const marketingPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/changelog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/careers`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/templates`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/partners`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/status`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/support`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Solutions pages
  const solutionPages: MetadataRoute.Sitemap = [
    "solutions",
    "solutions/web-apps",
    "solutions/ecommerce",
    "solutions/ai-apps",
    "solutions/marketing",
    "solutions/platforms",
    "solutions/enterprise",
  ].map((path) => ({
    url: `${BASE_URL}/${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Products pages
  const productPages: MetadataRoute.Sitemap = [
    "products",
    "products/deployments",
    "products/functions",
    "products/storage",
    "products/analytics",
    "products/edge-network",
    "products/ai",
    "products/ai-sdk",
    "products/ai-gateway",
    "products/v0",
  ].map((path) => ({
    url: `${BASE_URL}/${path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Documentation pages
  const docPages: MetadataRoute.Sitemap = [
    "docs",
    "docs/introduction",
    "docs/quick-start",
    "docs/importing",
    "docs/cli",
    "docs/git",
    "docs/build-config",
    "docs/previews",
    "docs/functions",
    "docs/api-routes",
    "docs/edge-functions",
    "docs/runtimes",
    "docs/domains",
    "docs/dns",
    "docs/ssl",
    "docs/redirects",
    "docs/headers",
    "docs/environment-variables",
    "docs/frameworks/nextjs",
    "docs/frameworks/react",
    "docs/frameworks/vue",
    "docs/frameworks/astro",
    "docs/getting-started",
    "docs/api-reference",
    "docs/self-hosting",
  ].map((path) => ({
    url: `${BASE_URL}/${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Guides
  const guidePages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/guides`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  return [
    ...marketingPages,
    ...solutionPages,
    ...productPages,
    ...docPages,
    ...guidePages,
  ];
}
