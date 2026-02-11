"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Bug,
  Shield,
  Wrench,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

type ChangeType = "feature" | "improvement" | "fix" | "security" | "breaking";

interface Change {
  type: ChangeType;
  title: string;
  description?: string;
}

interface Release {
  version: string;
  date: string;
  title: string;
  description?: string;
  changes: Change[];
}

const releases: Release[] = [
  {
    version: "2.4.0",
    date: "January 30, 2024",
    title: "Real-time Build Logs",
    description: "Stream build logs in real-time with our new SSE-based log viewer.",
    changes: [
      {
        type: "feature",
        title: "Real-time build log streaming",
        description: "Watch your builds happen live with Server-Sent Events",
      },
      {
        type: "feature",
        title: "Team management dashboard",
        description: "Invite and manage team members with role-based permissions",
      },
      {
        type: "improvement",
        title: "Faster cold starts for Edge Functions",
        description: "Reduced cold start times by up to 40%",
      },
      {
        type: "fix",
        title: "Fixed deployment rollback for large projects",
      },
    ],
  },
  {
    version: "2.3.0",
    date: "January 15, 2024",
    title: "Enhanced Analytics",
    description: "New analytics dashboard with Web Vitals and more insights.",
    changes: [
      {
        type: "feature",
        title: "Web Vitals monitoring",
        description: "Track Core Web Vitals across all your deployments",
      },
      {
        type: "feature",
        title: "Usage-based billing alerts",
        description: "Get notified when approaching usage limits",
      },
      {
        type: "improvement",
        title: "Improved domain verification flow",
      },
      {
        type: "security",
        title: "Enhanced 2FA with hardware key support",
      },
    ],
  },
  {
    version: "2.2.0",
    date: "December 20, 2023",
    title: "Global Edge Network Expansion",
    description: "Expanded our edge network to 12 new regions worldwide.",
    changes: [
      {
        type: "feature",
        title: "12 new edge locations",
        description: "Now available in South America, Africa, and more of Asia-Pacific",
      },
      {
        type: "improvement",
        title: "Automatic image optimization",
        description: "Images are now automatically optimized and served in WebP/AVIF",
      },
      {
        type: "fix",
        title: "Fixed environment variable sync issues",
      },
      {
        type: "fix",
        title: "Resolved preview URL generation for monorepos",
      },
    ],
  },
  {
    version: "2.1.0",
    date: "November 30, 2023",
    title: "Monorepo Support",
    description: "Full support for monorepo projects with automatic detection.",
    changes: [
      {
        type: "feature",
        title: "Monorepo project detection",
        description: "Automatically detect and configure Turborepo, Nx, and Lerna projects",
      },
      {
        type: "feature",
        title: "Project-level environment variables",
      },
      {
        type: "breaking",
        title: "Deprecated legacy deployment API",
        description: "The v1 deployment API will be removed in March 2024",
      },
      {
        type: "improvement",
        title: "Faster build caching",
      },
    ],
  },
];

const typeConfig: Record<
  ChangeType,
  { icon: React.ElementType; label: string; color: string }
> = {
  feature: {
    icon: Sparkles,
    label: "New",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  improvement: {
    icon: Zap,
    label: "Improved",
    color: "bg-secondary text-foreground",
  },
  fix: {
    icon: Bug,
    label: "Fixed",
    color: "bg-gray-100 text-foreground",
  },
  security: {
    icon: Shield,
    label: "Security",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  },
  breaking: {
    icon: Wrench,
    label: "Breaking",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-card">
      <Header />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-gray-200 mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Changelog
            </h1>
            <p className="text-xl text-muted-foreground">
              New features, improvements, and fixes in Cloudify
            </p>
          </div>

          {/* Releases */}
          <div className="space-y-16">
            {releases.map((release, releaseIndex) => (
              <motion.article
                key={release.version}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: releaseIndex * 0.1 }}
                className="relative"
              >
                {/* Version header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-base font-mono">
                      v{release.version}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {release.date}
                    </div>
                  </div>
                </div>

                <div className="pl-4 border-l-2 border-blue-500">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {release.title}
                  </h2>
                  {release.description && (
                    <p className="text-muted-foreground mb-6">
                      {release.description}
                    </p>
                  )}

                  {/* Changes */}
                  <div className="space-y-4">
                    {release.changes.map((change, changeIndex) => {
                      const config = typeConfig[change.type];
                      const Icon = config.icon;

                      return (
                        <div
                          key={changeIndex}
                          className="flex items-start gap-3"
                        >
                          <Badge className={config.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                          <div>
                            <p className="font-medium text-foreground">
                              {change.title}
                            </p>
                            {change.description && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {change.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {/* Load more */}
          <div className="text-center mt-16">
            <Button variant="outline" size="lg">
              View Older Releases
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
