"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // Handle both cmd/ctrl for cross-platform
        const modifierMatch =
          shortcut.meta || shortcut.ctrl
            ? (event.metaKey || event.ctrlKey) &&
              (shortcut.meta ? true : true) &&
              (shortcut.ctrl ? true : true)
            : metaMatch && ctrlMatch;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          modifierMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Pre-built shortcuts for common navigation
export function useNavigationShortcuts() {
  const router = useRouter();

  const shortcuts: ShortcutConfig[] = [
    {
      key: "g",
      description: "Go to Dashboard",
      action: () => router.push("/dashboard"),
    },
    {
      key: "p",
      description: "Go to Projects",
      action: () => router.push("/projects"),
    },
    {
      key: "d",
      description: "Go to Deployments",
      action: () => router.push("/deployments"),
    },
    {
      key: "n",
      meta: true,
      description: "New Project",
      action: () => router.push("/new"),
    },
    {
      key: "s",
      meta: true,
      shift: true,
      description: "Go to Settings",
      action: () => router.push("/settings"),
    },
    {
      key: "?",
      shift: true,
      description: "Show Keyboard Shortcuts",
      action: () => {
        // This could open a shortcuts modal
        console.log("Show shortcuts help");
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

// Shortcut context for displaying in UI
export const keyboardShortcuts = [
  { keys: ["⌘", "K"], description: "Open command palette" },
  { keys: ["G"], description: "Go to Dashboard" },
  { keys: ["P"], description: "Go to Projects" },
  { keys: ["D"], description: "Go to Deployments" },
  { keys: ["⌘", "N"], description: "Create new project" },
  { keys: ["⌘", "⇧", "S"], description: "Go to Settings" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close dialog / Cancel" },
];
