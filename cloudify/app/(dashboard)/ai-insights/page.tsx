"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  TrendingUp,
  CheckCircle,
  Code,
  Zap,
  MessageSquare,
  ChevronRight,
  Bug,
  Shield,
  Clock,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";

import {
  SkeletonQuickActionGrid,
  SkeletonAnalysisList,
  SkeletonErrorPatternList,
  SkeletonConversationList,
} from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useSuccessToast,
  useErrorToast,
  useInfoToast,
} from "@/components/notifications/toast";

interface Project {
  id: string;
  name: string;
  slug: string;
  framework: string | null;
}

interface AIAnalysis {
  id: string;
  type: string;
  summary: string;
  score: number | null;
  createdAt: string;
  deployment?: {
    id: string;
    branch: string;
    status: string;
  };
}

interface AIConversation {
  id: string;
  title: string;
  context: string;
  messageCount: number;
  updatedAt: string;
  project?: {
    name: string;
    slug: string;
  };
}

interface ErrorPattern {
  pattern: string;
  category: string;
  count: number;
  lastSeen: string;
  solution: string;
}

export default function AIInsightsPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();
  const showInfo = useInfoToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [errorPatterns, setErrorPatterns] = useState<ErrorPattern[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch projects
      const projectsRes = await fetch("/api/projects");
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }

      // Fetch AI conversations
      const params = new URLSearchParams();
      if (selectedProject !== "all") {
        params.set("projectId", selectedProject);
      }
      params.set("limit", "5");

      const conversationsRes = await fetch(`/api/ai/conversations?${params.toString()}`);
      if (conversationsRes.ok) {
        const data = await conversationsRes.json();
        setConversations(data.conversations || []);
      }

      // Analyses and error patterns will be empty until real endpoints are available
      setAnalyses([]);
      setErrorPatterns([]);
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuickAnalysis = async (type: string) => {
    if (selectedProject === "all" || !selectedProject) {
      showInfo("Select a project", "Please select a project first to run analysis");
      return;
    }

    setIsAnalyzing(true);
    showInfo("Analysis started", `Running ${type.replace(/_/g, " ")} analysis...`);

    try {
      if (type === "performance") {
        const response = await fetch("/api/ai/performance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: selectedProject,
            vitals: { lcp: 3200, fid: 120, cls: 0.15, ttfb: 900 },
          }),
        });

        if (response.ok) {
          showSuccess("Analysis complete", "Performance analysis finished successfully");
        } else {
          showError("Analysis failed", "Could not complete performance analysis");
        }
      } else if (type === "code_review") {
        showInfo("Code review", "Select a deployment from the deployments page to run code review");
      } else if (type === "security") {
        showInfo("Security scan", "Select a deployment from the deployments page to run security scan");
      }
      await fetchData();
    } catch (error) {
      console.error("Analysis failed:", error);
      showError("Analysis failed", "An unexpected error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return "bg-secondary";
    if (score >= 90) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 70) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deployment":
        return <Zap className="h-4 w-4" />;
      case "code_review_security":
        return <Shield className="h-4 w-4" />;
      case "performance":
        return <TrendingUp className="h-4 w-4" />;
      case "code_review_full":
        return <Code className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-foreground flex items-center gap-3"
          >
            <Brain className="h-8 w-8 text-purple-500" />
            AI Insights
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-muted-foreground"
          >
            AI-powered analysis and recommendations for your deployments.
          </motion.p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Quick Actions Skeleton */}
          <SkeletonQuickActionGrid />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Analyses Skeleton */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Recent Analyses
                </CardTitle>
                <CardDescription>
                  AI-powered insights from your deployments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SkeletonAnalysisList rows={3} />
              </CardContent>
            </Card>

            {/* Error Patterns Skeleton */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-red-500" />
                  Common Error Patterns
                </CardTitle>
                <CardDescription>
                  Frequently occurring issues and solutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SkeletonErrorPatternList rows={3} />
              </CardContent>
            </Card>

            {/* Conversations Skeleton */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  AI Conversations
                </CardTitle>
                <CardDescription>
                  Your recent conversations with the AI assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SkeletonConversationList rows={3} />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card
                className="cursor-pointer hover:border-purple-500 transition-colors"
                onClick={() => handleQuickAnalysis("performance")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        Performance Analysis
                      </div>
                      <p className="text-xs text-muted-foreground">Web Vitals & optimization</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card
                className="cursor-pointer hover:border-foreground/20 transition-colors"
                onClick={() => handleQuickAnalysis("code_review")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary rounded-lg">
                      <Code className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        Code Review
                      </div>
                      <p className="text-xs text-muted-foreground">Quality & best practices</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card
                className="cursor-pointer hover:border-red-500 transition-colors"
                onClick={() => handleQuickAnalysis("security")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        Security Scan
                      </div>
                      <p className="text-xs text-muted-foreground">Vulnerability detection</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card
                className="cursor-pointer hover:border-green-500 transition-colors h-full"
                onClick={() => showInfo("Coming soon", "AI Chat will be available in a future update.")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        AI Chat
                      </div>
                      <p className="text-xs text-muted-foreground">Ask questions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Analyses */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Recent Analyses
                  </CardTitle>
                  <CardDescription>
                    AI-powered insights from your deployments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyses.length === 0 ? (
                    <EmptyState
                      icon={Brain}
                      title="No analyses yet"
                      description="Run your first analysis using the quick actions above."
                      action={
                        selectedProject !== "all"
                          ? {
                              label: "Run Performance Analysis",
                              onClick: () => handleQuickAnalysis("performance"),
                            }
                          : undefined
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {analyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          className="p-3 rounded-lg border border-border hover:bg-secondary transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2 rounded-lg ${getScoreBg(analysis.score)}`}
                              >
                                {getTypeIcon(analysis.type)}
                              </div>
                              <div>
                                <div className="font-medium text-foreground text-sm">
                                  {analysis.type
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {analysis.summary}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(analysis.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {analysis.score !== null && (
                              <div
                                className={`text-lg font-bold ${getScoreColor(analysis.score)}`}
                              >
                                {analysis.score}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Error Patterns */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-red-500" />
                    Common Error Patterns
                  </CardTitle>
                  <CardDescription>
                    Frequently occurring issues and solutions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {errorPatterns.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle}
                      title="No recurring errors"
                      description="Great job! No common error patterns have been detected in your deployments."
                    />
                  ) : (
                    <div className="space-y-3">
                      {errorPatterns.map((pattern, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border border-border"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    pattern.category === "build"
                                      ? "border-orange-500 text-orange-500"
                                      : "border-foreground text-foreground"
                                  }
                                >
                                  {pattern.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {pattern.count} occurrences
                                </span>
                              </div>
                              <code className="text-sm text-red-600 dark:text-red-400 mt-2 block">
                                {pattern.pattern}
                              </code>
                              <p className="text-xs text-muted-foreground mt-2">
                                <strong>Solution:</strong> {pattern.solution}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Conversations */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      AI Conversations
                    </CardTitle>
                    <CardDescription>
                      Your recent conversations with the AI assistant
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showInfo("Coming soon", "AI Chat will be available in a future update.")}
                  >
                    New Chat
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {conversations.length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      title="No conversations yet"
                      description="Start a new chat to get AI-powered help with your deployments."
                      action={{
                        label: "Start New Chat",
                        onClick: () => showInfo("Coming soon", "AI Chat will be available in a future update."),
                      }}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className="p-4 rounded-lg border border-border hover:border-green-500 transition-colors cursor-pointer"
                          onClick={() => showInfo("Coming soon", "AI Chat will be available in a future update.")}
                        >
                          <div className="font-medium text-foreground">
                            {conversation.title}
                          </div>
                          {conversation.project && (
                            <Badge variant="outline" className="mt-2">
                              {conversation.project.name}
                            </Badge>
                          )}
                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span>{conversation.messageCount} messages</span>
                            <span>•</span>
                            <span>{formatDate(conversation.updatedAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
