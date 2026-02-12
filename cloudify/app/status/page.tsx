"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Globe,
  Server,
  Database,
  GitBranch,
  RefreshCw,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";

type Status = "operational" | "degraded" | "partial" | "major";

interface Service {
  id: string;
  name: string;
  status: Status;
  icon: React.ElementType;
  description: string;
}

interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  startedAt: string;
  updates: {
    time: string;
    message: string;
  }[];
}

const services: Service[] = [
  {
    id: "api",
    name: "API",
    status: "operational",
    icon: Server,
    description: "Core API endpoints",
  },
  {
    id: "deployments",
    name: "Deployments",
    status: "operational",
    icon: GitBranch,
    description: "Build and deployment pipeline",
  },
  {
    id: "edge",
    name: "Edge Network",
    status: "operational",
    icon: Globe,
    description: "Global CDN and edge functions",
  },
  {
    id: "database",
    name: "Database",
    status: "operational",
    icon: Database,
    description: "Managed database services",
  },
  {
    id: "dashboard",
    name: "Dashboard",
    status: "operational",
    icon: Server,
    description: "Web dashboard and UI",
  },
];

const incidents: Incident[] = [
  {
    id: "inc-1",
    title: "Increased deployment times",
    status: "resolved",
    severity: "minor",
    startedAt: "Jan 28, 2024 - 14:30 UTC",
    updates: [
      {
        time: "15:45 UTC",
        message: "This incident has been resolved. Deployment times have returned to normal.",
      },
      {
        time: "15:15 UTC",
        message: "We have identified the issue and are implementing a fix.",
      },
      {
        time: "14:30 UTC",
        message: "We are investigating reports of increased deployment times.",
      },
    ],
  },
];

const statusConfig = {
  operational: {
    icon: CheckCircle2,
    label: "Operational",
    color: "text-green-500",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Degraded",
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  partial: {
    icon: AlertTriangle,
    label: "Partial Outage",
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  major: {
    icon: XCircle,
    label: "Major Outage",
    color: "text-red-500",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
};

const incidentStatusConfig = {
  investigating: { color: "bg-red-500", label: "Investigating" },
  identified: { color: "bg-yellow-500", label: "Identified" },
  monitoring: { color: "bg-[#0070f3]", label: "Monitoring" },
  resolved: { color: "bg-green-500", label: "Resolved" },
};

export default function StatusPage() {
  const [email, setEmail] = useState("");

  const overallStatus = services.every((s) => s.status === "operational")
    ? "operational"
    : services.some((s) => s.status === "major")
    ? "major"
    : "degraded";

  const overallConfig = statusConfig[overallStatus];
  const OverallIcon = overallConfig.icon;

  return (
    <div className="min-h-screen flex flex-col bg-card">
      <Header />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Overall status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-8 rounded-2xl mb-12",
              overallStatus === "operational"
                ? "bg-green-50 dark:bg-green-900/20"
                : "bg-red-50 dark:bg-red-900/20"
            )}
          >
            <div className="flex items-center gap-4">
              <OverallIcon className={cn("h-10 w-10", overallConfig.color)} />
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                  {overallStatus === "operational"
                    ? "All Systems Operational"
                    : "System Issues Detected"}
                </h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  Last updated: {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} UTC
                </p>
              </div>
            </div>
          </motion.div>

          {/* Services */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
              Services
            </h2>
            <div className="space-y-3">
              {services.map((service, index) => {
                const config = statusConfig[service.status];
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-card rounded-xl border border-[var(--border-primary)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[var(--surface-secondary)]">
                        <service.icon className="h-5 w-5 text-[var(--text-secondary)]" />
                      </div>
                      <div>
                        <h3 className="font-medium text-[var(--text-primary)]">
                          {service.name}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn("h-5 w-5", config.color)} />
                      <span className={cn("text-sm font-medium", config.color)}>
                        {config.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Uptime */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
              90-Day Uptime
            </h2>
            <div className="p-6 bg-card rounded-xl border border-[var(--border-primary)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                  99.99%
                </span>
                <Badge variant="success">Excellent</Badge>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 90 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-8 rounded-sm",
                      i === 45
                        ? "bg-yellow-400"
                        : "bg-green-400 dark:bg-green-500"
                    )}
                    title={`Day ${90 - i}: ${i === 45 ? "99.8%" : "100%"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Each bar represents one day. Green = 100% uptime.
              </p>
            </div>
          </section>

          {/* Recent incidents */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
              Recent Incidents
            </h2>
            {incidents.length === 0 ? (
              <div className="p-8 bg-card rounded-xl border border-[var(--border-primary)] text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-[var(--text-secondary)]">
                  No incidents in the past 30 days
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="p-6 bg-card rounded-xl border border-[var(--border-primary)]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            className={cn(
                              "text-white",
                              incidentStatusConfig[incident.status].color
                            )}
                          >
                            {incidentStatusConfig[incident.status].label}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {incident.severity}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          {incident.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Started: {incident.startedAt}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3 border-l-2 border-[var(--border-primary)] pl-4">
                      {incident.updates.map((update, i) => (
                        <div key={i}>
                          <p className="text-xs text-gray-500 mb-1">
                            {update.time}
                          </p>
                          <p className="text-sm text-[var(--text-primary)]">
                            {update.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Subscribe */}
          <section className="p-6 bg-[var(--surface-secondary)] rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <Bell className="h-6 w-6 text-[var(--text-primary)] shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                  Get Status Updates
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Subscribe to receive notifications when incidents occur or are resolved.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button variant="default">Subscribe</Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
