"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Extract headings from the page
  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: TOCItem[] = [];

    elements.forEach((el) => {
      // Generate ID if not present
      if (!el.id) {
        el.id = el.textContent
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "";
      }

      items.push({
        id: el.id,
        text: el.textContent || "",
        level: el.tagName === "H2" ? 2 : 3,
      });
    });

    setHeadings(items);
  }, []);

  // Track active heading on scroll
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="hidden xl:block w-toc sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
      <div className="pb-4 border-b border-border-light mb-4">
        <h4 className="text-label uppercase text-foreground-secondary tracking-wider">
          On This Page
        </h4>
      </div>

      <ul className="space-y-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: heading.level === 3 ? "12px" : "0" }}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(heading.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                  setActiveId(heading.id);
                }
              }}
              className={`
                block py-1 text-body-sm
                transition-colors duration-fast
                ${activeId === heading.id
                  ? "text-accent font-medium"
                  : "text-foreground-secondary hover:text-foreground"
                }
              `}
            >
              <span className="flex items-center gap-2">
                {activeId === heading.id && (
                  <motion.span
                    layoutId="toc-indicator"
                    className="w-0.5 h-4 bg-accent rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={activeId === heading.id ? "" : "ml-2.5"}>
                  {heading.text}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
