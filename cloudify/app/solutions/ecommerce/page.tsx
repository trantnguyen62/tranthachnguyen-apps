"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShoppingCart,
  Zap,
  Globe,
  Shield,
  CreditCard,
  Package,
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
    title: "Blazing Fast Checkout",
    description: "Sub-second page loads that convert. Every 100ms delay costs 1% in conversions.",
  },
  {
    icon: Globe,
    title: "Global Edge Network",
    description: "Serve your store from 100+ locations worldwide. Fast for every customer.",
  },
  {
    icon: Shield,
    title: "PCI Compliant",
    description: "Built-in security for payment processing. PCI DSS Level 1 certified.",
  },
  {
    icon: TrendingUp,
    title: "Handle Traffic Spikes",
    description: "Auto-scale during flash sales and Black Friday. Never lose a sale.",
  },
];

const platforms = [
  { name: "Next.js Commerce", desc: "High-performance e-commerce starter" },
  { name: "Shopify Hydrogen", desc: "Custom Shopify storefronts" },
  { name: "Medusa", desc: "Open-source headless commerce" },
  { name: "Saleor", desc: "GraphQL-first commerce platform" },
  { name: "BigCommerce", desc: "Headless BigCommerce solutions" },
  { name: "Custom Solutions", desc: "Your own commerce stack" },
];

const metrics = [
  { value: "32ms", label: "Average TTFB" },
  { value: "99.99%", label: "Uptime" },
  { value: "3x", label: "Faster Checkout" },
  { value: "↑23%", label: "Conversion Lift" },
];

export default function EcommercePage() {
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 mb-6">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm font-medium">E-commerce</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Sell more with
                <br />
                <span className="text-emerald-600 dark:text-emerald-400">faster stores</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Build high-converting online stores that load instantly.
                Every millisecond matters when it comes to sales.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" asChild>
                  <Link href="/new">
                    Start Building
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

        {/* Metrics */}
        <section className="py-16 bg-emerald-600 dark:bg-emerald-700">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl font-bold text-white">{metric.value}</div>
                  <div className="text-emerald-100 mt-1">{metric.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Built for commerce performance
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Everything you need to run a world-class online store.
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
                  className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
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

        {/* Platforms */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Works with your commerce platform
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Deploy headless commerce solutions with any backend.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.map((platform, index) => (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white">{platform.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{platform.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Performance Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Speed = Revenue
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Studies show that every 100ms of latency costs e-commerce sites 1% in
                  conversions. With Cloudify, your store loads in milliseconds.
                </p>
                <ul className="space-y-4">
                  {[
                    "Edge-rendered product pages",
                    "Instant search and filtering",
                    "Optimized checkout flow",
                    "Automatic image optimization",
                    "Smart caching strategies",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
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
                className="p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Page Load</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="w-1/4 h-full bg-emerald-500 rounded-full" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">0.8s</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">First Input Delay</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="w-1/5 h-full bg-emerald-500 rounded-full" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">12ms</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Layout Shift</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="w-1/6 h-full bg-emerald-500 rounded-full" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">0.02</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 text-center">
                  Core Web Vitals - All passing
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-emerald-600 dark:bg-emerald-700">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start selling faster today
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Deploy your e-commerce store on Cloudify and watch your conversions improve.
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
