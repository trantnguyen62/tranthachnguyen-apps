"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mb-6 max-w-lg overflow-auto rounded-lg bg-red-950/20 border border-red-900/30 p-4 text-sm text-red-400">
          {error.message}
        </pre>
      )}
      <Button variant="outline" onClick={reset}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}
