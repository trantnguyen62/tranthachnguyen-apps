"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  Globe,
  ShoppingCart,
  Megaphone,
  Layers,
  Building2,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const solutions = [
  {
    name: "AI Apps",
    description: "Build and deploy intelligent applications with our AI-powered infrastructure",
    icon: Sparkles,
    href: "/solutions/ai-apps",
    color: "from-purple-500 to-pink-500",
    features: ["GPT integration", "Streaming responses", "Vector databases", "Model fine-tuning"],
  },
  {
    name: "Web Apps",
    description: "Deploy modern web applications with automatic scaling and global distribution",
    icon: Globe,
    href: "/solutions/web-apps",
    color: "from-gray-600 to-gray-400",
    features: ["Next.js optimized", "Edge rendering", "ISR support", "Automatic HTTPS"],
  },
  {
    name: "E-commerce",
    description: "High-performance storefronts with instant page loads and seamless checkout",
    icon: ShoppingCart,
    href: "/solutions/ecommerce",
    color: "from-green-500 to-emerald-500",
    features: ["Sub-100ms TTFB", "Cart persistence", "Payment integration", "Inventory sync"],
  },
  {
    name: "Marketing",
    description: "Launch landing pages and campaigns with speed and reliability",
    icon: Megaphone,
    href: "/solutions/marketing",
    color: "from-orange-500 to-amber-500",
    features: ["A/B testing", "Analytics built-in", "Form handling", "SEO optimization"],
  },
  {
    name: "Platforms",
    description: "Build multi-tenant SaaS applications with enterprise-grade infrastructure",
    icon: Layers,
    href: "/solutions/platforms",
    color: "from-indigo-500 to-violet-500",
    features: ["Multi-tenancy", "Custom domains", "White-labeling", "Usage metering"],
  },
  {
    name: "Enterprise",
    description: "Dedicated infrastructure, compliance, and support for large organizations",
    icon: Building2,
    href: "/solutions/enterprise",
    color: "from-gray-700 to-gray-900",
    features: ["SLA guarantee", "SOC2 compliant", "Dedicated support", "Custom contracts"],
  },
];

export default function SolutionsPage() {
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
              className="text-center"
            >
              <Badge className="mb-4" variant="secondary">
                Solutions
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)]">
                Solutions for Every Use Case
              </h1>
              <p className="mt-4 text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                Whether you're building AI applications, e-commerce stores, or enterprise
                platforms, Cloudify has the tools and infrastructure you need.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Solutions Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {solutions.map((solution, index) => (
                <motion.div
                  key={solution.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={solution.href}
                    className="group block h-full p-6 rounded-lg border border-[var(--border-primary)] bg-card hover:shadow-xl transition-all hover:border-foreground/20"
                  >
                    <div
                      className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${solution.color}`}
                    >
                      <solution.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)] group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3] transition-colors">
                      {solution.name}
                    </h3>
                    <p className="mt-2 text-[var(--text-secondary)]">
                      {solution.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {solution.features.map((feature) => (
                        <li key={feature} className="flex items-center text-sm text-[var(--text-secondary)]">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 flex items-center text-[var(--text-primary)] font-medium">
                      Learn more
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-foreground">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-background">
              Not Sure Which Solution Fits?
            </h2>
            <p className="mt-4 text-xl text-background/70 max-w-2xl mx-auto">
              Talk to our team to find the perfect solution for your needs.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-[var(--surface-primary)] text-[var(--text-primary)]" asChild>
                <Link href="/contact">Talk to Sales</Link>
              </Button>
              <Button size="lg" variant="secondary" className="border-[var(--surface-primary)]/30 text-background hover:bg-[var(--surface-primary)]/10" asChild>
                <Link href="/demo">Request a Demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
