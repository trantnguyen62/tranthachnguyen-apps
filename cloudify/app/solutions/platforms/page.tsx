"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Layers,
  Zap,
  Globe,
  Shield,
  Users,
  Code,
  Check,
  Building2
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Users,
    title: "Multi-Tenancy",
    description: "Isolated environments for each customer with custom domains and branding.",
  },
  {
    icon: Zap,
    title: "Instant Scaling",
    description: "Auto-scale to handle any number of customers without infrastructure changes.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2, HIPAA, and custom compliance. SSO and SAML for your customers.",
  },
  {
    icon: Globe,
    title: "Global Presence",
    description: "Deploy close to your customers with 100+ edge locations worldwide.",
  },
];

const useCases = [
  { name: "SaaS Platforms", desc: "Multi-tenant applications" },
  { name: "Developer Tools", desc: "APIs, SDKs, and CLIs" },
  { name: "White-Label Products", desc: "Resellable solutions" },
  { name: "Marketplace Apps", desc: "App store integrations" },
  { name: "Internal Tools", desc: "Company-wide platforms" },
  { name: "Customer Portals", desc: "Self-service dashboards" },
];

export default function PlatformsPage() {
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 mb-6">
                <Layers className="h-4 w-4" />
                <span className="text-sm font-medium">Platforms</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Build platforms
                <br />
                <span className="text-cyan-600 dark:text-cyan-400">your customers love</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Create multi-tenant SaaS products, developer platforms, and white-label
                solutions that scale with your business.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" asChild>
                  <Link href="/new">
                    Start Building
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/contact">Talk to Sales</Link>
                </Button>
              </div>
            </motion.div>
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
                Platform infrastructure at scale
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Everything you need to build and operate a platform business.
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
                  <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
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

        {/* Multi-tenancy */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Built for multi-tenancy
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Serve thousands of customers from a single codebase with complete
                  isolation and customization.
                </p>
                <ul className="space-y-4">
                  {[
                    "Custom domains per customer",
                    "Isolated data and configurations",
                    "Per-tenant feature flags",
                    "Usage-based billing integration",
                    "White-label branding options",
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
              >
                <pre className="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto text-sm">
                  <code>{`// Dynamic tenant configuration
import { getTenant } from '@cloudify/multi-tenant';

export async function middleware(req) {
  // Automatically resolve tenant from domain
  const tenant = await getTenant(req);

  // Access tenant-specific config
  const config = await tenant.getConfig();

  // Use tenant's custom branding
  const theme = await tenant.getTheme();

  return NextResponse.next({
    headers: {
      'x-tenant-id': tenant.id,
      'x-tenant-plan': tenant.plan,
    },
  });
}

// Per-tenant data isolation
const data = await db.items.findMany({
  where: { tenantId: tenant.id }
});`}</code>
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
                Build any type of platform
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
                  className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white">{useCase.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{useCase.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Building2 className="h-12 w-12 text-cyan-600 dark:text-cyan-400 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Enterprise-ready from day one
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
                Meet the security and compliance requirements of your largest customers.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
                {[
                  { label: "SOC 2 Type II" },
                  { label: "HIPAA Compliant" },
                  { label: "GDPR Ready" },
                  { label: "99.99% SLA" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-cyan-600 dark:bg-cyan-700">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Launch your platform today
            </h2>
            <p className="text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
              Start building your multi-tenant platform with enterprise-grade infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" asChild>
                <Link href="/new">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/contact">Talk to Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
