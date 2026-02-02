"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Globe,
  Zap,
  Shield,
  MapPin,
  Clock,
  Server,
  Activity,
  Check
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const regions = [
  { name: "North America", locations: 35, cities: ["San Francisco", "New York", "Toronto", "Chicago"] },
  { name: "Europe", locations: 28, cities: ["London", "Frankfurt", "Amsterdam", "Paris"] },
  { name: "Asia Pacific", locations: 24, cities: ["Tokyo", "Singapore", "Sydney", "Mumbai"] },
  { name: "South America", locations: 8, cities: ["São Paulo", "Buenos Aires", "Santiago"] },
  { name: "Africa", locations: 4, cities: ["Johannesburg", "Cape Town", "Lagos"] },
  { name: "Middle East", locations: 6, cities: ["Dubai", "Tel Aviv", "Bahrain"] },
];

const features = [
  {
    icon: Zap,
    title: "Sub-50ms Latency",
    description: "Serve content from the location nearest to your users. Most requests complete in under 50ms.",
  },
  {
    icon: Shield,
    title: "Built-in DDoS Protection",
    description: "Automatic protection against DDoS attacks at all layers. No configuration required.",
  },
  {
    icon: Clock,
    title: "Smart Caching",
    description: "Intelligent caching with instant cache invalidation. Serve fresh content globally.",
  },
  {
    icon: Activity,
    title: "Real-time Analytics",
    description: "Monitor traffic, latency, and cache hit rates across all edge locations.",
  },
];

export default function EdgeNetworkPage() {
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mb-6">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">Edge Network</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Global reach,
                <br />
                <span className="text-purple-600 dark:text-purple-400">local speed</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Deploy to 100+ edge locations worldwide. Your application loads instantly
                from anywhere on the planet.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" asChild>
                  <Link href="/new">
                    Start Deploying
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/docs/edge-functions">Edge Functions Docs</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* World Map Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                100+ edge locations worldwide
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Deploy once, serve everywhere. Your content is automatically distributed globally.
              </p>
            </motion.div>

            {/* Regions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regions.map((region, index) => (
                <motion.div
                  key={region.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {region.name}
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
                      {region.locations} locations
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {region.cities.map((city) => (
                      <span
                        key={city}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-sm"
                      >
                        <MapPin className="h-3 w-3" />
                        {city}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Enterprise-grade infrastructure
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Built on the same infrastructure that powers the world&apos;s largest websites.
                  Get enterprise features without enterprise complexity.
                </p>
                <div className="space-y-4">
                  {features.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                        <feature.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {feature.description}
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
                className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Network Performance
                </h3>
                <div className="space-y-6">
                  {[
                    { label: "Average Global Latency", value: "32ms" },
                    { label: "Cache Hit Ratio", value: "98.7%" },
                    { label: "Network Uptime", value: "99.999%" },
                    { label: "Bandwidth Capacity", value: "200+ Tbps" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{stat.label}</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Edge Functions */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="order-2 lg:order-1"
              >
                <pre className="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto text-sm">
                  <code>{`// edge/middleware.ts
import { next } from '@cloudify/edge';

export const config = {
  runtime: 'edge',
};

export default async function middleware(req) {
  // Execute at the edge, closest to users
  const country = req.geo?.country || 'US';

  // Personalize content based on location
  if (country === 'JP') {
    return next({ locale: 'ja' });
  }

  // Add custom headers
  const response = next();
  response.headers.set('x-edge-location', req.geo?.city);

  return response;
}`}</code>
                </pre>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="order-1 lg:order-2"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Edge Functions
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Run code at the edge for ultra-low latency. Perfect for authentication,
                  personalization, A/B testing, and more.
                </p>
                <ul className="space-y-3">
                  {[
                    "Cold start in under 5ms",
                    "Access to geo-location data",
                    "WebAssembly support",
                    "Full JavaScript/TypeScript support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="secondary" size="lg" className="mt-8" asChild>
                  <Link href="/docs/edge-functions">
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-purple-600 dark:bg-purple-700">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Go global instantly
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Deploy to our edge network and reach users worldwide with blazing-fast performance.
            </p>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/new">
                Start Deploying
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
