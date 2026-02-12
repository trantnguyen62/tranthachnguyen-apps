"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Cloud, Bug, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    console.error(error);

    // Report to error tracking
    fetch("/api/error-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      }),
    }).catch((err) => console.warn("Failed to report error:", err));
  }, [error]);

  const reportUrl = `mailto:support@cloudify.app?subject=${encodeURIComponent(
    `Bug Report: ${error.message || "Application Error"}`
  )}&body=${encodeURIComponent(
    `Error ID: ${error.digest || "N/A"}\nURL: ${typeof window !== "undefined" ? window.location.href : "N/A"}\n\nDescription:\n[Please describe what you were doing when this error occurred]\n`
  )}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-primary)] px-4">
      <div className="text-center max-w-lg">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative inline-flex">
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 to-red-500 mx-auto">
              <AlertTriangle className="h-12 w-12 text-white" />
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 bg-yellow-500 text-white p-2 rounded-full"
            >
              <Bug className="h-4 w-4" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
            Something went wrong
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mb-2">
            We encountered an unexpected error.
          </p>
          <p className="text-[var(--text-secondary)] mb-6">
            Don&apos;t worry, our team has been notified and is working on a fix.
          </p>

          {error.digest && (
            <div className="mb-6 p-3 bg-muted rounded-lg">
              <p className="text-sm text-[var(--text-secondary)]">
                Error ID: <code className="font-mono text-[var(--text-primary)]">{error.digest}</code>
              </p>
            </div>
          )}

          {/* Dev mode error details */}
          {isDev && (
            <div className="mb-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 mx-auto text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showDetails ? "Hide" : "Show"} error details
              </button>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-3"
                >
                  <pre className="text-left max-h-64 overflow-auto rounded-lg bg-red-950/20 border border-red-900/30 p-4 text-sm text-red-400">
                    <strong>{error.name}: {error.message}</strong>
                    {"\n\n"}
                    {error.stack}
                  </pre>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button variant="default" size="lg" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10"
        >
          <div className="p-4 bg-card rounded-xl border border-[var(--border-primary)]">
            <div className="flex items-start gap-3">
              <Cloud className="h-5 w-5 text-[var(--text-primary)] shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Need help?
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Check our{" "}
                  <Link href="/docs" className="text-[#0070f3] underline">
                    documentation
                  </Link>{" "}
                  or{" "}
                  <a href={reportUrl} className="text-[#0070f3] underline inline-flex items-center gap-1">
                    report this issue
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  if the problem persists.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
