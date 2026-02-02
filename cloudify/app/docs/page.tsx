"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Book,
  Code2,
  Rocket,
  Settings,
  Globe,
  Shield,
  Cpu,
  Terminal,
  FileCode,
  GitBranch,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const docSections = [
  {
    title: "Getting Started",
    icon: Rocket,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    items: [
      { title: "Introduction", href: "/docs/introduction" },
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "Importing a Project", href: "/docs/importing" },
      { title: "CLI Installation", href: "/docs/cli" },
    ],
  },
  {
    title: "Deployments",
    icon: GitBranch,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    items: [
      { title: "Git Integration", href: "/docs/git" },
      { title: "Build Configuration", href: "/docs/build-config" },
      { title: "Preview Deployments", href: "/docs/previews" },
      { title: "Production Deployments", href: "/docs/production" },
    ],
  },
  {
    title: "Frameworks",
    icon: Code2,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    items: [
      { title: "Next.js", href: "/docs/frameworks/nextjs" },
      { title: "React", href: "/docs/frameworks/react" },
      { title: "Vue", href: "/docs/frameworks/vue" },
      { title: "Astro", href: "/docs/frameworks/astro" },
    ],
  },
  {
    title: "Serverless Functions",
    icon: Cpu,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    items: [
      { title: "Overview", href: "/docs/functions" },
      { title: "API Routes", href: "/docs/api-routes" },
      { title: "Edge Functions", href: "/docs/edge-functions" },
      { title: "Runtimes", href: "/docs/runtimes" },
    ],
  },
  {
    title: "Domains & SSL",
    icon: Globe,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    items: [
      { title: "Custom Domains", href: "/docs/domains" },
      { title: "DNS Configuration", href: "/docs/dns" },
      { title: "SSL Certificates", href: "/docs/ssl" },
      { title: "Redirects", href: "/docs/redirects" },
    ],
  },
  {
    title: "Configuration",
    icon: Settings,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    items: [
      { title: "Environment Variables", href: "/docs/environment-variables" },
      { title: "cloudify.json", href: "/docs/configuration" },
      { title: "Headers", href: "/docs/headers" },
      { title: "Rewrites", href: "/docs/rewrites" },
    ],
  },
];

const quickLinks = [
  {
    title: "Deploy your first project",
    description: "Get started with Cloudify in under 5 minutes",
    icon: Rocket,
    href: "/docs/quick-start",
  },
  {
    title: "CLI Reference",
    description: "Complete reference for the Cloudify CLI",
    icon: Terminal,
    href: "/docs/cli",
  },
  {
    title: "API Documentation",
    description: "Integrate with the Cloudify REST API",
    icon: FileCode,
    href: "/docs/api",
  },
  {
    title: "Security Best Practices",
    description: "Keep your deployments secure",
    icon: Shield,
    href: "/docs/security",
  },
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mb-6">
                <Book className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
                Documentation
              </h1>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Learn how to deploy and scale your applications with Cloudify.
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-12 border-b border-gray-200 dark:border-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickLinks.map((link, index) => (
                <motion.div
                  key={link.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link href={link.href}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                      <CardContent className="p-6">
                        <link.icon className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {link.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {link.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {docSections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${section.bg}`}>
                          <section.icon className={`h-5 w-5 ${section.color}`} />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {section.title}
                        </h2>
                      </div>
                      <ul className="space-y-2">
                        {section.items.map((item) => (
                          <li key={item.title}>
                            <Link
                              href={item.href}
                              className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                            >
                              <span className="text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                {item.title}
                              </span>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Help CTA */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Need help?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" asChild>
                <Link href="/support">
                  Contact Support
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://github.com/cloudify/cloudify/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Community Forum
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
