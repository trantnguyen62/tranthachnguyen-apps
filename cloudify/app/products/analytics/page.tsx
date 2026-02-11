"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Globe,
  Zap,
  Eye,
  Users,
  Activity,
  TrendingUp,
  Check,
  Clock
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Real-time Data",
    description: "See visitors as they happen. No sampling, no delays. Every visitor, every pageview.",
  },
  {
    icon: Globe,
    title: "Privacy-First",
    description: "No cookies required. GDPR compliant out of the box. Respect your users' privacy.",
  },
  {
    icon: Users,
    title: "Visitor Insights",
    description: "Understand your audience with device, browser, OS, and geographic data.",
  },
  {
    icon: Activity,
    title: "Performance Metrics",
    description: "Track Core Web Vitals, load times, and performance across all pages.",
  },
  {
    icon: TrendingUp,
    title: "Conversion Tracking",
    description: "Set up custom events and track conversions throughout your funnel.",
  },
  {
    icon: Eye,
    title: "Page Analytics",
    description: "See which pages perform best and where visitors drop off.",
  },
];

const metrics = [
  { label: "Page Views", value: "2.4M", change: "+12.5%" },
  { label: "Unique Visitors", value: "847K", change: "+8.3%" },
  { label: "Avg. Session", value: "4m 23s", change: "+15.2%" },
  { label: "Bounce Rate", value: "32%", change: "-5.1%" },
];

export default function AnalyticsPage() {
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 mb-6">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Analytics</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-foreground leading-tight">
                Insights that
                <br />
                <span className="text-orange-600 dark:text-orange-400">drive growth</span>
              </h1>
              <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
                Real-time analytics for your web applications. Understand your users,
                improve performance, and grow your business.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" asChild>
                  <Link href="/new">
                    Enable Analytics
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/docs">Learn More</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Dashboard Preview */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-lg bg-card border border-border overflow-hidden"
            >
              {/* Dashboard Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold text-foreground">Dashboard</h3>
                  <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs">
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last 7 days
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-secondary">
                {metrics.map((metric) => (
                  <div key={metric.label} className="bg-card p-6">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {metric.value}
                    </p>
                    <p className={`text-sm mt-1 ${
                      metric.change.startsWith('+')
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {metric.change} from last period
                    </p>
                  </div>
                ))}
              </div>

              {/* Chart Placeholder */}
              <div className="p-6">
                <div className="h-64 bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-lg flex items-end justify-between px-8 pb-8">
                  {[35, 45, 55, 40, 65, 75, 60, 80, 70, 90, 85, 95].map((height, i) => (
                    <div
                      key={i}
                      className="w-6 bg-orange-500 dark:bg-orange-400 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-secondary/50">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Everything you need to understand your users
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Powerful analytics without the complexity of traditional tools.
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
                  className="p-6 rounded-lg bg-card border border-border"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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

        {/* Privacy Section */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Privacy-first analytics
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Get the insights you need without compromising your users&apos; privacy.
                  No cookies, no tracking across sites, fully GDPR compliant.
                </p>
                <ul className="space-y-4">
                  {[
                    "No cookies or personal data collection",
                    "GDPR, CCPA, and PECR compliant",
                    "Data stored in your region",
                    "No third-party data sharing",
                    "Open and transparent methodology",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
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
                className="p-8 rounded-lg bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800"
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                    <Globe className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    No Cookie Banner Needed
                  </h3>
                  <p className="text-muted-foreground">
                    Since we don&apos;t use cookies for tracking, you don&apos;t need to show
                    a cookie consent banner for Cloudify Analytics.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-20 bg-secondary/50">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Analytics included in all plans. Scale as you grow.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { plan: "Hobby", events: "100K", price: "Included" },
                { plan: "Pro", events: "1M", price: "Included" },
                { plan: "Enterprise", events: "Unlimited", price: "Included" },
              ].map((tier, index) => (
                <motion.div
                  key={tier.plan}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-lg bg-card border border-border text-center"
                >
                  <h3 className="font-semibold text-foreground">{tier.plan}</h3>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {tier.events}
                  </p>
                  <p className="text-muted-foreground text-sm">events/month</p>
                  <p className="mt-4 text-orange-600 dark:text-orange-400 font-medium">
                    {tier.price}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-orange-600 dark:bg-orange-700">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start understanding your users
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Enable analytics with one click and start getting insights immediately.
            </p>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/new">
                Enable Analytics
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
