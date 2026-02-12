"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  Menu,
  X,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const products = [
  { name: "Hosting", description: "Deploy any framework", href: "/products/deployments" },
  { name: "Storage", description: "Blob and KV storage", href: "/products/storage" },
  { name: "Functions", description: "Serverless compute", href: "/products/functions" },
  { name: "Analytics", description: "Traffic and performance", href: "/products/analytics" },
  { name: "Domains", description: "Custom domain management", href: "/domains" },
  { name: "Edge Config", description: "Runtime configuration", href: "/edge-config" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        isScrolled
          ? "bg-[var(--surface-primary,theme(colors.background))]/80 backdrop-blur-xl border-b border-[var(--separator,theme(colors.border))]"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-[980px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
              <Cloud className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="text-[15px] font-semibold text-[var(--text-primary,theme(colors.foreground))]">
              Cloudify
            </span>
          </Link>

          {/* Desktop Navigation - 5 items per spec */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-2 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors">
                  Products
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[400px] p-4" align="center">
                <div className="grid grid-cols-2 gap-1">
                  {products.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="flex flex-col gap-0.5 p-3 rounded-md">
                        <span className="text-[15px] font-medium text-[var(--text-primary,theme(colors.foreground))]">
                          {item.name}
                        </span>
                        <span className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
                          {item.description}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/solutions"
              className="px-3 py-2 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
            >
              Solutions
            </Link>
            <Link
              href="/solutions/enterprise"
              className="px-3 py-2 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
            >
              Enterprise
            </Link>
            <Link
              href="/pricing"
              className="px-3 py-2 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="px-3 py-2 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
            >
              Docs
            </Link>
          </div>

          {/* Right side - Sign In (ghost) + Get Started (pill) */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <Link
                href="/login"
                className="px-3 py-2 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
              >
                Sign In
              </Link>
              <Button
                className="rounded-full px-5 h-9 text-[15px] font-medium"
                asChild
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>

            <button
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary,theme(colors.muted.foreground))] hover:bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--separator,theme(colors.border))] py-4 bg-[var(--surface-primary,theme(colors.background))]">
            <div className="space-y-1">
              <Link
                href="/products"
                className="block px-4 py-2.5 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
              >
                Products
              </Link>
              <Link
                href="/solutions"
                className="block px-4 py-2.5 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
              >
                Solutions
              </Link>
              <Link
                href="/solutions/enterprise"
                className="block px-4 py-2.5 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
              >
                Enterprise
              </Link>
              <Link
                href="/pricing"
                className="block px-4 py-2.5 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/docs"
                className="block px-4 py-2.5 text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors"
              >
                Docs
              </Link>
              <div className="my-3 h-px bg-[var(--separator,theme(colors.border))]" />
              <div className="flex gap-2 px-4 pt-2">
                <Button variant="secondary" className="flex-1 h-11 text-[15px]" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button className="flex-1 h-11 text-[15px] rounded-full" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
