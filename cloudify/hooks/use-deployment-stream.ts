"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface BuildStep {
  step: string;
  message: string;
  progress: number;
}

export interface BuildLog {
  id?: string;
  timestamp: string;
  level: string;
  type: "info" | "command" | "success" | "error" | "warning";
  message: string;
}

export interface DeploymentStreamStatus {
  deploymentId: string;
  status: string;
  url?: string;
  duration?: string;
  buildTime?: number | null;
  siteSlug?: string | null;
  finishedAt?: string | null;
}

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";

export interface UseDeploymentStreamOptions {
  onLog?: (log: BuildLog) => void;
  onStep?: (step: BuildStep) => void;
  onComplete?: (status: DeploymentStreamStatus) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (previous: string, current: string) => void;
  /** Maximum number of reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Base delay between reconnection attempts in ms (default: 1000) */
  reconnectDelay?: number;
  /** Use the new /logs/stream endpoint instead of /stream (default: false) */
  useLogStream?: boolean;
}

export function useDeploymentStream(
  deploymentId: string | null,
  options: UseDeploymentStreamOptions = {}
) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [status, setStatus] = useState<DeploymentStreamStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<BuildStep | null>(null);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [buildTime, setBuildTime] = useState<number | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCompleteRef = useRef(false);

  const {
    onLog,
    onStep,
    onComplete,
    onError,
    onStatusChange,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000,
    useLogStream = false,
  } = options;

  // Store callbacks in refs so we don't trigger reconnects on callback changes
  const callbacksRef = useRef({ onLog, onStep, onComplete, onError, onStatusChange });
  callbacksRef.current = { onLog, onStep, onComplete, onError, onStatusChange };

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!deploymentId) return;

    cleanup();

    const streamPath = useLogStream
      ? `/api/deployments/${deploymentId}/logs/stream`
      : `/api/deployments/${deploymentId}/stream`;

    setConnectionState(
      reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting"
    );

    const eventSource = new EventSource(streamPath);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("connected", (event) => {
      const data = JSON.parse(event.data);
      setConnectionState("connected");
      setStatus(data);
      setError(null);
      reconnectAttemptsRef.current = 0;
    });

    eventSource.addEventListener("step", (event) => {
      const data = JSON.parse(event.data) as BuildStep;
      setCurrentStep(data);
      setProgress(data.progress);
      callbacksRef.current.onStep?.(data);
    });

    eventSource.addEventListener("log", (event) => {
      const data = JSON.parse(event.data);
      const log: BuildLog = {
        id: data.id,
        timestamp: data.timestamp,
        level: data.level || "info",
        type: data.level === "warn" ? "warning" : (data.level || "info"),
        message: data.message,
      };
      setLogs((prev) => {
        // Deduplicate by id if available
        if (log.id && prev.some((l) => l.id === log.id)) {
          return prev;
        }
        return [...prev, log];
      });
      callbacksRef.current.onLog?.(log);
    });

    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data);
      callbacksRef.current.onStatusChange?.(data.previous, data.current);
    });

    eventSource.addEventListener("complete", (event) => {
      const data = JSON.parse(event.data) as DeploymentStreamStatus;
      setStatus(data);
      setProgress(100);
      setBuildTime(data.buildTime ?? null);
      setConnectionState("disconnected");
      isCompleteRef.current = true;
      callbacksRef.current.onComplete?.(data);
      eventSource.close();
      eventSourceRef.current = null;
    });

    eventSource.addEventListener("error", () => {
      // If the deployment is already complete, don't try to reconnect
      if (isCompleteRef.current) {
        setConnectionState("disconnected");
        eventSource.close();
        eventSourceRef.current = null;
        return;
      }

      const err = new Error("Connection to deployment stream lost");
      setError(err);
      setConnectionState("disconnected");
      eventSource.close();
      eventSourceRef.current = null;

      // Attempt reconnection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
        reconnectAttemptsRef.current += 1;

        setConnectionState("reconnecting");
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        callbacksRef.current.onError?.(err);
        setConnectionState("disconnected");
      }
    });
  }, [deploymentId, cleanup, maxReconnectAttempts, reconnectDelay, useLogStream]);

  useEffect(() => {
    isCompleteRef.current = false;
    reconnectAttemptsRef.current = 0;
    connect();

    return () => {
      cleanup();
      setConnectionState("disconnected");
    };
  }, [connect, cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setLogs([]);
    setCurrentStep(null);
    setProgress(0);
    setStatus(null);
    setError(null);
    setBuildTime(null);
    setConnectionState("disconnected");
    isCompleteRef.current = false;
    reconnectAttemptsRef.current = 0;
  }, [cleanup]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    isCompleteRef.current = false;
    connect();
  }, [connect]);

  // Backward-compatible isConnected
  const isConnected = connectionState === "connected";

  return {
    isConnected,
    connectionState,
    status,
    currentStep,
    logs,
    progress,
    error,
    buildTime,
    reset,
    reconnect,
  };
}
