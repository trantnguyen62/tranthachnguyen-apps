"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Eye,
  Globe,
  Clock,
  Activity,
  ChevronDown,
  Calendar,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalytics } from "@/hooks/use-analytics";
import { useProjects } from "@/hooks/use-projects";
import { TrafficChart } from "@/components/dashboard/traffic-chart";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const { projects } = useProjects();
  const { data, loading, error, refetch } = useAnalytics({
    range: timeRange,
    projectId: selectedProjectId,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds >= 60) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.round(seconds)}s`;
  };

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
          Failed to load analytics
        </h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const overviewStats = [
    {
      name: "Unique Visitors",
      value: formatNumber(data?.summary?.uniqueVisitors || 0),
      icon: Users,
    },
    {
      name: "Page Views",
      value: formatNumber(data?.summary?.pageviews || 0),
      icon: Eye,
    },
    {
      name: "Avg. Session",
      value: formatDuration(data?.summary?.avgSessionDuration || 0),
      icon: Clock,
    },
    {
      name: "Top Pages",
      value: (data?.topPages?.length || 0).toString(),
      icon: Globe,
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-foreground"
          >
            Analytics
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-muted-foreground"
          >
            Monitor your project performance and user engagement.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4"
        >
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {selectedProjectId
                  ? projects.find((p) => p.id === selectedProjectId)?.name || "Select Project"
                  : "All Projects"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedProjectId(undefined)}>
                All Projects
              </DropdownMenuItem>
              {projects.map((project) => (
                <DropdownMenuItem key={project.id} onClick={() => setSelectedProjectId(project.id)}>
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                {timeRange === "24h" ? "Last 24 hours" : timeRange === "7d" ? "Last 7 days" : "Last 30 days"}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTimeRange("24h")}>
                Last 24 hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange("7d")}>
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange("30d")}>
                Last 30 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>

      {/* Overview Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {overviewStats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="h-8 w-8 text-foreground" />
              </div>
              <div className="text-3xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.name}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="traffic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        {/* Traffic Tab */}
        <TabsContent value="traffic">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Traffic Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrafficChart
                  data={data?.timeseries || []}
                  height={300}
                  color="#0070f3"
                />
              </CardContent>
            </Card>

            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Top Pages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.topPages && data.topPages.length > 0 ? (
                  <div className="space-y-4">
                    {data.topPages.slice(0, 5).map((page, index) => {
                      const maxViews = data.topPages[0]?.views || 1;
                      const percentage = (page.views / maxViews) * 100;
                      return (
                        <div key={page.path}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-sm text-foreground truncate max-w-[60%]">
                              {page.path}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatNumber(page.views)} views
                            </span>
                          </div>
                          <Progress value={percentage} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No page data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referrers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Top Referrers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.referrers && data.referrers.length > 0 ? (
                  <div className="space-y-4">
                    {data.referrers.slice(0, 5).map((referrer, index) => {
                      const maxVisits = data.referrers[0]?.visits || 1;
                      const percentage = (referrer.visits / maxVisits) * 100;
                      return (
                        <div key={referrer.source}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-foreground">
                              {referrer.source}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatNumber(referrer.visits)} visits
                            </span>
                          </div>
                          <Progress value={percentage} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No referrer data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="space-y-6">
            {/* Core Web Vitals */}
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "LCP", label: "Largest Contentful Paint", target: "2.5s", targetMs: 2500 },
                    { name: "FID", label: "First Input Delay", target: "100ms", targetMs: 100 },
                    { name: "CLS", label: "Cumulative Layout Shift", target: "0.1", targetMs: 0.1 },
                    { name: "FCP", label: "First Contentful Paint", target: "1.8s", targetMs: 1800 },
                    { name: "TTFB", label: "Time to First Byte", target: "800ms", targetMs: 800 },
                    { name: "INP", label: "Interaction to Next Paint", target: "200ms", targetMs: 200 },
                  ].map((vital) => (
                    <div
                      key={vital.name}
                      className="p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground">
                          {vital.name}
                        </span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-muted-foreground dark:bg-gray-800 dark:text-muted-foreground">
                          Awaiting data
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-300 dark:text-gray-600">
                        --
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {vital.label} (target: {vital.target})
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-secondary rounded-lg border border-border">
                  <p className="text-sm text-foreground font-medium">
                    Add the Cloudify analytics script to your project to track Web Vitals
                  </p>
                  <code className="block mt-2 text-xs font-mono text-foreground bg-secondary p-2 rounded">
                    {`<Script src="https://cloudify.tranthachnguyen.com/api/analytics/script/{projectId}" />`}
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.devices && data.devices.length > 0 ? (
                  <div className="space-y-3">
                    {(() => {
                      const totalDevices = data.devices.reduce((sum, d) => sum + d.count, 0);
                      return data.devices.map((device) => {
                        const pct = totalDevices > 0 ? (device.count / totalDevices) * 100 : 0;
                        return (
                          <div key={device.type} className="p-4 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-foreground capitalize">
                                {device.type}
                              </span>
                              <span className="text-muted-foreground">
                                {formatNumber(device.count)} ({pct.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress value={pct} />
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No device data available yet. Data appears when your projects receive traffic.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Browser Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Browser Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.browsers && data.browsers.length > 0 ? (
                  <div className="space-y-3">
                    {(() => {
                      const totalBrowsers = data.browsers.reduce((sum, b) => sum + b.count, 0);
                      return data.browsers.map((browser) => {
                        const pct = totalBrowsers > 0 ? (browser.count / totalBrowsers) * 100 : 0;
                        return (
                          <div key={browser.browser}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-foreground">
                                {browser.browser}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatNumber(browser.count)} ({pct.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress value={pct} />
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No browser data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Top Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.countries && data.countries.length > 0 ? (
                <div className="space-y-4">
                  {data.countries.slice(0, 10).map((country, index) => {
                    const maxVisits = data.countries[0]?.visits || 1;
                    const percentage = (country.visits / maxVisits) * 100;
                    return (
                      <div key={country.country}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">
                            {country.country}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatNumber(country.visits)} visitors
                          </span>
                        </div>
                        <Progress value={percentage} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No geographic data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
