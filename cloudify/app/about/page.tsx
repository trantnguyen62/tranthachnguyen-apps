"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Users, Globe, Zap, Heart, Building2, MapPin } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "2019", label: "Founded" },
  { value: "200+", label: "Team Members" },
  { value: "100K+", label: "Customers" },
  { value: "100+", label: "Countries" },
];

const values = [
  {
    icon: Zap,
    title: "Ship Fast",
    description: "We believe in rapid iteration. Move fast, learn faster, and deliver value to customers every day.",
  },
  {
    icon: Users,
    title: "Developer First",
    description: "Everything we build starts with the developer experience. If it's not delightful to use, we don't ship it.",
  },
  {
    icon: Globe,
    title: "Think Global",
    description: "The web is global, and so are we. We build for developers and users around the world.",
  },
  {
    icon: Heart,
    title: "Care Deeply",
    description: "We care about our customers, our team, and the quality of everything we create.",
  },
];

const leadership = [
  {
    name: "Sarah Chen",
    role: "CEO & Co-founder",
    image: "SC",
    color: "from-blue-500 to-purple-500",
  },
  {
    name: "Marcus Johnson",
    role: "CTO & Co-founder",
    image: "MJ",
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "Emily Rodriguez",
    role: "VP of Engineering",
    image: "ER",
    color: "from-orange-500 to-red-500",
  },
  {
    name: "David Kim",
    role: "VP of Product",
    image: "DK",
    color: "from-purple-500 to-pink-500",
  },
];

const offices = [
  { city: "San Francisco", country: "USA", type: "HQ" },
  { city: "New York", country: "USA", type: "Office" },
  { city: "London", country: "UK", type: "Office" },
  { city: "Berlin", country: "Germany", type: "Office" },
  { city: "Singapore", country: "Singapore", type: "Office" },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 bg-secondary/30">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
                Building the future of the web
              </h1>
              <p className="mt-6 text-xl text-muted-foreground">
                Cloudify is on a mission to make the web faster, more accessible, and easier
                to build. We&apos;re creating tools that empower developers to ship their best work.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground mb-8">
                Our Story
              </h2>
              <div className="prose prose-lg dark:prose-invert">
                <p>
                  Cloudify was founded in 2019 with a simple belief: deploying websites should
                  be as easy as pushing code to Git. We saw developers spending hours configuring
                  servers, managing infrastructure, and debugging deployment pipelines when they
                  should be building products.
                </p>
                <p>
                  Today, Cloudify powers millions of websites for developers and teams around
                  the world. From solo developers shipping side projects to Fortune 500 companies
                  running mission-critical applications, our platform handles it all.
                </p>
                <p>
                  We&apos;re backed by world-class investors and are growing fast. But we&apos;re just
                  getting started. The web is evolving, and we&apos;re committed to building the
                  tools that will shape its future.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-background">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-foreground">
                Our Values
              </h2>
              <p className="mt-4 text-xl text-muted-foreground">
                The principles that guide everything we do
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 rounded-lg bg-card border border-border"
                >
                  <value.icon className="h-10 w-10 text-[#0070f3] mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section className="py-20">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-foreground">
                Leadership
              </h2>
              <p className="mt-4 text-xl text-muted-foreground">
                Meet the team building Cloudify
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {leadership.map((person, index) => (
                <motion.div
                  key={person.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div
                    className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${person.color} flex items-center justify-center text-white text-2xl font-bold mb-4`}
                  >
                    {person.image}
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {person.name}
                  </h3>
                  <p className="text-muted-foreground">{person.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Offices */}
        <section className="py-20 bg-background">
          <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-bold text-foreground">
                Our Offices
              </h2>
              <p className="mt-4 text-xl text-muted-foreground">
                We&apos;re a global team with offices around the world
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-6">
              {offices.map((office) => (
                <div
                  key={office.city}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border"
                >
                  <MapPin className="h-4 w-4 text-[#0070f3]" />
                  <span className="text-foreground font-medium">
                    {office.city}
                  </span>
                  {office.type === "HQ" && (
                    <span className="text-xs bg-secondary text-foreground px-2 py-0.5 rounded-full">
                      HQ
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Join our team
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              We&apos;re always looking for talented people to help us build the future of the web.
            </p>
            <Button variant="default" size="lg" asChild>
              <Link href="/careers">
                View Open Positions
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
