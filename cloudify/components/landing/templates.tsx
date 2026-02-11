"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UseCase = "all" | "ai" | "web" | "ecommerce" | "marketing" | "platforms";

interface Template {
  name: string;
  description: string;
  gradient: string;
  icon: string;
  demo: string;
  categories: UseCase[];
  deployTime: string;
}

const templates: Template[] = [
  {
    name: "Next.js",
    description: "The React framework for the web",
    gradient: "from-black to-gray-800",
    icon: "▲",
    demo: "nextjs-demo.cloudify.app",
    categories: ["all", "web", "ai", "ecommerce", "platforms"],
    deployTime: "~45s",
  },
  {
    name: "React",
    description: "Build user interfaces with React",
    gradient: "from-cyan-500 to-blue-500",
    icon: "\u269b\ufe0f",
    demo: "react-demo.cloudify.app",
    categories: ["all", "web", "platforms"],
    deployTime: "~30s",
  },
  {
    name: "Vue",
    description: "Progressive JavaScript framework",
    gradient: "from-green-500 to-emerald-500",
    icon: "\ud83d\udfe2",
    demo: "vue-demo.cloudify.app",
    categories: ["all", "web", "ecommerce"],
    deployTime: "~30s",
  },
  {
    name: "Svelte",
    description: "Cybernetically enhanced web apps",
    gradient: "from-orange-500 to-red-500",
    icon: "\ud83d\udd25",
    demo: "svelte-demo.cloudify.app",
    categories: ["all", "web"],
    deployTime: "~25s",
  },
  {
    name: "Astro",
    description: "The web framework for content-driven websites",
    gradient: "from-purple-500 to-pink-500",
    icon: "\ud83d\ude80",
    demo: "astro-demo.cloudify.app",
    categories: ["all", "web", "marketing"],
    deployTime: "~20s",
  },
  {
    name: "Nuxt",
    description: "The Intuitive Vue Framework",
    gradient: "from-green-400 to-cyan-500",
    icon: "\ud83d\udc9a",
    demo: "nuxt-demo.cloudify.app",
    categories: ["all", "web", "ecommerce"],
    deployTime: "~40s",
  },
  {
    name: "AI Chatbot",
    description: "Full-stack AI chatbot with streaming",
    gradient: "from-violet-500 to-purple-600",
    icon: "\ud83e\udd16",
    demo: "ai-chat-demo.cloudify.app",
    categories: ["all", "ai"],
    deployTime: "~50s",
  },
  {
    name: "Shopify Hydrogen",
    description: "Custom Shopify storefront",
    gradient: "from-emerald-400 to-green-600",
    icon: "\ud83d\udecd\ufe0f",
    demo: "hydrogen-demo.cloudify.app",
    categories: ["all", "ecommerce"],
    deployTime: "~55s",
  },
  {
    name: "Blog Starter",
    description: "MDX-powered blog with CMS",
    gradient: "from-amber-400 to-orange-500",
    icon: "\u270d\ufe0f",
    demo: "blog-demo.cloudify.app",
    categories: ["all", "marketing"],
    deployTime: "~25s",
  },
];

const useCases: { name: string; value: UseCase }[] = [
  { name: "All", value: "all" },
  { name: "AI Apps", value: "ai" },
  { name: "Web Apps", value: "web" },
  { name: "E-commerce", value: "ecommerce" },
  { name: "Marketing", value: "marketing" },
  { name: "Platforms", value: "platforms" },
];

export function Templates() {
  const [activeTab, setActiveTab] = useState<UseCase>("all");

  const filteredTemplates = templates.filter((t) =>
    t.categories.includes(activeTab)
  );

  return (
    <section className="relative py-24 bg-background">
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
            START IN SECONDS
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
          >
            Deploy your favorite framework
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
          >
            Choose from our collection of production-ready templates or import
            your existing project from GitHub.
          </motion.p>
        </div>

        {/* Use case tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {useCases.map((useCase) => (
            <button
              key={useCase.value}
              onClick={() => setActiveTab(useCase.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                activeTab === useCase.value
                  ? "bg-foreground text-background shadow-lg"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {useCase.name}
            </button>
          ))}
        </motion.div>

        {/* Templates grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.name}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-foreground/20"
            >
              {/* Preview area */}
              <div
                className={cn(
                  "aspect-video bg-gradient-to-br flex items-center justify-center relative",
                  template.gradient
                )}
              >
                <span className="text-6xl">{template.icon}</span>
                {/* Deploy time badge */}
                <div className="absolute top-3 right-3 rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {template.deployTime}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {template.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
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
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Demo
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {filteredTemplates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center py-16"
          >
            <p className="text-muted-foreground">
              No templates found for this category yet. Check back soon!
            </p>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
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
