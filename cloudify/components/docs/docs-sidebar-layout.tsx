"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Rocket,
  GitBranch,
  Code2,
  Cpu,
  Globe,
  Settings,
  Terminal,
  Menu,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sidebarSections = [
  {
    title: "Getting Started",
    icon: Rocket,
    items: [
      { title: "Introduction", href: "/docs/introduction" },
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "Importing a Project", href: "/docs/importing" },
      { title: "CLI Installation", href: "/docs/cli" },
    ],
  },
  {
    title: "Deployments",
    icon: GitBranch,
    items: [
      { title: "Git Integration", href: "/docs/git" },
      { title: "Build Configuration", href: "/docs/build-config" },
      { title: "Preview Deployments", href: "/docs/previews" },
      { title: "Production Deployments", href: "/docs/production" },
    ],
  },
  {
    title: "Frameworks",
    icon: Code2,
    items: [
      { title: "Next.js", href: "/docs/frameworks/nextjs" },
      { title: "React", href: "/docs/frameworks/react" },
      { title: "Vue", href: "/docs/frameworks/vue" },
      { title: "Astro", href: "/docs/frameworks/astro" },
    ],
  },
  {
    title: "Serverless Functions",
    icon: Cpu,
    items: [
      { title: "Overview", href: "/docs/functions" },
      { title: "API Routes", href: "/docs/api-routes" },
      { title: "Edge Functions", href: "/docs/edge-functions" },
      { title: "Runtimes", href: "/docs/runtimes" },
    ],
  },
  {
    title: "Domains & SSL",
    icon: Globe,
    items: [
      { title: "Custom Domains", href: "/docs/domains" },
      { title: "DNS Configuration", href: "/docs/dns" },
      { title: "SSL Certificates", href: "/docs/ssl" },
      { title: "Redirects", href: "/docs/redirects" },
    ],
  },
  {
    title: "Configuration",
    icon: Settings,
    items: [
      { title: "Environment Variables", href: "/docs/environment-variables" },
      { title: "cloudify.json", href: "/docs/configuration" },
      { title: "Headers", href: "/docs/headers" },
      { title: "Rewrites", href: "/docs/rewrites" },
    ],
  },
  {
    title: "CLI & API",
    icon: Terminal,
    items: [
      { title: "CLI Reference", href: "/docs/cli" },
      { title: "REST API", href: "/docs/api-reference" },
      { title: "Security", href: "/docs/security" },
    ],
  },
];

export function DocsSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    sidebarSections.map((s) => s.title)
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  // Don't use layout for main docs page
  if (pathname === "/docs") {
    return children;
  }

  const Sidebar = () => (
    <nav className="space-y-1">
      {sidebarSections.map((section) => {
        const isExpanded = expandedSections.includes(section.title);
        const hasActiveItem = section.items.some(
          (item) => pathname === item.href
        );

        return (
          <div key={section.title}>
            <button
              onClick={() => toggleSection(section.title)}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                hasActiveItem
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-primary)] hover:bg-secondary"
              )}
            >
              <div className="flex items-center gap-2">
                <section.icon className="h-4 w-4" />
                {section.title}
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {isExpanded && (
              <div className="mt-1 ml-6 space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "block px-3 py-1.5 text-sm rounded-lg transition-colors",
                      pathname === item.href
                        ? "bg-[var(--surface-secondary)] text-[var(--text-primary)] font-medium"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:hover:text-white hover:bg-secondary"
                    )}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 pt-16">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 py-8">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed bottom-4 right-4 z-50">
              <Button
                size="lg"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-full shadow-lg"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Mobile sidebar */}
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-40 bg-card pt-20 px-4 overflow-y-auto">
                <Sidebar />
              </div>
            )}

            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24">
                <Sidebar />
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
