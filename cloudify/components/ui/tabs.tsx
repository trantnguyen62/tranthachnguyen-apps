"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const indicatorRef = React.useRef<HTMLDivElement>(null);

  const updateIndicator = React.useCallback(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;

    const activeTab = list.querySelector<HTMLElement>('[data-state="active"]');
    if (activeTab) {
      const listRect = list.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      indicator.style.left = `${tabRect.left - listRect.left}px`;
      indicator.style.width = `${tabRect.width}px`;
      indicator.style.opacity = "1";
    } else {
      indicator.style.opacity = "0";
    }
  }, []);

  React.useEffect(() => {
    updateIndicator();

    const list = listRef.current;
    if (!list) return;

    const observer = new MutationObserver(updateIndicator);
    observer.observe(list, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state"],
    });

    return () => observer.disconnect();
  }, [updateIndicator]);

  return (
    <TabsPrimitive.List
      ref={(node) => {
        listRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn(
        "relative inline-flex h-10 items-center gap-0 border-b border-[var(--separator)] bg-transparent text-[var(--text-tertiary)]",
        className
      )}
      {...props}
    >
      {children}
      <div
        ref={indicatorRef}
        className="absolute bottom-0 h-[2px] bg-[var(--text-primary)] transition-all duration-200 ease-out"
        style={{ opacity: 0 }}
      />
    </TabsPrimitive.List>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap px-4 py-2.5 text-[length:var(--text-body)] font-normal transition-colors duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-subtle)] rounded-t-[var(--radius-sm)] disabled:pointer-events-none disabled:opacity-50 hover:text-[var(--text-primary)] data-[state=active]:font-medium data-[state=active]:text-[var(--text-primary)]",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "pt-[var(--space-5)] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-subtle)] rounded-[var(--radius-sm)]",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
