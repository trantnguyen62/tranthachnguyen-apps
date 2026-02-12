"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: 1,
    title: "Connect",
    description: "Link your GitHub repository in one click.",
  },
  {
    number: 2,
    title: "Push Code",
    description: "Every commit triggers a build on our infrastructure.",
  },
  {
    number: 3,
    title: "Go Live",
    description: "Your site is live on a global edge network.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-32 bg-[var(--surface-primary,theme(colors.background))]">
      <div ref={ref} className="mx-auto max-w-[980px] px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className={`text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))] transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            How It Works
          </h2>
        </div>

        {/* 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`text-center transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: visible ? `${index * 100}ms` : "0ms" }}
            >
              {/* Step number */}
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))]">
                <span className="text-[20px] font-bold text-[var(--text-primary,theme(colors.foreground))]">
                  {step.number}
                </span>
              </div>

              {/* Title */}
              <h3 className="mt-5 text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))]">
                {step.title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary,theme(colors.muted.foreground))]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
