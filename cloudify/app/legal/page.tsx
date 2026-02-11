"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  Shield,
  Cookie,
  Scale,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";

const legalDocuments = [
  {
    name: "Terms of Service",
    description: "The terms and conditions for using Cloudify services",
    icon: FileText,
    href: "/terms",
    updated: "January 2025",
  },
  {
    name: "Privacy Policy",
    description: "How we collect, use, and protect your personal information",
    icon: Shield,
    href: "/privacy",
    updated: "January 2025",
  },
  {
    name: "Cookie Policy",
    description: "Information about cookies and tracking technologies",
    icon: Cookie,
    href: "/cookies",
    updated: "January 2025",
  },
  {
    name: "Acceptable Use Policy",
    description: "Guidelines for acceptable use of our platform",
    icon: Scale,
    href: "/docs/acceptable-use",
    updated: "January 2025",
  },
  {
    name: "Data Processing Agreement",
    description: "GDPR-compliant data processing terms for enterprise customers",
    icon: Lock,
    href: "/docs/dpa",
    updated: "January 2025",
  },
  {
    name: "Service Level Agreement",
    description: "Uptime guarantees and support commitments",
    icon: FileText,
    href: "/docs/sla",
    updated: "January 2025",
  },
];

export default function LegalPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Badge className="mb-4" variant="secondary">
                Legal
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Legal Documents
              </h1>
              <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                Important policies and agreements governing your use of Cloudify services.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Documents Grid */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              {legalDocuments.map((doc, index) => (
                <motion.div
                  key={doc.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={doc.href}
                    className="group flex items-center justify-between p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-all hover:border-blue-500 dark:hover:border-blue-500"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        <doc.icon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3] transition-colors">
                          {doc.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Last updated: {doc.updated}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#0070f3] group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Have Questions?
            </h2>
            <p className="mt-4 text-muted-foreground">
              For legal inquiries, please contact us at{" "}
              <a
                href="mailto:legal@cloudify.app"
                className="text-[#0070f3] hover:underline"
              >
                legal@cloudify.app
              </a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
