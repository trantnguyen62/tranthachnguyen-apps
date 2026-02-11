import {
  CheckCircle2,
  Loader2,
  Clock,
  XCircle,
} from "lucide-react";

export const statusConfig = {
  ready: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    label: "Ready",
  },
  building: {
    icon: Loader2,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Building",
  },
  queued: {
    icon: Clock,
    color: "text-foreground",
    bg: "bg-secondary",
    label: "Queued",
  },
  error: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    label: "Error",
  },
  failed: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    label: "Failed",
  },
  canceled: {
    icon: XCircle,
    color: "text-muted-foreground",
    bg: "bg-secondary/30",
    label: "Canceled",
  },
  cancelled: {
    icon: XCircle,
    color: "text-muted-foreground",
    bg: "bg-secondary/30",
    label: "Cancelled",
  },
};

export function getStatusConfig(status: string) {
  const normalizedStatus = status.toLowerCase();
  return statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.ready;
}
