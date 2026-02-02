"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Moon,
  Sun,
  Menu,
  X,
  Zap,
  Cloud,
  Globe,
  BarChart3,
  Shield,
  Code2,
  Boxes,
  Cpu,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const products = [
  {
    category: "AI",
    items: [
      { name: "v0", description: "AI-powered app builder", icon: Zap, href: "/products/v0" },
      { name: "AI SDK", description: "Build AI applications", icon: Code2, href: "/products/ai" },
      { name: "AI Gateway", description: "Multi-model access", icon: Boxes, href: "/products/ai-gateway" },
    ],
  },
  {
    category: "Infrastructure",
    items: [
      { name: "Deployments", description: "Git-based deployments", icon: GitBranch, href: "/products/deployments" },
      { name: "Edge Network", description: "Global CDN", icon: Globe, href: "/products/edge-network" },
      { name: "Serverless", description: "Auto-scaling compute", icon: Cpu, href: "/products/functions" },
    ],
  },
  {
    category: "Security",
    items: [
      { name: "Firewall", description: "Web application firewall", icon: Shield, href: "/products/analytics" },
      { name: "DDoS Protection", description: "Enterprise protection", icon: Cloud, href: "/solutions/enterprise" },
    ],
  },
];

const solutions = [
  { name: "AI Apps", href: "/solutions/ai-apps" },
  { name: "Web Apps", href: "/solutions/web-apps" },
  { name: "E-commerce", href: "/solutions/ecommerce" },
  { name: "Marketing", href: "/solutions/marketing" },
  { name: "Platforms", href: "/solutions/platforms" },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-gray-200/50 dark:bg-gray-950/80 dark:border-gray-800/50"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Cloudify
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {/* Products Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  Products
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[500px] p-4">
                <div className="grid grid-cols-3 gap-4">
                  {products.map((category) => (
                    <div key={category.category}>
                      <DropdownMenuLabel className="text-xs uppercase text-gray-500">
                        {category.category}
                      </DropdownMenuLabel>
                      {category.items.map((item) => (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link href={item.href} className="flex items-start gap-3 p-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                              <item.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Solutions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  Solutions
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {solutions.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href}>{item.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" asChild>
              <Link href="/resources">Resources</Link>
            </Button>

            <Button variant="ghost" asChild>
              <Link href="/solutions/enterprise">Enterprise</Link>
            </Button>

            <Button variant="ghost" asChild>
              <Link href="/pricing">Pricing</Link>
            </Button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
              <Button variant="primary" asChild>
                <Link href="/new">
                  <Zap className="h-4 w-4" />
                  Deploy
                </Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden border-t border-gray-200 dark:border-gray-800 py-4"
          >
            <div className="space-y-2">
              <Link
                href="/products"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Products
              </Link>
              <Link
                href="/solutions"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Solutions
              </Link>
              <Link
                href="/resources"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Resources
              </Link>
              <Link
                href="/pricing"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Pricing
              </Link>
              <DropdownMenuSeparator />
              <div className="flex gap-2 px-4 pt-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  );
}
