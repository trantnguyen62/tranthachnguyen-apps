"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Command, ChevronRight } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { GlobalSearch } from "@/components/search/global-search";
import { cn } from "@/lib/utils";

const routeNames: Record<string, string> = {
  "/dashboard": "Overview",
  "/projects": "Projects",
  "/deployments": "Deployments",
  "/functions": "Functions",
  "/storage": "Storage",
  "/edge-config": "Edge Config",
  "/domains": "Domains",
  "/analytics": "Analytics",
  "/logs": "Logs",
  "/feature-flags": "Feature Flags",
  "/activity": "Activity",
  "/team": "Team",
  "/integrations": "Integrations",
  "/usage": "Usage",
  "/settings": "Settings",
  "/new": "New Project",
  "/templates": "Templates",
  "/welcome": "Welcome",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 0);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const name =
      routeNames[path] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    return { name, path };
  });

  // For simple pages (1 segment), show just the page title as headline
  // For nested pages (2+ segments), show simplified breadcrumb
  const isSimplePage = breadcrumbs.length <= 1;

  return (
    <>
      <GlobalSearch />
      <header
        className={cn(
          "sticky top-0 z-30 flex h-12 items-center justify-between border-b border-[var(--separator,theme(colors.border))] px-6 transition-all duration-200",
          scrolled
            ? "bg-[var(--material-thin,theme(colors.background/80))] backdrop-blur-[20px] saturate-[180%]"
            : "bg-[var(--surface-primary,theme(colors.background))]"
        )}
      >
        {/* Breadcrumb / Page Title */}
        <nav className="flex items-center gap-1.5">
          {isSimplePage ? (
            <h1 className="text-[length:var(--text-headline,17px)] font-semibold text-[var(--text-primary,theme(colors.foreground))]">
              {breadcrumbs[0]?.name || "Dashboard"}
            </h1>
          ) : (
            breadcrumbs.map((crumb, i) => (
              <div key={crumb.path} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--text-quaternary,theme(colors.muted.foreground/40))]" />
                )}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-[length:var(--text-body,15px)] font-medium text-[var(--text-primary,theme(colors.foreground))]">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.path}
                    className="text-[length:var(--text-body,15px)] text-[var(--text-secondary,theme(colors.muted.foreground))] transition-colors hover:text-[var(--text-primary,theme(colors.foreground))]"
                  >
                    {crumb.name}
                  </Link>
                )}
              </div>
            ))
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2.5">
          {/* Search trigger */}
          <button
            className="flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] rounded-md hover:bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] transition-colors"
            onClick={() => {
              document.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  bubbles: true,
                })
              );
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-[var(--text-quaternary,theme(colors.muted.foreground/40))]">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
          <NotificationCenter />
        </div>
      </header>
    </>
  );
}
