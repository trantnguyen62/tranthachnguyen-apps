"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Copy,
  Check,
  Clock,
  ChevronDown,
  Download,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useDeploymentStream,
  type ConnectionState,
  type BuildLog,
} from "@/hooks/use-deployment-stream";

interface LiveLogViewerProps {
  deploymentId: string;
  /** Initial height of the log container in pixels (default: 400) */
  height?: number;
  /** Whether to show the header bar (default: true) */
  showHeader?: boolean;
  /** Callback when deployment completes */
  onComplete?: () => void;
  /** Use the /logs/stream endpoint (default: false, uses /stream) */
  useLogStream?: boolean;
}

const LOG_LEVEL_STYLES: Record<string, string> = {
  error: "text-red-400",
  warn: "text-yellow-400",
  warning: "text-yellow-400",
  success: "text-green-400",
  command: "text-[#0070f3]",
  info: "text-gray-300",
};

function ConnectionStatusIndicator({ state }: { state: ConnectionState }) {
  switch (state) {
    case "connected":
      return (
        <div className="flex items-center gap-1.5 text-xs text-green-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Live
        </div>
      );
    case "connecting":
      return (
        <div className="flex items-center gap-1.5 text-xs text-yellow-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Connecting
        </div>
      );
    case "reconnecting":
      return (
        <div className="flex items-center gap-1.5 text-xs text-yellow-500">
          <Wifi className="h-3 w-3 animate-pulse" />
          Reconnecting
        </div>
      );
    case "disconnected":
      return (
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <WifiOff className="h-3 w-3" />
          Disconnected
        </div>
      );
  }
}

export function LiveLogViewer({
  deploymentId,
  height = 400,
  showHeader = true,
  onComplete,
  useLogStream = false,
}: LiveLogViewerProps) {
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { connectionState, logs, status, progress, buildTime } =
    useDeploymentStream(deploymentId, {
      onComplete: () => {
        onComplete?.();
      },
      useLogStream,
    });

  // Auto-scroll to bottom when new logs arrive (unless user has scrolled up)
  useEffect(() => {
    if (autoScroll && !userScrolledUp && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll, userScrolledUp]);

  // Detect when user scrolls up to disable auto-scroll
  const handleScroll = useCallback(() => {
    const container = logsContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;

    setUserScrolledUp(!isAtBottom);
    if (isAtBottom) {
      setAutoScroll(true);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    setAutoScroll(true);
    setUserScrolledUp(false);
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const copyLogs = useCallback(() => {
    const logText = logs
      .map((log) => {
        const ts = log.timestamp
          ? `[${new Date(log.timestamp).toLocaleTimeString()}] `
          : "";
        return `${ts}[${log.level}] ${log.message}`;
      })
      .join("\n");

    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [logs]);

  const downloadLogs = useCallback(() => {
    const logText = logs
      .map((log) => {
        const ts = log.timestamp
          ? `[${new Date(log.timestamp).toISOString()}] `
          : "";
        return `${ts}[${log.level}] ${log.message}`;
      })
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deploy-${deploymentId}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs, deploymentId]);

  const getLogLevelStyle = (log: BuildLog) => {
    return LOG_LEVEL_STYLES[log.level] || LOG_LEVEL_STYLES[log.type] || "text-gray-300";
  };

  const isTerminal =
    status?.status === "READY" ||
    status?.status === "ready" ||
    status?.status === "ERROR" ||
    status?.status === "error";

  return (
    <div className="rounded-lg border border-[var(--border-primary)] overflow-hidden">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-primary)] border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4 text-[var(--text-secondary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Build Output
            </span>
            {isTerminal && buildTime != null && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {buildTime}s
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ConnectionStatusIndicator state={connectionState} />

            <div className="h-4 w-px bg-border mx-1" />

            {/* Timestamp toggle */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2 text-xs",
                showTimestamps && "bg-[var(--surface-secondary)]"
              )}
              onClick={() => setShowTimestamps(!showTimestamps)}
            >
              <Clock className="h-3 w-3 mr-1" />
              Time
            </Button>

            {/* Copy button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={copyLogs}
              disabled={logs.length === 0}
            >
              {copied ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>

            {/* Download button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={downloadLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Log output */}
      <div
        ref={logsContainerRef}
        className="overflow-y-auto bg-gray-950 p-4 font-mono text-[13px] leading-5 relative"
        style={{ height }}
        onScroll={handleScroll}
      >
        {logs.length === 0 && connectionState !== "disconnected" ? (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Waiting for build output...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
            No build logs available
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {logs.map((log, index) => (
              <motion.div
                key={log.id || index}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.08 }}
                className={cn(
                  "py-[1px] flex gap-2 hover:bg-white/[0.03] rounded-sm px-1 -mx-1",
                  getLogLevelStyle(log)
                )}
              >
                {showTimestamps && log.timestamp && (
                  <span className="text-gray-600 select-none shrink-0 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                )}
                <span className="text-gray-500 select-none shrink-0 uppercase w-[52px] text-right">
                  {log.level === "info" ? "" : `[${log.level}]`}
                </span>
                <span className="flex-1 whitespace-pre-wrap break-all">
                  {log.message}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-900 border-t border-gray-800 text-xs text-[var(--text-secondary)]">
        <span>
          {logs.length} line{logs.length !== 1 ? "s" : ""}
          {progress > 0 && progress < 100 && ` | ${progress}%`}
        </span>

        <div className="flex items-center gap-3">
          {userScrolledUp && (
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-1 text-[#0070f3] hover:text-[#0070f3]/80 transition-colors"
            >
              <ChevronDown className="h-3 w-3" />
              Jump to bottom
            </button>
          )}

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-gray-600 h-3 w-3"
            />
            Auto-scroll
          </label>
        </div>
      </div>
    </div>
  );
}
