"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Folder,
  GitBranch,
  Globe,
  Settings,
  FileText,
  Users,
  BarChart3,
  Command,
  ArrowRight,
  Clock,
  Hash,
} from "lucide-react";
import { CommandPalette } from "@/components/ui/command";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  href: string;
  category: string;
}

const projects: SearchResult[] = [
  {
    id: "proj-1",
    title: "my-portfolio",
    description: "Next.js personal website",
    icon: <Folder className="h-4 w-4" />,
    href: "/projects/my-portfolio",
    category: "Projects",
  },
  {
    id: "proj-2",
    title: "api-service",
    description: "Node.js REST API",
    icon: <Folder className="h-4 w-4" />,
    href: "/projects/api-service",
    category: "Projects",
  },
  {
    id: "proj-3",
    title: "e-commerce-store",
    description: "React storefront",
    icon: <Folder className="h-4 w-4" />,
    href: "/projects/e-commerce-store",
    category: "Projects",
  },
];

const pages: SearchResult[] = [
  {
    id: "page-1",
    title: "Dashboard",
    description: "Overview and stats",
    icon: <BarChart3 className="h-4 w-4" />,
    href: "/dashboard",
    category: "Pages",
  },
  {
    id: "page-2",
    title: "All Projects",
    description: "Manage your projects",
    icon: <Folder className="h-4 w-4" />,
    href: "/projects",
    category: "Pages",
  },
  {
    id: "page-3",
    title: "Deployments",
    description: "View deployment history",
    icon: <GitBranch className="h-4 w-4" />,
    href: "/deployments",
    category: "Pages",
  },
  {
    id: "page-4",
    title: "Domains",
    description: "Manage custom domains",
    icon: <Globe className="h-4 w-4" />,
    href: "/domains",
    category: "Pages",
  },
  {
    id: "page-5",
    title: "Analytics",
    description: "Traffic and performance",
    icon: <BarChart3 className="h-4 w-4" />,
    href: "/analytics",
    category: "Pages",
  },
  {
    id: "page-6",
    title: "Team",
    description: "Manage team members",
    icon: <Users className="h-4 w-4" />,
    href: "/team",
    category: "Pages",
  },
  {
    id: "page-7",
    title: "Settings",
    description: "Account settings",
    icon: <Settings className="h-4 w-4" />,
    href: "/settings",
    category: "Pages",
  },
];

const actions: SearchResult[] = [
  {
    id: "action-1",
    title: "Create New Project",
    description: "Import from Git or deploy template",
    icon: <Hash className="h-4 w-4" />,
    href: "/new",
    category: "Actions",
  },
  {
    id: "action-2",
    title: "Add Domain",
    description: "Connect a custom domain",
    icon: <Globe className="h-4 w-4" />,
    href: "/domains/new",
    category: "Actions",
  },
  {
    id: "action-3",
    title: "Invite Team Member",
    description: "Add someone to your team",
    icon: <Users className="h-4 w-4" />,
    href: "/team?invite=true",
    category: "Actions",
  },
];

const docs: SearchResult[] = [
  {
    id: "doc-1",
    title: "Getting Started",
    description: "Quick start guide",
    icon: <FileText className="h-4 w-4" />,
    href: "/docs",
    category: "Documentation",
  },
  {
    id: "doc-2",
    title: "CLI Reference",
    description: "Command line tools",
    icon: <FileText className="h-4 w-4" />,
    href: "/docs/cli",
    category: "Documentation",
  },
  {
    id: "doc-3",
    title: "Environment Variables",
    description: "Configure your app",
    icon: <FileText className="h-4 w-4" />,
    href: "/docs/environment-variables",
    category: "Documentation",
  },
];

const recentSearches = ["my-portfolio", "deployment logs", "add domain"];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const allResults = useMemo(
    () => [...projects, ...pages, ...actions, ...docs],
    []
  );

  const groups = useMemo(
    () => [
      {
        heading: "Recent",
        items: recentSearches.map((search, i) => ({
          id: `recent-${i}`,
          title: search,
          icon: <Clock className="h-4 w-4" />,
          action: () => {
            // Search for this term
            setOpen(false);
          },
        })),
      },
      {
        heading: "Actions",
        items: actions.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          icon: item.icon,
          shortcut: item.id === "action-1" ? "⌘N" : undefined,
          action: () => {
            router.push(item.href);
            setOpen(false);
          },
        })),
      },
      {
        heading: "Projects",
        items: projects.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          icon: item.icon,
          action: () => {
            router.push(item.href);
            setOpen(false);
          },
        })),
      },
      {
        heading: "Pages",
        items: pages.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          icon: item.icon,
          action: () => {
            router.push(item.href);
            setOpen(false);
          },
        })),
      },
      {
        heading: "Documentation",
        items: docs.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          icon: item.icon,
          action: () => {
            router.push(item.href);
            setOpen(false);
          },
        })),
      },
    ],
    [router]
  );

  return (
    <CommandPalette open={open} onOpenChange={setOpen} groups={groups} />
  );
}
