"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Clock,
  Download,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Zap,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useUsage } from "@/hooks/use-usage";

export default function UsagePage() {
  const [period, setPeriod] = useState<string>("current");
  const { data, loading, error, getPercentage, formatUsage, formatLimit, refetch } = useUsage({ period });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Failed to load usage data
        </h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const usageMetrics = [
    {
      name: "Build Minutes",
      key: "build_minutes" as const,
      icon: Clock,
    },
    {
      name: "Bandwidth",
      key: "bandwidth" as const,
      icon: Globe,
    },
    {
      name: "Requests",
      key: "requests" as const,
      icon: Zap,
    },
    {
      name: "Deployments",
      key: "deployments" as const,
      icon: GitBranch,
    },
  ];

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Usage & Billing
          </h1>
          <p className="text-muted-foreground">
            Monitor your resource usage and manage billing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button variant="default" asChild>
            <a href="/settings?tab=billing">
              <CreditCard className="h-4 w-4" />
              Manage Billing
            </a>
          </Button>
        </div>
      </div>

      {/* Current Plan */}
      <div className="p-6 bg-foreground rounded-lg text-background">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-background/70 text-sm">Current Plan</p>
            <h2 className="text-3xl font-bold mt-1">Pro Plan</h2>
            <p className="text-background/70 mt-2">
              $20/month · Billing period: {data?.period || "Current month"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="bg-background/20 hover:bg-background/30 border-0 text-background">
              View Plan Details
            </Button>
            <Button className="bg-background text-foreground hover:bg-background/90">
              Upgrade Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {usageMetrics.map((metric, index) => {
          const percentage = getPercentage(metric.key);
          const isHigh = percentage > 80;
          const isWarning = percentage > 60 && percentage <= 80;

          return (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-5 bg-card rounded-xl border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <metric.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    isHigh
                      ? "text-red-600 dark:text-red-400"
                      : isWarning
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-green-600 dark:text-green-400"
                  )}
                >
                  {isHigh ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {percentage.toFixed(0)}%
                </div>
              </div>

              <h3 className="text-sm font-medium text-muted-foreground">
                {metric.name}
              </h3>

              <div className="mt-2">
                <p className="text-2xl font-bold text-foreground">
                  {formatUsage(metric.key)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / {formatLimit(metric.key)}
                  </span>
                </p>
              </div>

              <div className="mt-3">
                <Progress
                  value={percentage}
                  className={cn(
                    "h-2",
                    isHigh && "[&>div]:bg-red-500",
                    isWarning && "[&>div]:bg-yellow-500"
                  )}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="breakdown">
        <TabsList>
          <TabsTrigger value="breakdown">Usage Breakdown</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="spending">Spending Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="mt-6">
          <div className="bg-card rounded-xl border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Usage by Project
                </h3>
                <select
                  className="text-sm border border-border rounded-lg px-3 py-1.5 bg-transparent"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="current">This Month</option>
                  <option value="last">Last Month</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {data?.records && data.records.length > 0 ? (
                data.records.slice(0, 10).map((record) => (
                  <div
                    key={record.id}
                    className="p-6 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center text-white font-bold">
                          {(record.project?.name || "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">
                            {record.project?.name || "Unknown Project"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {record.type.replace("_", " ")} - {record.amount} {record.unit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.recordedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  No usage records found for this period.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-foreground">
                Billing History
              </h3>
            </div>

            <div className="p-12 text-center text-muted-foreground">
              No invoices yet. Your first invoice will appear here after the billing period ends.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="spending" className="mt-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Spending Alerts
            </h3>
            <p className="text-muted-foreground mb-6">
              Get notified when your usage approaches certain thresholds.
            </p>

            <div className="space-y-4">
              {[
                { threshold: 50, enabled: true },
                { threshold: 75, enabled: true },
                { threshold: 90, enabled: true },
                { threshold: 100, enabled: false },
              ].map((alert) => (
                <div
                  key={alert.threshold}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {alert.threshold}% usage alert
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Notify when usage reaches {alert.threshold}% of limit
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={alert.enabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-muted-foreground/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
                  </label>
                </div>
              ))}
            </div>

            <Button variant="default" className="mt-6">
              Save Alert Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
