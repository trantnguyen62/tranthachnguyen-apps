"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Cloud, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error and report to Sentry via API
    console.error(error);
    fetch("/api/error-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
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
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Something went wrong
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            We encountered an unexpected error.
          </p>
          <p className="text-muted-foreground mb-6">
            Don't worry, our team has been notified and is working on a fix.
          </p>

          {error.digest && (
            <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Error ID: <code className="font-mono">{error.digest}</code>
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="default" size="lg" onClick={reset}>
            <RefreshCw className="h-5 w-5" />
            Try Again
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">
              <Home className="h-5 w-5" />
              Go to Homepage
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <div className="p-4 bg-secondary rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Cloud className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  Need help?
                </p>
                <p className="text-sm text-[#0070f3] mt-1">
                  Check our{" "}
                  <Link href="/docs" className="underline">
                    documentation
                  </Link>{" "}
                  or{" "}
                  <a href="mailto:support@cloudify.app" className="underline">
                    contact support
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
