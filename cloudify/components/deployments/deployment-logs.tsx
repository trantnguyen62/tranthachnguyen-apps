"use client";

import { useEffect, useRef } from "react";
import { useDeploymentLogs } from "@/hooks/use-deployments";

interface DeploymentLogsProps {
  deploymentId: string;
  className?: string;
}

export function DeploymentLogs({ deploymentId, className = "" }: DeploymentLogsProps) {
  const { logs, status, isComplete } = useDeploymentLogs(deploymentId);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-400";
      case "warn":
        return "text-yellow-400";
      case "success":
        return "text-green-400";
      case "info":
      default:
        return "text-gray-300";
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return "✕";
      case "warn":
        return "⚠";
      case "success":
        return "✓";
      case "info":
      default:
        return "●";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-[#0a0a0a] rounded-lg p-4 font-mono text-sm overflow-auto ${className}`}
      style={{ maxHeight: "500px" }}
    >
      {logs.length === 0 ? (
        <div className="text-gray-500 flex items-center gap-2">
          <span className="animate-pulse">●</span>
          Waiting for logs...
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2">
              <span className={`flex-shrink-0 ${getLogLevelColor(log.level)}`}>
                {getLogLevelIcon(log.level)}
              </span>
              <span className="text-gray-500 flex-shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={getLogLevelColor(log.level)}>{log.message}</span>
            </div>
          ))}
          {!isComplete && (
            <div className="text-gray-500 flex items-center gap-2 mt-2">
              <span className="animate-pulse">●</span>
              Building...
            </div>
          )}
          {isComplete && status && (
            <div
              className={`mt-4 pt-4 border-t border-gray-800 ${
                status === "READY" ? "text-green-400" : status === "ERROR" ? "text-red-400" : "text-yellow-400"
              }`}
            >
              {status === "READY" && "✓ Deployment completed successfully"}
              {status === "ERROR" && "✕ Deployment failed"}
              {status === "CANCELLED" && "⚠ Deployment cancelled"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
