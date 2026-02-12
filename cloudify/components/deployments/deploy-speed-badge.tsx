"use client";

import { useMemo } from "react";
import { Zap, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeploySpeedBadgeProps {
  /** Duration string of this deployment (e.g. "45s", "1m 23s", "2m 5s") */
  duration: string | null;
  /** All durations from the current list to compute average */
  allDurations: (string | null)[];
  className?: string;
}

/**
 * Parse a duration string like "45s", "1m 23s", "2m 5s" into seconds.
 * Also handles raw second values like "45" and ms values like "1200ms".
 */
function parseDurationToSeconds(duration: string): number | null {
  if (!duration) return null;

  // Handle "Xms" format
  const msMatch = duration.match(/^(\d+(?:\.\d+)?)\s*ms$/i);
  if (msMatch) {
    return parseFloat(msMatch[1]) / 1000;
  }

  // Handle "Xm Ys" format
  const minSecMatch = duration.match(/^(\d+)\s*m\s+(\d+)\s*s$/i);
  if (minSecMatch) {
    return parseInt(minSecMatch[1]) * 60 + parseInt(minSecMatch[2]);
  }

  // Handle "Xs" format
  const secMatch = duration.match(/^(\d+(?:\.\d+)?)\s*s$/i);
  if (secMatch) {
    return parseFloat(secMatch[1]);
  }

  // Handle "Xm" format
  const minMatch = duration.match(/^(\d+(?:\.\d+)?)\s*m$/i);
  if (minMatch) {
    return parseFloat(minMatch[1]) * 60;
  }

  // Handle raw number (assume seconds)
  const rawNum = parseFloat(duration);
  if (!isNaN(rawNum)) {
    return rawNum;
  }

  return null;
}

/**
 * Format seconds back into a readable string
 */
function formatSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function DeploySpeedBadge({
  duration,
  allDurations,
  className,
}: DeploySpeedBadgeProps) {
  const badge = useMemo(() => {
    if (!duration) return null;

    const currentSeconds = parseDurationToSeconds(duration);
    if (currentSeconds === null) return null;

    // Calculate average from all completed deployments with durations
    const validDurations = allDurations
      .filter((d): d is string => d !== null)
      .map(parseDurationToSeconds)
      .filter((d): d is number => d !== null);

    if (validDurations.length < 2) {
      // Not enough data to compare — just show the time
      return {
        text: `Built in ${formatSeconds(currentSeconds)}`,
        icon: Zap,
        colorClass:
          "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
        comparison: null,
      };
    }

    const average =
      validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length;
    const diff = ((average - currentSeconds) / average) * 100;
    const absDiff = Math.abs(Math.round(diff));

    if (absDiff < 5) {
      // Within 5% of average — essentially the same
      return {
        text: `Built in ${formatSeconds(currentSeconds)}`,
        icon: Minus,
        colorClass:
          "text-[var(--text-secondary)] bg-[var(--surface-secondary)]/50",
        comparison: "avg speed",
      };
    }

    if (diff > 0) {
      // Faster than average
      return {
        text: `Built in ${formatSeconds(currentSeconds)}`,
        icon: TrendingDown,
        colorClass:
          "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
        comparison: `${absDiff}% faster`,
      };
    }

    // Slower than average
    return {
      text: `Built in ${formatSeconds(currentSeconds)}`,
      icon: TrendingUp,
      colorClass:
        "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
      comparison: `${absDiff}% slower`,
    };
  }, [duration, allDurations]);

  if (!badge) return null;

  const BadgeIcon = badge.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
        badge.colorClass,
        className
      )}
    >
      <BadgeIcon className="h-3 w-3" />
      {badge.text}
      {badge.comparison && (
        <span className="opacity-75">({badge.comparison})</span>
      )}
    </span>
  );
}
