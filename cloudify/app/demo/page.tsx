"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, CheckCircle, Zap, Shield, Globe, Clock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: Zap,
    title: "Instant Deployments",
    description: "See how to deploy in under 30 seconds",
  },
  {
    icon: Globe,
    title: "Global Edge Network",
    description: "Learn about our 100+ edge locations",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Discover our security features",
  },
  {
    icon: Clock,
    title: "Zero Downtime",
    description: "Understand our deployment strategy",
  },
];

const teamSizes = [
  "Just me",
  "2-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
];

export default function DemoPage() {
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    jobTitle: "",
    teamSize: "",
    useCase: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left - Content */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
                  See Cloudify in Action
                </h1>
                <p className="mt-6 text-xl text-gray-600 dark:text-gray-400">
                  Get a personalized demo of how Cloudify can help your team deploy
                  faster, scale effortlessly, and build with confidence.
                </p>

                {/* Benefits */}
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {benefits.map((benefit) => (
                    <div key={benefit.title} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <benefit.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {benefit.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right - Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="shadow-xl">
                  <CardContent className="p-8">
                    {submitted ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                          Demo Request Received!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Our team will reach out within 24 hours to schedule your
                          personalized demo.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-6">
                          <Play className="h-5 w-5 text-blue-600" />
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Request a Demo
                          </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                First Name *
                              </label>
                              <Input
                                required
                                value={formState.firstName}
                                onChange={(e) =>
                                  setFormState({ ...formState, firstName: e.target.value })
                                }
                                placeholder="John"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Last Name *
                              </label>
                              <Input
                                required
                                value={formState.lastName}
                                onChange={(e) =>
                                  setFormState({ ...formState, lastName: e.target.value })
                                }
                                placeholder="Doe"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Work Email *
                            </label>
                            <Input
                              required
                              type="email"
                              value={formState.email}
                              onChange={(e) =>
                                setFormState({ ...formState, email: e.target.value })
                              }
                              placeholder="john@company.com"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Company *
                            </label>
                            <Input
                              required
                              value={formState.company}
                              onChange={(e) =>
                                setFormState({ ...formState, company: e.target.value })
                              }
                              placeholder="Company name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Job Title *
                            </label>
                            <Input
                              required
                              value={formState.jobTitle}
                              onChange={(e) =>
                                setFormState({ ...formState, jobTitle: e.target.value })
                              }
                              placeholder="Your role"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Team Size *
                            </label>
                            <select
                              required
                              value={formState.teamSize}
                              onChange={(e) =>
                                setFormState({ ...formState, teamSize: e.target.value })
                              }
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="">Select team size</option>
                              {teamSizes.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              What would you like to learn about?
                            </label>
                            <textarea
                              rows={3}
                              value={formState.useCase}
                              onChange={(e) =>
                                setFormState({ ...formState, useCase: e.target.value })
                              }
                              placeholder="Tell us about your use case..."
                              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          <Button type="submit" variant="primary" size="lg" className="w-full">
                            Request Demo
                          </Button>

                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            By submitting, you agree to our{" "}
                            <a href="/privacy" className="text-blue-600 hover:underline">
                              Privacy Policy
                            </a>
                          </p>
                        </form>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
