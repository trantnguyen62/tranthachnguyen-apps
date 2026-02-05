"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { searchData, SearchItem } from "./search-data";

const RECENT_SEARCHES_KEY = "cloudify-docs-recent-searches";
const MAX_RECENT_SEARCHES = 5;

export interface SearchResult extends SearchItem {
  matchedText?: string;
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<SearchItem[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Simple fuzzy search implementation
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const words = normalizedQuery.split(/\s+/);

    const scored = searchData
      .map((item) => {
        const titleLower = item.title.toLowerCase();
        const contentLower = item.content.toLowerCase();
        const sectionLower = item.section.toLowerCase();

        let score = 0;

        // Exact title match (highest priority)
        if (titleLower === normalizedQuery) {
          score += 100;
        }
        // Title starts with query
        else if (titleLower.startsWith(normalizedQuery)) {
          score += 80;
        }
        // Title contains query
        else if (titleLower.includes(normalizedQuery)) {
          score += 60;
        }

        // Section match
        if (sectionLower.includes(normalizedQuery)) {
          score += 20;
        }

        // Word matching in content
        words.forEach((word) => {
          if (titleLower.includes(word)) {
            score += 15;
          }
          if (contentLower.includes(word)) {
            score += 5;
          }
        });

        // Find matched text snippet
        let matchedText = "";
        const contentIndex = contentLower.indexOf(normalizedQuery);
        if (contentIndex !== -1) {
          const start = Math.max(0, contentIndex - 20);
          const end = Math.min(item.content.length, contentIndex + normalizedQuery.length + 40);
          matchedText = (start > 0 ? "..." : "") + item.content.slice(start, end) + (end < item.content.length ? "..." : "");
        }

        return { ...item, score, matchedText };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return scored;
  }, [query]);

  // Add to recent searches
  const addToRecent = useCallback((item: SearchItem) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const updated = [item, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    recentSearches,
    addToRecent,
    clearRecent,
  };
}
