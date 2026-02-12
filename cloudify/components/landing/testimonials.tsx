"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote:
      "Cloudify reduced our deployment time from 15 minutes to 45 seconds. It is the fastest CI/CD pipeline we have ever used.",
    author: "Sarah Chen",
    role: "CTO, Acme Corp",
  },
  {
    quote:
      "We migrated our entire infrastructure in a week. The serverless functions and edge caching have been game-changers for our global users.",
    author: "Marcus Rodriguez",
    role: "Lead Engineer, GlobalApp",
  },
  {
    quote:
      "Preview deployments for every PR changed our workflow entirely. We catch issues before they hit production. It is essential.",
    author: "Lisa Patel",
    role: "Engineering Lead, ShipFast",
  },
  {
    quote:
      "The zero-config approach means our team spends time building features, not fighting infrastructure. Exactly what we needed.",
    author: "James Kim",
    role: "Founder, DevTools Inc",
  },
];

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  }, []);

  // Auto-advance every 8 seconds
  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next]);

  const testimonial = testimonials[activeIndex];

  return (
    <section className="py-32 bg-[var(--surface-primary,theme(colors.background))]">
      <div className="mx-auto max-w-[980px] px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
            Loved by developers
          </h2>
        </div>

        {/* Single testimonial - centered */}
        <div className="mx-auto max-w-[640px] text-center">
          <blockquote className="text-[20px] leading-relaxed text-[var(--text-primary,theme(colors.foreground))] italic">
            &ldquo;{testimonial.quote}&rdquo;
          </blockquote>

          <div className="mt-8">
            <p className="text-[15px] font-semibold text-[var(--text-primary,theme(colors.foreground))]">
              {testimonial.author}
            </p>
            <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
              {testimonial.role}
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-primary,theme(colors.border))] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] hover:text-[var(--text-primary,theme(colors.foreground))] hover:border-[var(--text-tertiary,theme(colors.muted.foreground/70))] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] tabular-nums">
              {activeIndex + 1} of {testimonials.length}
            </span>
            <button
              onClick={next}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-primary,theme(colors.border))] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] hover:text-[var(--text-primary,theme(colors.foreground))] hover:border-[var(--text-tertiary,theme(colors.muted.foreground/70))] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
