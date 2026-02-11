"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Cloudify has transformed how we deploy. We went from hours of deployment time to seconds. The developer experience is unmatched.",
    author: "Sarah Chen",
    role: "CTO at TechFlow",
    initials: "SC",
    gradient: "from-blue-500 to-cyan-400",
    metric: "90% faster deployments",
    stars: 5,
  },
  {
    quote:
      "The edge network performance is incredible. Our global users now experience sub-50ms latency. It's like magic.",
    author: "Marcus Rodriguez",
    role: "Lead Engineer at GlobalApp",
    initials: "MR",
    gradient: "from-purple-500 to-pink-400",
    metric: "50ms global latency",
    stars: 5,
  },
  {
    quote:
      "We migrated our entire infrastructure to Cloudify in a week. The serverless functions and edge caching have been game-changers.",
    author: "Emily Watson",
    role: "VP Engineering at DataScale",
    initials: "EW",
    gradient: "from-orange-500 to-yellow-400",
    metric: "10x cost reduction",
    stars: 5,
  },
  {
    quote:
      "The AI capabilities built into the platform are incredible. We deployed our first AI-powered feature in hours, not weeks.",
    author: "James Kim",
    role: "Founder at AIStartup",
    initials: "JK",
    gradient: "from-green-500 to-emerald-400",
    metric: "5x faster AI deployment",
    stars: 5,
  },
  {
    quote:
      "Preview deployments for every PR changed our workflow. We catch issues before they hit production. It's essential.",
    author: "Lisa Patel",
    role: "Engineering Lead at ShipFast",
    initials: "LP",
    gradient: "from-rose-500 to-red-400",
    metric: "Zero production incidents",
    stars: 5,
  },
  {
    quote:
      "Cloudify's analytics give us real-time insights into performance. We've optimized our entire frontend based on actual data.",
    author: "David Thompson",
    role: "Performance Engineer at SpeedyCo",
    initials: "DT",
    gradient: "from-indigo-500 to-violet-400",
    metric: "40% better Core Web Vitals",
    stars: 5,
  },
];

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[0];
}) {
  return (
    <div className="relative rounded-lg border border-border bg-card p-8 transition-all duration-300 hover:border-foreground/20">
      {/* Metric badge */}
      <div className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
        {testimonial.metric}
      </div>

      {/* Stars */}
      <div className="mt-2 flex gap-0.5">
        {Array.from({ length: testimonial.stars }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 fill-yellow-400 text-yellow-400"
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="mt-4 text-muted-foreground leading-relaxed">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="mt-6 flex items-center gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground"
        >
          {testimonial.initials}
        </div>
        <div>
          <div className="font-semibold text-foreground">
            {testimonial.author}
          </div>
          <div className="text-sm text-muted-foreground">
            {testimonial.role}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const maxIndex = testimonials.length - 3;

  const next = () => setActiveIndex((i) => Math.min(i + 1, maxIndex));
  const prev = () => setActiveIndex((i) => Math.max(i - 1, 0));

  return (
    <section className="relative py-24 bg-card overflow-hidden">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="text-sm font-semibold text-muted-foreground"
            >
              TRUSTED BY DEVELOPERS
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
            >
              Loved by teams worldwide
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mt-4 max-w-2xl text-lg text-muted-foreground"
            >
              Join thousands of developers and teams who trust Cloudify for
              their production deployments.
            </motion.p>
          </div>

          {/* Navigation arrows */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={prev}
              disabled={activeIndex === 0}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:border-foreground/20 hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              disabled={activeIndex >= maxIndex}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:border-foreground/20 hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Desktop carousel */}
        <div className="mt-12 hidden lg:block overflow-hidden">
          <motion.div
            className="flex gap-8"
            animate={{ x: `-${activeIndex * (33.333 + 2.67)}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                className="w-[calc(33.333%-1.333rem)] flex-shrink-0"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <TestimonialCard testimonial={testimonial} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Mobile/tablet grid (no carousel) */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:hidden">
          {testimonials.slice(0, 4).map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </div>

        {/* Dots indicator (desktop) */}
        <div className="mt-8 hidden lg:flex justify-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? "w-8 bg-foreground"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
