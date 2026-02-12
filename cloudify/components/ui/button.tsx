"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[length:var(--text-body)] font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-subtle)] focus-visible:border-[var(--border-focused)] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:brightness-[1.08] active:bg-[var(--accent-active)] shadow-sm hover:shadow-md",
        destructive:
          "bg-[var(--error)] text-white hover:bg-[#E5342B] hover:brightness-[1.08] active:bg-[#CC2E26] shadow-sm hover:shadow-md",
        secondary:
          "border border-[var(--border-primary)] bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--surface-tertiary)] active:bg-[var(--surface-tertiary)]",
        ghost:
          "text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] active:bg-[var(--surface-tertiary)]",
      },
      size: {
        default: "h-9 px-4 py-2 rounded-[var(--radius-sm)]",
        sm: "h-8 px-3 text-[length:var(--text-footnote)] rounded-[var(--radius-sm)]",
        lg: "h-11 px-6 text-[length:var(--text-body)] rounded-[var(--radius-sm)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
