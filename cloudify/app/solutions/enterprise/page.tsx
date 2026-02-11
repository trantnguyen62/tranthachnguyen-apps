"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Shield,
  Lock,
  Users,
  Headphones,
  FileText,
  Check,
  Globe,
  Zap
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Advanced Security",
    description: "SOC 2 Type II, HIPAA, and custom security controls for your organization.",
  },
  {
    icon: Lock,
    title: "SSO & SAML",
    description: "Single sign-on with your identity provider. SAML, OIDC, and SCIM support.",
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Fine-grained permissions, audit logs, and role-based access control.",
  },
  {
    icon: Headphones,
    title: "Priority Support",
    description: "24/7 dedicated support with 1-hour response SLA and named account manager.",
  },
  {
    icon: FileText,
    title: "Custom Contracts",
    description: "Custom terms, DPA, BAA, and legal agreements tailored to your needs.",
  },
  {
    icon: Globe,
    title: "99.99% SLA",
    description: "Enterprise-grade uptime guarantee with financial-backed SLA.",
  },
];

const logos = [
  "Fortune 500 Company",
  "Global Bank",
  "Healthcare Provider",
  "Tech Enterprise",
  "Government Agency",
  "Media Corporation",
];

const securityFeatures = [
  "SOC 2 Type II certified",
  "HIPAA compliant",
  "GDPR compliant",
  "ISO 27001 certified",
  "PCI DSS Level 1",
  "FedRAMP authorized",
];

export default function EnterprisePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 bg-foreground">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-muted-foreground mb-6">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">Enterprise</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight">
                Enterprise-grade
                <br />
                <span className="text-[#0070f3]">deployment platform</span>
              </h1>
              <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
                Deploy with confidence. Security, compliance, and support built for
                the world&apos;s most demanding organizations.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" asChild>
                  <Link href="/contact">
                    Contact Sales
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/demo">Request Demo</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trusted By */}
        <section className="py-16 bg-secondary/50">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-muted-foreground mb-8">
              TRUSTED BY LEADING ENTERPRISES
            </p>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center">
              {logos.map((logo, index) => (
                <motion.div
                  key={logo}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-muted-foreground font-semibold text-sm">
                      {logo}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Built for enterprise requirements
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to deploy at scale with confidence.
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
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-foreground" />
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

        {/* Security Section */}
        <section className="py-20 bg-secondary/50">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Security & Compliance
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Meet the strictest security and compliance requirements with our
                  enterprise-grade infrastructure.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {securityFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-lg bg-secondary/50 border border-border"
              >
                <Shield className="h-12 w-12 text-foreground mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Security First
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our platform is built with security at its core. From encrypted
                  data at rest to continuous monitoring, we protect your applications.
                </p>
                <Button variant="secondary" asChild>
                  <Link href="/security">
                    View Security Page
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="order-2 lg:order-1"
              >
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: "1 hour", label: "Response SLA" },
                    { value: "24/7", label: "Support Coverage" },
                    { value: "Dedicated", label: "Account Manager" },
                    { value: "99.99%", label: "Uptime SLA" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-6 rounded-lg bg-background text-center"
                    >
                      <div className="text-3xl font-bold text-foreground">
                        {stat.value}
                      </div>
                      <div className="text-muted-foreground text-sm mt-1">
                        {stat.label}
                      </div>
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
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  White-glove support
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Get dedicated support from engineers who understand your infrastructure.
                  We&apos;re here when you need us, 24/7.
                </p>
                <ul className="space-y-3">
                  {[
                    "Named account manager",
                    "Direct Slack/Teams channel",
                    "Quarterly business reviews",
                    "Migration assistance",
                    "Architecture reviews",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
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
        <section className="py-20 bg-foreground dark:bg-black">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to scale your deployments?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Talk to our team about how Cloudify can meet your enterprise requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" size="lg" asChild>
                <Link href="/contact">
                  Contact Sales
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/demo">Request Demo</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
