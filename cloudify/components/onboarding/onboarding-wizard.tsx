"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  GitBranch,
  Settings,
  Rocket,
  PartyPopper,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Save,
  Github,
  Search,
  RefreshCw,
  Folder,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  initialStep?: number;
  onComplete: () => void;
}

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

const WIZARD_STEPS = [
  { id: 1, name: "Profile", icon: User, label: "Set up profile" },
  { id: 2, name: "Repository", icon: GitBranch, label: "Connect repository" },
  { id: 3, name: "Configure", icon: Settings, label: "Configure project" },
  { id: 4, name: "Deploy", icon: Rocket, label: "Deploy" },
  { id: 5, name: "Success", icon: PartyPopper, label: "All done!" },
];

const FRAMEWORKS = [
  { name: "Next.js", value: "nextjs", icon: "▲", buildCmd: "npm run build", outputDir: ".next" },
  { name: "React", value: "react", icon: "⚛️", buildCmd: "npm run build", outputDir: "build" },
  { name: "Vue", value: "vue", icon: "💚", buildCmd: "npm run build", outputDir: "dist" },
  { name: "Svelte", value: "svelte", icon: "🔥", buildCmd: "npm run build", outputDir: "build" },
  { name: "Astro", value: "astro", icon: "🚀", buildCmd: "npm run build", outputDir: "dist" },
  { name: "Static", value: "static", icon: "📄", buildCmd: "", outputDir: "public" },
];

// ─── Component ───────────────────────────────────────────────────────

