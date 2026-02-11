"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Megaphone,
  Zap,
  Globe,
  BarChart3,
  Users,
  FileText,
  Palette,
  Check,
  Eye
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Instant Page Loads",
    description: "Landing pages that load in milliseconds. Better performance means higher conversions.",
  },
  {
    icon: Eye,
    title: "Preview Deployments",
    description: "Share preview URLs with stakeholders. Get approval before going live.",
  },
  {
    icon: BarChart3,
    title: "Built-in Analytics",
    description: "Track visitors, conversions, and campaign performance without third-party tools.",
  },
  {
    icon: Globe,
    title: "Global CDN",
    description: "Serve your campaigns to 100+ countries with sub-50ms latency worldwide.",
  },
];

const useCases = [
  { name: "Landing Pages", desc: "High-converting campaign landing pages" },
  { name: "Microsites", desc: "Product launches and event sites" },
  { name: "A/B Testing", desc: "Test variations at the edge" },
  { name: "Personalization", desc: "Dynamic content by location/device" },
  { name: "Documentation", desc: "Product docs and help centers" },
  { name: "Blogs", desc: "Content marketing and SEO" },
];

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 bg-secondary/30">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 mb-6">
                <Megaphone className="h-4 w-4" />
                <span className="text-sm font-medium">Marketing Sites</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-foreground leading-tight">
                Ship campaigns
                <br />
                <span className="text-violet-600 dark:text-violet-400">at the speed of marketing</span>
              </h1>
              <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
                Deploy landing pages, microsites, and marketing content instantly.
                Move as fast as your campaigns demand.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" asChild>
                  <Link href="/new">
                    Start Deploying
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/templates">View Templates</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Built for marketing teams
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Deploy, preview, and iterate without waiting for engineering.
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
                  className="p-6 rounded-lg bg-card border border-border"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="py-20 bg-secondary/50">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  From design to deployed in minutes
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Streamline your workflow with instant previews, branch deployments,
                  and automated publishing.
                </p>
                <div className="space-y-6">
                  {[
                    { step: "1", title: "Design", desc: "Use your favorite tools - Figma, Framer, or code" },
                    { step: "2", title: "Preview", desc: "Get unique URLs for every change" },
                    { step: "3", title: "Approve", desc: "Share with stakeholders for feedback" },
                    { step: "4", title: "Publish", desc: "Go live instantly with one click" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-lg bg-card border border-border overflow-hidden"
              >
                <div className="px-4 py-3 bg-secondary dark:bg-secondary border-b border-border flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground ml-2">Preview Deployment</span>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                        Ready
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">URL</span>
                      <code className="text-xs text-violet-600 dark:text-violet-400">
                        campaign-abc123.cloudify.app
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Branch</span>
                      <span className="text-sm text-foreground">feature/new-hero</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button variant="default" size="sm" className="w-full">
                      Promote to Production
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Perfect for every marketing need
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={useCase.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-background border border-border"
                >
                  <h4 className="font-semibold text-foreground">{useCase.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{useCase.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-violet-600 dark:bg-violet-700">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Launch your next campaign today
            </h2>
            <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
              Start deploying marketing sites that convert. No engineering required.
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
