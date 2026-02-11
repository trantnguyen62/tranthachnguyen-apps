"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  MessageCircle,
  Mail,
  Users,
  Zap,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const supportChannels = [
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Browse our comprehensive docs and guides",
    href: "/docs",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: MessageCircle,
    title: "Community Forum",
    description: "Get help from the Cloudify community",
    href: "https://github.com/cloudify/discussions",
    color: "from-purple-500 to-pink-500",
    external: true,
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Contact our support team directly",
    href: "mailto:support@cloudify.app",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Users,
    title: "Enterprise Support",
    description: "Dedicated support for enterprise customers",
    href: "/contact",
    color: "from-orange-500 to-amber-500",
  },
];

const faqs = [
  {
    question: "How do I deploy my first project?",
    answer: "You can deploy your first project by connecting your Git repository and clicking the Deploy button. Our platform will automatically detect your framework and configure the build settings.",
  },
  {
    question: "What frameworks does Cloudify support?",
    answer: "Cloudify supports all major frameworks including Next.js, React, Vue, Nuxt, Svelte, Astro, and more. We also support static sites and custom build configurations.",
  },
  {
    question: "How do I add a custom domain?",
    answer: "Go to your project settings, click on Domains, and add your custom domain. You'll need to configure DNS records to point to our servers. We'll automatically provision an SSL certificate.",
  },
  {
    question: "What's included in the free tier?",
    answer: "The free tier includes 100 deployments per month, 100GB bandwidth, and basic analytics. It's perfect for personal projects and small teams getting started.",
  },
  {
    question: "How do environment variables work?",
    answer: "Environment variables can be configured in your project settings. They're encrypted at rest and injected at build time and runtime. You can have different values for preview and production.",
  },
  {
    question: "Can I rollback a deployment?",
    answer: "Yes, you can instantly rollback to any previous deployment from your deployment history. Just click the three dots menu on any deployment and select 'Promote to Production'.",
  },
];

export default function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    email: "",
    subject: "",
    description: "",
  });

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitted(true);
  };

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
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                How Can We Help?
              </h1>
              <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
                Find answers in our documentation, get help from the community, or contact our support team.
              </p>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-10 max-w-xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Support Channels */}
        <section className="py-12 -mt-8">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {supportChannels.map((channel, index) => (
                <motion.div
                  key={channel.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={channel.href}
                    target={channel.external ? "_blank" : undefined}
                    rel={channel.external ? "noopener noreferrer" : undefined}
                    className="group block h-full"
                  >
                    <Card className="h-full hover:shadow-lg transition-all hover:border-blue-500 dark:hover:border-blue-500">
                      <CardContent className="p-6 text-center">
                        <div
                          className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${channel.color} flex items-center justify-center mb-4`}
                        >
                          <channel.icon className="h-7 w-7 text-white" />
                        </div>
                        <h3 className="font-semibold text-foreground group-hover:text-[#0070f3] dark:group-hover:text-[#0070f3] transition-colors">
                          {channel.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {channel.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <span className="font-medium text-foreground">
                      {faq.question}
                    </span>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-4 text-muted-foreground">
                      {faq.answer}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16">
          <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
              Still Need Help?
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Submit a support ticket and we'll get back to you within 24 hours.
            </p>

            {ticketSubmitted ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Ticket Submitted!
                  </h3>
                  <p className="text-muted-foreground">
                    We'll get back to you at {ticketForm.email} within 24 hours.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleTicketSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Email
                      </label>
                      <Input
                        required
                        type="email"
                        value={ticketForm.email}
                        onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Subject
                      </label>
                      <Input
                        required
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                        placeholder="Brief description of your issue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Description
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={ticketForm.description}
                        onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                        placeholder="Please describe your issue in detail..."
                        className="w-full rounded-lg border border-border bg-card px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <Button type="submit" variant="default" className="w-full">
                      Submit Ticket
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
