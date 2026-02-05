import {
  BookOpen,
  Rocket,
  Code2,
  Database,
  BarChart3,
  Activity,
  FileCode,
  Terminal,
  LucideIcon,
  Brain,
  Shield,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
}

export interface NavSection {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [
      { title: "Introduction", href: "/getting-started" },
      { title: "Quick Start", href: "/getting-started/quick-start" },
      { title: "First Deployment", href: "/getting-started/first-deployment" },
    ],
  },
  {
    title: "Deployments",
    icon: Rocket,
    items: [
      { title: "Overview", href: "/deployments" },
      { title: "Git Integration", href: "/deployments/git-integration" },
      { title: "Build Settings", href: "/deployments/build-settings" },
      { title: "Environment Variables", href: "/deployments/environment-variables" },
      { title: "Custom Domains", href: "/deployments/domains" },
    ],
  },
  {
    title: "Edge Functions",
    icon: Code2,
    items: [
      { title: "Overview", href: "/functions" },
      { title: "Writing Functions", href: "/functions/writing-functions" },
      { title: "Logs & Debugging", href: "/functions/logs" },
    ],
  },
  {
    title: "Storage",
    icon: Database,
    items: [
      { title: "Overview", href: "/storage" },
      { title: "Blob Storage", href: "/storage/blob-storage" },
      { title: "KV Store", href: "/storage/kv-store" },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    items: [
      { title: "Overview", href: "/analytics" },
      { title: "Web Vitals", href: "/analytics/web-vitals" },
      { title: "Visitor Tracking", href: "/analytics/visitor-tracking" },
    ],
  },
  {
    title: "Monitoring",
    icon: Activity,
    items: [
      { title: "Overview", href: "/monitoring" },
      { title: "Metrics", href: "/monitoring/metrics" },
    ],
  },
  {
    title: "API Reference",
    icon: FileCode,
    items: [
      { title: "Overview", href: "/api-reference" },
      { title: "Authentication", href: "/api-reference/authentication" },
      { title: "Projects", href: "/api-reference/projects" },
      { title: "Deployments", href: "/api-reference/deployments" },
      { title: "Functions", href: "/api-reference/functions" },
      { title: "Storage", href: "/api-reference/storage" },
      { title: "Analytics", href: "/api-reference/analytics" },
      { title: "Audit Logs", href: "/api-reference/audit-logs" },
      { title: "AI", href: "/api-reference/ai" },
    ],
  },
  {
    title: "Guides",
    icon: Terminal,
    items: [
      { title: "Overview", href: "/guides" },
      { title: "Next.js", href: "/guides/nextjs" },
      { title: "React (Vite)", href: "/guides/react" },
      { title: "Static Sites", href: "/guides/static-sites" },
    ],
  },
];