export function OnboardingWizard({ initialStep = 1, onComplete }: OnboardingWizardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep || 1);

  // Step 1: Profile
  const [displayName, setDisplayName] = useState(session?.user?.name || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Step 2: Repository
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [gitUrl, setGitUrl] = useState("");
  const [useManualUrl, setUseManualUrl] = useState(false);

  // Step 3: Configure
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState("nextjs");
  const [branch, setBranch] = useState("main");
  const [buildCmd, setBuildCmd] = useState("npm run build");
  const [outputDir, setOutputDir] = useState(".next");

  // Step 4: Deploy
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<{
    id: string;
    slug: string;
    name: string;
  } | null>(null);

  // Step 5: Success (confetti)
  const [confettiPieces, setConfettiPieces] = useState<
    Array<{ id: number; x: number; y: number; rotation: number; color: string; delay: number }>
  >([]);

  const progressPercentage = (currentStep / WIZARD_STEPS.length) * 100;

  // Auto-detect framework from repo language
  const detectFramework = useCallback((repo: Repository) => {
    const lang = (repo.language || "").toLowerCase();
    if (lang === "typescript" || lang === "javascript") return "nextjs";
    if (lang === "vue") return "vue";
    if (lang === "svelte") return "svelte";
    return "nextjs";
  }, []);

  // Fetch repositories
  const fetchRepos = useCallback(async () => {
    setRepoLoading(true);
    setRepoError(null);
    try {
      const res = await fetch(`/api/github/repos?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && data.error?.includes("GitHub account not connected")) {
          setRepoError("GitHub account not connected. Use manual Git URL instead.");
          setUseManualUrl(true);
        } else {
          setRepoError(data.error || "Failed to load repositories");
        }
        setRepositories([]);
        return;
      }
      setRepositories(data.repos || []);
    } catch {
      setRepoError("Failed to connect to server");
      setRepositories([]);
    } finally {
      setRepoLoading(false);
    }
  }, [searchQuery]);

  // Fetch repos on step 2
  useEffect(() => {
    if (currentStep === 2 && !useManualUrl) {
      const timeoutId = setTimeout(() => fetchRepos(), 300);
      return () => clearTimeout(timeoutId);
    }
  }, [currentStep, fetchRepos, useManualUrl]);

  // Update session name
  useEffect(() => {
    if (session?.user?.name && !displayName) {
      setDisplayName(session.user.name);
    }
  }, [session, displayName]);

  // Generate confetti on step 5
  useEffect(() => {
    if (currentStep === 5) {
      const colors = [
        "#3b82f6", "#8b5cf6", "#ec4899", "#10b981",
        "#f59e0b", "#ef4444", "#06b6d4", "#84cc16",
      ];
      const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
      }));
      setConfettiPieces(pieces);
    }
  }, [currentStep]);

  // Save step progress to API
  const saveStepProgress = async (step: number) => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step }),
      });
    } catch {
      // Non-blocking
    }
  };

  const completeOnboarding = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
    } catch {
      // Non-blocking
    }
  };

  // Step navigation
  const goToStep = async (step: number) => {
    setCurrentStep(step);
    await saveStepProgress(step);
  };

  const nextStep = async () => {
    const next = Math.min(currentStep + 1, 5);
    await goToStep(next);
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  // ─── Step Handlers ────────────────────────────────────────────

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName }),
      });
      if (res.ok) {
        setProfileSaved(true);
        setTimeout(() => nextStep(), 600);
      }
    } catch {
      // Allow user to continue anyway
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo);
    setProjectName(repo.name);
    setBranch(repo.defaultBranch);
    setGitUrl(repo.htmlUrl);

    const detected = detectFramework(repo);
    setFramework(detected);
    const fw = FRAMEWORKS.find((f) => f.value === detected);
    if (fw) {
      setBuildCmd(fw.buildCmd);
      setOutputDir(fw.outputDir);
    }

    nextStep();
  };

  const handleManualUrlSubmit = () => {
    if (!gitUrl.trim()) return;

    // Extract project name from URL
    const parts = gitUrl.replace(/\.git$/, "").split("/");
    const repoName = parts[parts.length - 1] || "my-project";
    setProjectName(repoName);
    setSelectedRepo(null);
    nextStep();
  };

  const handleFrameworkChange = (value: string) => {
    setFramework(value);
    const fw = FRAMEWORKS.find((f) => f.value === value);
    if (fw) {
      setBuildCmd(fw.buildCmd);
      setOutputDir(fw.outputDir);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployError(null);
    setDeployProgress(0);
    setDeployLogs(["Initializing deployment..."]);

    try {
      // Simulate progress updates for better UX
      const progressInterval = setInterval(() => {
        setDeployProgress((prev) => {
          if (prev >= 80) return prev;
          return prev + Math.random() * 15;
        });
      }, 800);

      setDeployLogs((prev) => [...prev, "Creating project..."]);

      // Create project via the GitHub repos endpoint or projects endpoint
      const repoFullName = selectedRepo?.fullName;

      let res;
      if (repoFullName) {
        res = await fetch("/api/github/repos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repoFullName,
            projectName,
            branch,
          }),
        });
      } else {
        // Manual URL or no repo selected - use the projects API
        res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: projectName,
            repoUrl: gitUrl || undefined,
            branch,
            framework,
            buildCmd,
            outputDir,
          }),
        });
      }

      const data = await res.json();

      clearInterval(progressInterval);

      if (!res.ok && res.status !== 409) {
        throw new Error(data.error || "Failed to create project");
      }

      setDeployLogs((prev) => [...prev, "Project created successfully!"]);
      setDeployProgress(90);

      const project = res.status === 409
        ? { id: data.projectId, slug: data.projectSlug, name: projectName }
        : data.project || data;

      setCreatedProject({
        id: project.id,
        slug: project.slug,
        name: project.name || projectName,
      });

      setDeployLogs((prev) => [...prev, "Deployment queued!", "Build will start shortly..."]);
      setDeployProgress(100);

      // Move to success
      setTimeout(async () => {
        await goToStep(5);
        await completeOnboarding();
      }, 1000);
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : "Deployment failed");
      setDeployProgress(0);
      setDeployLogs((prev) => [...prev, `Error: ${err instanceof Error ? err.message : "Unknown error"}`]);
    } finally {
      setIsDeploying(false);
    }
  };

  // ─── Step Renderers ───────────────────────────────────────────

  const avatarUrl = session?.user?.image;
  const userInitials = (displayName || session?.user?.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const renderStepContent = () => {
    switch (currentStep) {
      // ─── Step 1: Profile Setup ──────────────────────────────
      case 1:
        return (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Set up your profile
              </h2>
              <p className="text-[var(--text-secondary)]">
                This is how other team members will see you.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              {/* Avatar */}
              <div className="flex justify-center">
                <Avatar className="h-24 w-24 border-4 border-[var(--surface-primary)] shadow-lg">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Display Name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="h-12 text-base"
                />
                <p className="text-xs text-[var(--text-secondary)]">
                  Your avatar is synced from your GitHub profile.
                </p>
              </div>

              {/* Save Button */}
              <Button
                className="w-full h-12 text-base"
                onClick={handleSaveProfile}
                disabled={!displayName.trim() || isSavingProfile}
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : profileSaved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save & Continue
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );

      // ─── Step 2: Connect Repository ─────────────────────────
      case 2:
        return (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Connect a repository
              </h2>
              <p className="text-[var(--text-secondary)]">
                Import a Git repository to deploy.
              </p>
            </div>

            {/* Toggle between GitHub and manual */}
            <div className="flex justify-center gap-2">
              <Button
                variant={!useManualUrl ? "default" : "secondary"}
                size="sm"
                onClick={() => setUseManualUrl(false)}
              >
                <Github className="h-4 w-4 mr-1" />
                GitHub
              </Button>
              <Button
                variant={useManualUrl ? "default" : "secondary"}
                size="sm"
                onClick={() => setUseManualUrl(true)}
              >
                Git URL
              </Button>
            </div>

            {useManualUrl ? (
              <div className="max-w-lg mx-auto space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Git Repository URL</label>
                  <Input
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    placeholder="https://github.com/user/repo.git"
                    className="h-12"
                  />
                  <p className="text-xs text-[var(--text-secondary)]">
                    Enter a public Git URL. We will auto-detect the framework.
                  </p>
                </div>
                <Button
                  className="w-full h-12"
                  onClick={handleManualUrlSubmit}
                  disabled={!gitUrl.trim()}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="max-w-lg mx-auto space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                  <Input
                    placeholder="Search repositories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={fetchRepos}
                    disabled={repoLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", repoLoading && "animate-spin")} />
                  </Button>
                </div>

                {/* Repository list */}
                <div className="space-y-2 max-h-[340px] overflow-y-auto rounded-lg">
                  {repoLoading ? (
                    <div className="flex flex-col items-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)] mb-3" />
                      <p className="text-sm text-[var(--text-secondary)]">Loading repositories...</p>
                    </div>
                  ) : repoError ? (
                    <div className="flex flex-col items-center py-10">
                      <AlertCircle className="h-6 w-6 text-red-500 mb-3" />
                      <p className="text-sm text-red-600 dark:text-red-400 mb-3">{repoError}</p>
                      <Button variant="secondary" size="sm" onClick={() => setUseManualUrl(true)}>
                        Use Git URL instead
                      </Button>
                    </div>
                  ) : repositories.length === 0 ? (
                    <div className="flex flex-col items-center py-10">
                      <Folder className="h-6 w-6 text-[var(--text-secondary)] mb-3" />
                      <p className="text-sm text-[var(--text-secondary)]">No repositories found</p>
                    </div>
                  ) : (
                    repositories.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => !repo.imported && handleSelectRepo(repo)}
                        disabled={repo.imported}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors",
                          repo.imported
                            ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10 opacity-60"
                            : "border-[var(--border-primary)] hover:border-foreground/20 hover:bg-secondary"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Folder className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[var(--text-primary)] text-sm truncate">
                                {repo.name}
                              </span>
                              {repo.imported && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                                  Imported
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-xs text-[var(--text-secondary)] truncate">
                                {repo.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] shrink-0 ml-2">
                          {repo.language || ""}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        );

      // ─── Step 3: Configure Project ──────────────────────────
      case 3:
        return (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Configure your project
              </h2>
              <p className="text-[var(--text-secondary)]">
                We auto-detected your settings. Feel free to adjust.
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-5">
              {/* Project Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="my-project"
                  className="h-11"
                />
                <p className="text-xs text-[var(--text-secondary)]">
                  Available at {projectName || "your-project"}.tranthachnguyen.com
                </p>
              </div>

              {/* Framework */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Framework</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="w-full justify-between h-11">
                      <span className="flex items-center gap-2">
                        <span>{FRAMEWORKS.find((f) => f.value === framework)?.icon}</span>
                        {FRAMEWORKS.find((f) => f.value === framework)?.name || "Select"}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {FRAMEWORKS.map((fw) => (
                      <DropdownMenuItem key={fw.value} onClick={() => handleFrameworkChange(fw.value)}>
                        <span className="mr-2">{fw.icon}</span>
                        {fw.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Branch</label>
                <Input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="h-11"
                />
              </div>

              {/* Build Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Build Command</label>
                  <Input
                    value={buildCmd}
                    onChange={(e) => setBuildCmd(e.target.value)}
                    placeholder="npm run build"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Output Directory</label>
                  <Input
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    placeholder=".next"
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {/* Deploy Button */}
              <Button
                className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                onClick={handleDeploy}
                disabled={!projectName.trim()}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Deploy Project
              </Button>
            </div>
          </motion.div>
        );

      // ─── Step 4: Deploying ──────────────────────────────────
      case 4:
        return (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {deployError ? "Deployment Error" : "Deploying your project..."}
              </h2>
              <p className="text-[var(--text-secondary)]">
                {deployError
                  ? "Something went wrong. Please try again."
                  : "Sit back and relax while we set everything up."}
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Progress</span>
                  <span className="font-medium text-[var(--text-primary)]">{Math.round(deployProgress)}%</span>
                </div>
                <Progress value={deployProgress} className="h-3" />
              </div>

              {/* Deploy logs */}
              <Card className="bg-gray-950 border-gray-800">
                <CardContent className="p-4">
                  <div className="font-mono text-xs text-gray-300 space-y-1 max-h-[200px] overflow-y-auto">
                    {deployLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-gray-600 shrink-0">$</span>
                        <span className={log.startsWith("Error") ? "text-red-400" : ""}>{log}</span>
                      </div>
                    ))}
                    {isDeploying && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {deployError && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {deployError}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setCurrentStep(3)}>
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Go Back
                    </Button>
                    <Button onClick={handleDeploy}>Retry Deploy</Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );

      // ─── Step 5: Success ────────────────────────────────────
      case 5:
        return (
          <motion.div
            key="step-5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="space-y-8 relative"
          >
            {/* Confetti */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
              {confettiPieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  className="absolute w-3 h-3 rounded-sm"
                  style={{
                    left: `${piece.x}%`,
                    backgroundColor: piece.color,
                  }}
                  initial={{
                    y: piece.y,
                    rotate: 0,
                    opacity: 1,
                  }}
                  animate={{
                    y: "110vh",
                    rotate: piece.rotation + 720,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: piece.delay,
                    ease: "easeIn",
                  }}
                />
              ))}
            </div>

            <div className="text-center">
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6"
              >
                <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-[var(--text-primary)] mb-3"
              >
                You&apos;re all set!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-[var(--text-secondary)] text-lg mb-8"
              >
                Your project is being deployed. It will be live shortly.
              </motion.p>

              {createdProject && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="max-w-md mx-auto mb-8">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Cloud className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold text-[var(--text-primary)]">{createdProject.name}</span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mb-2">Your site will be available at</p>
                      <a
                        href={`https://${createdProject.slug}.tranthachnguyen.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                      >
                        {createdProject.slug}.tranthachnguyen.com
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center justify-center gap-4"
              >
                {createdProject && (
                  <Button variant="secondary" asChild>
                    <a
                      href={`https://${createdProject.slug}.tranthachnguyen.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Your Site
                    </a>
                  </Button>
                )}
                <Button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                  onClick={() => {
                    if (createdProject) {
                      router.push(`/projects/${createdProject.slug}`);
                    } else {
                      onComplete();
                    }
                  }}
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // ─── Main Render ──────────────────────────────────────────────

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Top Progress Bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="max-w-2xl mx-auto">
          {/* Step indicators */}
          <div className="flex items-center justify-between mb-4">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-300",
                      currentStep > step.id
                        ? "bg-green-500 text-white"
                        : currentStep === step.id
                          ? "bg-foreground text-background"
                          : "bg-[var(--surface-secondary)] text-[var(--text-secondary)]"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className="text-[10px] mt-1 text-[var(--text-secondary)] hidden sm:block">
                    {step.label}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-8 md:w-16 h-0.5 mx-1 md:mx-2 transition-colors duration-300",
                      currentStep > step.id ? "bg-green-500" : "bg-[var(--surface-secondary)]"
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <Progress value={progressPercentage} className="h-1.5" />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Navigation (except steps 4 and 5) */}
      {currentStep < 4 && currentStep !== 2 && (
        <div className="px-6 py-4 border-t border-[var(--border-primary)]">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="ghost"
              className="text-[var(--text-secondary)]"
              onClick={async () => {
                await completeOnboarding();
                onComplete();
              }}
            >
              Skip onboarding
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
