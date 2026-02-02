"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Code,
  MessageSquare,
  Bot,
  Cpu,
  Check,
  FileText
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: MessageSquare,
    title: "AI Chat SDK",
    description: "Build conversational AI interfaces with streaming support and multi-turn conversations.",
  },
  {
    icon: Bot,
    title: "Model Flexibility",
    description: "Use OpenAI, Anthropic, Google, or self-hosted models. Switch providers with one line.",
  },
  {
    icon: Zap,
    title: "Streaming by Default",
    description: "Real-time responses with built-in streaming. No buffering, instant feedback.",
  },
  {
    icon: Cpu,
    title: "Edge Optimized",
    description: "Run AI inference at the edge for lowest latency. Deploy closer to your users.",
  },
];

const providers = [
  { name: "OpenAI", models: ["GPT-4", "GPT-3.5", "Ada"] },
  { name: "Anthropic", models: ["Claude 3", "Claude 2"] },
  { name: "Google", models: ["Gemini Pro", "PaLM 2"] },
  { name: "Cohere", models: ["Command", "Embed"] },
  { name: "Hugging Face", models: ["Llama 2", "Mistral"] },
  { name: "Replicate", models: ["Custom models"] },
];

export default function AIPage() {
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 mb-6">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">AI SDK</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                Build AI apps,
                <br />
                <span className="text-pink-600 dark:text-pink-400">faster</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                The AI toolkit for TypeScript. Build conversational AI, content generation,
                and intelligent features with any model provider.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" asChild>
                  <Link href="/new">
                    Start Building
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

        {/* Code Example */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  Ship AI features in minutes
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Build streaming chat interfaces, content generators, and AI-powered features
                  with just a few lines of code.
                </p>
                <div className="space-y-4">
                  {[
                    "Streaming responses out of the box",
                    "Multi-turn conversation support",
                    "Function calling and tool use",
                    "Built-in rate limiting and caching",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
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
                  <code>{`import { OpenAI } from '@cloudify/ai';
import { StreamingTextResponse } from '@cloudify/ai/streaming';

const openai = new OpenAI();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    stream: true,
  });

  // Stream the response to the client
  return new StreamingTextResponse(response);
}

// In your React component
import { useChat } from '@cloudify/ai/react';

function Chat() {
  const { messages, input, handleSubmit } = useChat();

  return (
    <form onSubmit={handleSubmit}>
      {messages.map(m => <div key={m.id}>{m.content}</div>)}
      <input value={input} onChange={handleInputChange} />
    </form>
  );
}`}</code>
                </pre>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Everything you need for AI development
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                A complete toolkit for building AI-powered applications.
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
                  <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
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

        {/* Providers */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Works with every major AI provider
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Use your favorite models. Switch providers without changing your code.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {providers.map((provider, index) => (
                <motion.div
                  key={provider.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {provider.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.models.map((model) => (
                      <span
                        key={model}
                        className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Build any AI experience
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: MessageSquare,
                  title: "Chatbots",
                  desc: "Customer support, virtual assistants, and conversational interfaces.",
                },
                {
                  icon: FileText,
                  title: "Content Generation",
                  desc: "Blog posts, product descriptions, and marketing copy.",
                },
                {
                  icon: Code,
                  title: "Code Assistance",
                  desc: "Code completion, documentation, and debugging helpers.",
                },
              ].map((useCase, index) => (
                <motion.div
                  key={useCase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                    <useCase.icon className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {useCase.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-pink-600 dark:bg-pink-700">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start building with AI today
            </h2>
            <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
              Create intelligent applications with the Cloudify AI SDK.
            </p>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/new">
                Get Started
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
