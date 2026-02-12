"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  GitBranch,
  Download,
  Wrench,
  Rocket,
  Globe,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDeploymentStream } from "@/hooks/use-deployment-stream";

type DeploymentStatus =
  | "QUEUED"
  | "BUILDING"
  | "DEPLOYING"
  | "READY"
  | "ERROR"
  | "CANCELLED";

interface BuildStep {
  id: string;
  label: string;
  icon: React.ElementType;
  statusForStep: DeploymentStatus[];
  progressRange: [number, number];
}

const BUILD_STEPS: BuildStep[] = [
  {
    id: "queued",
    label: "Queued",
    icon: Clock,
    statusForStep: ["QUEUED"],
    progressRange: [0, 10],
  },
  {
    id: "cloning",
    label: "Cloning",
    icon: GitBranch,
    statusForStep: ["BUILDING"],
    progressRange: [10, 25],
  },
  {
    id: "installing",
    label: "Installing",
    icon: Download,
    statusForStep: ["BUILDING"],
    progressRange: [25, 45],
  },
  {
    id: "building",
    label: "Building",
    icon: Wrench,
    statusForStep: ["BUILDING"],
    progressRange: [45, 70],
  },
  {
    id: "deploying",
    label: "Deploying",
    icon: Rocket,
    statusForStep: ["DEPLOYING"],
    progressRange: [70, 90],
  },
  {
    id: "ready",
    label: "Ready",
    icon: Globe,
    statusForStep: ["READY"],
    progressRange: [90, 100],
  },
];

interface BuildProgressProps {
  /** Deployment ID to stream progress for */
  deploymentId: string;
  /** Initial status (optional, for immediate rendering before stream connects) */
  initialStatus?: DeploymentStatus;
  /** Callback when deployment finishes */
  onComplete?: () => void;
  /** Compact mode shows just the progress bar without step labels (default: false) */
  compact?: boolean;
}

/**
 * Determine which build step is currently active based on the deployment status
 * and the log messages we have seen so far.
 */
function getActiveStepIndex(
  deploymentStatus: string | undefined,
  logMessages: string[]
): number {
  if (!deploymentStatus) return 0;

  const status = deploymentStatus.toUpperCase();

  if (status === "READY") return BUILD_STEPS.length - 1;
  if (status === "ERROR" || status === "CANCELLED") return -1;

  if (status === "DEPLOYING") return 4;

  if (status === "BUILDING") {
    // Infer sub-step from log messages
    const lastMessages = logMessages.slice(-20);
    const joined = lastMessages.join(" ").toLowerCase();

    if (joined.includes("building") || joined.includes("compiling") || joined.includes("bundle")) {
      return 3;
    }
    if (
      joined.includes("installing") ||
      joined.includes("npm install") ||
      joined.includes("yarn install") ||
      joined.includes("pnpm install")
    ) {
      return 2;
    }
    if (joined.includes("cloning") || joined.includes("clone")) {
      return 1;
    }
    // Default to cloning as the first BUILDING sub-step
    return 1;
  }

  return 0; // QUEUED
}

function formatElapsedTime(startMs: number): string {
  const elapsed = Math.floor((Date.now() - startMs) / 1000);
  if (elapsed < 60) return `${elapsed}s`;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}m ${seconds}s`;
}

export function BuildProgress({
  deploymentId,
  initialStatus,
  onComplete,
  compact = false,
}: BuildProgressProps) {
  const [elapsedTime, setElapsedTime] = useState("0s");
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { status, logs, progress, connectionState, buildTime } =
    useDeploymentStream(deploymentId, {
      onComplete: () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        onComplete?.();
      },
    });

  const deploymentStatus = (
    status?.status?.toUpperCase() || initialStatus || "QUEUED"
  ) as DeploymentStatus;

  const isTerminal =
    deploymentStatus === "READY" ||
    deploymentStatus === "ERROR" ||
    deploymentStatus === "CANCELLED";

  const isFailed = deploymentStatus === "ERROR" || deploymentStatus === "CANCELLED";

  // Elapsed time ticker
  useEffect(() => {
    if (isTerminal) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (buildTime != null) {
        setElapsedTime(`${buildTime}s`);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedTime(formatElapsedTime(startTimeRef.current));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTerminal, buildTime]);

  const logMessages = logs.map((l) => l.message);
  const activeStepIndex = getActiveStepIndex(deploymentStatus, logMessages);

  // Calculate a smooth progress value based on step position
  const smoothProgress = isTerminal
    ? isFailed
      ? progress || 0
      : 100
    : Math.min(
        Math.max(
          progress,
          activeStepIndex >= 0
            ? BUILD_STEPS[activeStepIndex].progressRange[0]
            : 0
        ),
        99
      );

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            {isTerminal ? (
              isFailed ? (
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              )
            ) : (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            <span className="font-medium text-[var(--text-primary)]">
              {isTerminal
                ? isFailed
                  ? "Failed"
                  : "Complete"
                : activeStepIndex >= 0
                ? BUILD_STEPS[activeStepIndex].label
                : "Starting..."}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {elapsedTime}
          </div>
        </div>
        <Progress value={smoothProgress} className="h-1.5" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isTerminal ? (
              isFailed ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-primary)]" />
            )}
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {isTerminal
                ? isFailed
                  ? `Deployment ${deploymentStatus === "CANCELLED" ? "cancelled" : "failed"}`
                  : "Deployment complete"
                : "Deploying..."}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
            <Clock className="h-3.5 w-3.5" />
            {elapsedTime}
          </div>
        </div>
        <Progress value={smoothProgress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-foreground transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(0, (smoothProgress / 100) * (100 - 8))}%`,
          }}
        />

        {/* Steps */}
        <div className="relative flex items-start justify-between">
          {BUILD_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isComplete = index < activeStepIndex || (isTerminal && !isFailed);
            const isActive = index === activeStepIndex && !isTerminal;
            const isFutureOrFailed =
              (index > activeStepIndex && !isTerminal) || isFailed;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center gap-1.5"
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  className={cn(
                    "relative z-10 flex items-center justify-center h-8 w-8 rounded-full border-2 transition-colors duration-300",
                    isComplete
                      ? "bg-foreground border-foreground text-background"
                      : isActive
                      ? "bg-[var(--surface-primary)] border-foreground text-[var(--text-primary)]"
                      : "bg-[var(--surface-primary)] border-[var(--border-primary)] text-[var(--text-secondary)]"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </motion.div>
                <span
                  className={cn(
                    "text-[11px] font-medium transition-colors",
                    isComplete
                      ? "text-[var(--text-primary)]"
                      : isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)]"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
