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
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-green-500/10 text-green-600 dark:text-green-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};

export function Features() {
  return (
    <section className="relative py-24 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400"
          >
            EVERYTHING YOU NEED
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
          >
            Deploy once, deliver everywhere
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
            >
              <div
                className={cn(
                  "inline-flex h-12 w-12 items-center justify-center rounded-xl",
                  colorClasses[feature.color as keyof typeof colorClasses]
                )}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Large feature highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8 lg:p-12 dark:border-gray-800 dark:from-gray-900 dark:to-gray-950"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                <Zap className="h-4 w-4" />
                Fluid Compute
              </div>
              <h3 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                Auto-scaling that just works
              </h3>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
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
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-8">
                <div className="h-full w-full rounded-xl bg-gray-900/90 backdrop-blur p-6">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Terminal className="h-4 w-4" />
                    <span className="text-sm">cloudify deploy</span>
                  </div>
                  <div className="mt-4 space-y-2 font-mono text-sm">
                    <div className="text-green-400">✓ Build completed</div>
                    <div className="text-green-400">✓ Functions deployed</div>
                    <div className="text-green-400">✓ Edge network updated</div>
                    <div className="text-blue-400">→ Live at cloudify.app</div>
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
