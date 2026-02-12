"use client";

import { useProjectPresence } from "@/hooks/use-realtime";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from "lucide-react";

interface PresenceIndicatorProps {
  projectId: string;
  showCount?: boolean;
  maxAvatars?: number;
}

/**
 * Component showing who's currently viewing a project
 */
export function PresenceIndicator({
  projectId,
  showCount = true,
  maxAvatars = 5,
}: PresenceIndicatorProps) {
  const { viewers, isConnected } = useProjectPresence(projectId);

  if (!isConnected || viewers.length === 0) {
    return null;
  }

  const displayViewers = viewers.slice(0, maxAvatars);
  const remainingCount = viewers.length - maxAvatars;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {showCount && (
          <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {viewers.length}
          </span>
        )}
        <div className="flex -space-x-2">
          {displayViewers.map((viewer) => (
            <Tooltip key={viewer.userId}>
              <TooltipTrigger asChild>
                <div
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-900 cursor-default"
                  style={{
                    backgroundColor: getColorFromName(viewer.name),
                  }}
                >
                  {getInitials(viewer.name)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{viewer.name}</p>
                {viewer.email && (
                  <p className="text-xs text-gray-400">{viewer.email}</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-7 h-7 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-900 cursor-default">
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{remainingCount} more viewing</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Compact version for headers
 */
export function PresenceIndicatorCompact({ projectId }: { projectId: string }) {
  const { viewers, isConnected } = useProjectPresence(projectId);

  if (!isConnected || viewers.length <= 1) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>{viewers.length} viewing</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            {viewers.map((viewer) => (
              <p key={viewer.userId} className="text-sm">
                {viewer.name}
              </p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate a consistent color from a name
 */
function getColorFromName(name: string): string {
  const colors = [
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#a855f7", // purple
    "#d946ef", // fuchsia
    "#ec4899", // pink
    "#f43f5e", // rose
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#eab308", // yellow
    "#84cc16", // lime
    "#22c55e", // green
    "#10b981", // emerald
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#0ea5e9", // sky
    "#0070f3", // blue
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
