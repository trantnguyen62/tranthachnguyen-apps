"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  Code,
  BookOpen,
  X,
} from "lucide-react";
import { useSearch, quickActions, SearchItem } from "@/lib/search";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { query, setQuery, results, recentSearches, addToRecent, clearRecent } = useSearch();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
      setQuery("");
    }
  }, [isOpen, setQuery]);

  // Get all items to display
  const displayItems = query.trim()
    ? results
    : recentSearches.length > 0
    ? recentSearches
    : [];

  const showQuickActions = !query.trim() && recentSearches.length === 0;

  // Handle navigation
  const handleSelect = useCallback(
    (item: SearchItem | typeof quickActions[0]) => {
      if ("content" in item) {
        addToRecent(item);
        router.push(item.href);
      } else {
        if (item.href.startsWith("http")) {
          window.open(item.href, "_blank");
        } else {
          router.push(item.href);
        }
      }
      onClose();
    },
    [router, onClose, addToRecent]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const itemCount = showQuickActions ? quickActions.length : displayItems.length;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % itemCount);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount);
          break;
        case "Enter":
          e.preventDefault();
          if (showQuickActions && quickActions[selectedIndex]) {
            handleSelect(quickActions[selectedIndex]);
          } else if (displayItems[selectedIndex]) {
            handleSelect(displayItems[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [selectedIndex, displayItems, showQuickActions, handleSelect, onClose]
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const getIcon = (icon?: string) => {
    switch (icon) {
      case "external":
        return <ExternalLink className="h-4 w-4" />;
      case "code":
        return <Code className="h-4 w-4" />;
      case "book":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="
              relative z-10 w-full max-w-xl mx-4
              bg-background rounded-xl shadow-lg
              border border-border-light
              overflow-hidden
            "
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 border-b border-border-light">
              <Search className="h-5 w-5 text-foreground-secondary flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search documentation..."
                className="
                  flex-1 h-14
                  bg-transparent
                  text-body-lg text-foreground
                  placeholder:text-foreground-secondary
                  focus:outline-none
                "
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded-md hover:bg-background-secondary"
                >
                  <X className="h-4 w-4 text-foreground-secondary" />
                </button>
              )}
              <kbd className="
                hidden sm:flex items-center gap-0.5
                px-1.5 py-1
                rounded-md
                text-caption text-foreground-secondary
                bg-background-secondary
                border border-border-light
              ">
                esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {/* Quick Actions (when empty) */}
              {showQuickActions && (
                <div className="p-2">
                  <p className="px-3 py-2 text-label uppercase text-foreground-secondary">
                    Quick Actions
                  </p>
                  {quickActions.map((action, index) => (
                    <button
                      key={action.id}
                      onClick={() => handleSelect(action)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-colors duration-fast
                        ${selectedIndex === index
                          ? "bg-accent text-white"
                          : "hover:bg-background-secondary"
                        }
                      `}
                    >
                      <span className={selectedIndex === index ? "text-white" : "text-foreground-secondary"}>
                        {getIcon(action.icon)}
                      </span>
                      <span className="flex-1 text-left text-body-sm">
                        {action.title}
                      </span>
                      <ArrowRight className={`h-4 w-4 ${selectedIndex === index ? "text-white" : "text-foreground-secondary"}`} />
                    </button>
                  ))}
                </div>
              )}

              {/* Recent Searches */}
              {!query.trim() && recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="text-label uppercase text-foreground-secondary">
                      Recent
                    </p>
                    <button
                      onClick={clearRecent}
                      className="text-caption text-foreground-secondary hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-colors duration-fast
                        ${selectedIndex === index
                          ? "bg-accent text-white"
                          : "hover:bg-background-secondary"
                        }
                      `}
                    >
                      <Clock className={`h-4 w-4 ${selectedIndex === index ? "text-white" : "text-foreground-secondary"}`} />
                      <div className="flex-1 text-left">
                        <p className="text-body-sm">{item.title}</p>
                        <p className={`text-caption ${selectedIndex === index ? "text-white/70" : "text-foreground-secondary"}`}>
                          {item.section}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Results */}
              {query.trim() && results.length > 0 && (
                <div className="p-2">
                  <p className="px-3 py-2 text-label uppercase text-foreground-secondary">
                    Results
                  </p>
                  {results.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-colors duration-fast
                        ${selectedIndex === index
                          ? "bg-accent text-white"
                          : "hover:bg-background-secondary"
                        }
                      `}
                    >
                      <FileText className={`h-4 w-4 flex-shrink-0 ${selectedIndex === index ? "text-white" : "text-foreground-secondary"}`} />
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-body-sm truncate">{item.title}</p>
                        <p className={`text-caption truncate ${selectedIndex === index ? "text-white/70" : "text-foreground-secondary"}`}>
                          {item.matchedText || item.section}
                        </p>
                      </div>
                      <span className={`
                        flex-shrink-0 px-2 py-0.5 rounded-md text-caption
                        ${selectedIndex === index
                          ? "bg-white/20 text-white"
                          : "bg-background-secondary text-foreground-secondary"
                        }
                      `}>
                        {item.section}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {query.trim() && results.length === 0 && (
                <div className="p-8 text-center">
                  <Search className="h-12 w-12 text-foreground-secondary mx-auto mb-3 opacity-50" />
                  <p className="text-body text-foreground-secondary">
                    No results found for &quot;{query}&quot;
                  </p>
                  <p className="text-body-sm text-foreground-secondary mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border-light bg-background-secondary">
              <div className="flex items-center justify-between text-caption text-foreground-secondary">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border border-border-light">↑</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-background border border-border-light">↓</kbd>
                    <span className="ml-1">Navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-background border border-border-light">↵</kbd>
                    <span className="ml-1">Select</span>
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-background border border-border-light">esc</kbd>
                  <span className="ml-1">Close</span>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
