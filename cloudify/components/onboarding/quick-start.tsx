"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Rocket,
  Globe,
  Settings,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// ─── Types ───────────────────────────────────────────────────────────

interface QuickStartItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: typeof Rocket;
  checkFn?: () => Promise<boolean>;
}

const QUICK_START_ITEMS: QuickStartItem[] = [
  {
    id: "deploy",
    label: "Deploy your first project",
    description: "Import a repo and deploy it to the cloud",
    href: "/new",
    icon: Rocket,
  },
  {
    id: "domain",
    label: "Add a custom domain",
    description: "Connect your own domain to a project",
    href: "/domains",
    icon: Globe,
  },
  {
    id: "env-vars",
    label: "Set up environment variables",
    description: "Configure secrets and environment settings",
    href: "/settings",
    icon: Settings,
  },
  {
    id: "team",
    label: "Invite a team member",
    description: "Collaborate with your team on projects",
    href: "/team",
    icon: Users,
  },
];

const DISMISSED_KEY = "cloudify-quick-start-dismissed";
const COMPLETED_KEY = "cloudify-quick-start-completed";

// ─── Component ───────────────────────────────────────────────────────

export function QuickStartGuide() {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load completed items and dismissed state
  useEffect(() => {
    const savedDismissed = localStorage.getItem(DISMISSED_KEY);
    const savedCompleted = localStorage.getItem(COMPLETED_KEY);

    if (savedDismissed === "true") {
      setDismissed(true);
    }

    if (savedCompleted) {
      try {
        const items = JSON.parse(savedCompleted);
        setCompletedItems(new Set(items));
      } catch {
        // Ignore parse errors
      }
    }

    setLoading(false);
  }, []);

  // Check real completion status from API
  const checkCompletion = useCallback(async () => {
    try {
      const [projectsRes, domainsRes, teamsRes] = await Promise.all([
        fetch("/api/projects").catch(() => null),
        fetch("/api/domains").catch(() => null),
        fetch("/api/teams").catch(() => null),
      ]);

      const newCompleted = new Set(completedItems);

      // Check if user has projects
      if (projectsRes?.ok) {
        const data = await projectsRes.json();
        const projects = Array.isArray(data) ? data : data.projects || [];
        if (projects.length > 0) {
          newCompleted.add("deploy");

          // Check if any project has env vars (heuristic)
          const hasEnvVars = projects.some(
            (p: { envVariables?: unknown[] }) =>
              p.envVariables && Array.isArray(p.envVariables) && p.envVariables.length > 0
          );
          if (hasEnvVars) {
            newCompleted.add("env-vars");
          }
        }
      }

      // Check if user has domains
      if (domainsRes?.ok) {
        const data = await domainsRes.json();
        const domains = Array.isArray(data) ? data : data.domains || [];
        if (domains.length > 0) {
          newCompleted.add("domain");
        }
      }

      // Check if user has team members
      if (teamsRes?.ok) {
        const data = await teamsRes.json();
        const teams = Array.isArray(data) ? data : data.teams || [];
        const hasMembers = teams.some(
          (t: { members?: unknown[] }) =>
            t.members && Array.isArray(t.members) && t.members.length > 1
        );
        if (hasMembers) {
          newCompleted.add("team");
        }
      }

      setCompletedItems(newCompleted);
      localStorage.setItem(COMPLETED_KEY, JSON.stringify([...newCompleted]));
    } catch {
      // Non-blocking
    }
  }, [completedItems]);

  useEffect(() => {
    if (!dismissed && !loading) {
      checkCompletion();
    }
  }, [dismissed, loading, checkCompletion]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  const handleToggleItem = (itemId: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemId)) {
      newCompleted.delete(itemId);
    } else {
      newCompleted.add(itemId);
    }
    setCompletedItems(newCompleted);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...newCompleted]));
  };

  // Don't show if dismissed, loading, or all items completed
  if (loading || dismissed) return null;

  const completedCount = completedItems.size;
  const totalCount = QUICK_START_ITEMS.length;
  const allCompleted = completedCount === totalCount;
  const progressPercentage = (completedCount / totalCount) * 100;

  // Auto-dismiss if all completed (with animation)
  if (allCompleted) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 1, height: "auto" }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      All done! You&apos;ve completed the quick start guide.
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Quick Start</CardTitle>
              <span className="text-xs text-[var(--text-secondary)]">
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm" 
                className="h-7 w-7"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm" 
                className="h-7 w-7"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-1.5 mt-2" />
        </CardHeader>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0 space-y-1">
                {QUICK_START_ITEMS.map((item) => {
                  const isCompleted = completedItems.has(item.id);
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors group"
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleItem(item.id)}
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all shrink-0 ${
                          isCompleted
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-[var(--border-primary)] hover:border-foreground/40"
                        }`}
                      >
                        {isCompleted && <Check className="h-3 w-3" />}
                      </button>

                      {/* Content */}
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <ItemIcon
                          className={`h-4 w-4 shrink-0 ${
                            isCompleted
                              ? "text-green-500"
                              : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                          }`}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isCompleted
                                ? "text-[var(--text-secondary)] line-through"
                                : "text-[var(--text-primary)]"
                            }`}
                          >
                            {item.label}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
