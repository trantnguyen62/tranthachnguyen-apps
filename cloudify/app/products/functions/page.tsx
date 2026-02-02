"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Code,
  Clock,
  Shield,
  Activity,
  Layers,
  Check,
  Terminal
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Zero Cold Starts",
    description: "Functions stay warm and ready. No more waiting for cold starts to slow down your users.",
  },
  {
    icon: Layers,
    title: "Multiple Runtimes",
    description: "Node.js, Python, Go, and Ruby. Use the language that fits your project best.",
  },
  {
    icon: Clock,
    title: "Automatic Scaling",
    description: "Functions scale automatically from zero to millions of requests. Pay only for what you use.",
  },
  {
    icon: Shield,
    title: "Secure Execution",
    description: "Each function runs in its own isolated environment with fine-grained permissions.",
  },
  {
    icon: Activity,
    title: "Real-time Logs",
    description: "Stream logs in real-time. Debug issues instantly with full request tracing.",
  },
  {
    icon: Code,
    title: "Local Development",
    description: "Test functions locally with our CLI. Same behavior in development and production.",
  },
];

const examples = [
  {
    title: "API Endpoint",
    code: `// api/users.ts
export default async function handler(req, res) {
  const users = await db.user.findMany();
  res.json(users);
}`,
  },
  {
    title: "Webhook Handler",
    code: `// api/webhook.ts
export default async function handler(req, res) {
  const event = req.body;
  await processWebhook(event);
  res.status(200).end();
}`,
  },
  {
    title: "Background Job",
    code: `// api/process.ts
export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  await processLargeDataset(req.body);
  res.json({ status: 'complete' });
}`,
  },
];

export default function FunctionsPage() {
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 mb-6">
                <Terminal className="h-4 w-4" />
                <span className="text-sm font-medium">Serverless Functions</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Backend logic,
                <br />
                <span className="text-green-600 dark:text-green-400">no servers</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Write backend code without managing infrastructure. Functions deploy alongside
                your frontend with zero configuration.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" asChild>
                  <Link href="/new">
                    Start Building
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/docs/functions">View Documentation</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Write functions, not infrastructure
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Create powerful APIs with just a few lines of code.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {examples.map((example, index) => (
                <motion.div
                  key={example.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {example.title}
                    </span>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm">
                    <code>{example.code}</code>
                  </pre>
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
                Production-ready from day one
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                All the features you need to build and scale backend services.
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
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-green-600 dark:text-green-400" />
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

        {/* Runtime Support */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Your language, your runtime
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Write functions in the language you know best. We handle the rest.
                </p>
                <div className="space-y-4">
                  {[
                    { name: "Node.js 20", desc: "Latest LTS with full ES module support" },
                    { name: "Python 3.12", desc: "Including pip packages and type hints" },
                    { name: "Go 1.21", desc: "Fast compilation and execution" },
                    { name: "Ruby 3.3", desc: "With Bundler and gem support" },
                  ].map((runtime) => (
                    <div key={runtime.name} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {runtime.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {runtime.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Function Limits
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: "Max Duration", hobby: "10s", pro: "60s", enterprise: "900s" },
                      { label: "Memory", hobby: "1024 MB", pro: "3008 MB", enterprise: "3008 MB" },
                      { label: "Payload Size", hobby: "4.5 MB", pro: "4.5 MB", enterprise: "4.5 MB" },
                    ].map((limit) => (
                      <div key={limit.label} className="grid grid-cols-4 gap-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{limit.label}</span>
                        <span className="text-gray-900 dark:text-white">{limit.hobby}</span>
                        <span className="text-gray-900 dark:text-white">{limit.pro}</span>
                        <span className="text-gray-900 dark:text-white">{limit.enterprise}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span></span>
                    <span>Hobby</span>
                    <span>Pro</span>
                    <span>Enterprise</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-green-600 dark:bg-green-700">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Build your backend today
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Start building serverless functions and deploy them globally in seconds.
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
