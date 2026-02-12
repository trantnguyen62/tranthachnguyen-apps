"use client";

import { useEffect, useRef, useState } from "react";

interface FeatureSection {
  label: string;
  title: string;
  description: string;
  visual: "deploy" | "edge" | "rollback";
}

const features: FeatureSection[] = [
  {
    label: "INFRASTRUCTURE",
    title: "Zero-Config Deploys",
    description:
      "Push your code. We detect the framework, install dependencies, build your project, and deploy to production. No configuration files, no build scripts, no DevOps.",
    visual: "deploy",
  },
  {
    label: "PERFORMANCE",
    title: "Global Edge Network",
    description:
      "Your application is served from 100+ edge locations worldwide. Every user gets sub-50ms response times, no matter where they are. Automatic caching and optimization included.",
    visual: "edge",
  },
  {
    label: "RELIABILITY",
    title: "Instant Rollback",
    description:
      "Every deployment is immutable. If something goes wrong, roll back to any previous version in one click. Zero downtime, zero data loss, zero stress.",
    visual: "rollback",
  },
];

function DeployVisual() {
  return (
    <div className="w-full max-w-[400px] rounded-xl border border-[var(--border-primary,theme(colors.border))] bg-[var(--surface-primary,theme(colors.background))] p-6 shadow-lg">
      <div className="space-y-3">
        {["Clone repo", "Install deps", "Build", "Optimize", "Deploy"].map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--success,#34C759)]/10">
              <span className="text-[var(--success,#34C759)] text-[11px]">&#10003;</span>
            </div>
            <span className="text-[13px] text-[var(--text-primary,theme(colors.foreground))]">{step}</span>
            <span className="ml-auto text-[11px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] tabular-nums">{(0.3 + i * 0.8).toFixed(1)}s</span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-[var(--separator,theme(colors.border))] pt-3">
        <span className="text-[13px] text-[var(--success,#34C759)] font-medium">Deployed in 4.2s</span>
      </div>
    </div>
  );
}

function EdgeVisual() {
  return (
    <div className="w-full max-w-[400px] rounded-xl border border-[var(--border-primary,theme(colors.border))] bg-[var(--surface-primary,theme(colors.background))] p-6 shadow-lg">
      <div className="text-center mb-4">
        <span className="text-[28px] font-bold text-[var(--text-primary,theme(colors.foreground))]">&lt;50ms</span>
        <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">Global latency</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { region: "US East", ms: "12ms" },
          { region: "EU West", ms: "24ms" },
          { region: "Asia", ms: "38ms" },
          { region: "US West", ms: "8ms" },
          { region: "SA East", ms: "42ms" },
          { region: "AU East", ms: "45ms" },
        ].map((node) => (
          <div key={node.region} className="text-center p-2 rounded-md bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))]">
            <div className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]">{node.ms}</div>
            <div className="text-[11px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))]">{node.region}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RollbackVisual() {
  return (
    <div className="w-full max-w-[400px] rounded-xl border border-[var(--border-primary,theme(colors.border))] bg-[var(--surface-primary,theme(colors.background))] p-6 shadow-lg">
      <div className="space-y-2">
        {[
          { version: "v23", status: "current", time: "2m ago" },
          { version: "v22", status: "previous", time: "1h ago" },
          { version: "v21", status: "previous", time: "3h ago" },
          { version: "v20", status: "previous", time: "1d ago" },
        ].map((deploy) => (
          <div key={deploy.version} className="flex items-center gap-3 p-2 rounded-md hover:bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))]">
            <div className={`h-2 w-2 rounded-full shrink-0 ${deploy.status === "current" ? "bg-[var(--success,#34C759)]" : "bg-[var(--text-quaternary,theme(colors.muted.foreground/40))]"}`} />
            <span className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]">{deploy.version}</span>
            <span className="text-[11px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))]">{deploy.time}</span>
            {deploy.status === "previous" && (
              <button className="ml-auto text-[11px] text-[var(--accent,#0071E3)] font-medium">Rollback</button>
            )}
            {deploy.status === "current" && (
              <span className="ml-auto text-[11px] text-[var(--success,#34C759)] font-medium">Live</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const visuals = {
  deploy: DeployVisual,
  edge: EdgeVisual,
  rollback: RollbackVisual,
};

function FeatureBlock({ feature, index }: { feature: FeatureSection; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const Visual = visuals[feature.visual];
  const isReversed = index % 2 === 1;

  return (
    <div
      ref={ref}
      className="min-h-screen flex items-center py-20"
    >
      <div className={`mx-auto max-w-[980px] px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center ${isReversed ? "direction-rtl" : ""}`}>
        <div className={`${isReversed ? "lg:order-2" : ""} transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="text-[11px] font-semibold tracking-[0.1em] text-[var(--accent,#0071E3)] uppercase">
            {feature.label}
          </span>
          <h2 className="mt-3 text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
            {feature.title}
          </h2>
          <p className="mt-4 max-w-[400px] text-[15px] leading-relaxed text-[var(--text-secondary,theme(colors.muted.foreground))]">
            {feature.description}
          </p>
        </div>
        <div className={`${isReversed ? "lg:order-1" : ""} flex justify-center transition-all duration-500 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <Visual />
        </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section className="bg-[var(--surface-primary,theme(colors.background))]">
      {features.map((feature, index) => (
        <FeatureBlock key={feature.title} feature={feature} index={index} />
      ))}
    </section>
  );
}
