"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface DeployStep {
  text: string;
  duration: number;
}

const deploySteps: DeployStep[] = [
  { text: "Cloned repository", duration: 500 },
  { text: "Installed deps (2.1s)", duration: 500 },
  { text: "Built project (4.3s)", duration: 500 },
  { text: "Optimized assets", duration: 500 },
  { text: "Deployed to edge", duration: 500 },
];

function AnimatedTerminal() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showUrl, setShowUrl] = useState(false);

  const runDeploy = useCallback(() => {
    setCompletedSteps([]);
    setShowUrl(false);

    let totalDelay = 0;
    deploySteps.forEach((step, i) => {
      totalDelay += step.duration;
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, i]);
        if (i === deploySteps.length - 1) {
          setTimeout(() => setShowUrl(true), 400);
        }
      }, totalDelay);
    });

    setTimeout(() => runDeploy(), totalDelay + 4000);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runDeploy(), 800);
    return () => clearTimeout(timer);
  }, [runDeploy]);

  return (
    <div className="mx-auto mt-16 max-w-lg">
      <div className="overflow-hidden rounded-xl border border-[var(--border-primary,theme(colors.border))] bg-gray-950 shadow-2xl">
        {/* Terminal header */}
        <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900/80 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[11px] text-gray-500 font-mono">terminal</span>
          </div>
        </div>

        {/* Terminal body */}
        <div className="p-5 font-mono text-[13px] min-h-[220px]">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-green-400">$</span>
            <span className="text-white">cloudify deploy</span>
          </div>

          <div className="mt-3 space-y-1">
            {deploySteps.map((step, i) => {
              const isCompleted = completedSteps.includes(i);
              if (!isCompleted) return null;

              return (
                <div
                  key={i}
                  className="flex items-center gap-2 text-green-400 transition-opacity duration-100"
                >
                  <span className="shrink-0">&#10003;</span>
                  <span>{step.text}</span>
                </div>
              );
            })}
          </div>

          {showUrl && (
            <div className="mt-4 border-t border-gray-800 pt-3">
              <div className="flex items-center gap-2 text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                <span>Live at:</span>
              </div>
              <a
                href="https://my-app.cloudify.tranthachnguyen.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-[var(--accent,#0071E3)] hover:underline"
              >
                my-app.cloudify.tranthachnguyen.com
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative bg-[var(--surface-primary,theme(colors.background))]">
      <div className="mx-auto max-w-[980px] px-4 sm:px-6 lg:px-8">
        <div className="pt-32 pb-20 lg:pt-44 lg:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Headline - clean typography, no gradient */}
            <h1 className="text-[34px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))] sm:text-[48px] lg:text-[56px] leading-[1.1]">
              Deploy at the Speed of Push
            </h1>

            {/* Subtitle - 2 lines max */}
            <p className="mx-auto mt-6 max-w-[600px] text-[20px] leading-relaxed text-[var(--text-secondary,theme(colors.muted.foreground))]">
              Ship your frontend to production with zero configuration.
              Every git push triggers a build. Every build gets a URL.
            </p>

            {/* CTAs - primary pill + text link */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-[var(--accent,#0071E3)] text-white text-[15px] font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
              >
                Start Deploying
              </Link>
              <Link
                href="/demo"
                className="text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
              >
                View Demo &rarr;
              </Link>
            </div>
          </div>

          {/* Terminal demo */}
          <AnimatedTerminal />
        </div>
      </div>
    </section>
  );
}
