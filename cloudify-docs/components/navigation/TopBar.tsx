"use client";

import { useState, useEffect } from "react";
import { Search, Github } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface TopBarProps {
  onSearchClick?: () => void;
}

export function TopBar({ onSearchClick }: TopBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show after scrolling down 100px
      if (currentScrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="
            fixed top-0 right-0 left-0
            lg:left-sidebar
            z-30 h-topbar
            glass border-b border-border-light
          "
        >
          <div className="flex items-center justify-between h-full px-6 lg:px-8">
            {/* Left: Breadcrumbs */}
            <div className="hidden sm:block">
              <Breadcrumbs />
            </div>

            {/* Mobile: Spacer */}
            <div className="sm:hidden" />

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {/* Search Button */}
              <button
                onClick={onSearchClick}
                className="
                  flex items-center gap-2
                  h-9 px-3
                  rounded-lg
                  text-body-sm text-foreground-secondary
                  transition-colors duration-fast
                  hover:bg-background-secondary hover:text-foreground
                "
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="
                  hidden sm:inline-flex
                  items-center gap-0.5
                  px-1.5 py-0.5
                  rounded-md
                  text-caption
                  bg-background-secondary
                  border border-border-light
                ">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* GitHub Link */}
              <a
                href="https://github.com/cloudify"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex h-9 w-9 items-center justify-center
                  rounded-lg
                  text-foreground-secondary
                  transition-colors duration-fast
                  hover:bg-background-secondary hover:text-foreground
                "
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
