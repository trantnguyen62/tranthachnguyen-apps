/**
 * Socket.io Real-time Server
 * Provides real-time collaboration features:
 * - Deployment log streaming
 * - Presence indicators
 * - Live status updates
 */

import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { prisma } from "@/lib/prisma";
import { validateApiToken } from "@/lib/auth/api-token";
import { verifyToken } from "@/lib/auth/jwt";

// Singleton instance
let io: SocketServer | null = null;

// Connected user tracking
const connectedUsers = new Map<string, Set<string>>(); // projectId -> Set<socketId>
const socketToUser = new Map<string, SocketUser>();

export interface SocketUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Initialize Socket.io server
 */
export function initSocketServer(httpServer: HttpServer): SocketServer {
  if (io) {
    return io;
  }

  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      credentials: true,
    },
    path: "/api/socket",
    transports: ["websocket", "polling"],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      // Try API token first (for CLI)
      if (token.startsWith("cl_")) {
        const mockRequest = {
          headers: {
            get: (name: string) => (name === "authorization" ? `Bearer ${token}` : null),
          },
        } as any;

        const user = await validateApiToken(mockRequest);
        if (user) {
          socket.data.user = {
            id: user.id,
            email: user.email,
            name: user.name,
          };
          return next();
        }
      }

      // Try JWT session token
      const payload = verifyToken(token);
      if (payload) {
        const session = await prisma.session.findUnique({
          where: { id: payload.sessionId },
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        });

        if (session && session.expiresAt > new Date()) {
          socket.data.user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
          };
          return next();
        }
      }

      return next(new Error("Authentication failed"));
    } catch (error) {
      console.error("Socket auth error:", error);
      return next(new Error("Authentication failed"));
    }
  });

  // Connection handler
  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    console.log(`[Socket] User connected: ${user.email} (${socket.id})`);

    // Store user info
    socketToUser.set(socket.id, user);

    // Join project room
    socket.on("join:project", async (projectId: string) => {
      const hasAccess = await checkProjectAccess(user.id, projectId);

      if (!hasAccess) {
        socket.emit("error", { message: "Access denied to project" });
        return;
      }

      socket.join(`project:${projectId}`);

      // Track user in project
      if (!connectedUsers.has(projectId)) {
        connectedUsers.set(projectId, new Set());
      }
      connectedUsers.get(projectId)!.add(socket.id);

      // Broadcast presence join
      socket.to(`project:${projectId}`).emit("presence:join", {
        userId: user.id,
        name: user.name,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      // Send current viewers to the joining user
      const viewers = getProjectViewers(projectId);
      socket.emit("presence:list", { viewers });

      console.log(`[Socket] ${user.email} joined project:${projectId}`);
    });

    // Leave project room
    socket.on("leave:project", (projectId: string) => {
      leaveProject(socket, projectId, user);
    });

    // Join deployment log stream
    socket.on("join:deployment", async (deploymentId: string) => {
      // Verify access through project
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        include: {
          project: {
            select: { id: true, userId: true },
          },
        },
      });

      if (!deployment) {
        socket.emit("error", { message: "Deployment not found" });
        return;
      }

      const hasAccess = await checkProjectAccess(user.id, deployment.project.id);
      if (!hasAccess) {
        socket.emit("error", { message: "Access denied" });
        return;
      }

      socket.join(`deployment:${deploymentId}`);
      console.log(`[Socket] ${user.email} joined deployment:${deploymentId}`);
    });

    // Leave deployment room
    socket.on("leave:deployment", (deploymentId: string) => {
      socket.leave(`deployment:${deploymentId}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${user.email}`);

      // Remove from all project rooms
      connectedUsers.forEach((sockets, projectId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);

          // Broadcast presence leave
          io?.to(`project:${projectId}`).emit("presence:leave", {
            userId: user.id,
            timestamp: new Date().toISOString(),
          });

          // Clean up empty sets
          if (sockets.size === 0) {
            connectedUsers.delete(projectId);
          }
        }
      });

      socketToUser.delete(socket.id);
    });
  });

  return io;
}

/**
 * Get the Socket.io server instance
 */
export function getSocketServer(): SocketServer | null {
  return io;
}

/**
 * Check if user has access to a project
 */
async function checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { userId },
        {
          teamProjects: {
            some: {
              team: {
                members: {
                  some: { userId },
                },
              },
            },
          },
        },
      ],
    },
  });

  return !!project;
}

/**
 * Leave a project room
 */
function leaveProject(socket: Socket, projectId: string, user: SocketUser) {
  socket.leave(`project:${projectId}`);

  const projectSockets = connectedUsers.get(projectId);
  if (projectSockets) {
    projectSockets.delete(socket.id);

    if (projectSockets.size === 0) {
      connectedUsers.delete(projectId);
    }
  }

  // Broadcast presence leave
  socket.to(`project:${projectId}`).emit("presence:leave", {
    userId: user.id,
    timestamp: new Date().toISOString(),
  });

  console.log(`[Socket] ${user.email} left project:${projectId}`);
}

/**
 * Get list of users viewing a project
 */
function getProjectViewers(projectId: string): Array<{ userId: string; name: string; email: string }> {
  const projectSockets = connectedUsers.get(projectId);
  if (!projectSockets) return [];

  const viewers: Array<{ userId: string; name: string; email: string }> = [];
  const seenUsers = new Set<string>();

  projectSockets.forEach((socketId) => {
    const user = socketToUser.get(socketId);
    if (user && !seenUsers.has(user.id)) {
      seenUsers.add(user.id);
      viewers.push({
        userId: user.id,
        name: user.name,
        email: user.email,
      });
    }
  });

  return viewers;
}

/**
 * Broadcast to a specific project room
 */
export function broadcastToProject(projectId: string, event: string, data: any) {
  if (!io) return;
  io.to(`project:${projectId}`).emit(event, data);
}

/**
 * Broadcast to a specific deployment room
 */
export function broadcastToDeployment(deploymentId: string, event: string, data: any) {
  if (!io) return;
  io.to(`deployment:${deploymentId}`).emit(event, data);
}
