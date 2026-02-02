/**
 * Real-time Broadcast Utilities
 * Functions to broadcast events to connected clients
 */

import { getSocketServer } from "./socket-server";

// Event types
export interface DeploymentStatusEvent {
  type: "status_change";
  deploymentId: string;
  projectId: string;
  status: string;
  url?: string;
  buildTime?: number;
  timestamp: string;
}

export interface DeploymentLogEvent {
  type: "log";
  deploymentId: string;
  projectId: string;
  level: string;
  message: string;
  timestamp: string;
}

export interface BuildProgressEvent {
  type: "build_progress";
  deploymentId: string;
  projectId: string;
  step: string;
  progress: number; // 0-100
  timestamp: string;
}

export interface PresenceEvent {
  userId: string;
  name: string;
  email?: string;
  action?: "viewing" | "editing";
  resource?: string;
  timestamp: string;
}

/**
 * Broadcast deployment status change
 */
export function broadcastDeploymentStatus(event: DeploymentStatusEvent) {
  const io = getSocketServer();
  if (!io) {
    console.warn("[Broadcast] Socket.io not initialized");
    return;
  }

  // Broadcast to project subscribers
  io.to(`project:${event.projectId}`).emit("deployment:status", event);

  // Also broadcast to specific deployment subscribers
  io.to(`deployment:${event.deploymentId}`).emit("deployment:status", event);

  console.log(`[Broadcast] Deployment ${event.deploymentId} status: ${event.status}`);
}

/**
 * Broadcast deployment log entry
 */
export function broadcastDeploymentLog(event: DeploymentLogEvent) {
  const io = getSocketServer();
  if (!io) return;

  io.to(`deployment:${event.deploymentId}`).emit("deployment:log", event);
}

/**
 * Broadcast build progress update
 */
export function broadcastBuildProgress(event: BuildProgressEvent) {
  const io = getSocketServer();
  if (!io) return;

  io.to(`deployment:${event.deploymentId}`).emit("deployment:progress", event);
  io.to(`project:${event.projectId}`).emit("deployment:progress", event);
}

/**
 * Broadcast presence update
 */
export function broadcastPresence(projectId: string, event: PresenceEvent) {
  const io = getSocketServer();
  if (!io) return;

  io.to(`project:${projectId}`).emit("presence:update", event);
}

/**
 * Helper to create and broadcast a deployment status event
 */
export function notifyDeploymentStatus(
  deploymentId: string,
  projectId: string,
  status: string,
  options?: { url?: string; buildTime?: number }
) {
  broadcastDeploymentStatus({
    type: "status_change",
    deploymentId,
    projectId,
    status,
    url: options?.url,
    buildTime: options?.buildTime,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper to create and broadcast a deployment log event
 */
export function notifyDeploymentLog(
  deploymentId: string,
  projectId: string,
  level: string,
  message: string
) {
  broadcastDeploymentLog({
    type: "log",
    deploymentId,
    projectId,
    level,
    message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper to create and broadcast build progress
 */
export function notifyBuildProgress(
  deploymentId: string,
  projectId: string,
  step: string,
  progress: number
) {
  broadcastBuildProgress({
    type: "build_progress",
    deploymentId,
    projectId,
    step,
    progress,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast project update (e.g., settings changed)
 */
export function broadcastProjectUpdate(
  projectId: string,
  updateType: string,
  data: any
) {
  const io = getSocketServer();
  if (!io) return;

  io.to(`project:${projectId}`).emit("project:update", {
    type: updateType,
    projectId,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Broadcast function invocation event
 */
export function broadcastFunctionInvocation(
  projectId: string,
  functionId: string,
  result: {
    status: string;
    duration: number;
    statusCode?: number;
    error?: string;
  }
) {
  const io = getSocketServer();
  if (!io) return;

  io.to(`project:${projectId}`).emit("function:invocation", {
    functionId,
    ...result,
    timestamp: new Date().toISOString(),
  });
}
