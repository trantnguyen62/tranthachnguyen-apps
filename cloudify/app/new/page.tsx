"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Github,
  GitBranch,
  Folder,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  Loader2,
  Check,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Repository type from API
interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  htmlUrl: string;
  defaultBranch: string;
  language: string | null;
  updatedAt: string;
  imported: boolean;
  projectId?: string;
  projectSlug?: string;
}

const templates = [
  { name: "Next.js", icon: "▲", color: "from-black to-gray-700" },
  { name: "React", icon: "⚛️", color: "from-cyan-500 to-blue-500" },
  { name: "Vue", icon: "💚", color: "from-green-500 to-emerald-500" },
  { name: "Svelte", icon: "🔥", color: "from-orange-500 to-red-500" },
  { name: "Astro", icon: "🚀", color: "from-purple-500 to-pink-500" },
  { name: "Nuxt", icon: "💚", color: "from-green-400 to-cyan-500" },
];

type Step = "source" | "configure" | "deploy";

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("source");
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState("Next.js");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployComplete, setDeployComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [gitProvider, setGitProvider] = useState("github");

  // Real data states
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<{
    id: string;
    slug: string;
    name: string;
  } | null>(null);

  // Fetch repositories from real API
  const fetchRepositories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/github/repos?search=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError("Please sign in to view your repositories");
        } else if (response.status === 400 && data.error?.includes("GitHub account not connected")) {
          setError("GitHub account not connected. Please sign in with GitHub.");
        } else {
          setError(data.error || "Failed to load repositories");
        }
        setRepositories([]);
        return;
      }

      setRepositories(data.repos || []);
    } catch (err) {
      console.error("Failed to fetch repositories:", err);
      setError("Failed to connect to server");
      setRepositories([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Fetch repos on mount and when search changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRepositories();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchRepositories]);

  const filteredRepos = repositories;

  const handleSelectRepo = (repo: Repository) => {
    if (repo.imported && repo.projectSlug) {
      // Already imported - go to project page
      router.push(`/projects/${repo.projectSlug}`);
      return;
    }
    setSelectedRepo(repo);
    setProjectName(repo.name);
    setStep("configure");
  };

  const handleDeploy = async () => {
    if (!selectedRepo) return;

    setIsDeploying(true);
    setError(null);

    try {
      const response = await fetch("/api/github/repos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoFullName: selectedRepo.fullName,
          projectName: projectName,
          branch: selectedRepo.defaultBranch,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Already imported
          setCreatedProject({
            id: data.projectId,
            slug: data.projectSlug,
            name: projectName,
          });
        } else {
          throw new Error(data.error || "Failed to import repository");
        }
      } else {
        setCreatedProject({
          id: data.project.id,
          slug: data.project.slug,
          name: data.project.name,
        });
      }

      setDeployComplete(true);
      setStep("deploy");
    } catch (err) {
      console.error("Failed to import repository:", err);
      setError(err instanceof Error ? err.message : "Failed to import repository");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Import Project
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Import a Git repository or start from a template
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-2">
            {["source", "configure", "deploy"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                    step === s
                      ? "bg-blue-600 text-white"
                      : step === "deploy" || (step === "configure" && s === "source")
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                  )}
                >
                  {step === "deploy" || (step === "configure" && s === "source") ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    "ml-2 text-sm font-medium capitalize",
                    step === s
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {s}
                </span>
                {i < 2 && (
                  <ChevronRight className="mx-4 h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Step 1: Select Source */}
        {step === "source" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Git Provider */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Import Git Repository
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex items-center gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Github className="h-4 w-4" />
                        {gitProvider === "github" ? "GitHub" : "GitLab"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setGitProvider("github")}>
                        <Github className="h-4 w-4 mr-2" />
                        GitHub
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setGitProvider("gitlab")}>
                        GitLab
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setGitProvider("bitbucket")}>
                        Bitbucket
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search repositories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchRepositories}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </div>

                {/* Repository List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Loading repositories...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
                      <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                      {error.includes("sign in") || error.includes("GitHub account") ? (
                        <Button asChild>
                          <Link href="/login">Sign in with GitHub</Link>
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={fetchRepositories}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      )}
                    </div>
                  ) : filteredRepos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Folder className="h-8 w-8 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchQuery ? "No repositories found matching your search" : "No repositories found"}
                      </p>
                    </div>
                  ) : (
                    filteredRepos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => handleSelectRepo(repo)}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left",
                          repo.imported
                            ? "border-green-200 bg-green-50/50 hover:border-green-400 dark:border-green-800 dark:bg-green-900/10"
                            : "border-gray-200 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Folder className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {repo.name}
                              </span>
                              {repo.private && (
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                  Private
                                </span>
                              )}
                              {repo.imported && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Imported
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {repo.fullName}
                              {repo.description && ` • ${repo.description.substring(0, 50)}${repo.description.length > 50 ? '...' : ''}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                          <div>{new Date(repo.updatedAt).toLocaleDateString()}</div>
                          {repo.language && (
                            <div className="text-xs">{repo.language}</div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Clone Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.name}
                      className="flex flex-col items-center justify-center p-6 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md dark:border-gray-800 dark:hover:border-blue-500 transition-all"
                    >
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl mb-3`}
                      >
                        {template.icon}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Manual Import */}
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center gap-4">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-center">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Import Third-Party Git Repository
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Deploy from any public Git URL
                    </p>
                  </div>
                  <Button variant="outline">Import</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Configure */}
        {step === "configure" && selectedRepo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Configure Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Repository Info */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRepo.fullName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Branch: {selectedRepo.defaultBranch}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Project Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project Name
                  </label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="my-project"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your project will be available at {projectName}.cloudify.app
                  </p>
                </div>

                {/* Framework */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Framework Preset
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {framework}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      {templates.map((t) => (
                        <DropdownMenuItem key={t.name} onClick={() => setFramework(t.name)}>
                          <span className="mr-2">{t.icon}</span>
                          {t.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Build Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Build & Output Settings
                    </label>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Override
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <p className="text-gray-500 dark:text-gray-400">Build Command</p>
                      <p className="font-mono text-gray-900 dark:text-white">npm run build</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <p className="text-gray-500 dark:text-gray-400">Output Directory</p>
                      <p className="font-mono text-gray-900 dark:text-white">.next</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <p className="text-gray-500 dark:text-gray-400">Install Command</p>
                      <p className="font-mono text-gray-900 dark:text-white">npm install</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <p className="text-gray-500 dark:text-gray-400">Root Directory</p>
                      <p className="font-mono text-gray-900 dark:text-white">./</p>
                    </div>
                  </div>
                </div>

                {/* Environment Variables */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Environment Variables
                    </label>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variable
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
                    No environment variables configured
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error display */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => { setStep("source"); setError(null); }}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button variant="primary" onClick={handleDeploy} disabled={isDeploying}>
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import Project
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Deploy Success */}
        {step === "deploy" && deployComplete && createdProject && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Project Imported Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your project has been imported from GitHub. The first deployment will start automatically.
            </p>
            <Card className="max-w-md mx-auto mb-8">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Your project will be available at
                </p>
                <a
                  href={`https://${createdProject.slug}.tranthachnguyen.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {createdProject.slug}.tranthachnguyen.com
                </a>
              </CardContent>
            </Card>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href={`/projects/${createdProject.slug}`}>
                  View Project Dashboard
                </Link>
              </Button>
              <Button variant="primary" asChild>
                <Link href="/new">
                  Import Another Project
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
