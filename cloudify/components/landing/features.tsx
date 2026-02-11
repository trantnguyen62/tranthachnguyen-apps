"use client";

import { motion } from "framer-motion";
import {
  GitBranch,
  Globe,
  Zap,
  Shield,
  BarChart3,
  Cpu,
  Cloud,
  Lock,
  Boxes,
  Sparkles,
  Terminal,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: GitBranch,
    title: "Git-based Deployments",
    description:
      "Push to deploy. Every branch gets its own preview deployment automatically.",
    color: "blue",
  },
  {
    icon: Globe,
    title: "Global Edge Network",
    description:
      "Deploy to 100+ edge locations worldwide. Your content is always close to your users.",
    color: "green",
  },
  {
    icon: Cpu,
    title: "Serverless Functions",
    description:
      "Write backend code that scales automatically. No infrastructure to manage.",
    color: "purple",
  },
  {
    icon: Sparkles,
    title: "AI-Powered",
    description:
      "Built-in AI capabilities with our SDK. Deploy intelligent apps in minutes.",
    color: "orange",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "SOC 2 Type II certified. DDoS protection and Web Application Firewall included.",
    color: "red",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description:
      "Monitor performance, track visitors, and analyze your deployments in real-time.",
    color: "cyan",
  },
  {
    icon: Database,
    title: "Edge Storage",
    description:
      "Store and serve assets from the edge. Optimized for speed and scalability.",
    color: "indigo",
  },
  {
    icon: Terminal,
    title: "Developer Experience",
    description:
      "CLI tools, SDKs, and integrations that make development a breeze.",
    color: "pink",
  },
];

const colorClasses = {
  blue: "bg-secondary text-foreground",
  green: "bg-secondary text-foreground",
  purple: "bg-secondary text-foreground",
  orange: "bg-secondary text-foreground",
  red: "bg-secondary text-foreground",
  cyan: "bg-secondary text-foreground",
  indigo: "bg-secondary text-foreground",
  pink: "bg-secondary text-foreground",
};

export function Features() {
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
            className="text-sm font-semibold text-muted-foreground"
          >
            EVERYTHING YOU NEED
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
          >
            Deploy once, deliver everywhere
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
          >
            A complete platform for building and deploying modern web applications
            with all the features you need out of the box.
          </motion.p>
        </div>

        {/* Features grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="group relative rounded-lg border border-border bg-card p-6 transition-all duration-300 hover:border-foreground/20"
            >
              <div
                className={cn(
                  "inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                  colorClasses[feature.color as keyof typeof colorClasses]
                )}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {feature.description}
              </p>
              <div className="mt-4 flex items-center text-sm font-medium text-foreground opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                Learn more
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Large feature highlight */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="mt-24 relative overflow-hidden rounded-lg border border-border bg-secondary/50 p-8 lg:p-12"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-foreground">
                <Zap className="h-4 w-4" />
                Fluid Compute
              </div>
              <h3 className="mt-4 text-3xl font-bold text-foreground">
                Auto-scaling that just works
              </h3>
              <p className="mt-4 text-lg text-muted-foreground">
                Our serverless infrastructure automatically scales your applications
                based on demand. Pay only for what you use, scale to millions of users
                without any configuration.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Zero cold starts with edge pre-warming",
                  "Automatic scaling from 0 to 10M+ requests",
                  "Pay-per-use pricing with no minimum",
                  "Built-in caching and optimization",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10">
                      <svg
                        className="h-4 w-4 text-green-600 dark:text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-lg bg-foreground p-8">
                <div className="h-full w-full rounded-xl bg-gray-900/90 backdrop-blur p-6">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Terminal className="h-4 w-4" />
                    <span className="text-sm">cloudify deploy</span>
                  </div>
                  <div className="mt-4 space-y-2 font-mono text-sm">
                    <div className="text-green-400">✓ Build completed</div>
                    <div className="text-green-400">✓ Functions deployed</div>
                    <div className="text-green-400">✓ Edge network updated</div>
                    <div className="text-[#0070f3]">→ Live at cloudify.app</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
