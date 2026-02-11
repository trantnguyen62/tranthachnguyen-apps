"use client";

import { motion } from "framer-motion";
import { GitBranch, Rocket, Globe, Eye } from "lucide-react";

const steps = [
  {
    icon: GitBranch,
    title: "Connect your repo",
    description:
      "Import your Git repository from GitHub, GitLab, or Bitbucket. Cloudify auto-detects your framework and configures your build.",
    color: "blue",
  },
  {
    icon: Rocket,
    title: "Push to deploy",
    description:
      "Every push to your main branch triggers a production deployment. Every PR gets its own unique preview URL automatically.",
    color: "purple",
  },
  {
    icon: Eye,
    title: "Preview & collaborate",
    description:
      "Share preview URLs with your team. Leave comments directly on the preview. Approve and merge with confidence.",
    color: "green",
  },
  {
    icon: Globe,
    title: "Go global instantly",
    description:
      "Your app is deployed to 100+ edge locations worldwide. Custom domains, SSL certificates, and CDN — all automatic.",
    color: "orange",
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: {
    bg: "bg-secondary",
    text: "text-foreground",
    border: "border-blue-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  green: {
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-500/20",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20",
  },
};

export function HowItWorks() {
  return (
    <section className="relative py-24 bg-secondary/50">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="text-sm font-semibold text-muted-foreground"
          >
            HOW IT WORKS
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
          >
            From code to production in minutes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
          >
            No infrastructure to configure. No servers to manage. Just push your
            code and we handle the rest.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const colors = colorMap[step.color];
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.3 }}
                className="relative"
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-border to-border" />
                )}

                <div className="relative rounded-lg border border-border bg-card p-6">
                  {/* Step number */}
                  <div className="absolute -top-3 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div
                    className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${colors.bg}`}
                  >
                    <step.icon className={`h-7 w-7 ${colors.text}`} />
                  </div>

                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
