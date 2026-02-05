"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Menu, X, Cloud, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { navigation, NavSection } from "@/lib/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function NavSectionComponent({ section }: { section: NavSection }) {
  const pathname = usePathname();
  const isActive = section.items.some((item) => pathname === item.href);
  const [isExpanded, setIsExpanded] = useState(isActive);

  const Icon = section.icon;

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full flex items-center justify-between px-3 py-2.5
          text-body-sm font-medium rounded-lg
          transition-all duration-fast
          ${isActive
            ? "bg-accent-light text-accent"
            : "text-foreground hover:bg-background-secondary"
          }
        `}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4" />
          <span>{section.title}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-foreground-secondary" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-1 space-y-0.5 border-l border-border-light pl-3">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    block px-3 py-2 text-body-sm rounded-lg
                    transition-all duration-fast
                    ${pathname === item.href
                      ? "bg-background-secondary text-foreground font-medium"
                      : "text-foreground-secondary hover:bg-background-secondary hover:text-foreground"
                    }
                  `}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="
          fixed top-4 left-4 z-50
          flex h-10 w-10 items-center justify-center
          rounded-xl bg-background shadow-md
          transition-all duration-fast
          hover:shadow-lg
          lg:hidden
        "
        aria-label="Toggle menu"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isMobileMenuOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5 text-foreground" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="w-5 h-5 text-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-sidebar
          glass border-r border-border-light
          transform transition-transform duration-base
          lg:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="
                flex h-9 w-9 items-center justify-center
                rounded-xl bg-accent
                transition-all duration-fast
                group-hover:shadow-md group-hover:shadow-accent/25
              ">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-body font-semibold text-foreground">Cloudify</h1>
                <p className="text-caption text-foreground-secondary">Documentation</p>
              </div>
            </Link>
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 no-scrollbar">
            <div className="space-y-6">
              {navigation.map((section, idx) => (
                <div key={section.title}>
                  {idx > 0 && (
                    <div className="mb-4 px-3">
                      <div className="h-px bg-border-light" />
                    </div>
                  )}
                  <NavSectionComponent section={section} />
                </div>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border-light">
            <a
              href="https://cloudify.tranthachnguyen.com"
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center justify-center gap-2
                w-full px-4 py-2.5
                text-body-sm font-medium text-white
                bg-accent rounded-xl
                transition-all duration-fast
                hover:bg-accent-hover hover:shadow-md hover:shadow-accent/25
                active:scale-[0.98]
              "
            >
              Go to Dashboard
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
