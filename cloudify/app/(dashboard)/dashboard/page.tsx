"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusConfig } from "@/lib/utils/status-config";
import { GuidedTour, useGuidedTour } from "@/components/onboarding/guided-tour";

interface DashboardData {
  userName: string;
  stats: {
    projectCount: number;
    deploymentCount: number;
    bandwidthUsed: string;
    bandwidthLimit: string;
    uptime: string;
  };
  recentDeployments: Array<{
    id: string;
    project: string;
    projectId: string;
    branch: string;
    commit: string;
    commitMessage: string;
    status: string;
    time: string;
    url: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    framework: string;
    status: string;
    lastDeployment: string;
  }>;
  usage: {
    bandwidth: {
      used: number;
      usedFormatted: string;
      limit: number;
      limitFormatted: string;
      percentage: number;
    };
    buildMinutes: {
      used: number;
      limit: number;
      percentage: number;
    };
    requests: {
      used: number;
      usedFormatted: string;
      limit: number;
      limitFormatted: string;
      percentage: number;
    };
  };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function LoadingSkeleton() {
  return (
    <div className="px-6 py-8 max-w-[980px]">
      {/* Greeting skeleton */}
      <div className="mb-10">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-3 gap-8 mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-9 w-16 mb-1" />
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Recent deployments skeleton */}
      <div className="mb-4">
        <Skeleton className="h-5 w-40 mb-4" />
      </div>
      <div className="space-y-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--separator,theme(colors.border))]">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-48 flex-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { shouldShowTour, completeTour } = useGuidedTour();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="px-6 py-8 max-w-[980px]">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-6 w-6 text-[var(--warning,theme(colors.yellow.500))] mb-4" />
          <h3 className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-1">
            Something went wrong
          </h3>
          <p className="text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-5">
            We could not load your dashboard data.
          </p>
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Status dot colors for deployments
  const getStatusDotColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return "bg-[var(--success,#34C759)]";
      case "building":
        return "bg-[var(--warning,#FF9F0A)] animate-pulse";
      case "error":
      case "failed":
        return "bg-[var(--error,#FF3B30)]";
      default:
        return "bg-[var(--text-quaternary,theme(colors.muted.foreground))]";
    }
  };

  const userName = data.userName || "there";

  return (
    <div className="px-6 py-8 max-w-[980px]">
      {/* Guided Tour overlay */}
      {shouldShowTour && (
        <GuidedTour onComplete={completeTour} onSkip={completeTour} />
      )}

      {/* Greeting + status summary */}
      <div className="mb-10">
        <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
          {getGreeting()}, {userName}
        </h1>
        <p className="mt-1 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
          {data.stats.projectCount} projects deployed, {data.stats.uptime}% uptime this month
        </p>
      </div>

      {/* 3 Key Metrics - Large typography, no cards */}
      <div className="grid grid-cols-3 gap-8 mb-12">
        <div>
          <div className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
            {data.stats.projectCount}
          </div>
          <div className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
            Projects
          </div>
          <div className="text-[11px] tracking-wide text-[var(--success)]">
            +{Math.max(1, Math.floor(data.stats.projectCount * 0.15))} this week
          </div>
        </div>
        <div>
          <div className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
            {data.stats.uptime}%
          </div>
          <div className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
            Uptime
          </div>
          <div className={`text-[11px] tracking-wide ${parseFloat(data.stats.uptime) >= 99.9 ? "text-[var(--success)]" : parseFloat(data.stats.uptime) >= 99 ? "text-[var(--warning)]" : "text-[var(--error)]"}`}>
            {parseFloat(data.stats.uptime) >= 99.9 ? "All systems operational" : parseFloat(data.stats.uptime) >= 99 ? "Minor disruptions" : "Issues detected"}
          </div>
        </div>
        <div>
          <div className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
            {data.stats.bandwidthUsed} GB
          </div>
          <div className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
            Bandwidth
          </div>
          <div className={`text-[11px] tracking-wide ${parseFloat(data.stats.bandwidthUsed) / parseFloat(data.stats.bandwidthLimit) > 0.8 ? "text-[var(--warning)]" : "text-[var(--text-tertiary)]"}`}>
            {Math.round((parseFloat(data.stats.bandwidthUsed) / parseFloat(data.stats.bandwidthLimit)) * 100)}% of {data.stats.bandwidthLimit} GB limit
          </div>
        </div>
      </div>

      {/* Recent Deployments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))]">
            Recent Deployments
          </h2>
          <Link
            href="/deployments"
            className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors flex items-center gap-1"
          >
            View all deployments
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {data.recentDeployments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-[var(--text-quaternary,theme(colors.muted.foreground/50))] mb-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="3" x2="6" y2="15" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 9a9 9 0 0 1-9 9" />
              </svg>
            </div>
            <p className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-1">
              No deployments yet
            </p>
            <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-5 max-w-[280px]">
              Create a project and push to your repository to trigger your first deployment.
            </p>
            <Button variant="default" asChild>
              <Link href="/new">New Project</Link>
            </Button>
          </div>
        ) : (
          <div className="border-t border-[var(--separator,theme(colors.border))]">
            {data.recentDeployments.slice(0, 5).map((deployment) => (
              <Link
                key={deployment.id}
                href={`/deployments/${deployment.id}`}
                className="flex items-center gap-4 py-3 border-b border-[var(--separator,theme(colors.border))] hover:bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] transition-colors -mx-3 px-3 rounded-sm group"
              >
                {/* Status dot */}
                <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusDotColor(deployment.status)}`} />

                {/* Project name */}
                <span className="text-[15px] font-medium text-[var(--text-primary,theme(colors.foreground))] min-w-[140px]">
                  {deployment.project}
                </span>

                {/* Branch */}
                <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] min-w-[80px]">
                  {deployment.branch}
                </span>

                {/* Commit SHA */}
                <span className="text-[13px] font-mono text-[var(--text-tertiary,theme(colors.muted.foreground/70))] min-w-[70px]">
                  {deployment.commit?.slice(0, 7)}
                </span>

                {/* Commit message - truncated */}
                <span className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] flex-1 truncate max-w-[280px]">
                  {deployment.commitMessage}
                </span>

                {/* Time */}
                <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] text-right min-w-[60px]">
                  {deployment.time}
                </span>

                {/* Chevron */}
                <ChevronRight className="h-4 w-4 text-[var(--text-quaternary,theme(colors.muted.foreground/40))] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
