import type { Metadata } from "next";
import { StructuredData } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "Pricing - Simple, Transparent Plans",
  description:
    "Cloudify pricing starts free for hobby projects. Scale with Pro and Enterprise plans. Unlimited deployments, preview environments, and serverless functions included.",
  openGraph: {
    title: "Cloudify Pricing - Simple, Transparent Plans",
    description:
      "Start free, scale as you grow. Cloudify pricing includes unlimited deployments, preview environments, and serverless functions.",
    url: "https://cloudify.tranthachnguyen.com/pricing",
  },
  alternates: {
    canonical: "https://cloudify.tranthachnguyen.com/pricing",
  },
};

const faqItems = [
  {
    question: "What happens when I exceed my limits?",
    answer:
      "We'll notify you when you're approaching your limits. If you exceed them, we'll work with you to upgrade your plan or optimize your usage. We never shut down your deployments without warning.",
  },
  {
    question: "Can I change plans at any time?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged a prorated amount. When downgrading, the change will take effect at the end of your billing cycle.",
  },
  {
    question: "Do you offer discounts for startups or non-profits?",
    answer:
      "Yes! We offer special pricing for startups, non-profits, and educational institutions. Contact our sales team to learn more about our discount programs.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express) as well as PayPal. Enterprise customers can also pay by invoice.",
  },
  {
    question: "Is there a free trial for Pro plans?",
    answer:
      "Yes! All Pro plans come with a 14-day free trial. No credit card required to start.",
  },
];

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData type="faq" faqItems={faqItems} />
      {children}
    </>
  );
}
