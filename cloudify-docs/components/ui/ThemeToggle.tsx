"use client";

import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useContext } from "react";
import { ThemeContext } from "../providers/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const context = useContext(ThemeContext);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render placeholder during SSR and before mount
  if (!mounted || !context) {
    return (
      <div
        className={`
          flex h-9 w-9 items-center justify-center
          rounded-lg
          ${className}
        `}
      >
        <Sun className="h-5 w-5 text-foreground-secondary opacity-50" />
      </div>
    );
  }

  const { theme, toggleTheme } = context;

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative flex h-9 w-9 items-center justify-center
        rounded-lg transition-colors duration-base
        hover:bg-background-secondary
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
        ${className}
      `}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "light" ? (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-5 w-5 text-foreground-secondary" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-5 w-5 text-foreground-secondary" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
