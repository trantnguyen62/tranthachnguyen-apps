import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Templates } from "@/components/landing/templates";
import { Testimonials } from "@/components/landing/testimonials";
import { CTA } from "@/components/landing/cta";
import { StructuredData } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "Cloudify - Deploy, Scale & Manage Modern Web Apps",
  description:
    "Self-hosted Vercel alternative. Deploy with Git, run serverless functions, and scale on your own infrastructure. Free and open source.",
  openGraph: {
    title: "Cloudify - Deploy, Scale & Manage Modern Web Apps",
    description:
      "Self-hosted Vercel alternative. Deploy with Git, run serverless functions, and scale on your own infrastructure.",
    url: "https://cloudify.tranthachnguyen.com",
    images: [
      {
        url: "/api/og?title=Cloudify&description=Deploy%2C+Scale+%26+Manage+Modern+Web+Apps",
        width: 1200,
        height: 630,
      },
    ],
  },
  alternates: {
    canonical: "https://cloudify.tranthachnguyen.com",
  },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData type="software" />
      <StructuredData type="organization" />
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Templates />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
