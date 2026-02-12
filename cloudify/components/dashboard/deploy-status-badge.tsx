"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DeploymentStatus =
  | "QUEUED"
  | "BUILDING"
  | "DEPLOYING"
  | "READY"
  | "ERROR"
  | "CANCELLED";

interface DeployStatusBadgeProps {
  /** Current deployment status */
  status: DeploymentStatus;
  /** Deployment ID for real-time polling (optional). When provided, the badge auto-updates. */
  deploymentId?: string;
  /** Polling interval in ms (default: 3000). Only used when deploymentId is set. */
  pollInterval?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show the status label text (default: true) */
  showLabel?: boolean;
  /** Callback when status changes (only fires during polling) */
  onStatusChange?: (newStatus: DeploymentStatus) => void;
}

const STATUS_CONFIG: Record<
  DeploymentStatus,
  {
    label: string;
    dotClass: string;
    badgeVariant: "default" | "secondary" | "success" | "warning" | "error" | "neutral";
    animate: boolean;
    icon?: "spinner" | "pulse";
  }
> = {
  QUEUED: {
    label: "Queued",
    dotClass: "bg-gray-400",
    badgeVariant: "secondary",
    animate: false,
    icon: "spinner",
  },
  BUILDING: {
    label: "Building",
    dotClass: "bg-yellow-400",
    badgeVariant: "warning",
    animate: true,
    icon: "pulse",
  },
  DEPLOYING: {
    label: "Deploying",
    dotClass: "bg-blue-400",
    badgeVariant: "default",
    animate: true,
    icon: "pulse",
  },
  READY: {
    label: "Ready",
    dotClass: "bg-green-500",
    badgeVariant: "success",
    animate: false,
  },
  ERROR: {
    label: "Error",
    dotClass: "bg-red-500",
    badgeVariant: "error",
    animate: false,
  },
  CANCELLED: {
    label: "Cancelled",
    dotClass: "bg-gray-400",
    badgeVariant: "secondary",
    animate: false,
  },
};

const SIZE_CLASSES = {
  sm: {
    badge: "text-[10px] px-1.5 py-0",
    dot: "h-1.5 w-1.5",
    ping: "h-1.5 w-1.5",
    spinner: "h-2.5 w-2.5",
  },
  md: {
    badge: "text-xs px-2 py-0.5",
    dot: "h-2 w-2",
    ping: "h-2 w-2",
    spinner: "h-3 w-3",
  },
  lg: {
    badge: "text-sm px-2.5 py-1",
    dot: "h-2.5 w-2.5",
    ping: "h-2.5 w-2.5",
    spinner: "h-3.5 w-3.5",
  },
};

export function DeployStatusBadge({
  status: initialStatus,
  deploymentId,
  pollInterval = 3000,
  size = "md",
  showLabel = true,
  onStatusChange,
}: DeployStatusBadgeProps) {
  const [currentStatus, setCurrentStatus] =
    useState<DeploymentStatus>(initialStatus);

  // Keep in sync with prop changes
  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  // Optional polling for real-time updates
  const pollStatus = useCallback(async () => {
    if (!deploymentId) return;
    try {
      const res = await fetch(`/api/deployments/${deploymentId}`);
      if (!res.ok) return;
      const data = await res.json();
      const newStatus = data.status as DeploymentStatus;
      if (newStatus && newStatus !== currentStatus) {
        setCurrentStatus(newStatus);
        onStatusChange?.(newStatus);
      }
    } catch {
      // Silently fail on network errors
    }
  }, [deploymentId, currentStatus, onStatusChange]);

  useEffect(() => {
    if (!deploymentId) return;

    // Only poll for non-terminal statuses
    const isTerminal =
      currentStatus === "READY" ||
      currentStatus === "ERROR" ||
      currentStatus === "CANCELLED";

    if (isTerminal) return;

    const interval = setInterval(pollStatus, pollInterval);
    return () => clearInterval(interval);
  }, [deploymentId, currentStatus, pollInterval, pollStatus]);

  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.QUEUED;
  const sizeConfig = SIZE_CLASSES[size];

  return (
    <Badge
      variant={config.badgeVariant}
      className={cn("inline-flex items-center gap-1.5", sizeConfig.badge)}
    >
      {/* Status indicator */}
      {config.icon === "spinner" ? (
        <Loader2
          className={cn("animate-spin", sizeConfig.spinner, config.dotClass.replace("bg-", "text-"))}
        />
      ) : (
        <span className="relative flex shrink-0">
          {config.animate && (
            <span
              className={cn(
                "animate-ping absolute inline-flex rounded-full opacity-75",
                sizeConfig.ping,
                config.dotClass
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex rounded-full",
              sizeConfig.dot,
              config.dotClass
            )}
          />
        </span>
      )}

      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}
