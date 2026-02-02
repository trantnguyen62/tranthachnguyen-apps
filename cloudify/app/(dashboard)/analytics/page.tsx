"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load analytics
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
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
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            Analytics
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-gray-600 dark:text-gray-400"
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
                <stat.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
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
            {/* Chart placeholder */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Traffic Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {data?.summary?.pageviews
                        ? `${formatNumber(data.summary.pageviews)} page views`
                        : "No traffic data available"}
                    </p>
                    <p className="text-sm text-gray-400">
                      for the selected period
                    </p>
                  </div>
                </div>
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
                            <span className="font-mono text-sm text-gray-900 dark:text-white truncate max-w-[60%]">
                              {page.path}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatNumber(page.views)} views
                            </span>
                          </div>
                          <Progress value={percentage} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
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
                            <span className="text-sm text-gray-900 dark:text-white">
                              {referrer.source}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatNumber(referrer.visits)} visits
                            </span>
                          </div>
                          <Progress value={percentage} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No referrer data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data?.devices && data.devices.length > 0 ? (
                  data.devices.map((device) => (
                    <div
                      key={device.type}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white capitalize">
                          {device.type}
                        </span>
                        <span className="text-gray-500">
                          {formatNumber(device.count)} users
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No device data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
                          <span className="text-sm text-gray-900 dark:text-white">
                            {country.country}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatNumber(country.visits)} visitors
                          </span>
                        </div>
                        <Progress value={percentage} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
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
