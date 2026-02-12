"use client";

import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] bg-[var(--surface-tertiary)]",
        "bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]",
        "bg-gradient-to-r from-[var(--surface-tertiary)] via-[var(--surface-secondary)] to-[var(--surface-tertiary)]",
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-primary)] p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-[var(--radius-sm)]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 p-4 border-b border-[var(--separator)]">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-md)] border border-[var(--border-primary)] p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-8 rounded-[var(--radius-sm)]" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function SkeletonDeployment() {
  return (
    <div className="flex items-center justify-between p-4 rounded-[var(--radius-md)] border border-[var(--border-primary)]">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-[var(--radius-sm)]" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-[var(--radius-sm)]" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-[var(--radius-sm)]" />
      </div>
    </div>
  );
}

function SkeletonAuditLog() {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-[var(--separator)] last:border-0">
      <Skeleton className="h-10 w-10 rounded-[var(--radius-sm)] shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-16 rounded-[var(--radius-sm)]" />
          <Skeleton className="h-5 w-20 rounded-[var(--radius-sm)]" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-16 shrink-0" />
    </div>
  );
}

function SkeletonAuditLogList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[var(--separator)]">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonAuditLog key={i} />
      ))}
    </div>
  );
}

function SkeletonRetentionStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-md)] border border-[var(--border-primary)] p-4"
        >
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

function SkeletonQuickAction() {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-primary)] p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-10 w-10 rounded-[var(--radius-sm)]" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function SkeletonQuickActionGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonQuickAction key={i} />
      ))}
    </div>
  );
}

function SkeletonAnalysisCard() {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-primary)] p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-[var(--radius-sm)]" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-[var(--radius-sm)]" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

function SkeletonAnalysisList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonAnalysisCard key={i} />
      ))}
    </div>
  );
}

function SkeletonConversation() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-[var(--radius-md)] border border-[var(--border-primary)]">
      <Skeleton className="h-10 w-10 rounded-[var(--radius-full)] shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full max-w-md" />
      </div>
      <div className="text-right shrink-0 space-y-1">
        <Skeleton className="h-3 w-16 ml-auto" />
        <Skeleton className="h-5 w-8 rounded-[var(--radius-full)] ml-auto" />
      </div>
    </div>
  );
}

function SkeletonConversationList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonConversation key={i} />
      ))}
    </div>
  );
}

function SkeletonErrorPattern() {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-primary)] p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-[var(--radius-sm)]" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-12 rounded-[var(--radius-sm)]" />
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-4/5 mb-3" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-[var(--radius-sm)]" />
        <Skeleton className="h-5 w-24 rounded-[var(--radius-sm)]" />
      </div>
    </div>
  );
}

function SkeletonErrorPatternList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonErrorPattern key={i} />
      ))}
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonStats,
  SkeletonDeployment,
  SkeletonAuditLog,
  SkeletonAuditLogList,
  SkeletonRetentionStats,
  SkeletonQuickAction,
  SkeletonQuickActionGrid,
  SkeletonAnalysisCard,
  SkeletonAnalysisList,
  SkeletonConversation,
  SkeletonConversationList,
  SkeletonErrorPattern,
  SkeletonErrorPatternList,
};
