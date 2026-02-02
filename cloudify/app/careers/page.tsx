"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Briefcase,
  Clock,
  Heart,
  Zap,
  Globe,
  Users,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const benefits = [
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Comprehensive health, dental, and vision insurance for you and your family. Mental health support included.",
  },
  {
    icon: Zap,
    title: "Competitive Pay",
    description: "Top-of-market salary, equity package, and annual bonuses. We want you to share in our success.",
  },
  {
    icon: Globe,
    title: "Remote-First",
    description: "Work from anywhere. We have team members across 20+ countries and async-first communication.",
  },
  {
    icon: Clock,
    title: "Flexible Time Off",
    description: "Unlimited PTO with a minimum of 4 weeks encouraged. Plus company-wide recharge weeks.",
  },
  {
    icon: Briefcase,
    title: "Learning Budget",
    description: "$2,000 annual learning budget for courses, conferences, books, or anything that helps you grow.",
  },
  {
    icon: Users,
    title: "Team Events",
    description: "Annual company retreats, team offsites, and regular virtual social events to stay connected.",
  },
];

const departments = ["All", "Engineering", "Product", "Design", "Marketing", "Sales", "Operations"];
const locations = ["All", "Remote", "San Francisco", "New York", "London"];

const jobs = [
  {
    id: 1,
    title: "Senior Software Engineer, Platform",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build the core infrastructure that powers millions of deployments. Work on distributed systems, edge computing, and developer tools.",
  },
  {
    id: 2,
    title: "Staff Software Engineer, Edge Runtime",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Design and implement our edge runtime. Deep experience with V8, WebAssembly, and low-level systems programming.",
  },
  {
    id: 3,
    title: "Product Designer",
    department: "Design",
    location: "San Francisco",
    type: "Full-time",
    description: "Design beautiful, intuitive experiences for developers. Shape the future of how teams deploy and manage web applications.",
  },
  {
    id: 4,
    title: "Senior Product Manager, Developer Experience",
    department: "Product",
    location: "Remote",
    type: "Full-time",
    description: "Own the developer experience from CLI to dashboard. Work closely with engineering to build tools developers love.",
  },
  {
    id: 5,
    title: "Technical Writer",
    department: "Product",
    location: "Remote",
    type: "Full-time",
    description: "Create world-class documentation, tutorials, and guides. Help developers succeed with Cloudify.",
  },
  {
    id: 6,
    title: "Enterprise Account Executive",
    department: "Sales",
    location: "New York",
    type: "Full-time",
    description: "Build relationships with enterprise customers. Help large organizations adopt modern deployment practices.",
  },
  {
    id: 7,
    title: "Developer Advocate",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    description: "Be the voice of developers. Create content, speak at conferences, and build community.",
  },
  {
    id: 8,
    title: "Site Reliability Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Ensure 99.99% uptime for our global infrastructure. Build observability, automation, and incident response systems.",
  },
];

export default function CareersPage() {
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");

  const filteredJobs = jobs.filter((job) => {
    const matchesDept = selectedDepartment === "All" || job.department === selectedDepartment;
    const matchesLoc = selectedLocation === "All" || job.location === selectedLocation;
    return matchesDept && matchesLoc;
  });

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
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
                Join us in building the future
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-400">
                We&apos;re a team of builders, dreamers, and problem-solvers working to make
                the web faster and more accessible for everyone.
              </p>
              <div className="mt-8">
                <Button variant="primary" size="lg" asChild>
                  <a href="#openings">
                    View Open Positions
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Why Cloudify?
              </h2>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                We take care of our team so they can take care of our customers
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                >
                  <benefit.icon className="h-8 w-8 text-blue-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section id="openings" className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Open Positions
              </h2>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
                Find your next role at Cloudify
              </p>
            </motion.div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
              <div className="flex gap-2">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                      selectedDepartment === dept
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Job List */}
            <div className="space-y-4 max-w-4xl mx-auto">
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <Badge variant="secondary">{job.department}</Badge>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Briefcase className="h-4 w-4" />
                          {job.type}
                        </span>
                      </div>
                      <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">
                        {job.description}
                      </p>
                    </div>
                    <Button variant="outline" className="shrink-0" asChild>
                      <Link href={`/careers/${job.id}`}>
                        Apply
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              ))}

              {filteredJobs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No positions match your filters. Try adjusting your criteria.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Don&apos;t see a role that fits?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              We&apos;re always looking for talented people. Send us your resume and we&apos;ll
              keep you in mind for future opportunities.
            </p>
            <Button variant="outline" size="lg" asChild>
              <Link href="/contact">
                Get in Touch
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
