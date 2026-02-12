"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI to render when an error occurs */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show a minimal inline error instead of a centered panel */
  inline?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable error boundary component that:
 * - Catches render errors in its children
 * - Shows a friendly error message with a "Retry" button
 * - Reports to Sentry if configured
 * - Falls back to a minimal UI
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <SomeComponent />
 * </ErrorBoundary>
 *
 * <ErrorBoundary fallback={<p>Custom fallback</p>}>
 *   <SomeComponent />
 * </ErrorBoundary>
 *
 * <ErrorBoundary inline>
 *   <SmallWidget />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Report to Sentry if configured
    import("@/lib/integrations/sentry")
      .then(({ captureException, isSentryConfigured }) => {
        if (isSentryConfigured()) {
          captureException(error, {
            level: "error",
            tags: { source: "error-boundary" },
            extra: { componentStack: errorInfo.componentStack },
          });
        }
      })
      .catch(() => {
        // Sentry import failed; swallow silently
      });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Inline minimal error
      if (this.props.inline) {
        return (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive flex-1">
              Something went wrong loading this section.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={this.handleRetry}
              className="shrink-0"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        );
      }

      // Default panel error
      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-[var(--text-secondary)] text-center max-w-sm mb-4">
            An unexpected error occurred while rendering this section.
            Please try again.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mb-4 max-w-lg overflow-auto rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-xs text-destructive">
              {this.state.error.message}
            </pre>
          )}
          <Button variant="secondary" size="sm" onClick={this.handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
