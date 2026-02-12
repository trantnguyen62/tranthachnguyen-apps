"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Zap,
  Code2,
  Boxes,
  GitBranch,
  Globe,
  Cpu,
  Database,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const productCategories = [
  {
    name: "AI",
    description: "Build intelligent applications with our AI-powered tools",
    products: [
      {
        name: "v0",
        description: "AI-powered app builder that turns ideas into production-ready code",
        icon: Zap,
        href: "/products/v0",
        badge: "New",
        color: "from-purple-500 to-pink-500",
      },
      {
        name: "AI SDK",
        description: "Build AI applications with streaming, tool calling, and more",
        icon: Code2,
        href: "/products/ai",
        color: "from-indigo-500 to-purple-500",
      },
      {
        name: "AI Gateway",
        description: "Multi-model access with load balancing and cost optimization",
        icon: Boxes,
        href: "/products/ai-gateway",
        badge: "Beta",
        color: "from-violet-500 to-purple-500",
      },
    ],
  },
  {
    name: "Infrastructure",
    description: "Scalable infrastructure for modern applications",
    products: [
      {
        name: "Deployments",
        description: "Git-based deployments with automatic previews and rollbacks",
        icon: GitBranch,
        href: "/products/deployments",
        color: "from-gray-600 to-gray-400",
      },
      {
        name: "Edge Network",
        description: "Global CDN with edge caching and smart routing",
        icon: Globe,
        href: "/products/edge-network",
        color: "from-green-500 to-emerald-500",
      },
      {
        name: "Serverless Functions",
        description: "Auto-scaling compute with zero cold starts",
        icon: Cpu,
        href: "/products/functions",
        color: "from-orange-500 to-amber-500",
      },
    ],
  },
  {
    name: "Data & Analytics",
    description: "Store and analyze your application data",
    products: [
      {
        name: "Storage",
        description: "Blob storage and KV store for your application data",
        icon: Database,
        href: "/products/storage",
        color: "from-teal-500 to-cyan-500",
      },
      {
        name: "Analytics",
        description: "Real-time analytics and insights for your applications",
        icon: BarChart3,
        href: "/products/analytics",
        color: "from-pink-500 to-rose-500",
      },
    ],
  },
];

export default function ProductsPage() {
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
                Platform
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)]">
                Build with the Best Tools
              </h1>
              <p className="mt-4 text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                Everything you need to build, deploy, and scale your applications.
                From AI to infrastructure, we've got you covered.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Product Categories */}
        {productCategories.map((category, categoryIndex) => (
          <section
            key={category.name}
            className={`py-16 ${categoryIndex % 2 === 1 ? "bg-[var(--surface-primary)]" : ""}`}
          >
            <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-10"
              >
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  {category.name}
                </h2>
                <p className="mt-2 text-[var(--text-secondary)]">
                  {category.description}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.products.map((product, productIndex) => (
                  <motion.div
                    key={product.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: productIndex * 0.1 }}
                  >
                    <Link
                      href={product.href}
                      className="group block h-full p-6 rounded-lg border border-[var(--border-primary)] bg-card hover:shadow-xl transition-all hover:border-foreground/20"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${product.color}`}
                        >
                          <product.icon className="h-6 w-6 text-white" />
                        </div>
                        {product.badge && (
                          <Badge variant="secondary">{product.badge}</Badge>
                        )}
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)] group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3] transition-colors">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-[var(--text-secondary)]">
                        {product.description}
                      </p>
                      <div className="mt-4 flex items-center text-[var(--text-primary)] font-medium">
                        Learn more
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="py-20 bg-foreground">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-background">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-xl text-background/70 max-w-2xl mx-auto">
              Deploy your first project in minutes with our intuitive platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-[var(--surface-primary)] text-[var(--text-primary)]" asChild>
                <Link href="/new">Start Deploying</Link>
              </Button>
              <Button size="lg" variant="secondary" className="border-[var(--surface-primary)]/30 text-background hover:bg-[var(--surface-primary)]/10" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
