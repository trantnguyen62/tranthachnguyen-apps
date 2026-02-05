"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { navigation } from "@/lib/navigation";

interface NavLink {
  title: string;
  href: string;
  section: string;
}

function getAllPages(): NavLink[] {
  const pages: NavLink[] = [];

  navigation.forEach((section) => {
    section.items.forEach((item) => {
      pages.push({
        title: item.title,
        href: item.href,
        section: section.title,
      });
    });
  });

  return pages;
}

function getAdjacentPages(pathname: string): { prev: NavLink | null; next: NavLink | null } {
  const pages = getAllPages();
  const currentIndex = pages.findIndex((page) => page.href === pathname);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? pages[currentIndex - 1] : null,
    next: currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null,
  };
}

export function PageNav() {
  const pathname = usePathname();
  const { prev, next } = getAdjacentPages(pathname);

  if (!prev && !next) {
    return null;
  }

  return (
    <nav className="mt-16 pt-8 border-t border-border-light">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Previous */}
        {prev ? (
          <Link
            href={prev.href}
            className="
              flex-1 group
              flex items-center gap-4
              p-4 rounded-xl
              border border-border-light
              transition-all duration-fast
              hover:border-accent hover:shadow-sm
            "
          >
            <div className="
              flex h-10 w-10 items-center justify-center
              rounded-lg bg-background-secondary
              transition-colors duration-fast
              group-hover:bg-accent-light
            ">
              <ChevronLeft className="h-5 w-5 text-foreground-secondary group-hover:text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption text-foreground-secondary mb-0.5">
                Previous
              </p>
              <p className="text-body font-medium text-foreground truncate">
                {prev.title}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {/* Next */}
        {next ? (
          <Link
            href={next.href}
            className="
              flex-1 group
              flex items-center gap-4
              p-4 rounded-xl
              border border-border-light
              transition-all duration-fast
              hover:border-accent hover:shadow-sm
              sm:flex-row-reverse sm:text-right
            "
          >
            <div className="
              flex h-10 w-10 items-center justify-center
              rounded-lg bg-background-secondary
              transition-colors duration-fast
              group-hover:bg-accent-light
            ">
              <ChevronRight className="h-5 w-5 text-foreground-secondary group-hover:text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption text-foreground-secondary mb-0.5">
                Next
              </p>
              <p className="text-body font-medium text-foreground truncate">
                {next.title}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </nav>
  );
}
