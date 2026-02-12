"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User,
  GitBranch,
  Rocket,
  ArrowRight,
  Loader2,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

interface OnboardingStatus {
  completed: boolean;
  currentStep: number;
  hasProjects: boolean;
  user: {
    name: string;
    avatar: string | null;
  };
}

const steps = [
  {
    icon: User,
    label: "Set up profile",
    description: "Customize your account",
  },
  {
    icon: GitBranch,
    label: "Create first project",
    description: "Import a Git repository",
  },
  {
    icon: Rocket,
    label: "First deploy",
    description: "Ship it to the cloud",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    async function fetchOnboardingStatus() {
      try {
        const res = await fetch("/api/onboarding");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
          // If already completed, redirect to dashboard
          if (data.completed) {
            router.push("/dashboard");
            return;
          }
        }
      } catch {
        // Proceed with defaults
      } finally {
        setLoading(false);
      }
    }
    fetchOnboardingStatus();
  }, [router]);

  const userName =
    status?.user?.name || session?.user?.name || "there";
  const firstName = userName.split(" ")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (showWizard) {
    return (
      <OnboardingWizard
        initialStep={status?.currentStep || 1}
        onComplete={() => router.push("/dashboard")}
      />
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-[80vh] overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 dark:bg-blue-400/10 rounded-full blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 dark:bg-purple-400/10 rounded-full blur-3xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-400/15 dark:bg-indigo-400/5 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground shadow-lg">
            <Cloud className="h-8 w-8 text-background" />
          </div>
        </motion.div>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4"
        >
          Welcome to Cloudify,{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {firstName}!
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-lg text-[var(--text-secondary)] mb-12"
        >
          Let&apos;s get your first project deployed in under 5 minutes.
        </motion.p>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex items-center justify-center gap-4 md:gap-6 mb-12"
        >
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                    (status?.currentStep || 0) > index + 1
                      ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                      : (status?.currentStep || 0) === index + 1
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-[var(--border-primary)] bg-[var(--surface-primary)]"
                  }`}
                >
                  <step.icon
                    className={`h-5 w-5 ${
                      (status?.currentStep || 0) > index + 1
                        ? "text-green-600 dark:text-green-400"
                        : (status?.currentStep || 0) === index + 1
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-[var(--text-secondary)]"
                    }`}
                  />
                </div>
                <span className="text-xs font-medium mt-2 text-[var(--text-primary)]">
                  {step.label}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  {step.description}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden md:block w-16 h-0.5 mx-2 mt-[-1.5rem] ${
                    (status?.currentStep || 0) > index + 1
                      ? "bg-green-500"
                      : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
        >
          <Button
            size="lg"
            className="h-12 px-8 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-blue-500/25 dark:shadow-blue-500/10"
            onClick={() => setShowWizard(true)}
          >
            Let&apos;s get started
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </motion.div>

        {/* Skip option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-6"
        >
          <Button
            variant="ghost"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            onClick={async () => {
              await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: true }),
              });
              router.push("/dashboard");
            }}
          >
            Skip for now
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
