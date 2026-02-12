"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Layout,
  Zap,
  Globe,
  Shield,
  Code,
  Layers,
  Check,
  Database
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Instant Deployments",
    description: "Push to deploy. Every commit triggers a new deployment automatically.",
  },
  {
    icon: Globe,
    title: "Global Distribution",
    description: "Your app runs at the edge, close to users worldwide.",
  },
  {
    icon: Shield,
    title: "Automatic HTTPS",
    description: "Free SSL certificates provisioned and renewed automatically.",
  },
  {
    icon: Database,
    title: "Integrated Backend",
    description: "Serverless functions, databases, and storage built in.",
  },
];

const frameworks = [
  { name: "Next.js", category: "React" },
  { name: "Nuxt", category: "Vue" },
  { name: "SvelteKit", category: "Svelte" },
  { name: "Remix", category: "React" },
  { name: "Astro", category: "Multi" },
  { name: "Gatsby", category: "React" },
];

const techStack = [
  { icon: Code, title: "Frontend", items: ["React", "Vue", "Svelte", "Angular"] },
  { icon: Layers, title: "Backend", items: ["Serverless Functions", "API Routes", "Edge Functions"] },
  { icon: Database, title: "Data", items: ["Postgres", "Redis", "Blob Storage", "KV Store"] },
];

export default function WebAppsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 bg-[var(--surface-secondary)]/30">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-secondary)] text-[var(--text-primary)] mb-6">
                <Layout className="h-4 w-4" />
                <span className="text-sm font-medium">Web Applications</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-[var(--text-primary)] leading-tight">
                Build and deploy
                <br />
                <span className="text-[var(--text-primary)]">modern web apps</span>
              </h1>
              <p className="mt-6 text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                From simple static sites to complex full-stack applications.
                Deploy anything with zero configuration.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" asChild>
                  <Link href="/new">
                    Start Building
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/docs">Documentation</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Frameworks */}
        <section className="py-16 border-b border-[var(--border-primary)]">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-[var(--text-secondary)] mb-8">
              WORKS WITH YOUR FAVORITE FRAMEWORKS
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
              {frameworks.map((fw, index) => (
                <motion.div
                  key={fw.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-lg font-semibold text-[var(--text-primary)]">
                    {fw.name}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {fw.category}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                Everything you need to ship
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">
                A complete platform for building and deploying web applications.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-lg bg-card border border-[var(--border-primary)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-[var(--text-primary)]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--text-secondary)]">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Full Stack */}
        <section className="py-20 bg-[var(--surface-secondary)]/50">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                Full-stack by design
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">
                Build complete applications with frontend, backend, and data layer.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {techStack.map((stack, index) => (
                <motion.div
                  key={stack.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-lg bg-card border border-[var(--border-primary)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
                    <stack.icon className="h-6 w-6 text-[var(--text-primary)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                    {stack.title}
                  </h3>
                  <ul className="space-y-2">
                    {stack.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6">
                  Deploy in seconds
                </h2>
                <p className="text-lg text-[var(--text-secondary)] mb-8">
                  Connect your Git repository and deploy. Every push creates a new
                  deployment with a unique URL.
                </p>
                <ul className="space-y-3">
                  {[
                    "Automatic builds and deployments",
                    "Preview URLs for every branch",
                    "Instant rollbacks to any version",
                    "Custom domains with free SSL",
                    "Environment variables per branch",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[var(--text-secondary)]">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <pre className="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto text-sm">
                  <code>{`# Install Cloudify CLI
npm i -g cloudify

# Deploy from your project directory
cloudify deploy

Deploying my-web-app...
✓ Building project
✓ Running tests
✓ Deploying to edge network
✓ Updating DNS

Production: https://my-web-app.cloudify.app
Preview:    https://my-web-app-abc123.cloudify.app

Deployed in 23 seconds`}</code>
                </pre>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-foreground">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start building today
            </h2>
            <p className="text-xl text-background/70 mb-8 max-w-2xl mx-auto">
              Deploy your first web application in minutes. No credit card required.
            </p>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/new">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
