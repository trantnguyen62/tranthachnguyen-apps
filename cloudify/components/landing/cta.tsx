"use client";

import Link from "next/link";

export function CTA() {
  return (
    <section className="py-32 bg-[var(--surface-primary,theme(colors.background))]">
      <div className="mx-auto max-w-[980px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))]">
            Start building today.
            <br />
            It is free.
          </h2>

          <div className="mt-8">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-[var(--accent,#0071E3)] text-white text-[15px] font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
            >
              Get Started Free
            </Link>
          </div>

          <p className="mt-5 text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))]">
            No credit card required. Deploy in 60 seconds.
          </p>
        </div>
      </div>
    </section>
  );
}
