"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDeploymentStream } from "@/hooks/use-deployment-stream";

interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  step?: string;
}

interface BuildLogsProps {
  deploymentId: string;
  status: "building" | "ready" | "error";
}

function mapStreamLevel(type: string): LogEntry["level"] {
  switch (type) {
    case "command": return "info";
    case "warning": return "warn";
    default: return type as LogEntry["level"];
  }
}

export function BuildLogs({ deploymentId, status }: BuildLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Try real-time stream via useDeploymentStream
  const stream = useDeploymentStream(deploymentId, {
    onLog: (log) => {
      setLogs((prev) => [
        ...prev,
        {
          timestamp: log.timestamp,
          level: mapStreamLevel(log.type),
          message: log.message,
        },
      ]);
    },
    onError: () => {
      // Stream failed — fall back to REST API or mock
      if (!usedFallback) {
        setUsedFallback(true);
      }
    },
  });

  // Fallback: fetch logs from REST API when stream is not connected
  useEffect(() => {
    if (stream.isConnected) return;

    if (!usedFallback && logs.length === 0) {
      const timeout = setTimeout(() => setUsedFallback(true), 2000);
      return () => clearTimeout(timeout);
    }

    if (!usedFallback) return;

    async function fetchLogs() {
      try {
        const res = await fetch(`/api/deployments/${deploymentId}/logs`);
        if (res.ok) {
          const data = await res.json();
          const fetched: LogEntry[] = (data.logs || data).map((l: { timestamp?: string; level?: string; type?: string; message: string; step?: string }) => ({
            timestamp: l.timestamp || "",
            level: mapStreamLevel(l.level || l.type || "info"),
            message: l.message,
            step: l.step,
          }));
          if (fetched.length > 0) {
            setLogs(fetched);
          }
        }
      } catch {
        // REST API unavailable
      }
    }

    fetchLogs();
  }, [deploymentId, status, stream.isConnected, usedFallback, logs.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const levelColors = {
    info: "text-[var(--text-secondary)]",
    warn: "text-yellow-500",
    error: "text-red-500",
    success: "text-green-500",
  };

  const copyLogs = () => {
    const logText = logs.map((log) => `[${log.timestamp}] ${log.message}`).join("\n");
    navigator.clipboard.writeText(logText);
  };

  const downloadLogs = () => {
    const logText = logs.map((log) => `[${log.timestamp}] ${log.message}`).join("\n");
    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `build-${deploymentId}.log`;
    a.click();
  };

  return (
    <div className="rounded-lg border border-[var(--border-primary)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[var(--surface-primary)] border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-[var(--text-secondary)]" />
          <span className="font-medium text-[var(--text-primary)]">Build Logs</span>
          <Badge
            variant={
              status === "ready" ? "success" : status === "error" ? "error" : "warning"
            }
          >
            {status === "building" && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            {status === "ready" && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {status === "error" && <XCircle className="h-3 w-3 mr-1" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm"  onClick={copyLogs}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm"  onClick={downloadLogs}>
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Logs content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-[var(--border-primary)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm bg-transparent border-[var(--border-primary)]"
                />
              </div>
            </div>

            {/* Log entries */}
            <div className="h-[400px] overflow-y-auto bg-gray-950 p-4 font-mono text-sm">
              {filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
                  No build logs available
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 py-0.5 hover:bg-gray-900"
                  >
                    <span className="text-gray-600 shrink-0">{log.timestamp}</span>
                    <span className={cn("flex-1", levelColors[log.level])}>
                      {log.message}
                    </span>
                  </motion.div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-2 bg-gray-900 border-t border-gray-800 text-xs text-[var(--text-secondary)]">
              <span>{logs.length} lines</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-gray-600"
                />
                Auto-scroll
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
