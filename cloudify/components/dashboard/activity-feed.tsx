"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  GitBranch,
  Globe,
  Settings,
  Users,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "deployment" | "domain" | "team" | "settings" | "security";
  action: string;
  description: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  timestamp: string;
  status?: "success" | "error" | "warning";
  link?: string;
}

const mockActivities: Activity[] = [
  {
    id: "act-1",
    type: "deployment",
    action: "Deployment completed",
    description: "my-portfolio deployed to production",
    user: { name: "John Doe", initials: "JD" },
    timestamp: "2 minutes ago",
    status: "success",
    link: "/deployments",
  },
  {
    id: "act-2",
    type: "domain",
    action: "Domain verified",
    description: "johndoe.com is now active",
    user: { name: "John Doe", initials: "JD" },
    timestamp: "15 minutes ago",
    status: "success",
    link: "/domains",
  },
  {
    id: "act-3",
    type: "deployment",
    action: "Build failed",
    description: "api-service deployment failed",
    user: { name: "Jane Smith", initials: "JS" },
    timestamp: "1 hour ago",
    status: "error",
    link: "/deployments",
  },
  {
    id: "act-4",
    type: "team",
    action: "Team member added",
    description: "mike@example.com joined the team",
    user: { name: "John Doe", initials: "JD" },
    timestamp: "2 hours ago",
    status: "success",
  },
  {
    id: "act-5",
    type: "settings",
    action: "Environment updated",
    description: "Added 3 new environment variables",
    user: { name: "Jane Smith", initials: "JS" },
    timestamp: "3 hours ago",
  },
  {
    id: "act-6",
    type: "security",
    action: "2FA enabled",
    description: "Two-factor authentication activated",
    user: { name: "John Doe", initials: "JD" },
    timestamp: "1 day ago",
    status: "success",
  },
];

const typeConfig = {
  deployment: {
    icon: GitBranch,
    color: "text-foreground",
    bg: "bg-secondary",
  },
  domain: {
    icon: Globe,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  team: {
    icon: Users,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  settings: {
    icon: Settings,
    color: "text-muted-foreground",
    bg: "bg-secondary",
  },
  security: {
    icon: Shield,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
};

const statusIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const statusColors = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-yellow-600 dark:text-yellow-400",
};

interface ActivityFeedProps {
  activities?: Activity[];
  maxItems?: number;
  showHeader?: boolean;
}

export function ActivityFeed({
  activities: activitiesProp,
  maxItems = 10,
  showHeader = true,
}: ActivityFeedProps) {
  const [fetchedActivities, setFetchedActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(!activitiesProp);

  useEffect(() => {
    if (activitiesProp) return;

    async function fetchActivities() {
      try {
        const res = await fetch("/api/activity");
        if (res.ok) {
          const data = await res.json();
          setFetchedActivities(data.activities || data);
        } else {
          setFetchedActivities([]);
        }
      } catch {
        setFetchedActivities([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivities();
  }, [activitiesProp]);

  const activities = activitiesProp || fetchedActivities;
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">
            Recent Activity
          </h3>
          <Link
            href="/activity"
            className="text-sm text-[#0070f3] hover:text-[#0070f3]"
          >
            View all
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 animate-pulse">
              <div className="p-2 rounded-lg bg-secondary h-8 w-8 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary rounded w-1/3" />
                <div className="h-3 bg-secondary rounded w-2/3" />
                <div className="h-3 bg-secondary rounded w-1/4" />
              </div>
            </div>
          ))
        ) : displayedActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : null}
        {!isLoading && displayedActivities.map((activity, index) => {
          const config = typeConfig[activity.type];
          const TypeIcon = config.icon;
          const StatusIcon = activity.status
            ? statusIcons[activity.status]
            : null;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-4"
            >
              {/* Icon */}
              <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
                <TypeIcon className={cn("h-4 w-4", config.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {activity.action}
                  </span>
                  {StatusIcon && (
                    <StatusIcon
                      className={cn(
                        "h-4 w-4",
                        statusColors[activity.status!]
                      )}
                    />
                  )}
                </div>
                {activity.link ? (
                  <Link
                    href={activity.link}
                    className="text-sm text-muted-foreground hover:text-[#0070f3] dark:hover:text-[#0070f3]"
                  >
                    {activity.description}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={activity.user.avatar} />
                    <AvatarFallback className="text-[10px]">
                      {activity.user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {activity.user.name} · {activity.timestamp}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
