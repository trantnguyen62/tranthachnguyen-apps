"use client";

import { TopBar } from "@/components/navigation/TopBar";
import { TableOfContents } from "./TableOfContents";
import { PageNav } from "./PageNav";
import { Feedback } from "@/components/content/Feedback";
import { useSearchModal } from "@/components/providers/SearchProvider";

interface PageWrapperProps {
  children: React.ReactNode;
}

export function PageWrapper({ children }: PageWrapperProps) {
  const { openSearch } = useSearchModal();

  return (
    <>
      {/* Sticky Top Bar */}
      <TopBar onSearchClick={openSearch} />

      {/* Main Content Area */}
      <div className="flex gap-8">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {children}

          {/* Feedback */}
          <Feedback />

          {/* Previous / Next Navigation */}
          <PageNav />
        </div>

        {/* Table of Contents - Right Sidebar */}
        <div className="hidden xl:block flex-shrink-0">
          <TableOfContents />
        </div>
      </div>
    </>
  );
}
