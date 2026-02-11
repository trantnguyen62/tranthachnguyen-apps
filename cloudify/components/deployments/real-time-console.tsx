"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDeploymentStream } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";

interface LogLine {
  id: string;
  level: "info" | "warn" | "error" | "success" | "debug";
  message: string;
  timestamp: Date;
}

interface RealTimeConsoleProps {
  deploymentId: string;
  projectId?: string; // Optional, kept for backwards compatibility
  className?: string;
  maxLines?: number;
  autoScroll?: boolean;
  showTimestamps?: boolean;
  showFilters?: boolean;
}

export function RealTimeConsole({
  deploymentId,
  className,
  maxLines = 1000,
  autoScroll = true,
  showTimestamps = true,
  showFilters = true,
}: RealTimeConsoleProps) {
  const [filter, setFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<Set<string>>(
    new Set(["info", "warn", "error", "success", "debug"])
  );
  const [isAutoScroll, setIsAutoScroll] = useState(autoScroll);
  const consoleRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Subscribe to deployment stream
  const { isConnected, status, logs: rawLogs, clearLogs: clearStreamLogs } = useDeploymentStream(deploymentId);

  // Transform logs to our LogLine format with memoization
  const logs: LogLine[] = useMemo(() => {
    return rawLogs.slice(-maxLines).map((log, index) => ({
      id: `${log.timestamp}-${index}`,
      level: (log.level || "info") as LogLine["level"],
      message: log.message,
      timestamp: new Date(log.timestamp || Date.now()),
    }));
  }, [rawLogs, maxLines]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isAutoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isAutoScroll]);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    if (!consoleRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = consoleRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAutoScroll(isAtBottom);
  }, []);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (!levelFilter.has(log.level)) return false;
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Toggle level filter
  const toggleLevel = (level: string) => {
    setLevelFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  // Clear logs
  const clearLogs = () => {
    clearStreamLogs();
  };

  // Copy logs to clipboard
  const copyLogs = () => {
    const text = filteredLogs
      .map((log) => {
        const time = showTimestamps
          ? `[${log.timestamp.toISOString()}] `
          : "";
        return `${time}[${log.level.toUpperCase()}] ${log.message}`;
      })
      .join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={cn("flex flex-col bg-gray-900 rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span className="text-xs text-gray-400">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Build status */}
          {status && (
            <span
              className={cn(
                "px-2 py-0.5 text-xs rounded",
                status.status === "BUILDING" && "bg-yellow-500/20 text-yellow-400",
                status.status === "DEPLOYING" && "bg-secondary text-[#0070f3]",
                status.status === "READY" && "bg-green-500/20 text-green-400",
                status.status === "ERROR" && "bg-red-500/20 text-red-400"
              )}
            >
              {status.status}
            </span>
          )}
        </div>

        {showFilters && (
          <div className="flex items-center gap-2">
            {/* Level filters */}
            <div className="flex items-center gap-1">
              {["info", "warn", "error", "success", "debug"].map((level) => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded transition-colors",
                    levelFilter.has(level)
                      ? getLevelBgClass(level)
                      : "bg-gray-700 text-gray-500"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Search filter */}
            <input
              type="text"
              placeholder="Filter..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-32 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />

            {/* Actions */}
            <button
              onClick={copyLogs}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
              title="Copy logs"
            >
              Copy
            </button>
            <button
              onClick={clearLogs}
              className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
              title="Clear logs"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Console output */}
      <div
        ref={consoleRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto p-4 font-mono text-sm"
        style={{ maxHeight: "500px" }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {logs.length === 0
              ? "Waiting for build logs..."
              : "No logs match the current filter"}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={cn(
                "flex gap-2 py-0.5 hover:bg-gray-800/50",
                getLevelTextClass(log.level)
              )}
            >
              {showTimestamps && (
                <span className="text-gray-500 shrink-0">
                  {log.timestamp.toLocaleTimeString()}
                </span>
              )}
              <span className={cn("shrink-0", getLevelBadgeClass(log.level))}>
                [{log.level.toUpperCase().padEnd(5)}]
              </span>
              <span className="text-gray-200 break-all whitespace-pre-wrap">
                {formatMessage(log.message)}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Auto-scroll indicator */}
      {!isAutoScroll && (
        <button
          onClick={() => {
            setIsAutoScroll(true);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="absolute bottom-4 right-4 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
        >
          ↓ Scroll to bottom
        </button>
      )}
    </div>
  );
}

function getLevelBgClass(level: string): string {
  switch (level) {
    case "error":
      return "bg-red-500/20 text-red-400";
    case "warn":
      return "bg-yellow-500/20 text-yellow-400";
    case "success":
      return "bg-green-500/20 text-green-400";
    case "debug":
      return "bg-gray-500/20 text-gray-400";
    case "info":
    default:
      return "bg-secondary text-[#0070f3]";
  }
}

function getLevelTextClass(level: string): string {
  switch (level) {
    case "error":
      return "text-red-400";
    case "warn":
      return "text-yellow-400";
    case "success":
      return "text-green-400";
    case "debug":
      return "text-gray-500";
    case "info":
    default:
      return "text-gray-300";
  }
}

function getLevelBadgeClass(level: string): string {
  switch (level) {
    case "error":
      return "text-red-500";
    case "warn":
      return "text-yellow-500";
    case "success":
      return "text-green-500";
    case "debug":
      return "text-gray-600";
    case "info":
    default:
      return "text-[#0070f3]";
  }
}

function formatMessage(message: string): string {
  // Highlight URLs
  return message.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" class="text-indigo-400 hover:underline">$1</a>'
  );
}

export default RealTimeConsole;
