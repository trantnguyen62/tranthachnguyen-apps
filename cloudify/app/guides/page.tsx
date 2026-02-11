"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Rocket,
  Code2,
  Database,
  Globe,
  Shield,
  Zap,
  ArrowRight,
  Clock,
  BookOpen,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const guideCategories = [
  {
    name: "Getting Started",
    icon: Rocket,
    color: "from-green-500 to-emerald-500",
    guides: [
      { title: "Quick Start Guide", href: "/docs/getting-started", time: "5 min" },
      { title: "Your First Deployment", href: "/docs/first-deployment", time: "10 min" },
      { title: "Understanding Projects", href: "/docs/projects", time: "8 min" },
      { title: "Connecting Git Repositories", href: "/docs/git", time: "7 min" },
    ],
  },
  {
    name: "Framework Guides",
    icon: Code2,
    color: "from-blue-500 to-cyan-500",
    guides: [
      { title: "Deploying Next.js", href: "/docs/frameworks/nextjs", time: "12 min" },
      { title: "Deploying React", href: "/docs/frameworks/react", time: "10 min" },
      { title: "Deploying Vue", href: "/docs/frameworks/vue", time: "10 min" },
      { title: "Deploying Astro", href: "/docs/frameworks/astro", time: "8 min" },
    ],
  },
  {
    name: "Databases & Storage",
    icon: Database,
    color: "from-purple-500 to-pink-500",
    guides: [
      { title: "Connecting Databases", href: "/docs/databases", time: "15 min" },
      { title: "Using KV Storage", href: "/docs/storage/kv", time: "10 min" },
      { title: "Blob Storage Guide", href: "/docs/storage/blobs", time: "12 min" },
      { title: "Edge Config", href: "/docs/edge-config", time: "8 min" },
    ],
  },
  {
    name: "Domains & SSL",
    icon: Globe,
    color: "from-orange-500 to-amber-500",
    guides: [
      { title: "Custom Domains", href: "/docs/domains", time: "10 min" },
      { title: "SSL Certificates", href: "/docs/ssl", time: "8 min" },
      { title: "DNS Configuration", href: "/docs/dns", time: "12 min" },
      { title: "Redirects & Rewrites", href: "/docs/redirects", time: "10 min" },
    ],
  },
  {
    name: "Security",
    icon: Shield,
    color: "from-red-500 to-pink-500",
    guides: [
      { title: "Environment Variables", href: "/docs/environment-variables", time: "8 min" },
      { title: "Authentication", href: "/docs/authentication", time: "15 min" },
      { title: "Firewall Rules", href: "/docs/firewall", time: "10 min" },
      { title: "DDoS Protection", href: "/docs/ddos", time: "7 min" },
    ],
  },
  {
    name: "Performance",
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
    guides: [
      { title: "Caching Strategies", href: "/docs/caching", time: "12 min" },
      { title: "Edge Functions", href: "/docs/edge-functions", time: "15 min" },
      { title: "Image Optimization", href: "/docs/images", time: "8 min" },
      { title: "Performance Monitoring", href: "/docs/monitoring", time: "10 min" },
    ],
  },
];

export default function GuidesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Badge className="mb-4" variant="secondary">
                <BookOpen className="h-3 w-3 mr-1" />
                Guides
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Learn How to Build with Cloudify
              </h1>
              <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                Step-by-step tutorials and best practices to help you get the most out of
                our platform.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Guide Categories */}
        {guideCategories.map((category, categoryIndex) => (
          <section
            key={category.name}
            className={`py-16 ${categoryIndex % 2 === 1 ? "bg-background" : ""}`}
          >
            <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 mb-8"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${category.color}`}
                >
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  {category.name}
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.guides.map((guide, guideIndex) => (
                  <motion.div
                    key={guide.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: guideIndex * 0.05 }}
                  >
                    <Link
                      href={guide.href}
                      className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md"
                    >
                      <span className="font-medium text-foreground group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3] transition-colors">
                        {guide.title}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {guide.time}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-[#0070f3] group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white">
              Can't Find What You're Looking For?
            </h2>
            <p className="mt-4 text-xl text-background/70 max-w-2xl mx-auto">
              Check our documentation or reach out to our support team.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/docs">Browse Documentation</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" asChild>
                <Link href="/support">Contact Support</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
