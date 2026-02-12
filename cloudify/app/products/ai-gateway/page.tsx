"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Zap,
  Shield,
  BarChart3,
  DollarSign,
  Check,
  Globe,
  Clock,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Boxes,
    title: "Multi-Provider Support",
    description: "Access OpenAI, Anthropic, Google, Cohere, and more through a single unified API.",
  },
  {
    icon: Zap,
    title: "Intelligent Routing",
    description: "Automatic load balancing and failover across providers for maximum reliability.",
  },
  {
    icon: DollarSign,
    title: "Cost Optimization",
    description: "Route requests to the most cost-effective provider based on your requirements.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC2 compliant with encryption, audit logs, and fine-grained access controls.",
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description: "Track costs, latency, and usage across all providers in real-time.",
  },
  {
    icon: Clock,
    title: "Rate Limiting",
    description: "Built-in rate limiting and request queuing to prevent API overages.",
  },
];

const providers = [
  { name: "OpenAI", models: "GPT-4, GPT-3.5, DALL-E, Whisper" },
  { name: "Anthropic", models: "Claude 3 Opus, Claude 3 Sonnet" },
  { name: "Google", models: "Gemini Pro, PaLM 2" },
  { name: "Cohere", models: "Command, Embed, Rerank" },
  { name: "Mistral", models: "Mistral Large, Mistral Small" },
  { name: "Meta", models: "Llama 3, Llama 2" },
];

export default function AIGatewayPage() {
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
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 mb-6">
                <Boxes className="h-4 w-4" />
                <span className="text-sm font-medium">AI Gateway</span>
                <Badge variant="secondary" className="ml-2">Beta</Badge>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-[var(--text-primary)] leading-tight">
                One API for
                <br />
                <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  all AI models
                </span>
              </h1>
              <p className="mt-6 text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                AI Gateway provides unified access to multiple AI providers with intelligent routing,
                cost optimization, and enterprise-grade security.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" asChild>
                  <Link href="/new">
                    <Zap className="h-4 w-4" />
                    Get Started
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/docs/ai-gateway">View Documentation</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Providers */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-[var(--text-primary)]">
                Supported Providers
              </h2>
              <p className="mt-4 text-[var(--text-secondary)]">
                Access leading AI models through a single, unified API
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {providers.map((provider, index) => (
                <motion.div
                  key={provider.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl border border-[var(--border-primary)] bg-card"
                >
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    {provider.name}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {provider.models}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Code Example */}
        <section className="py-20 bg-[var(--surface-primary)]">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6">
                  Simple, unified API
                </h2>
                <p className="text-lg text-[var(--text-secondary)] mb-8">
                  Switch between AI providers with a single configuration change.
                  No code changes required.
                </p>
                <div className="space-y-4">
                  {[
                    "Automatic failover between providers",
                    "Cost-based routing optimization",
                    "Real-time usage monitoring",
                    "Request caching and deduplication",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-[var(--text-secondary)]">
                      <Check className="h-5 w-5 text-green-500 shrink-0" />
                      {item}
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
                  <code>{`import { Gateway } from '@cloudify/ai-gateway';

const gateway = new Gateway({
  providers: ['openai', 'anthropic', 'google'],
  routing: 'cost-optimized', // or 'latency' or 'round-robin'
});

// Use any model through the same API
const response = await gateway.chat({
  model: 'auto', // Gateway chooses the best provider
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
});

// Or specify a provider explicitly
const claude = await gateway.chat({
  model: 'anthropic/claude-3-opus',
  messages: [...],
});`}</code>
                </pre>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                Enterprise-ready features
              </h2>
              <p className="mt-4 text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                Everything you need to build reliable AI applications at scale.
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
                  className="p-6 rounded-lg bg-card border border-[var(--border-primary)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--text-secondary)]">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-600">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white">
              Ready to simplify your AI infrastructure?
            </h2>
            <p className="mt-4 text-xl text-violet-100 max-w-2xl mx-auto">
              Start using AI Gateway today with our generous free tier.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/new">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" className="text-white border-white hover:bg-white/10" asChild>
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
