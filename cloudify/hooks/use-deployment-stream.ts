"use client";

import { useState, useEffect, useCallback } from "react";

interface BuildStep {
  step: string;
  message: string;
  progress: number;
}

interface BuildLog {
  timestamp: string;
  type: "info" | "command" | "success" | "error" | "warning";
  message: string;
}

interface DeploymentStatus {
  deploymentId: string;
  status: "starting" | "building" | "ready" | "error";
  url?: string;
  duration?: string;
}

interface UseDeploymentStreamOptions {
  onLog?: (log: BuildLog) => void;
  onStep?: (step: BuildStep) => void;
  onComplete?: (status: DeploymentStatus) => void;
  onError?: (error: Error) => void;
}

export function useDeploymentStream(
  deploymentId: string | null,
  options: UseDeploymentStreamOptions = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<BuildStep | null>(null);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [progress, setProgress] = useState(0);

  const { onLog, onStep, onComplete, onError } = options;

  const connect = useCallback(() => {
    if (!deploymentId) return;

    const eventSource = new EventSource(
      `/api/deployments/${deploymentId}/stream`
    );

    eventSource.addEventListener("connected", (event) => {
      const data = JSON.parse(event.data);
      setIsConnected(true);
      setStatus(data);
    });

    eventSource.addEventListener("step", (event) => {
      const data = JSON.parse(event.data) as BuildStep;
      setCurrentStep(data);
      setProgress(data.progress);
      onStep?.(data);
    });

    eventSource.addEventListener("log", (event) => {
      const data = JSON.parse(event.data) as BuildLog;
      setLogs((prev) => [...prev, data]);
      onLog?.(data);
    });

    eventSource.addEventListener("complete", (event) => {
      const data = JSON.parse(event.data) as DeploymentStatus;
      setStatus(data);
      setProgress(100);
      setIsConnected(false);
      onComplete?.(data);
      eventSource.close();
    });

    eventSource.addEventListener("error", () => {
      const error = new Error("Connection to deployment stream failed");
      onError?.(error);
      setIsConnected(false);
      eventSource.close();
    });

    return () => {
      eventSource.close();
    };
  }, [deploymentId, onLog, onStep, onComplete, onError]);

  useEffect(() => {
    const cleanup = connect();
    return () => cleanup?.();
  }, [connect]);

  const reset = useCallback(() => {
    setLogs([]);
    setCurrentStep(null);
    setProgress(0);
    setStatus(null);
  }, []);

  return {
    isConnected,
    status,
    currentStep,
    logs,
    progress,
    reset,
    reconnect: connect,
  };
}
