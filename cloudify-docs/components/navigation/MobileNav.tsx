"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Menu, Moon, Sun, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchModal } from "@/components/providers/SearchProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

interface MobileNavProps {
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

export function MobileNav({ onMenuClick, isMenuOpen }: MobileNavProps) {
  const { openSearch } = useSearchModal();
  const themeContext = useTheme();
  const pathname = usePathname();

  // Safely access theme context
  const theme = themeContext?.theme || "light";
  const toggleTheme = themeContext?.toggleTheme || (() => {});

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-40
      lg:hidden
      glass border-t border-border-light
      safe-area-bottom
    ">
      <div className="flex items-center justify-around h-16 px-4">
        {/* Search */}
        <button
          onClick={openSearch}
          className="
            flex flex-col items-center justify-center gap-1
            w-16 h-full
            text-foreground-secondary
            transition-colors duration-fast
            active:text-accent
          "
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Search</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="
            flex flex-col items-center justify-center gap-1
            w-16 h-full
            text-foreground-secondary
            transition-colors duration-fast
            active:text-accent
          "
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "light" ? (
              <motion.div
                key="sun"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
              >
                <Sun className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.15 }}
              >
                <Moon className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-[10px] font-medium">Theme</span>
        </button>

        {/* Menu Toggle */}
        <button
          onClick={onMenuClick}
          className={`
            flex flex-col items-center justify-center gap-1
            w-16 h-full
            transition-colors duration-fast
            ${isMenuOpen ? "text-accent" : "text-foreground-secondary"}
            active:text-accent
          `}
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isMenuOpen ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
