"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GitBranch,
  Rocket,
  Globe,
  Zap,
  RefreshCw,
  Eye,
  Check,
  Clock,
  Shield
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: GitBranch,
    title: "Git Integration",
    description: "Push to deploy. Every commit automatically triggers a new deployment with zero configuration.",
  },
  {
    icon: Eye,
    title: "Preview Deployments",
    description: "Every pull request gets its own preview URL. Review changes before merging to production.",
  },
  {
    icon: Globe,
    title: "Global Edge Network",
    description: "Deploy to 100+ edge locations worldwide. Your app loads fast from anywhere.",
  },
  {
    icon: RefreshCw,
    title: "Instant Rollbacks",
    description: "Something went wrong? Roll back to any previous deployment with one click.",
  },
  {
    icon: Zap,
    title: "Atomic Deployments",
    description: "Zero-downtime deployments with instant cache invalidation. Users always see the latest version.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Automatic HTTPS, DDoS protection, and security headers included with every deployment.",
  },
];

const deploymentSteps = [
  { step: "1", title: "Push Code", desc: "Commit and push to your Git repository" },
  { step: "2", title: "Build", desc: "Cloudify builds your project in the cloud" },
  { step: "3", title: "Deploy", desc: "Deployed to 100+ edge locations globally" },
  { step: "4", title: "Live", desc: "Your changes are live in seconds" },
];

export default function DeploymentsPage() {
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
                <Rocket className="h-4 w-4" />
                <span className="text-sm font-medium">Deployments</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-[var(--text-primary)] leading-tight">
                Deploy in seconds,
                <br />
                <span className="text-[var(--text-primary)]">scale forever</span>
              </h1>
              <p className="mt-6 text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                Push your code and watch it go live instantly. Cloudify handles building,
                deploying, and scaling so you can focus on what matters.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" asChild>
                  <Link href="/new">
                    Start Deploying
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/docs/quick-start">View Documentation</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Deployment Flow */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                From code to production in seconds
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">
                A streamlined workflow that gets your code live faster than ever.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {deploymentSteps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-2xl font-bold text-[var(--text-primary)] mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[var(--text-secondary)]">{item.desc}</p>
                  {index < deploymentSteps.length - 1 && (
                    <div className="hidden md:block absolute top-8 right-0 w-full h-0.5 bg-border -z-10" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-[var(--surface-secondary)]/50">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                Everything you need for production
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">
                Enterprise-grade deployment infrastructure without the complexity.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

        {/* Stats */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "100+", label: "Edge Locations" },
                { value: "<100ms", label: "Deploy Time" },
                { value: "99.99%", label: "Uptime SLA" },
                { value: "10M+", label: "Deployments/Month" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-4xl font-bold text-[var(--text-primary)]">
                    {stat.value}
                  </div>
                  <div className="text-[var(--text-secondary)] mt-2">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-foreground">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to deploy?
            </h2>
            <p className="text-xl text-background/70 mb-8 max-w-2xl mx-auto">
              Get started with Cloudify and deploy your first project in seconds.
            </p>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/new">
                Deploy Now
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
