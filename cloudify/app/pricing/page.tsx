"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  X,
  Zap,
  Building2,
  Users,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Hobby",
    description: "For personal projects and experiments",
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    features: [
      { name: "Unlimited deployments", included: true },
      { name: "100 GB bandwidth", included: true },
      { name: "100 hours build time", included: true },
      { name: "10 concurrent builds", included: false },
      { name: "Preview deployments", included: true },
      { name: "Serverless functions", included: true, limit: "100k/month" },
      { name: "Edge functions", included: true, limit: "500k/month" },
      { name: "Analytics", included: false },
      { name: "Password protection", included: false },
      { name: "Custom domains", included: true, limit: "1" },
      { name: "SSL certificates", included: true },
      { name: "DDoS protection", included: true },
      { name: "Email support", included: false },
    ],
    cta: "Start for Free",
    ctaLink: "/signup",
  },
  {
    name: "Pro",
    description: "For professionals and growing teams",
    monthlyPrice: 20,
    yearlyPrice: 192,
    popular: true,
    features: [
      { name: "Unlimited deployments", included: true },
      { name: "1 TB bandwidth", included: true },
      { name: "Unlimited build time", included: true },
      { name: "10 concurrent builds", included: true },
      { name: "Preview deployments", included: true },
      { name: "Serverless functions", included: true, limit: "1M/month" },
      { name: "Edge functions", included: true, limit: "3M/month" },
      { name: "Analytics", included: true },
      { name: "Password protection", included: true },
      { name: "Custom domains", included: true, limit: "Unlimited" },
      { name: "SSL certificates", included: true },
      { name: "DDoS protection", included: true },
      { name: "Email support", included: true },
    ],
    cta: "Start Free Trial",
    ctaLink: "/signup?plan=pro",
  },
  {
    name: "Enterprise",
    description: "For large-scale applications",
    monthlyPrice: null,
    yearlyPrice: null,
    popular: false,
    features: [
      { name: "Unlimited deployments", included: true },
      { name: "Custom bandwidth", included: true },
      { name: "Unlimited build time", included: true },
      { name: "Unlimited concurrent builds", included: true },
      { name: "Preview deployments", included: true },
      { name: "Serverless functions", included: true, limit: "Custom" },
      { name: "Edge functions", included: true, limit: "Custom" },
      { name: "Advanced analytics", included: true },
      { name: "Password protection", included: true },
      { name: "Custom domains", included: true, limit: "Unlimited" },
      { name: "SSL certificates", included: true },
      { name: "Enterprise DDoS protection", included: true },
      { name: "Dedicated support", included: true },
      { name: "SLA guarantee", included: true },
      { name: "SAML SSO", included: true },
      { name: "Audit logs", included: true },
    ],
    cta: "Contact Sales",
    ctaLink: "/contact",
  },
];

const faqs = [
  {
    question: "What happens when I exceed my limits?",
    answer:
      "We'll notify you when you're approaching your limits. If you exceed them, we'll work with you to upgrade your plan or optimize your usage. We never shut down your deployments without warning.",
  },
  {
    question: "Can I change plans at any time?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged a prorated amount. When downgrading, the change will take effect at the end of your billing cycle.",
  },
  {
    question: "Do you offer discounts for startups or non-profits?",
    answer:
      "Yes! We offer special pricing for startups, non-profits, and educational institutions. Contact our sales team to learn more about our discount programs.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express) as well as PayPal. Enterprise customers can also pay by invoice.",
  },
  {
    question: "Is there a free trial for Pro plans?",
    answer:
      "Yes! All Pro plans come with a 14-day free trial. No credit card required to start.",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-[var(--surface-primary)]">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)]"
            >
              Simple, transparent pricing
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mt-4 text-xl text-[var(--text-secondary)] max-w-2xl mx-auto"
            >
              Start for free, scale as you grow. No hidden fees, no surprises.
            </motion.p>

            {/* Billing toggle */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mt-8 flex items-center justify-center gap-4"
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  !isYearly ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                )}
              >
                Monthly
              </span>
              <Switch checked={isYearly} onCheckedChange={setIsYearly} />
              <span
                className={cn(
                  "text-sm font-medium",
                  isYearly ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                )}
              >
                Yearly{" "}
                <span className="text-green-600 dark:text-green-400">
                  (Save 20%)
                </span>
              </span>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12 -mt-8">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-1 text-sm font-medium text-background">
                        <Zap className="h-4 w-4" />
                        Most Popular
                      </span>
                    </div>
                  )}
                  <Card
                    className={cn(
                      "h-full flex flex-col",
                      plan.popular
                        ? "border-foreground shadow-none"
                        : ""
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {plan.name === "Hobby" && (
                          <Users className="h-5 w-5 text-gray-400" />
                        )}
                        {plan.name === "Pro" && (
                          <Zap className="h-5 w-5 text-[#0070f3]" />
                        )}
                        {plan.name === "Enterprise" && (
                          <Building2 className="h-5 w-5 text-purple-500" />
                        )}
                        <CardTitle>{plan.name}</CardTitle>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {plan.description}
                      </p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      {/* Price */}
                      <div className="mb-6">
                        {plan.monthlyPrice !== null ? (
                          <div className="flex items-baseline">
                            <span className="text-4xl font-bold text-[var(--text-primary)]">
                              ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                            </span>
                            <span className="ml-2 text-[var(--text-secondary)]">
                              /{isYearly ? "year" : "month"}
                            </span>
                          </div>
                        ) : (
                          <div className="text-4xl font-bold text-[var(--text-primary)]">
                            Custom
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 flex-1">
                        {plan.features.map((feature) => (
                          <li
                            key={feature.name}
                            className="flex items-start gap-3"
                          >
                            {feature.included ? (
                              <Check className="h-5 w-5 text-green-500 shrink-0" />
                            ) : (
                              <X className="h-5 w-5 text-[var(--text-secondary)] shrink-0" />
                            )}
                            <span
                              className={cn(
                                "text-sm",
                                feature.included
                                  ? "text-[var(--text-primary)]"
                                  : "text-[var(--text-secondary)]"
                              )}
                            >
                              {feature.name}
                              {feature.limit && (
                                <span className="text-[var(--text-secondary)]">
                                  {" "}
                                  ({feature.limit})
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <div className="mt-8">
                        <Button
                          className="w-full"
                          variant={plan.popular ? "default" : "secondary"}
                          asChild
                        >
                          <Link href={plan.ctaLink}>
                            {plan.cta}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-[var(--surface-primary)]">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold text-center text-[var(--text-primary)] mb-12"
            >
              Frequently Asked Questions
            </motion.h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                  className="p-6 rounded-lg bg-card border border-[var(--border-primary)]"
                >
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-[#0070f3]" />
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-[var(--text-secondary)]">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
