import { navigation } from "@/lib/navigation";

export interface SearchItem {
  id: string;
  title: string;
  section: string;
  href: string;
  content: string;
}

// Static search data generated from navigation
// In a real app, this would be built at build time from page content
export const searchData: SearchItem[] = [
  // Getting Started
  {
    id: "getting-started",
    title: "Introduction",
    section: "Getting Started",
    href: "/getting-started",
    content: "Welcome to Cloudify documentation. Learn how to deploy your applications with ease. Getting started guide overview introduction.",
  },
  {
    id: "quick-start",
    title: "Quick Start",
    section: "Getting Started",
    href: "/getting-started/quick-start",
    content: "Get up and running with Cloudify in minutes. Install CLI, connect repository, deploy your first application.",
  },
  {
    id: "first-deployment",
    title: "First Deployment",
    section: "Getting Started",
    href: "/getting-started/first-deployment",
    content: "Deploy your first application step by step. Configure build settings, environment variables, and custom domains.",
  },

  // Deployments
  {
    id: "deployments-overview",
    title: "Deployments Overview",
    section: "Deployments",
    href: "/deployments",
    content: "Learn about Cloudify deployments. Automatic deployments, preview deployments, rollbacks, and deployment history.",
  },
  {
    id: "git-integration",
    title: "Git Integration",
    section: "Deployments",
    href: "/deployments/git-integration",
    content: "Connect your GitHub, GitLab, or Bitbucket repository. Automatic deployments on push, branch previews.",
  },
  {
    id: "build-settings",
    title: "Build Settings",
    section: "Deployments",
    href: "/deployments/build-settings",
    content: "Configure build commands, output directory, Node.js version, and framework presets for your project.",
  },
  {
    id: "environment-variables",
    title: "Environment Variables",
    section: "Deployments",
    href: "/deployments/environment-variables",
    content: "Manage environment variables and secrets. Production, preview, and development environment configuration.",
  },
  {
    id: "custom-domains",
    title: "Custom Domains",
    section: "Deployments",
    href: "/deployments/domains",
    content: "Add custom domains to your project. SSL certificates, DNS configuration, and domain verification.",
  },

  // Edge Functions
  {
    id: "functions-overview",
    title: "Edge Functions Overview",
    section: "Edge Functions",
    href: "/functions",
    content: "Run serverless functions at the edge. Low latency, global distribution, TypeScript support.",
  },
  {
    id: "writing-functions",
    title: "Writing Functions",
    section: "Edge Functions",
    href: "/functions/writing-functions",
    content: "Write and deploy edge functions. Request handling, response streaming, middleware patterns.",
  },
  {
    id: "functions-logs",
    title: "Logs & Debugging",
    section: "Edge Functions",
    href: "/functions/logs",
    content: "View function logs and debug issues. Real-time logs, error tracking, performance monitoring.",
  },

  // Storage
  {
    id: "storage-overview",
    title: "Storage Overview",
    section: "Storage",
    href: "/storage",
    content: "Cloudify storage solutions. Blob storage for files, KV store for key-value data.",
  },
  {
    id: "blob-storage",
    title: "Blob Storage",
    section: "Storage",
    href: "/storage/blob-storage",
    content: "Store and serve files. Images, videos, documents. CDN distribution, access control.",
  },
  {
    id: "kv-store",
    title: "KV Store",
    section: "Storage",
    href: "/storage/kv-store",
    content: "Key-value storage at the edge. Fast reads, global replication, TTL support.",
  },

  // Analytics
  {
    id: "analytics-overview",
    title: "Analytics Overview",
    section: "Analytics",
    href: "/analytics",
    content: "Track your application performance and usage. Web vitals, visitor analytics, real user monitoring.",
  },
  {
    id: "web-vitals",
    title: "Web Vitals",
    section: "Analytics",
    href: "/analytics/web-vitals",
    content: "Monitor Core Web Vitals. LCP, FID, CLS metrics. Performance optimization recommendations.",
  },
  {
    id: "visitor-tracking",
    title: "Visitor Tracking",
    section: "Analytics",
    href: "/analytics/visitor-tracking",
    content: "Track visitors and page views. Geographic distribution, device types, referral sources.",
  },

  // Monitoring
  {
    id: "monitoring-overview",
    title: "Monitoring Overview",
    section: "Monitoring",
    href: "/monitoring",
    content: "Monitor your deployments and functions. Uptime monitoring, alerts, status pages.",
  },
  {
    id: "metrics",
    title: "Metrics",
    section: "Monitoring",
    href: "/monitoring/metrics",
    content: "View deployment metrics. Request count, response times, error rates, bandwidth usage.",
  },

  // API Reference
  {
    id: "api-overview",
    title: "API Reference Overview",
    section: "API Reference",
    href: "/api-reference",
    content: "Cloudify REST API documentation. Authentication, endpoints, rate limits.",
  },
  {
    id: "api-authentication",
    title: "Authentication",
    section: "API Reference",
    href: "/api-reference/authentication",
    content: "API authentication methods. API keys, OAuth tokens, bearer authentication.",
  },
  {
    id: "api-projects",
    title: "Projects API",
    section: "API Reference",
    href: "/api-reference/projects",
    content: "Create, read, update, delete projects via API. Project settings, team management.",
  },
  {
    id: "api-deployments",
    title: "Deployments API",
    section: "API Reference",
    href: "/api-reference/deployments",
    content: "Trigger deployments, get deployment status, rollback via API.",
  },
  {
    id: "api-functions",
    title: "Functions API",
    section: "API Reference",
    href: "/api-reference/functions",
    content: "Manage edge functions via API. Deploy, invoke, view logs.",
  },
  {
    id: "api-storage",
    title: "Storage API",
    section: "API Reference",
    href: "/api-reference/storage",
    content: "Blob storage and KV store API. Upload files, manage keys.",
  },
  {
    id: "api-analytics",
    title: "Analytics API",
    section: "API Reference",
    href: "/api-reference/analytics",
    content: "Query analytics data via API. Custom date ranges, aggregations.",
  },
  {
    id: "api-audit-logs",
    title: "Audit Logs API",
    section: "API Reference",
    href: "/api-reference/audit-logs",
    content: "Access audit logs via API. Track team activity, security events.",
  },
  {
    id: "api-ai",
    title: "AI API",
    section: "API Reference",
    href: "/api-reference/ai",
    content: "AI-powered features API. Code review, performance suggestions, error analysis.",
  },

  // Guides
  {
    id: "guides-overview",
    title: "Guides Overview",
    section: "Guides",
    href: "/guides",
    content: "Framework-specific deployment guides. Step-by-step tutorials for popular frameworks.",
  },
  {
    id: "nextjs-guide",
    title: "Next.js Guide",
    section: "Guides",
    href: "/guides/nextjs",
    content: "Deploy Next.js applications. App Router, Pages Router, ISR, API routes configuration.",
  },
  {
    id: "react-guide",
    title: "React (Vite) Guide",
    section: "Guides",
    href: "/guides/react",
    content: "Deploy React applications with Vite. SPA configuration, routing, environment variables.",
  },
  {
    id: "static-sites-guide",
    title: "Static Sites Guide",
    section: "Guides",
    href: "/guides/static-sites",
    content: "Deploy static sites. HTML, CSS, JavaScript. Hugo, Jekyll, Astro support.",
  },
];

// Quick actions for command palette
export const quickActions = [
  {
    id: "action-dashboard",
    title: "Go to Dashboard",
    href: "https://cloudify.tranthachnguyen.com",
    icon: "external",
  },
  {
    id: "action-api",
    title: "View API Reference",
    href: "/api-reference",
    icon: "code",
  },
  {
    id: "action-guides",
    title: "Browse Guides",
    href: "/guides",
    icon: "book",
  },
];
