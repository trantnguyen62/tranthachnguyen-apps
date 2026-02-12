import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Cloudify - Our Mission & Team",
  description:
    "Learn about Cloudify, the self-hosted cloud platform for developers. Our mission is to make deploying web apps as easy as pushing code to Git.",
  openGraph: {
    title: "About Cloudify - Our Mission & Team",
    description:
      "Learn about Cloudify, the self-hosted cloud platform for developers. Our mission is to make deploying web apps as easy as pushing code to Git.",
    url: "https://cloudify.tranthachnguyen.com/about",
  },
  alternates: {
    canonical: "https://cloudify.tranthachnguyen.com/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
