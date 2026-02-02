"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    quote:
      "Cloudify has transformed how we deploy. We went from hours of deployment time to seconds. The developer experience is unmatched.",
    author: "Sarah Chen",
    role: "CTO at TechFlow",
    avatar: "/avatars/sarah.jpg",
    initials: "SC",
    metric: "90% faster deployments",
  },
  {
    quote:
      "The edge network performance is incredible. Our global users now experience sub-50ms latency. It's like magic.",
    author: "Marcus Rodriguez",
    role: "Lead Engineer at GlobalApp",
    avatar: "/avatars/marcus.jpg",
    initials: "MR",
    metric: "50ms global latency",
  },
  {
    quote:
      "We migrated our entire infrastructure to Cloudify in a week. The serverless functions and edge caching have been game-changers.",
    author: "Emily Watson",
    role: "VP Engineering at DataScale",
    avatar: "/avatars/emily.jpg",
    initials: "EW",
    metric: "10x cost reduction",
  },
  {
    quote:
      "The AI capabilities built into the platform are incredible. We deployed our first AI-powered feature in hours, not weeks.",
    author: "James Kim",
    role: "Founder at AIStartup",
    avatar: "/avatars/james.jpg",
    initials: "JK",
    metric: "5x faster AI deployment",
  },
  {
    quote:
      "Preview deployments for every PR changed our workflow. We catch issues before they hit production. It's essential.",
    author: "Lisa Patel",
    role: "Engineering Lead at ShipFast",
    avatar: "/avatars/lisa.jpg",
    initials: "LP",
    metric: "Zero production incidents",
  },
  {
    quote:
      "Cloudify's analytics give us real-time insights into performance. We've optimized our entire frontend based on actual data.",
    author: "David Thompson",
    role: "Performance Engineer at SpeedyCo",
    avatar: "/avatars/david.jpg",
    initials: "DT",
    metric: "40% better Core Web Vitals",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400"
          >
            TRUSTED BY DEVELOPERS
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
          >
            Loved by teams worldwide
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
          >
            Join thousands of developers and teams who trust Cloudify for their
            production deployments.
          </motion.p>
        </div>

        {/* Testimonials grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900"
            >
              {/* Metric badge */}
              <div className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                {testimonial.metric}
              </div>

              {/* Quote */}
              <blockquote className="mt-4 text-gray-700 dark:text-gray-300">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="mt-6 flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
                  <AvatarFallback>{testimonial.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
