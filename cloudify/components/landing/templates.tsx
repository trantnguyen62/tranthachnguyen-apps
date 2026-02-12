"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const templates = [
  {
    name: "Next.js",
    description: "The React framework for the web",
    icon: "\u25B2",
  },
  {
    name: "React",
    description: "Build user interfaces with components",
    icon: "\u269B\uFE0F",
  },
  {
    name: "Vue",
    description: "Progressive JavaScript framework",
    icon: "\uD83D\uDFE2",
  },
  {
    name: "Svelte",
    description: "Cybernetically enhanced web apps",
    icon: "\uD83D\uDD25",
  },
  {
    name: "Astro",
    description: "The web framework for content-driven websites",
    icon: "\uD83D\uDE80",
  },
  {
    name: "Nuxt",
    description: "The intuitive Vue framework",
    icon: "\uD83D\uDC9A",
  },
];

export function Templates() {
  return (
    <section className="py-32 bg-[var(--surface-primary,theme(colors.background))]">
      <div className="mx-auto max-w-[980px] px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
            Deploy your favorite framework
          </h2>
          <p className="mt-3 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
            Choose a template or import your existing project.
          </p>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.name}
              className="flex flex-col items-center justify-center h-[240px] rounded-xl border border-[var(--border-secondary,theme(colors.border))] bg-[var(--surface-primary,theme(colors.background))] p-6 transition-shadow hover:shadow-lg"
            >
              {/* Icon */}
              <span className="text-[48px]">{template.icon}</span>

              {/* Name */}
              <h3 className="mt-4 text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))]">
                {template.name}
              </h3>

              {/* Description */}
              <p className="mt-1 text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] text-center">
                {template.description}
              </p>

              {/* Deploy button */}
              <Button size="sm" className="mt-5" asChild>
                <Link href={`/new?template=${template.name.toLowerCase()}`}>
                  Deploy
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
