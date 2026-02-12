"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Newspaper,
  Layout,
  History,
  MessageCircle,
  ArrowRight,
  Search,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const resources = [
  {
    name: "Documentation",
    description: "Comprehensive guides and API references for building with Cloudify",
    icon: BookOpen,
    href: "/docs",
    color: "from-gray-600 to-gray-400",
  },
  {
    name: "Guides",
    description: "Step-by-step tutorials and best practices for common use cases",
    icon: FileText,
    href: "/guides",
    color: "from-purple-500 to-purple-600",
  },
  {
    name: "Blog",
    description: "Latest news, updates, and insights from the Cloudify team",
    icon: Newspaper,
    href: "/blog",
    color: "from-green-500 to-green-600",
  },
  {
    name: "Templates",
    description: "Production-ready starter templates for popular frameworks",
    icon: Layout,
    href: "/templates",
    color: "from-orange-500 to-orange-600",
  },
  {
    name: "Changelog",
    description: "Track new features, improvements, and bug fixes",
    icon: History,
    href: "/changelog",
    color: "from-pink-500 to-pink-600",
  },
  {
    name: "Support",
    description: "Get help from our team and community",
    icon: MessageCircle,
    href: "/support",
    color: "from-cyan-500 to-cyan-600",
  },
];

const popularGuides = [
  { title: "Getting Started with Cloudify", href: "/docs/getting-started" },
  { title: "Deploying a Next.js Application", href: "/docs/frameworks/nextjs" },
  { title: "Setting Up Environment Variables", href: "/docs/environment-variables" },
  { title: "Configuring Custom Domains", href: "/docs/domains" },
  { title: "Using Serverless Functions", href: "/docs/functions" },
];

export default function ResourcesPage() {
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
              <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)]">
                Resources
              </h1>
              <p className="mt-4 text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                Everything you need to build, deploy, and scale your applications on Cloudify.
              </p>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-10 max-w-xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-secondary)]" />
                <Input
                  placeholder="Search documentation, guides, and more..."
                  className="pl-12 h-14 text-lg"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Resources Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <motion.div
                  key={resource.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={resource.href}
                    className="group block p-6 rounded-lg border border-[var(--border-primary)] hover:shadow-lg transition-all hover:border-foreground/20"
                  >
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${resource.color}`}
                    >
                      <resource.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)] group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3] transition-colors">
                      {resource.name}
                    </h3>
                    <p className="mt-2 text-[var(--text-secondary)]">
                      {resource.description}
                    </p>
                    <div className="mt-4 flex items-center text-[var(--text-primary)] font-medium">
                      Explore
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Guides */}
        <section className="py-16 bg-[var(--surface-primary)]">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8">
              Popular Guides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularGuides.map((guide, index) => (
                <motion.div
                  key={guide.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={guide.href}
                    className="flex items-center justify-between p-4 rounded-lg border border-[var(--border-primary)] bg-card hover:border-foreground/20 transition-colors"
                  >
                    <span className="font-medium text-[var(--text-primary)]">
                      {guide.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[var(--text-secondary)]" />
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button variant="secondary" asChild>
                <Link href="/docs">
                  View All Documentation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-foreground">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-background">
              Need Help Getting Started?
            </h2>
            <p className="mt-4 text-xl text-background/70 max-w-2xl mx-auto">
              Our team is here to help you succeed. Reach out for personalized guidance.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-[var(--surface-primary)] text-[var(--text-primary)]" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
              <Button size="lg" variant="secondary" className="border-[var(--surface-primary)]/30 text-background hover:bg-[var(--surface-primary)]/10" asChild>
                <Link href="/support">Get Support</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
