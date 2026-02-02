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
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-6">
                <Rocket className="h-4 w-4" />
                <span className="text-sm font-medium">Deployments</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Deploy in seconds,
                <br />
                <span className="text-blue-600 dark:text-blue-400">scale forever</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Push your code and watch it go live instantly. Cloudify handles building,
                deploying, and scaling so you can focus on what matters.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" asChild>
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
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                From code to production in seconds
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
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
                  <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                  {index < deploymentSteps.length - 1 && (
                    <div className="hidden md:block absolute top-8 right-0 w-full h-0.5 bg-blue-200 dark:bg-blue-800 -z-10" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Everything you need for production
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
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
                  className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mt-2">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-blue-600 dark:bg-blue-700">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to deploy?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
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
