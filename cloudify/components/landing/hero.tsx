"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, Play, Github, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40rem] left-1/2 -translate-x-1/2">
          <div className="h-[80rem] w-[80rem] rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-600 dark:text-blue-400"
            >
              <Sparkles className="h-4 w-4" />
              <span>Introducing AI Gateway - Multi-model access</span>
              <ArrowRight className="h-4 w-4" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl dark:text-white"
            >
              Build and deploy on the{" "}
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Cloud Platform
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-xl leading-8 text-gray-600 dark:text-gray-400"
            >
              Cloudify provides the developer tools, cloud infrastructure, and AI capabilities
              to build, scale, and secure a faster, more personalized web.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="xl" variant="primary" asChild>
                <Link href="/new" className="group">
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
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6"
            >
              <Link
                href="/import"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <Github className="h-4 w-4" />
                Or import from GitHub
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-20"
          >
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Trusted by the best teams in the world
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {logos.map((logo) => (
                <div
                  key={logo}
                  className="text-lg font-semibold text-gray-400 dark:text-gray-600"
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
