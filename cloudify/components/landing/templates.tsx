"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const templates = [
  {
    name: "Next.js",
    description: "The React framework for the web",
    gradient: "from-black to-gray-800",
    icon: "▲",
    demo: "nextjs-demo.cloudify.app",
  },
  {
    name: "React",
    description: "Build user interfaces with React",
    gradient: "from-cyan-500 to-blue-500",
    icon: "⚛️",
    demo: "react-demo.cloudify.app",
  },
  {
    name: "Vue",
    description: "Progressive JavaScript framework",
    gradient: "from-green-500 to-emerald-500",
    icon: "🟢",
    demo: "vue-demo.cloudify.app",
  },
  {
    name: "Svelte",
    description: "Cybernetically enhanced web apps",
    gradient: "from-orange-500 to-red-500",
    icon: "🔥",
    demo: "svelte-demo.cloudify.app",
  },
  {
    name: "Astro",
    description: "The web framework for content-driven websites",
    gradient: "from-purple-500 to-pink-500",
    icon: "🚀",
    demo: "astro-demo.cloudify.app",
  },
  {
    name: "Nuxt",
    description: "The Intuitive Vue Framework",
    gradient: "from-green-400 to-cyan-500",
    icon: "💚",
    demo: "nuxt-demo.cloudify.app",
  },
];

const useCases = [
  { name: "AI Apps", active: true },
  { name: "Web Apps", active: false },
  { name: "E-commerce", active: false },
  { name: "Marketing", active: false },
  { name: "Platforms", active: false },
];

export function Templates() {
  return (
    <section className="relative py-24 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400"
          >
            START IN SECONDS
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
          >
            Deploy your favorite framework
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
          >
            Choose from our collection of production-ready templates or import
            your existing project from GitHub.
          </motion.p>
        </div>

        {/* Use case tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {useCases.map((useCase) => (
            <button
              key={useCase.name}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                useCase.active
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              {useCase.name}
            </button>
          ))}
        </motion.div>

        {/* Templates grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template, index) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700"
            >
              {/* Preview area */}
              <div
                className={cn(
                  "aspect-video bg-gradient-to-br flex items-center justify-center",
                  template.gradient
                )}
              >
                <span className="text-6xl">{template.icon}</span>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {template.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {template.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Button size="sm" asChild>
                    <Link href={`/new?template=${template.name.toLowerCase()}`}>
                      Deploy
                    </Link>
                  </Button>
                  <a
                    href={`https://${template.demo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Demo
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Button variant="outline" size="lg" asChild>
            <Link href="/templates" className="group">
              View All Templates
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
