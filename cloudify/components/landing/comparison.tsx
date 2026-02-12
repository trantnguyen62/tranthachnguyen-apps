"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type Support = "full" | "partial" | "none";

interface ComparisonRow {
  feature: string;
  cloudify: Support;
  vercel: Support;
  netlify: Support;
  aws: Support;
}

const comparisonData: ComparisonRow[] = [
  { feature: "Git Push to Deploy", cloudify: "full", vercel: "full", netlify: "full", aws: "partial" },
  { feature: "Preview Deployments", cloudify: "full", vercel: "full", netlify: "full", aws: "none" },
  { feature: "Edge Functions", cloudify: "full", vercel: "full", netlify: "full", aws: "full" },
  { feature: "Serverless Functions", cloudify: "full", vercel: "full", netlify: "full", aws: "full" },
  { feature: "Custom Domains + SSL", cloudify: "full", vercel: "full", netlify: "full", aws: "partial" },
  { feature: "Built-in Analytics", cloudify: "full", vercel: "partial", netlify: "partial", aws: "none" },
  { feature: "AI SDK & Gateway", cloudify: "full", vercel: "partial", netlify: "none", aws: "partial" },
  { feature: "Managed Databases", cloudify: "full", vercel: "partial", netlify: "none", aws: "full" },
  { feature: "Blob Storage", cloudify: "full", vercel: "full", netlify: "partial", aws: "full" },
  { feature: "KV Store", cloudify: "full", vercel: "full", netlify: "partial", aws: "full" },
  { feature: "Cron Jobs", cloudify: "full", vercel: "full", netlify: "partial", aws: "full" },
  { feature: "Web Application Firewall", cloudify: "full", vercel: "partial", netlify: "none", aws: "full" },
  { feature: "Free Tier", cloudify: "full", vercel: "full", netlify: "full", aws: "partial" },
  { feature: "Open Source Friendly", cloudify: "full", vercel: "partial", netlify: "partial", aws: "none" },
];

function SupportIcon({ support }: { support: Support }) {
  if (support === "full") {
    return (
      <div className="flex items-center justify-center">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
      </div>
    );
  }
  if (support === "partial") {
    return (
      <div className="flex items-center justify-center">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
          <Minus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <X className="h-4 w-4 text-[var(--text-secondary)]" />
      </div>
    </div>
  );
}

export function Comparison() {
  return (
    <section className="relative py-24 bg-card">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="text-sm font-semibold text-[var(--text-secondary)]"
          >
            WHY CLOUDIFY
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mt-2 text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl"
          >
            The complete platform
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-secondary)]"
          >
            Everything you need in one platform. No need to stitch together
            multiple services.
          </motion.p>
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mt-16 overflow-x-auto"
        >
          <div className="min-w-[640px]">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 border-b border-[var(--border-primary)] pb-4">
              <div className="text-sm font-medium text-[var(--text-secondary)]">
                Feature
              </div>
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-sm font-semibold text-[var(--text-primary)]">
                  Cloudify
                </span>
              </div>
              <div className="text-center text-sm font-medium text-[var(--text-secondary)]">
                Vercel
              </div>
              <div className="text-center text-sm font-medium text-[var(--text-secondary)]">
                Netlify
              </div>
              <div className="text-center text-sm font-medium text-[var(--text-secondary)]">
                AWS Amplify
              </div>
            </div>

            {/* Rows */}
            {comparisonData.map((row, index) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * index }}
                className="grid grid-cols-5 gap-4 py-3 border-b border-[var(--border-primary)]"
              >
                <div className="text-sm font-medium text-[var(--text-primary)] flex items-center">
                  {row.feature}
                </div>
                <SupportIcon support={row.cloudify} />
                <SupportIcon support={row.vercel} />
                <SupportIcon support={row.netlify} />
                <SupportIcon support={row.aws} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
