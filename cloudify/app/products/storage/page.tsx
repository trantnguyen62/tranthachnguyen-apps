"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Database,
  Globe,
  Zap,
  Shield,
  HardDrive,
  FileImage,
  Code,
  Check,
  Lock
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const storageTypes = [
  {
    icon: Database,
    title: "Blob Storage",
    description: "Store and serve files of any size. Perfect for images, videos, documents, and more.",
    features: ["Automatic CDN distribution", "Presigned URLs", "Metadata support"],
  },
  {
    icon: HardDrive,
    title: "KV Storage",
    description: "Lightning-fast key-value store at the edge. Ideal for configuration and caching.",
    features: ["Sub-millisecond reads", "Global replication", "Strong consistency"],
  },
  {
    icon: FileImage,
    title: "Edge Config",
    description: "Ultra-low latency configuration storage. Feature flags and A/B testing made easy.",
    features: ["Instant updates", "No cold starts", "Version control"],
  },
];

const useCases = [
  { name: "User uploads", desc: "Profile pictures, documents, attachments" },
  { name: "Static assets", desc: "Images, fonts, icons" },
  { name: "Feature flags", desc: "Real-time configuration" },
  { name: "Session data", desc: "User sessions at the edge" },
  { name: "API caching", desc: "Cache expensive computations" },
  { name: "Content delivery", desc: "Media files and downloads" },
];

export default function StoragePage() {
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 mb-6">
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Global storage,
                <br />
                <span className="text-indigo-600 dark:text-indigo-400">zero latency</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Store files and data at the edge. Blazing fast reads from anywhere in the world
                with automatic replication and CDN distribution.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" asChild>
                  <Link href="/new">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/docs">View Documentation</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Storage Types */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Storage for every use case
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                From large files to tiny key-value pairs, we&apos;ve got you covered.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {storageTypes.map((type, index) => (
                <motion.div
                  key={type.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                    <type.icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {type.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {type.description}
                  </p>
                  <ul className="space-y-2">
                    {type.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Simple, powerful APIs
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Integrate storage into your application with just a few lines of code.
                  Full TypeScript support included.
                </p>
                <div className="space-y-4">
                  {[
                    { title: "Upload files", desc: "Stream large files directly from the browser" },
                    { title: "Generate URLs", desc: "Create signed URLs for secure access" },
                    { title: "List and manage", desc: "Browse, copy, and delete with ease" },
                    { title: "Set metadata", desc: "Attach custom metadata to any file" },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <pre className="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto text-sm">
                  <code>{`import { blob, kv } from '@cloudify/storage';

// Upload a file to Blob Storage
const file = await blob.put('images/hero.jpg', imageBuffer, {
  contentType: 'image/jpeg',
  access: 'public',
});

// Get a public URL
const url = file.url;
// => https://storage.cloudify.app/images/hero.jpg

// Store data in KV
await kv.set('user:123', {
  name: 'John Doe',
  email: 'john@example.com',
});

// Read from KV (< 1ms at the edge)
const user = await kv.get('user:123');

// Use Edge Config for feature flags
import { get } from '@cloudify/edge-config';

const showBanner = await get('show_promo_banner');
// => true`}</code>
                </pre>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Built for real-world applications
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Common patterns that just work.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={useCase.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white">{useCase.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{useCase.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="order-2 lg:order-1 p-8 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800"
              >
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: Lock, label: "Encryption at rest" },
                    { icon: Shield, label: "TLS in transit" },
                    { icon: Globe, label: "Data residency" },
                    { icon: Code, label: "Signed URLs" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="order-1 lg:order-2"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Enterprise-grade security
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Your data is encrypted at rest and in transit. Control access with
                  fine-grained permissions and audit logs.
                </p>
                <ul className="space-y-3">
                  {[
                    "AES-256 encryption at rest",
                    "TLS 1.3 for all data in transit",
                    "SOC 2 Type II certified",
                    "GDPR compliant data handling",
                    "Configurable data residency",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-indigo-600 dark:bg-indigo-700">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start storing today
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Get started with 10GB of free storage. No credit card required.
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
