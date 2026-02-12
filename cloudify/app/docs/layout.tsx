import type { Metadata } from "next";
import { DocsSidebarLayout } from "@/components/docs/docs-sidebar-layout";

export const metadata: Metadata = {
  title: "Documentation - Guides, API Reference & Tutorials",
  description:
    "Cloudify documentation: learn how to deploy apps, configure builds, manage domains, use the CLI, and integrate with the REST API.",
  openGraph: {
    title: "Cloudify Documentation",
    description:
      "Complete guides, API reference, and tutorials for deploying and managing web applications with Cloudify.",
    url: "https://cloudify.tranthachnguyen.com/docs",
  },
  alternates: {
    canonical: "https://cloudify.tranthachnguyen.com/docs",
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsSidebarLayout>{children}</DocsSidebarLayout>;
}
