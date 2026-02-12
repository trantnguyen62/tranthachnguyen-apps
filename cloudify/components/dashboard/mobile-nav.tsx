"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Folder,
  GitBranch,
  Globe,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: Folder },
  { name: "Deploys", href: "/deployments", icon: GitBranch },
  { name: "Domains", href: "/domains", icon: Globe },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
    >
      <div
        className="flex items-end justify-around border-t border-[var(--separator,theme(colors.border))] bg-[var(--material-regular,theme(colors.background/90))] backdrop-blur-[20px] saturate-[180%]"
        style={{ height: 83, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/dashboard" &&
              pathname.startsWith(tab.href + "/"));
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors",
                isActive
                  ? "text-[var(--accent,#0071E3)]"
                  : "text-[var(--text-tertiary,theme(colors.muted.foreground/70))]"
              )}
            >
              <tab.icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium leading-none">
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
