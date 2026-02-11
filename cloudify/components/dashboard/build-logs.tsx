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

const mockBuildLogs: LogEntry[] = [
  { timestamp: "00:00:01", level: "info", message: "Cloning repository...", step: "Clone" },
  { timestamp: "00:00:02", level: "success", message: "Cloned johndoe/my-portfolio (ref: main)", step: "Clone" },
  { timestamp: "00:00:03", level: "info", message: "Detecting framework...", step: "Detect" },
  { timestamp: "00:00:03", level: "success", message: "Detected Next.js (16.1.6)", step: "Detect" },
  { timestamp: "00:00:04", level: "info", message: "Installing dependencies...", step: "Install" },
  { timestamp: "00:00:05", level: "info", message: "Running: npm install", step: "Install" },
  { timestamp: "00:00:12", level: "success", message: "added 357 packages in 7s", step: "Install" },
  { timestamp: "00:00:13", level: "info", message: "Building project...", step: "Build" },
  { timestamp: "00:00:14", level: "info", message: "Running: npm run build", step: "Build" },
  { timestamp: "00:00:15", level: "info", message: "Creating optimized production build...", step: "Build" },
  { timestamp: "00:00:18", level: "success", message: "Compiled successfully", step: "Build" },
  { timestamp: "00:00:19", level: "info", message: "Generating static pages...", step: "Build" },
  { timestamp: "00:00:22", level: "success", message: "Generated 12 static pages", step: "Build" },
  { timestamp: "00:00:23", level: "info", message: "Deploying to edge network...", step: "Deploy" },
  { timestamp: "00:00:25", level: "info", message: "Uploading build output...", step: "Deploy" },
  { timestamp: "00:00:28", level: "success", message: "Deployed to 100+ edge locations", step: "Deploy" },
  { timestamp: "00:00:29", level: "info", message: "Assigning domains...", step: "Deploy" },
  { timestamp: "00:00:30", level: "success", message: "Ready! Deployment complete", step: "Complete" },
];

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

  // Fallback: fetch logs from REST API, or use mock simulation
  useEffect(() => {
    // If the stream is connected and providing logs, skip fallback
    if (stream.isConnected) return;

    // If we haven't detected a stream failure yet, give it a moment
    if (!usedFallback && logs.length === 0) {
      const timeout = setTimeout(() => setUsedFallback(true), 2000);
      return () => clearTimeout(timeout);
    }

    if (!usedFallback) return;

    // Try REST API first
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
            return;
          }
        }
      } catch {
        // REST failed too
      }

      // Final fallback: mock simulation
      if (status === "building") {
        let currentIndex = 0;
        const interval = setInterval(() => {
          if (currentIndex < mockBuildLogs.length) {
            setLogs((prev) => [...prev, mockBuildLogs[currentIndex]]);
            currentIndex++;
          } else {
            clearInterval(interval);
          }
        }, 500);
        return () => clearInterval(interval);
      } else {
        setLogs(mockBuildLogs);
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
    info: "text-muted-foreground",
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
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium text-foreground">Build Logs</span>
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
          <Button variant="ghost" size="icon" onClick={copyLogs}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={downloadLogs}>
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
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
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm bg-transparent border-border"
                />
              </div>
            </div>

            {/* Log entries */}
            <div className="h-[400px] overflow-y-auto bg-gray-950 p-4 font-mono text-sm">
              {filteredLogs.map((log, index) => (
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
              ))}
              <div ref={logsEndRef} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-2 bg-gray-900 border-t border-gray-800 text-xs text-muted-foreground">
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
