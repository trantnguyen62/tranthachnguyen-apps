"use client";

import { useState } from "react";
import { Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { GlobalSearch } from "@/components/search/global-search";
import { useNavigationShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function DashboardHeader() {
  // Enable navigation shortcuts
  useNavigationShortcuts();

  return (
    <>
      <GlobalSearch />
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6 dark:border-gray-800 dark:bg-gray-950/80">
        {/* Search trigger */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          onClick={() => {
            // Trigger Cmd+K to open command palette
            document.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                bubbles: true,
              })
            );
          }}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <NotificationCenter />
        </div>
      </header>
    </>
  );
}
