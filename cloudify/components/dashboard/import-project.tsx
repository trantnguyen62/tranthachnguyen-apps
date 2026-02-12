"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Globe,
  ChevronRight,
  ChevronDown,
  Loader2,
  Check,
  AlertCircle,
  ArrowLeft,
  Settings,
  Zap,
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

type Step = "url" | "detect" | "configure" | "deploying" | "done";

interface DetectedFramework {
  name: string;
  slug: string;
  buildCommand: string;
  outputDirectory: string;
  installCommand: string;
  icon: string;
  confidence: number;
}

const FRAMEWORK_OPTIONS = [
  { name: "Next.js", slug: "nextjs", buildCommand: "npm run build", outputDirectory: ".next", installCommand: "npm install", icon: "▲" },
  { name: "Vite", slug: "vite", buildCommand: "npm run build", outputDirectory: "dist", installCommand: "npm install", icon: "V" },
  { name: "React (CRA)", slug: "cra", buildCommand: "npm run build", outputDirectory: "build", installCommand: "npm install", icon: "R" },
  { name: "Vue", slug: "vue", buildCommand: "npm run build", outputDirectory: "dist", installCommand: "npm install", icon: "V" },
  { name: "Svelte", slug: "sveltekit", buildCommand: "npm run build", outputDirectory: "build", installCommand: "npm install", icon: "S" },
  { name: "Astro", slug: "astro", buildCommand: "npm run build", outputDirectory: "dist", installCommand: "npm install", icon: "A" },
  { name: "Nuxt", slug: "nuxt", buildCommand: "npm run build", outputDirectory: ".output", installCommand: "npm install", icon: "N" },
  { name: "Remix", slug: "remix", buildCommand: "npm run build", outputDirectory: "build", installCommand: "npm install", icon: "R" },
  { name: "Gatsby", slug: "gatsby", buildCommand: "npm run build", outputDirectory: "public", installCommand: "npm install", icon: "G" },
  { name: "Static HTML", slug: "static", buildCommand: "", outputDirectory: ".", installCommand: "", icon: "H" },
  { name: "Other", slug: "other", buildCommand: "npm run build", outputDirectory: "dist", installCommand: "npm install", icon: "?" },
];

/**
 * Streamlined "Import from Git URL" wizard.
 *
 * 4 steps:
 *   1. Enter Git URL
 *   2. Auto-detect framework (calls API)
 *   3. Configure build settings (pre-filled from detection)
 *   4. Deploy
 */
