"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, Play, Github, Sparkles, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";

const stats = [
  { value: "10B+", label: "Requests per week" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "100+", label: "Edge locations" },
  { value: "< 50ms", label: "Global latency" },
];

const logos = [
  "Washington Post",
  "Stripe",
  "Notion",
  "Loom",
  "OpenAI",
  "Replicate",
];

interface DeployStep {
  text: string;
  duration: number;
}

const deploySteps: DeployStep[] = [
  { text: "Cloning repository...", duration: 800 },
  { text: "Detecting framework: Next.js 16", duration: 600 },
  { text: "Installing dependencies...", duration: 1200 },
  { text: "Building project...", duration: 1500 },
  { text: "Optimizing for production...", duration: 800 },
  { text: "Deploying to 100+ edge locations...", duration: 1000 },
  { text: "Provisioning SSL certificate...", duration: 600 },
  { text: "Running health checks...", duration: 500 },
];

function AnimatedTerminal() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const runDeploy = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsComplete(false);
    setShowUrl(false);

    let totalDelay = 0;

    deploySteps.forEach((step, i) => {
      totalDelay += step.duration;
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, i]);
        setCurrentStep(i + 1);
        if (i === deploySteps.length - 1) {
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(() => setShowUrl(true), 400);
          }, 300);
        }
      }, totalDelay);
    });

    setTimeout(() => {
      runDeploy();
    }, totalDelay + 4000);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runDeploy(), 1000);
    return () => clearTimeout(timer);
  }, [runDeploy]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative mx-auto mt-16 max-w-3xl"
    >
      <div className="relative overflow-hidden rounded-lg border border-border bg-gray-950 shadow-2xl">
        {/* Terminal header */}
        <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900/80 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-gray-500 font-mono">cloudify deploy --prod</span>
          </div>
        </div>

        {/* Terminal body */}
        <div className="p-6 font-mono text-sm min-h-[280px]">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-green-400">$</span>
            <span className="text-white">git push origin main</span>
          </div>

          <div className="mt-4 space-y-1.5">
            {deploySteps.map((step, i) => {
              const isCompleted = completedSteps.includes(i);
              const isCurrent = currentStep === i;
              const isVisible = i <= currentStep;

              if (!isVisible) return null;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-600 shrink-0" />
                  )}
                  <span
                    className={
                      isCompleted
                        ? "text-green-400"
                        : isCurrent
                        ? "text-white"
                        : "text-gray-600"
                    }
                  >
                    {step.text}
                  </span>
                  {isCompleted && (
                    <span className="text-gray-600 text-xs ml-auto">
                      {(step.duration / 1000).toFixed(1)}s
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-4 border-t border-gray-800 pt-4"
              >
                <div className="flex items-center gap-2 text-green-400 font-semibold">
                  <Zap className="h-4 w-4" />
                  Deployment successful!
                </div>
                {showUrl && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 space-y-1"
                  >
                    <div className="text-gray-400">
                      Production: <span className="text-[#0070f3] underline">https://my-app.cloudify.app</span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      Deployed to 100+ edge locations in 4.2s
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function AnimatedCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-foreground lg:text-4xl">
        {value}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      <div className="relative mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <div className="pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-foreground"
            >
              <Sparkles className="h-4 w-4" />
              <span>Introducing AI Gateway - Multi-model access</span>
              <ArrowRight className="h-4 w-4" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            >
              Your code.{" "}
              <span className="gradient-text">
                Global
              </span>{" "}
              in seconds.
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-6 text-xl leading-8 text-muted-foreground"
            >
              Cloudify is the platform for frontend developers, providing the speed and reliability
              innovators need to create at the moment of inspiration.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="xl" variant="default" asChild>
                <Link href="/signup" className="group">
                  <Zap className="h-5 w-5" />
                  Start Deploying
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/demo">
                  <Play className="h-5 w-5" />
                  Get a Demo
                </Link>
              </Button>
            </motion.div>

            {/* GitHub link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-6"
            >
              <Link
                href="/import"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                Or import from GitHub
              </Link>
            </motion.div>
          </div>

          {/* Animated Terminal */}
          <AnimatedTerminal />

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
              >
                <AnimatedCounter value={stat.value} label={stat.label} />
              </motion.div>
            ))}
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="mt-20"
          >
            <p className="text-center text-sm text-muted-foreground">
              Trusted by the best teams in the world
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {logos.map((logo) => (
                <div
                  key={logo}
                  className="text-lg font-semibold text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                >
                  {logo}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
