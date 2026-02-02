"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
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

const repositories = [
  {
    id: "repo-1",
    name: "my-portfolio",
    fullName: "johndoe/my-portfolio",
    private: false,
    updatedAt: "2 hours ago",
    defaultBranch: "main",
  },
  {
    id: "repo-2",
    name: "ecommerce-store",
    fullName: "johndoe/ecommerce-store",
    private: true,
    updatedAt: "1 day ago",
    defaultBranch: "main",
  },
  {
    id: "repo-3",
    name: "blog-app",
    fullName: "johndoe/blog-app",
    private: false,
    updatedAt: "3 days ago",
    defaultBranch: "main",
  },
  {
    id: "repo-4",
    name: "api-service",
    fullName: "johndoe/api-service",
    private: true,
    updatedAt: "1 week ago",
    defaultBranch: "develop",
  },
  {
    id: "repo-5",
    name: "mobile-app",
    fullName: "johndoe/mobile-app",
    private: false,
    updatedAt: "2 weeks ago",
    defaultBranch: "main",
  },
];

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
  const [step, setStep] = useState<Step>("source");
  const [selectedRepo, setSelectedRepo] = useState<typeof repositories[0] | null>(null);
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState("Next.js");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployComplete, setDeployComplete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [gitProvider, setGitProvider] = useState("github");

  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRepo = (repo: typeof repositories[0]) => {
    setSelectedRepo(repo);
    setProjectName(repo.name);
    setStep("configure");
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    // Simulate deployment
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsDeploying(false);
    setDeployComplete(true);
    setStep("deploy");
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
                  <Button variant="ghost" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                {/* Repository List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredRepos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => handleSelectRepo(repo)}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/10 transition-colors text-left"
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
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {repo.fullName}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {repo.updatedAt}
                      </div>
                    </button>
                  ))}
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

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep("source")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button variant="primary" onClick={handleDeploy} disabled={isDeploying}>
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    Deploy
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Deploy Success */}
        {step === "deploy" && deployComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Congratulations!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Your project has been successfully deployed.
            </p>
            <Card className="max-w-md mx-auto mb-8">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Your project is live at
                </p>
                <a
                  href={`https://${projectName}.cloudify.app`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {projectName}.cloudify.app
                </a>
              </CardContent>
            </Card>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href={`/projects/${projectName}`}>
                  View Project
                </Link>
              </Button>
              <Button variant="primary" asChild>
                <a
                  href={`https://${projectName}.cloudify.app`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit Site
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
