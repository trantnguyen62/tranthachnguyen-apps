"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDeploymentStream } from "@/hooks/use-deployment-stream";

interface DeploymentStreamProps {
  deploymentId: string;
  onComplete?: () => void;
}

export function DeploymentStream({
  deploymentId,
  onComplete,
}: DeploymentStreamProps) {
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { isConnected, status, currentStep, logs, progress } =
    useDeploymentStream(deploymentId, {
      onComplete: () => {
        onComplete?.();
      },
    });

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleCopyUrl = () => {
    if (status?.url) {
      navigator.clipboard.writeText(status.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "success":
        return "text-green-400";
      case "command":
        return "text-[#0070f3]";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status?.status === "ready" ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : status?.status === "error" ? (
              <XCircle className="h-6 w-6 text-red-500" />
            ) : (
              <Loader2 className="h-6 w-6 text-foreground animate-spin" />
            )}
            <div>
              <h3 className="font-semibold text-foreground">
                {status?.status === "ready"
                  ? "Deployment Complete"
                  : status?.status === "error"
                  ? "Deployment Failed"
                  : currentStep?.message || "Starting deployment..."}
              </h3>
              {status?.duration && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Completed in {status.duration}
                </p>
              )}
            </div>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Live
            </div>
          )}
        </div>

        <Progress value={progress} className="h-2" />

        {/* Step indicators */}
        <div className="flex items-center justify-between text-xs">
          {["Clone", "Install", "Build", "Optimize", "Deploy"].map(
            (step, index) => {
              const stepProgress = (index + 1) * 20;
              const isComplete = progress >= stepProgress;
              const isCurrent =
                progress >= stepProgress - 20 && progress < stepProgress;

              return (
                <div
                  key={step}
                  className={cn(
                    "flex items-center gap-1",
                    isComplete
                      ? "text-green-600 dark:text-green-400"
                      : isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : isCurrent ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <div className="h-3 w-3 rounded-full border border-current" />
                  )}
                  {step}
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Deployment URL (when ready) */}
      <AnimatePresence>
        {status?.status === "ready" && status.url && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Your site is live!
              </p>
              <a
                href={status.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 dark:text-green-400 hover:underline truncate block"
              >
                {status.url}
              </a>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                className="h-8"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="sm" asChild className="h-8">
                <a
                  href={status.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Build logs */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-secondary border-b border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Terminal className="h-4 w-4" />
            Build Logs
          </div>
          <span className="text-xs text-muted-foreground">{logs.length} lines</span>
        </div>
        <div className="h-64 overflow-y-auto bg-gray-950 p-4 font-mono text-sm">
          <AnimatePresence mode="popLayout">
            {logs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.1 }}
                className={cn("py-0.5", getLogColor(log.type))}
              >
                <span className="text-gray-600 select-none mr-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                {log.type === "command" && (
                  <span className="text-purple-400 mr-1">$</span>
                )}
                {log.message}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
