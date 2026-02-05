import { AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react";

type CalloutType = "info" | "warning" | "error" | "success";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const calloutStyles: Record<CalloutType, { bg: string; border: string; icon: string; title: string }> = {
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-500",
    title: "text-blue-800",
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: "text-yellow-500",
    title: "text-yellow-800",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-500",
    title: "text-red-800",
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "text-green-500",
    title: "text-green-800",
  },
};

const calloutIcons: Record<CalloutType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

export function Callout({ type = "info", title, children }: CalloutProps) {
  const styles = calloutStyles[type];
  const Icon = calloutIcons[type];

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4 my-4`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          {title && (
            <p className={`font-medium ${styles.title} mb-1`}>{title}</p>
          )}
          <div className="text-sm text-gray-700">{children}</div>
        </div>
      </div>
    </div>
  );
}
