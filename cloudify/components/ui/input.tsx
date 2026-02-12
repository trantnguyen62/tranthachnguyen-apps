"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[44px] w-full rounded-[var(--radius-sm)] border bg-[var(--surface-recessed)] px-3 text-[length:var(--text-body)] text-[var(--text-primary)] shadow-[var(--shadow-inset)] transition-[border-color,box-shadow] duration-200 file:border-0 file:bg-transparent file:text-[length:var(--text-body)] file:font-medium placeholder:text-[var(--text-quaternary)] outline-none focus:border-[var(--border-focused)] focus:shadow-[0_0_0_3px_var(--accent-subtle)] disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-[var(--error)] focus:shadow-[0_0_0_3px_var(--error-subtle)]"
            : "border-[var(--border-primary)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
