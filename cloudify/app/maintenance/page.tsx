"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Cloud,
  Wrench,
  Mail,
  ArrowRight,
  CheckCircle2,
  Github,
  Twitter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ---------------------------------------------------------------------------
// Maintenance page
// ---------------------------------------------------------------------------

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Simulate subscription (replace with real endpoint when available)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubscribed(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-primary)] px-4 py-12">
      <div className="text-center max-w-lg w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <Cloud className="h-4 w-4 text-background" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Cloudify
            </span>
          </Link>
        </motion.div>

        {/* Animated icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative inline-flex">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10 mx-auto">
              <Wrench className="h-10 w-10 text-orange-500" />
            </div>
            {/* Pulsing status dot */}
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute top-0 right-0 h-5 w-5 rounded-full bg-orange-500 border-2 border-[var(--surface-primary)] flex items-center justify-center"
            >
              <div className="h-2 w-2 rounded-full bg-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Status heading */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-medium mb-6">
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="h-2 w-2 rounded-full bg-orange-500"
            />
            Scheduled Maintenance
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
            We&apos;ll be back shortly
          </h1>
          <p className="text-[var(--text-secondary)] mb-2">
            We&apos;re performing scheduled maintenance to improve our platform.
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            All deployments and services will continue running normally.
            Only the dashboard is temporarily unavailable.
          </p>
        </motion.div>

        {/* Estimated time */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="inline-flex flex-col items-center gap-1 px-6 py-4 rounded-xl border border-[var(--border-primary)] bg-card">
            <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Estimated return
            </span>
            <span className="text-lg font-semibold text-[var(--text-primary)]">
              Within 30 minutes
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              Usually much sooner
            </span>
          </div>
        </motion.div>

        {/* Subscribe for updates */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-10"
        >
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              We&apos;ll notify you when we&apos;re back online.
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
                Get notified when we&apos;re back
              </p>
              <form
                onSubmit={handleSubscribe}
                className="flex gap-2 max-w-sm mx-auto"
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    className="pl-9"
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Notify me
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
              {error && (
                <p className="text-xs text-destructive mt-2">{error}</p>
              )}
            </>
          )}
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            Follow us for real-time updates
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="https://twitter.com/cloudifydev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-card text-sm text-[var(--text-primary)] hover:bg-accent transition-colors"
            >
              <Twitter className="h-4 w-4 text-[var(--text-secondary)]" />
              Twitter
            </Link>
            <Link
              href="https://github.com/cloudify"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-card text-sm text-[var(--text-primary)] hover:bg-accent transition-colors"
            >
              <Github className="h-4 w-4 text-[var(--text-secondary)]" />
              GitHub
            </Link>
          </div>
        </motion.div>

        {/* Status page link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <Link
            href="/status"
            className="text-xs text-[var(--text-secondary)] underline hover:text-[var(--text-primary)] transition-colors"
          >
            Check system status
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
