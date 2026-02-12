"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  Info,
  XCircle,
  ChevronDown,
  Pause,
  Play,
  Terminal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLogs } from "@/hooks/use-logs";

const levelConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  info: {
    icon: Info,
    color: "text-[#0070f3]",
    bg: "bg-[var(--surface-secondary)]",
  },
  warn: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  error: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  debug: {
    icon: Terminal,
    color: "text-[var(--text-secondary)]",
    bg: "bg-[var(--surface-secondary)]",
  },
};

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [isLive, setIsLive] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { logs, loading, error, hasMore, loadMore, refetch } = useLogs({
    level: selectedLevel,
    search: searchQuery,
    limit: 100,
  });

  const sources = ["all", ...new Set(logs.map((l) => l.source))];

  const filteredLogs = logs.filter((log) => {
    const matchesSource = selectedSource === "all" || log.source === selectedSource;
    return matchesSource;
  });

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive, refetch]);

  useEffect(() => {
    if (isLive && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredLogs, isLive]);

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Failed to load logs
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">{error}</p>
        <Button variant="secondary" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Logs Explorer
          </h1>
          <p className="text-[var(--text-secondary)]">
            Real-time logs from all your deployments and functions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? "default" : "secondary"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Resume
              </>
            )}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const data = JSON.stringify(filteredLogs, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `cloudify-logs-${new Date().toISOString().slice(0, 10)}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="w-full sm:w-auto">
              <Filter className="h-4 w-4" />
              Level: {selectedLevel === "all" ? "All" : selectedLevel}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["all", "info", "warn", "error", "debug"].map((level) => (
              <DropdownMenuItem
                key={level}
                onClick={() => setSelectedLevel(level)}
              >
                {level === "all" ? "All Levels" : level.charAt(0).toUpperCase() + level.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="w-full sm:w-auto">
              Source: {selectedSource === "all" ? "All" : selectedSource}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {sources.map((source) => (
              <DropdownMenuItem
                key={source}
                onClick={() => setSelectedSource(source)}
              >
                {source === "all" ? "All Sources" : source}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Live - auto-refreshing every 5 seconds
        </div>
      )}

      {/* Logs list */}
      <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
        <div className="h-[600px] overflow-y-auto font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
              <Terminal className="h-12 w-12 mb-4 text-gray-600" />
              <p>No logs found</p>
              <p className="text-sm text-gray-600 mt-2">
                Logs will appear here as your deployments run
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredLogs.map((log) => {
                const config = levelConfig[log.level] || levelConfig.info;
                const isExpanded = expandedLog === log.id;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "px-4 py-2 hover:bg-gray-900/50 cursor-pointer transition-colors",
                      isExpanded && "bg-gray-900"
                    )}
                    onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-[var(--text-secondary)] shrink-0 select-none">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-medium uppercase shrink-0",
                          config.bg,
                          config.color
                        )}
                      >
                        {log.level}
                      </span>
                      <span className="text-purple-400 shrink-0">
                        [{log.source}]
                      </span>
                      <span className="text-gray-300 break-all">
                        {log.message}
                      </span>
                    </div>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 ml-24 text-[var(--text-secondary)]"
                      >
                        <pre className="text-xs bg-gray-800 p-2 rounded">
                          {JSON.stringify({
                            projectId: log.projectId,
                            projectName: log.projectName,
                            deploymentId: log.deploymentId,
                          }, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center">
          <Button variant="secondary" onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Logs"
            )}
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Logs", value: filteredLogs.length, color: "text-gray-600" },
          {
            label: "Errors",
            value: filteredLogs.filter((l) => l.level === "error").length,
            color: "text-red-500",
          },
          {
            label: "Warnings",
            value: filteredLogs.filter((l) => l.level === "warn").length,
            color: "text-yellow-500",
          },
          {
            label: "Info",
            value: filteredLogs.filter((l) => l.level === "info").length,
            color: "text-[#0070f3]",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-card rounded-xl border border-[var(--border-primary)]"
          >
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
