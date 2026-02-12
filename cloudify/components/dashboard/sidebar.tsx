"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import {
  Cloud,
  Search,
  LogOut,
  User,
  Moon,
  Sun,
  Command,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SidebarCounts {
  projects: number;
  deployments: number;
  domains: number;
  members: number;
}

// Text-only navigation per Apple spec: "The labels are unambiguous."
const navGroups = [
  {
    items: [
      { name: "Dashboard", href: "/dashboard", countKey: null },
      { name: "Projects", href: "/projects", countKey: "projects" as const },
      { name: "Deployments", href: "/deployments", countKey: null },
      { name: "Domains", href: "/domains", countKey: "domains" as const },
      { name: "Analytics", href: "/analytics", countKey: null },
      { name: "Storage", href: "/storage", countKey: null },
      { name: "Logs", href: "/logs", countKey: null },
    ],
  },
  {
    items: [
      { name: "Functions", href: "/functions", countKey: null },
      { name: "Feature Flags", href: "/feature-flags", countKey: null },
      { name: "Edge Config", href: "/edge-config", countKey: null },
      { name: "Integrations", href: "/integrations", countKey: null },
    ],
  },
  {
    items: [
      { name: "Team", href: "/team", countKey: "members" as const },
      { name: "Settings", href: "/settings", countKey: null },
    ],
  },
];

// First letter abbreviations for collapsed mode
function getNavAbbr(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [counts, setCounts] = useState<SidebarCounts>({
    projects: 0,
    deployments: 0,
    domains: 0,
    members: 0,
  });
  const [collapsed, setCollapsed] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);

  const isExpanded = !collapsed || hoverExpanded;

  const userName = session?.user?.name || "User";
  const userImage = session?.user?.image;
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    async function fetchSidebarData() {
      try {
        const res = await fetch("/api/projects?limit=5");
        if (res.ok) {
          const data = await res.json();
          const projects = Array.isArray(data) ? data : data.projects || [];
          setCounts((prev) => ({
            ...prev,
            projects: Array.isArray(data)
              ? data.length
              : data.total || projects.length,
          }));
        }
      } catch {
        // Silently fail
      }
    }
    fetchSidebarData();
  }, []);

  // Auto-collapse at tablet width
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1280) {
        setCollapsed(false);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (collapsed) setHoverExpanded(true);
  }, [collapsed]);

  const handleMouseLeave = useCallback(() => {
    if (collapsed) setHoverExpanded(false);
  }, [collapsed]);

  return (
    <div
      className={cn(
        "flex h-screen flex-col bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT/50))] transition-[width] duration-200 ease-in-out",
        isExpanded ? "w-[240px]" : "w-[60px]"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo - 32px height, 16px from top */}
      <div className="flex h-12 items-center px-4 pt-1">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground">
            <Cloud className="h-3.5 w-3.5 text-background" />
          </div>
          {isExpanded && (
            <span className="text-[length:var(--text-body,15px)] font-semibold text-[var(--text-primary,theme(colors.foreground))]">
              Cloudify
            </span>
          )}
        </Link>
      </div>

      {/* Search trigger */}
      {isExpanded && (
        <div className="px-3 py-2">
          <button
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] transition-colors hover:bg-[var(--surface-tertiary,theme(colors.secondary.DEFAULT))]"
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
            <span className="flex-1 text-left">Search...</span>
            <kbd className="inline-flex items-center gap-0.5 text-[10px] text-[var(--text-quaternary,theme(colors.muted.foreground/40))]">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
        </div>
      )}

      {!isExpanded && (
        <div className="flex justify-center px-2 py-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-tertiary,theme(colors.muted.foreground/70))] transition-colors hover:bg-[var(--surface-tertiary,theme(colors.secondary.DEFAULT))]"
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
          </button>
        </div>
      )}

      {/* Separator */}
      <div className="mx-3 border-t border-[var(--separator,theme(colors.border))]" />

      {/* Navigation */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto px-3 py-2"
      >
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && (
              <div className="my-3 border-t border-[var(--separator,theme(colors.border))]" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href + "/"));
                const count = item.countKey ? counts[item.countKey] : null;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={!isExpanded ? item.name : undefined}
                    className={cn(
                      "flex h-8 items-center justify-between rounded-md px-3 text-[length:var(--text-body,15px)] transition-all duration-150",
                      isActive
                        ? "bg-[var(--accent-subtle,theme(colors.primary.DEFAULT/8))] text-[var(--accent,#0071E3)] font-medium"
                        : "text-[var(--text-secondary,theme(colors.muted.foreground))] hover:bg-[var(--surface-tertiary,theme(colors.secondary.DEFAULT))]",
                      !isExpanded && "justify-center px-0"
                    )}
                  >
                    {isExpanded ? (
                      <>
                        <span>{item.name}</span>
                        {count !== null && count > 0 && (
                          <span className="text-[11px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] tabular-nums">
                            {count}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[13px] font-medium">
                        {getNavAbbr(item.name)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (only visible at xl+) */}
      <div className="hidden xl:flex justify-end px-3 py-1">
        <button
          onClick={() => {
            setCollapsed(!collapsed);
            setHoverExpanded(false);
          }}
          className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-quaternary,theme(colors.muted.foreground/40))] hover:text-[var(--text-secondary,theme(colors.muted.foreground))] transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* User menu */}
      <div className="border-t border-[var(--separator,theme(colors.border))] px-3 py-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-[var(--surface-tertiary,theme(colors.secondary.DEFAULT))] transition-colors",
                !isExpanded && "justify-center px-0"
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                {userImage && <AvatarImage src={userImage} />}
                <AvatarFallback className="text-[10px] bg-[var(--surface-tertiary,theme(colors.secondary.DEFAULT))] text-[var(--text-primary,theme(colors.foreground))]">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {isExpanded && (
                <span className="text-[13px] text-[var(--text-primary,theme(colors.foreground))] truncate">
                  {userName}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" side="top">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="h-4 w-4 mr-2" />
                Account settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 mr-2" />
              ) : (
                <Moon className="h-4 w-4 mr-2" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[var(--error,#FF3B30)]"
              onSelect={async (e) => {
                e.preventDefault();
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                } catch {
                  // Continue with redirect even if the API call fails
                }
                window.location.href = "/login";
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
