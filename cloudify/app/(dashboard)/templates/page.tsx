"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Zap,
  Loader2,
  AlertCircle,
  Filter,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  description: string;
  framework: string;
  category: string;
  repoUrl: string;
  branch: string;
  buildCmd: string;
  installCmd: string;
  outputDir: string;
  nodeVersion: string;
  icon: string;
  gradient: string;
  featured: boolean;
}

interface TemplatesResponse {
  templates: Template[];
  total: number;
  frameworks: string[];
  categories: string[];
}

const frameworkIcons: Record<string, string> = {
  "Next.js": "\u25B2",
  React: "\u269B\uFE0F",
  Vite: "\u26A1",
  Vue: "\uD83D\uDC9A",
  Static: "\uD83C\uDF10",
  Astro: "\uD83D\uDE80",
  Svelte: "\uD83D\uDD25",
};

function LoadingSkeleton() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex justify-between items-center pt-4 border-t">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function TemplatesGalleryPage() {
  const router = useRouter();
  const [data, setData] = useState<TemplatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("All");
  const [deploying, setDeploying] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (selectedFramework !== "All")
          params.set("framework", selectedFramework);

        const response = await fetch(`/api/templates?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch templates");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    const timeoutId = setTimeout(() => {
      fetchTemplates();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedFramework]);

  async function handleDeploy(template: Template) {
    setDeploying(template.id);
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to deploy template");
      }

      const result = await response.json();
      router.push(`/projects/${result.project.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deploy");
      setDeploying(null);
    }
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
              <div>
                <h3 className="font-semibold">Failed to load templates</h3>
                <p className="text-sm text-red-500">{error}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const templates = data?.templates || [];
  const frameworks = ["All", ...(data?.frameworks || [])];
  const featured = templates.filter((t) => t.featured);
  const other = templates.filter((t) => !t.featured);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-[var(--text-primary)]"
        >
          Templates
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-[var(--text-secondary)]"
        >
          Deploy production-ready projects in one click. Choose a template to get
          started.
        </motion.p>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="gap-2">
              <Filter className="h-4 w-4" />
              {selectedFramework}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {frameworks.map((fw) => (
              <DropdownMenuItem
                key={fw}
                onClick={() => setSelectedFramework(fw)}
              >
                {fw !== "All" && (
                  <span className="mr-2">{frameworkIcons[fw] || ""}</span>
                )}
                {fw}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Featured Templates */}
      {featured.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            Featured
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                deploying={deploying === template.id}
                onDeploy={() => handleDeploy(template)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Other Templates */}
      {other.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            All Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {other.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                deploying={deploying === template.id}
                onDeploy={() => handleDeploy(template)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">{"\uD83D\uDCE6"}</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            No templates found
          </h3>
          <p className="text-[var(--text-secondary)] mb-6">
            {searchQuery
              ? "Try adjusting your search or filter"
              : "No templates are available yet"}
          </p>
          <Button variant="secondary" asChild>
            <Link href="/new">Import from Git instead</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  index,
  deploying,
  onDeploy,
}: {
  template: Template;
  index: number;
  deploying: boolean;
  onDeploy: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group h-full">
        <CardContent className="p-6 flex flex-col h-full">
          {/* Icon and framework badge */}
          <div className="flex items-start justify-between mb-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg text-2xl bg-gradient-to-br text-white",
                template.gradient
              )}
            >
              {template.icon}
            </div>
            <Badge variant="secondary" className="text-xs">
              {template.framework}
            </Badge>
          </div>

          {/* Name and description */}
          <div className="mb-4 flex-1">
            <h3 className="font-semibold text-[var(--text-primary)] mb-1">
              {template.name}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
              {template.description}
            </p>
          </div>

          {/* Build settings summary */}
          <div className="mb-4 space-y-1 text-xs text-[var(--text-secondary)]">
            {template.buildCmd && (
              <div className="flex items-center gap-2">
                <span className="font-medium w-14">Build:</span>
                <code className="bg-[var(--surface-secondary)] px-1.5 py-0.5 rounded">
                  {template.buildCmd}
                </code>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-medium w-14">Output:</span>
              <code className="bg-[var(--surface-secondary)] px-1.5 py-0.5 rounded">
                {template.outputDir}
              </code>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)]">
            <a
              href={template.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Source
            </a>
            <Button
              size="sm"
              onClick={onDeploy}
              disabled={deploying}
              className="gap-1.5"
            >
              {deploying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  Deploy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
