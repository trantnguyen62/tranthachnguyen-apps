"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ leftIcon, rightIcon, error, className = "", ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full h-10
            px-3 ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""}
            bg-background
            border border-border rounded-lg
            text-body text-foreground placeholder:text-foreground-secondary
            transition-all duration-fast
            hover:border-foreground-secondary
            focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-error focus:ring-error" : ""}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary">
            {rightIcon}
          </div>
        )}
        {error && (
          <p className="mt-1.5 text-caption text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
