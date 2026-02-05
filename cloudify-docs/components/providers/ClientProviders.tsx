"use client";

import { ThemeProvider } from "./ThemeProvider";
import { SearchProvider, useSearchModal } from "./SearchProvider";
import { CommandPalette } from "@/components/navigation/CommandPalette";

function SearchModal() {
  const { isOpen, closeSearch } = useSearchModal();
  return <CommandPalette isOpen={isOpen} onClose={closeSearch} />;
}

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider>
      <SearchProvider>
        {children}
        <SearchModal />
      </SearchProvider>
    </ThemeProvider>
  );
}
