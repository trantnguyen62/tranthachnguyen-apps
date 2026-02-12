"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FolderX, ArrowLeft, FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted mx-auto">
          <FolderX className="h-10 w-10 text-[var(--text-secondary)]" />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-center max-w-md"
      >
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          Project not found
        </h2>
        <p className="text-[var(--text-secondary)] mb-2">
          The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Double-check the project name in the URL, or go back to your projects list.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row items-center gap-3"
      >
        <Button variant="default" size="lg" asChild>
          <Link href="/projects">
            <FolderKanban className="h-4 w-4" />
            View all projects
          </Link>
        </Button>
        <Button variant="secondary" size="lg" asChild>
          <Link href="/new">
            <Plus className="h-4 w-4" />
            Create new project
          </Link>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
            Back to projects
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
