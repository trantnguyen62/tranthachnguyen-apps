import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "secondary";
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div className="mb-4">
        <Icon className="h-12 w-12 text-[var(--text-quaternary,theme(colors.muted.foreground/40))]" />
      </div>

      <h3 className="text-[length:var(--text-headline,17px)] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-[length:var(--text-footnote,13px)] text-[var(--text-secondary,theme(colors.muted.foreground))] max-w-sm mb-6">
          {description}
        </p>
      )}

      {action && (
        <div>
          <Button
            variant={action.variant || "default"}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
