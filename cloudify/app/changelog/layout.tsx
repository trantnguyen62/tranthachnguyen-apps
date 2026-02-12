import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog - What's New in Cloudify",
  description:
    "Stay up to date with the latest Cloudify releases. New features, improvements, bug fixes, and security updates.",
  openGraph: {
    title: "Cloudify Changelog - What's New",
    description:
      "Stay up to date with the latest Cloudify releases. New features, improvements, and bug fixes.",
    url: "https://cloudify.tranthachnguyen.com/changelog",
  },
  alternates: {
    canonical: "https://cloudify.tranthachnguyen.com/changelog",
  },
};

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
