"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Zap,
  Globe,
  Shield,
  MessageSquare,
  Cpu,
  Check,
  Bot
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Streaming Responses",
    description: "Real-time AI responses with built-in streaming. No delays, instant feedback.",
  },
  {
    icon: Globe,
    title: "Edge Inference",
    description: "Run AI models at the edge for lowest latency. Closer to users, faster responses.",
  },
  {
    icon: Bot,
    title: "Multi-Provider Support",
    description: "OpenAI, Anthropic, Google, Cohere, and more. Switch providers with one line.",
  },
  {
    icon: Shield,
    title: "Built-in Rate Limiting",
    description: "Protect your AI endpoints with automatic rate limiting and abuse prevention.",
  },
];

const useCases = [
  { name: "Chatbots", desc: "Customer support and virtual assistants", icon: MessageSquare },
  { name: "Content Generation", desc: "Blog posts, marketing copy, product descriptions", icon: Brain },
  { name: "Code Assistants", desc: "AI-powered coding tools and documentation", icon: Cpu },
];

export default function AiAppsPage() {
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 mb-6">
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">AI Applications</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-[var(--text-primary)] leading-tight">
                Build AI apps
                <br />
                <span className="text-pink-600 dark:text-pink-400">that scale</span>
              </h1>
              <p className="mt-6 text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
                Deploy AI-powered applications with streaming, edge inference, and
                multi-provider support. Build the next generation of intelligent apps.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" asChild>
                  <Link href="/new">
                    Start Building
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/products/ai">AI SDK Docs</Link>
                </Button>
              </div>
            </motion.div>
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
                Built for AI workloads
              </h2>
              <p className="mt-4 text-lg text-[var(--text-secondary)]">
                Everything you need to deploy production AI applications.
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
                  className="p-6 rounded-lg bg-card border border-[var(--border-primary)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
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

        {/* Code Example */}
        <section className="py-20 bg-[var(--surface-secondary)]/50">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6">
                  Ship AI features fast
                </h2>
                <p className="text-lg text-[var(--text-secondary)] mb-8">
                  Build streaming chat interfaces, content generators, and intelligent
                  features with just a few lines of code.
                </p>
                <ul className="space-y-3">
                  {[
                    "Streaming responses out of the box",
                    "Multi-turn conversation support",
                    "Function calling and tool use",
                    "Built-in rate limiting",
                    "Response caching",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[var(--text-secondary)]">
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
                  <code>{`import { OpenAI } from '@cloudify/ai';
import { StreamingTextResponse } from '@cloudify/ai/streaming';

export const runtime = 'edge';

const openai = new OpenAI();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    stream: true,
  });

  return new StreamingTextResponse(response);
}`}</code>
                </pre>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                Build any AI experience
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={useCase.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 rounded-lg bg-card border border-[var(--border-primary)] text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-6">
                    <useCase.icon className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    {useCase.name}
                  </h3>
                  <p className="text-[var(--text-secondary)]">
                    {useCase.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-pink-600 dark:bg-pink-700">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start building with AI today
            </h2>
            <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
              Deploy your first AI application in minutes.
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
