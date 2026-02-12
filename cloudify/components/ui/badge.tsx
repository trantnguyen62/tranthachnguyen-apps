"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-sm)] border border-transparent h-[22px] leading-[22px] px-2 py-0 text-[length:var(--text-caption)] font-medium tracking-[var(--tracking-wide)] transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--surface-secondary)] text-[var(--text-secondary)]",
        neutral:
          "bg-[var(--surface-secondary)] text-[var(--text-secondary)]",
        secondary:
          "bg-[var(--surface-secondary)] text-[var(--text-secondary)]",
        success:
          "bg-[var(--success-subtle)] text-[#1B7A3D] dark:text-[var(--success)]",
        warning:
          "bg-[var(--warning-subtle)] text-[#9A6700] dark:text-[var(--warning)]",
        error:
          "bg-[var(--error-subtle)] text-[#CC2E26] dark:text-[var(--error)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
