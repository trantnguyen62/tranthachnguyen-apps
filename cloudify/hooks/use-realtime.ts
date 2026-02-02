"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Singleton socket instance
let socket: Socket | null = null;
let connectionPromise: Promise<Socket> | null = null;

interface DeploymentLogEntry {
  level: string;
  message: string;
  timestamp: string;
}

interface DeploymentStatus {
  status: string;
  url?: string;
  buildTime?: number;
  timestamp: string;
}

interface PresenceUser {
  userId: string;
  name: string;
  email?: string;
}

interface BuildProgress {
  step: string;
  progress: number;
  timestamp: string;
}

/**
 * Get or create socket connection
 */
async function getSocket(): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      // Get auth token from session
      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (!session?.token && !session?.user) {
        reject(new Error("Not authenticated"));
        return;
      }

      const token = session.token || session.sessionToken;

      socket = io(window.location.origin, {
        path: "/api/socket",
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.on("connect", () => {
        console.log("[Socket] Connected");
        resolve(socket!);
      });

      socket.on("connect_error", (error) => {
        console.error("[Socket] Connection error:", error);
        reject(error);
      });

      socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
      });
    } catch (error) {
      reject(error);
    }
  });

  return connectionPromise;
}

/**
 * Hook to manage socket connection
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        const sock = await getSocket();
        if (mounted) {
          setIsConnected(sock.connected);
          setError(null);
        }

        sock.on("connect", () => {
          if (mounted) setIsConnected(true);
        });

        sock.on("disconnect", () => {
          if (mounted) setIsConnected(false);
        });
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Connection failed");
          setIsConnected(false);
        }
      }
    }

    connect();

    return () => {
      mounted = false;
    };
  }, []);

  return { socket, isConnected, error };
}

/**
 * Hook for deployment log streaming
 */
export function useDeploymentStream(deploymentId: string | null) {
  const [logs, setLogs] = useState<DeploymentLogEntry[]>([]);
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [progress, setProgress] = useState<BuildProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!deploymentId) return;

    let mounted = true;

    async function subscribe() {
      try {
        const sock = await getSocket();

        if (!mounted) return;
        setIsConnected(sock.connected);

        // Join deployment room
        if (!joinedRef.current) {
          sock.emit("join:deployment", deploymentId);
          joinedRef.current = true;
        }

        // Listen for logs
        const handleLog = (event: any) => {
          if (event.deploymentId === deploymentId && mounted) {
            setLogs((prev) => [
              ...prev,
              {
                level: event.level,
                message: event.message,
                timestamp: event.timestamp,
              },
            ]);
          }
        };

        // Listen for status changes
        const handleStatus = (event: DeploymentStatus & { deploymentId: string }) => {
          if (event.deploymentId === deploymentId && mounted) {
            setStatus(event);
          }
        };

        // Listen for progress
        const handleProgress = (event: BuildProgress & { deploymentId: string }) => {
          if (event.deploymentId === deploymentId && mounted) {
            setProgress(event);
          }
        };

        sock.on("deployment:log", handleLog);
        sock.on("deployment:status", handleStatus);
        sock.on("deployment:progress", handleProgress);

        return () => {
          sock.off("deployment:log", handleLog);
          sock.off("deployment:status", handleStatus);
          sock.off("deployment:progress", handleProgress);
        };
      } catch (err) {
        console.error("[useDeploymentStream] Error:", err);
      }
    }

    subscribe();

    return () => {
      mounted = false;
      if (socket && joinedRef.current) {
        socket.emit("leave:deployment", deploymentId);
        joinedRef.current = false;
      }
    };
  }, [deploymentId]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    status,
    progress,
    isConnected,
    clearLogs,
  };
}

/**
 * Hook for project presence (who's viewing)
 */
export function useProjectPresence(projectId: string | null) {
  const [viewers, setViewers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!projectId) return;

    let mounted = true;

    async function subscribe() {
      try {
        const sock = await getSocket();

        if (!mounted) return;
        setIsConnected(sock.connected);

        // Join project room
        if (!joinedRef.current) {
          sock.emit("join:project", projectId);
          joinedRef.current = true;
        }

        // Handle initial presence list
        const handleList = (data: { viewers: PresenceUser[] }) => {
          if (mounted) {
            setViewers(data.viewers);
          }
        };

        // Handle user join
        const handleJoin = (user: PresenceUser) => {
          if (mounted) {
            setViewers((prev) => {
              if (prev.find((v) => v.userId === user.userId)) {
                return prev;
              }
              return [...prev, user];
            });
          }
        };

        // Handle user leave
        const handleLeave = (data: { userId: string }) => {
          if (mounted) {
            setViewers((prev) => prev.filter((v) => v.userId !== data.userId));
          }
        };

        sock.on("presence:list", handleList);
        sock.on("presence:join", handleJoin);
        sock.on("presence:leave", handleLeave);

        return () => {
          sock.off("presence:list", handleList);
          sock.off("presence:join", handleJoin);
          sock.off("presence:leave", handleLeave);
        };
      } catch (err) {
        console.error("[useProjectPresence] Error:", err);
      }
    }

    subscribe();

    return () => {
      mounted = false;
      if (socket && joinedRef.current) {
        socket.emit("leave:project", projectId);
        joinedRef.current = false;
      }
    };
  }, [projectId]);

  return { viewers, isConnected };
}

/**
 * Hook for real-time project updates
 */
export function useProjectUpdates(projectId: string | null) {
  const [lastUpdate, setLastUpdate] = useState<{
    type: string;
    data: any;
    timestamp: string;
  } | null>(null);
  const { viewers, isConnected } = useProjectPresence(projectId);

  useEffect(() => {
    if (!projectId || !socket) return;

    const handleUpdate = (event: any) => {
      if (event.projectId === projectId) {
        setLastUpdate({
          type: event.type,
          data: event.data,
          timestamp: event.timestamp,
        });
      }
    };

    socket.on("project:update", handleUpdate);

    return () => {
      socket?.off("project:update", handleUpdate);
    };
  }, [projectId]);

  return { viewers, lastUpdate, isConnected };
}
