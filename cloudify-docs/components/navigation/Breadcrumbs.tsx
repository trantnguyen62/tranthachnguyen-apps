"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { navigation } from "@/lib/navigation";

interface BreadcrumbItem {
  label: string;
  href: string;
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Find the section and item that matches the current path
  for (const section of navigation) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        // Add section
        breadcrumbs.push({
          label: section.title,
          href: section.items[0].href,
        });

        // Add item if it's not the section overview
        if (item.href !== section.items[0].href) {
          breadcrumbs.push({
            label: item.title,
            href: item.href,
          });
        }

        return breadcrumbs;
      }
    }
  }

  return breadcrumbs;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-body-sm">
      <Link
        href="/"
        className="
          flex items-center justify-center
          h-6 w-6 rounded-md
          text-foreground-secondary
          transition-colors duration-fast
          hover:bg-background-secondary hover:text-foreground
        "
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-foreground-secondary" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="
                text-foreground-secondary
                transition-colors duration-fast
                hover:text-foreground
              "
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
