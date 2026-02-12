"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);

    // Report to Sentry if configured
    import("@/lib/integrations/sentry")
      .then(({ captureException, isSentryConfigured }) => {
        if (isSentryConfigured()) {
          captureException(error, {
            level: "error",
            tags: {
              source: "global-error-boundary",
              digest: error.digest || "unknown",
            },
          });
        }
      })
      .catch(() => {
        // Sentry import failed; swallow silently to avoid cascading errors
      });
  }, [error]);

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          @media (prefers-color-scheme: light) {
            body { background-color: #fafafa !important; color: #0a0a0a !important; }
            .error-btn { border-color: #d4d4d8 !important; color: #0a0a0a !important; }
            .error-btn:hover { background-color: #f4f4f5 !important; }
            .error-sub { color: #71717a !important; }
          }
        `}} />
      </head>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", backgroundColor: "#0a0a0a", color: "#fafafa" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p className="error-sub" style={{ color: "#a1a1aa", marginBottom: "1.5rem" }}>
            A critical error occurred. Please try again.
          </p>
          {error.digest && (
            <p className="error-sub" style={{ color: "#a1a1aa", fontSize: "0.75rem", marginBottom: "1rem" }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            className="error-btn"
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #27272a",
              backgroundColor: "transparent",
              color: "#fafafa",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
