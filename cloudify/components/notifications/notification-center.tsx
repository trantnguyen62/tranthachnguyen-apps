"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  GitBranch,
  Globe,
  Users,
  Settings,
  ExternalLink,
  Check,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NotificationType = "deployment" | "domain" | "team" | "system" | "security";
type NotificationStatus = "success" | "error" | "warning" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "deployment",
    status: "success",
    title: "Deployment Successful",
    message: "my-portfolio deployed to production",
    timestamp: "2 minutes ago",
    read: false,
    link: "/deployments",
  },
  {
    id: "2",
    type: "domain",
    status: "success",
    title: "Domain Verified",
    message: "johndoe.com is now active",
    timestamp: "1 hour ago",
    read: false,
    link: "/domains",
  },
  {
    id: "3",
    type: "deployment",
    status: "error",
    title: "Build Failed",
    message: "api-service deployment failed - check logs",
    timestamp: "2 hours ago",
    read: false,
    link: "/deployments",
  },
  {
    id: "4",
    type: "team",
    status: "info",
    title: "New Team Member",
    message: "Sarah Wilson joined the team",
    timestamp: "5 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "security",
    status: "warning",
    title: "Security Alert",
    message: "New login from unknown device",
    timestamp: "1 day ago",
    read: true,
    link: "/settings",
  },
  {
    id: "6",
    type: "system",
    status: "info",
    title: "System Update",
    message: "New features available in your dashboard",
    timestamp: "2 days ago",
    read: true,
  },
];

const typeIcons = {
  deployment: GitBranch,
  domain: Globe,
  team: Users,
  system: Settings,
  security: AlertTriangle,
};

const statusIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const statusColors = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-[#0070f3]",
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || data);
        } else {
          setNotifications([]);
        }
      } catch {
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Notifications
          </h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-xs text-muted-foreground"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3 animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.map((notification) => {
                const TypeIcon = typeIcons[notification.type];
                const StatusIcon = statusIcons[notification.status];

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "relative px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors",
                      !notification.read && "bg-secondary/50"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="p-2 rounded-lg bg-secondary">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <StatusIcon
                          className={cn(
                            "absolute -bottom-1 -right-1 h-4 w-4",
                            statusColors[notification.status]
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm",
                              !notification.read
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground"
                            )}
                          >
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 rounded hover:bg-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp}
                          </span>
                          {notification.link && (
                            <a
                              href={notification.link}
                              className="text-xs text-foreground hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-foreground" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-border">
            <Button variant="ghost" className="w-full text-sm" asChild>
              <a href="/activity">View all notifications</a>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