export function ImportProject() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("url");

  // Step 1
  const [gitUrl, setGitUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Step 2
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<DetectedFramework | null>(null);

  // Step 3
  const [projectName, setProjectName] = useState("");
  const [branch, setBranch] = useState("main");
  const [buildCommand, setBuildCommand] = useState("npm run build");
  const [outputDir, setOutputDir] = useState("dist");
  const [installCommand, setInstallCommand] = useState("npm install");
  const [selectedFramework, setSelectedFramework] = useState("other");

  // Step 4
  const [deployError, setDeployError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<{
    id: string;
    slug: string;
    name: string;
  } | null>(null);

  /**
   * Validate Git URL format
   */
  const isValidGitUrl = useCallback((url: string): boolean => {
    // Accept HTTPS Git URLs and SSH-style URLs
    return (
      /^https?:\/\/(github|gitlab|bitbucket)\.(com|org)\/[^/]+\/[^/]+/i.test(url) ||
      /^git@(github|gitlab|bitbucket)\.(com|org):[^/]+\/[^/]+/i.test(url) ||
      /^https?:\/\/.+\/.+\/.+/i.test(url)
    );
  }, []);

  /**
   * Extract project name from Git URL
   */
  const extractProjectName = useCallback((url: string): string => {
    const match = url.match(/\/([^/]+?)(?:\.git)?$/);
    return match ? match[1].toLowerCase().replace(/[^a-z0-9-]/g, "-") : "my-project";
  }, []);

  /**
   * Step 1 -> Step 2: Start framework detection
   */
  const handleSubmitUrl = async () => {
    if (!gitUrl.trim()) {
      setUrlError("Please enter a Git repository URL");
      return;
    }
    if (!isValidGitUrl(gitUrl.trim())) {
      setUrlError("Please enter a valid Git URL (e.g., https://github.com/user/repo)");
      return;
    }

    setUrlError(null);
    setDetecting(true);
    setStep("detect");

    const name = extractProjectName(gitUrl.trim());
    setProjectName(name);

    try {
      // Try to auto-detect framework via API
      const response = await fetch("/api/framework-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: gitUrl.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.framework) {
          const fw: DetectedFramework = {
            name: data.framework.name || "Other",
            slug: data.framework.slug || "other",
            buildCommand: data.framework.buildCommand || "npm run build",
            outputDirectory: data.framework.outputDirectory || "dist",
            installCommand: data.framework.installCommand || "npm install",
            icon: data.framework.icon || "?",
            confidence: data.confidence || 0,
          };
          setDetected(fw);
          setSelectedFramework(fw.slug);
          setBuildCommand(fw.buildCommand);
          setOutputDir(fw.outputDirectory);
          setInstallCommand(fw.installCommand);
          if (data.branch) setBranch(data.branch);
        }
      }
    } catch {
      // Detection failed — user can configure manually
    } finally {
      setDetecting(false);
      setStep("configure");
    }
  };

  /**
   * Step 3 -> Step 4: Deploy the project
   */
  const handleDeploy = async () => {
    setStep("deploying");
    setDeployError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          repoUrl: gitUrl.trim(),
          branch,
          framework: selectedFramework,
          buildCommand,
          outputDirectory: outputDir,
          installCommand,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setCreatedProject({
        id: data.project?.id || data.id,
        slug: data.project?.slug || data.slug || projectName,
        name: data.project?.name || data.name || projectName,
      });
      setStep("done");
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : "Deployment failed");
      setStep("configure");
    }
  };

  /**
   * Select a framework from the dropdown and pre-fill settings
   */
  const handleSelectFramework = (slug: string) => {
    setSelectedFramework(slug);
    const fw = FRAMEWORK_OPTIONS.find((f) => f.slug === slug);
    if (fw) {
      setBuildCommand(fw.buildCommand);
      setOutputDir(fw.outputDirectory);
      setInstallCommand(fw.installCommand);
    }
  };

  const stepLabels = ["Git URL", "Detect", "Configure", "Deploy"];
  const stepKeys: Step[] = ["url", "detect", "configure", "deploying"];
  const currentStepIndex = stepKeys.indexOf(
    step === "done" ? "deploying" : step
  );

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                i < currentStepIndex
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : i === currentStepIndex
                  ? "bg-foreground text-background"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800"
              )}
            >
              {i < currentStepIndex ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                "ml-2 text-sm font-medium",
                i === currentStepIndex
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]"
              )}
            >
              {label}
            </span>
            {i < stepLabels.length - 1 && (
              <ChevronRight className="mx-3 h-4 w-4 text-gray-400" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Enter Git URL */}
      {step === "url" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Import from Git URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Git Repository URL
              </label>
              <Input
                placeholder="https://github.com/user/my-project"
                value={gitUrl}
                onChange={(e) => {
                  setGitUrl(e.target.value);
                  setUrlError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitUrl()}
                className={cn(urlError && "border-red-500")}
              />
              {urlError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {urlError}
                </p>
              )}
              <p className="text-xs text-[var(--text-secondary)]">
                Supports GitHub, GitLab, and Bitbucket URLs. The repo must be
                accessible (public or connected via OAuth).
              </p>
            </div>

            <Button onClick={handleSubmitUrl} className="w-full">
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Detecting framework (shown briefly) */}
      {step === "detect" && detecting && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#0070f3] mx-auto mb-4" />
            <p className="text-[var(--text-primary)] font-medium mb-1">
              Analyzing repository...
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Detecting framework and build settings
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configure */}
      {step === "configure" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure Project
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Detected framework badge */}
            {detected && detected.confidence > 50 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Auto-detected <strong>{detected.name}</strong> with{" "}
                  {detected.confidence}% confidence
                </span>
              </div>
            )}

            {/* Git URL display */}
            <div className="p-3 rounded-lg bg-[var(--surface-secondary)]/50 border border-[var(--border-primary)]">
              <p className="text-sm text-[var(--text-secondary)]">Repository</p>
              <p className="font-mono text-sm text-[var(--text-primary)] truncate">
                {gitUrl}
              </p>
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Project Name
              </label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-project"
              />
              <p className="text-xs text-[var(--text-secondary)]">
                Available at {projectName || "my-project"}.cloudify.app
              </p>
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Branch
              </label>
              <Input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
              />
            </div>

            {/* Framework Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Framework
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="w-full justify-between">
                    {FRAMEWORK_OPTIONS.find((f) => f.slug === selectedFramework)
                      ?.name || "Other"}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full max-h-64 overflow-y-auto">
                  {FRAMEWORK_OPTIONS.map((fw) => (
                    <DropdownMenuItem
                      key={fw.slug}
                      onClick={() => handleSelectFramework(fw.slug)}
                    >
                      <span className="mr-2 w-5 text-center">{fw.icon}</span>
                      {fw.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Build Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-[var(--text-primary)]">
                Build Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-[var(--text-secondary)]">
                    Build Command
                  </label>
                  <Input
                    value={buildCommand}
                    onChange={(e) => setBuildCommand(e.target.value)}
                    placeholder="npm run build"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-[var(--text-secondary)]">
                    Output Directory
                  </label>
                  <Input
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    placeholder="dist"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-[var(--text-secondary)]">
                    Install Command
                  </label>
                  <Input
                    value={installCommand}
                    onChange={(e) => setInstallCommand(e.target.value)}
                    placeholder="npm install"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Error display */}
            {deployError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {deployError}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("url");
                  setDeployError(null);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleDeploy} disabled={!projectName.trim()}>
                Deploy
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Deploying */}
      {step === "deploying" && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#0070f3] mx-auto mb-4" />
            <p className="text-[var(--text-primary)] font-medium mb-1">
              Creating project...
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Setting up {projectName} and triggering first deployment
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Done */}
      {step === "done" && createdProject && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Project Created!
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Your project is being deployed. The first build will start
              shortly.
            </p>
            <div className="p-4 rounded-lg bg-[var(--surface-secondary)]/50 border border-[var(--border-primary)] max-w-sm mx-auto mb-6">
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                Available at
              </p>
              <p className="text-[#0070f3] font-medium">
                {createdProject.slug}.cloudify.app
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                onClick={() =>
                  router.push(`/projects/${createdProject.slug}`)
                }
              >
                View Project
              </Button>
              <Button
                onClick={() => {
                  setStep("url");
                  setGitUrl("");
                  setProjectName("");
                  setDetected(null);
                  setCreatedProject(null);
                }}
              >
                Import Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
