"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, Cloud, BookOpen, FolderKanban, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/docs?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-primary)] px-4">
      <div className="text-center max-w-xl">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative inline-flex">
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-foreground mx-auto">
              <Cloud className="h-12 w-12 text-background" />
            </div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
            >
              404
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
            This page doesn&apos;t exist
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mb-2">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
          <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
            Check the URL for typos, or use the search below to find what you need.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <Input
                type="text"
                placeholder="Search for pages, docs, or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="default">
              Search
            </Button>
          </form>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
        >
          <Button
            variant="secondary"
            size="lg"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
          <Button variant="default" size="lg" asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-[var(--text-secondary)] mb-4">Quick links</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
              { name: "Projects", href: "/projects", icon: FolderKanban },
              { name: "Documentation", href: "/docs", icon: BookOpen },
            ].map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-primary)] bg-card text-sm text-[var(--text-primary)] hover:bg-accent transition-colors"
              >
                <link.icon className="h-4 w-4 text-[var(--text-secondary)]" />
                {link.name}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
