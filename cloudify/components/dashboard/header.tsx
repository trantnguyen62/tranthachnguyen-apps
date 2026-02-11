"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Command, ChevronRight } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { GlobalSearch } from "@/components/search/global-search";
import { useNavigationShortcuts } from "@/hooks/use-keyboard-shortcuts";

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
  "/tokens": "API Tokens",
  "/usage": "Usage",
  "/settings": "Settings",
  "/new": "New Project",
};

export function DashboardHeader() {
  useNavigationShortcuts();
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((segment, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const name = routeNames[path] || segment.charAt(0).toUpperCase() + segment.slice(1);
    return { name, path };
  });

  return (
    <>
      <GlobalSearch />
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.path} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-medium text-foreground">
                  {crumb.name}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.name}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Search trigger */}
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border border-border rounded-md hover:bg-secondary transition-colors"
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
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-secondary rounded border border-border">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>
          <NotificationCenter />
        </div>
      </header>
    </>
  );
}
