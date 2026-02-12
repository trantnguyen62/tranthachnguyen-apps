"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  Globe,
  Trash2,
  Settings,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SkeletonAuditLogList,
  SkeletonRetentionStats,
} from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  useSuccessToast,
  useErrorToast,
} from "@/components/notifications/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";

interface AuditLog {
  id: string;
  type: string;
  action: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
    slug: string;
  } | null;
  team: {
    id: string;
    name: string;
    slug: string;
  } | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface FilterOptions {
  types: string[];
  actions: string[];
}

interface RetentionPolicy {
  enabled: boolean;
  retentionDays: number;
  autoDelete: boolean;
  lastCleanup?: string;
}

interface RetentionStats {
  policy: RetentionPolicy;
  preview: {
    totalLogs: number;
    logsToDelete: number;
    oldestLog: string | null;
  };
  storageEstimate: {
    currentSizeKB: number;
    afterCleanupSizeKB: number;
  };
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("logs");
  const showSuccess = useSuccessToast();
  const showError = useErrorToast();

  // Logs state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Retention state
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null);
  const [isLoadingRetention, setIsLoadingRetention] = useState(false);
  const [isSavingRetention, setIsSavingRetention] = useState(false);
  const [isApplyingRetention, setIsApplyingRetention] = useState(false);
  const [retentionEnabled, setRetentionEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);
  const [autoDelete, setAutoDelete] = useState(false);

  // Team ID (for now, use the first team the user is part of)
  const [teamId, setTeamId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", "20");
      params.set("includeFilters", "true");

      if (searchQuery) params.set("search", searchQuery);
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
      if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
      if (startDate) params.set("startDate", new Date(startDate).toISOString());
      if (endDate) params.set("endDate", new Date(endDate).toISOString());
      if (teamId) params.set("teamId", teamId);

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
        setPagination(data.pagination);
        if (data.filterOptions) {
          setFilterOptions(data.filterOptions);
        }
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, typeFilter, actionFilter, startDate, endDate, teamId]);

  const fetchRetentionStats = useCallback(async () => {
    if (!teamId) return;

    setIsLoadingRetention(true);
    try {
      const response = await fetch(`/api/settings/audit/retention?teamId=${teamId}`);
      const data = await response.json();

      if (response.ok) {
        setRetentionStats(data);
        setRetentionEnabled(data.policy.enabled);
        setRetentionDays(data.policy.retentionDays);
        setAutoDelete(data.policy.autoDelete);
      }
    } catch (error) {
      console.error("Failed to fetch retention stats:", error);
    } finally {
      setIsLoadingRetention(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (activeTab === "retention" && teamId) {
      fetchRetentionStats();
    }
  }, [activeTab, teamId, fetchRetentionStats]);

  const handleExport = async (format: "json" | "csv") => {
    setIsExporting(true);
    try {
      const filters: Record<string, unknown> = {};
      if (typeFilter && typeFilter !== "all") filters.type = typeFilter;
      if (actionFilter && actionFilter !== "all") filters.action = actionFilter;
      if (startDate) filters.startDate = new Date(startDate).toISOString();
      if (endDate) filters.endDate = new Date(endDate).toISOString();
      if (searchQuery) filters.search = searchQuery;
      if (teamId) filters.teamId = teamId;

      const response = await fetch("/api/audit-logs/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, filters }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess(
          "Export completed",
          `Audit logs exported as ${format.toUpperCase()}`
        );
      } else {
        showError("Export failed", "Could not export audit logs");
      }
    } catch (error) {
      console.error("Export failed:", error);
      showError("Export failed", "An unexpected error occurred");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveRetention = async () => {
    if (!teamId) return;

    setIsSavingRetention(true);
    try {
      const response = await fetch("/api/settings/audit/retention", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          policy: {
            enabled: retentionEnabled,
            retentionDays,
            autoDelete,
          },
        }),
      });

      if (response.ok) {
        await fetchRetentionStats();
        showSuccess(
          "Policy saved",
          "Retention policy has been updated successfully"
        );
      } else {
        showError("Save failed", "Could not save retention policy");
      }
    } catch (error) {
      console.error("Failed to save retention policy:", error);
      showError("Save failed", "An unexpected error occurred");
    } finally {
      setIsSavingRetention(false);
    }
  };

  const handleApplyRetention = async () => {
    if (!teamId) return;

    setIsApplyingRetention(true);
    try {
      const response = await fetch("/api/settings/audit/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchRetentionStats();
        await fetchLogs();
        showSuccess(
          "Logs deleted",
          `Successfully deleted ${data.deletedCount?.toLocaleString() || 0} old logs`
        );
      } else {
        showError("Cleanup failed", "Could not delete old logs");
      }
    } catch (error) {
      console.error("Failed to apply retention policy:", error);
      showError("Cleanup failed", "An unexpected error occurred");
    } finally {
      setIsApplyingRetention(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const hasActiveFilters =
    searchQuery ||
    (typeFilter && typeFilter !== "all") ||
    (actionFilter && actionFilter !== "all") ||
    startDate ||
    endDate;

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setActionFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      auth: "bg-[var(--surface-secondary)] text-[var(--text-primary)]",
      project: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      deployment: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      domain: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      env_var: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      team: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      billing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-[var(--text-primary)]"
        >
          Audit Logs
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 text-[var(--text-secondary)]"
        >
          View and manage audit logs for compliance and security monitoring.
        </motion.p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="h-4 w-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-2">
            <Settings className="h-4 w-4" />
            Retention Policy
          </TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                    <Input
                      placeholder="Search logs..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Type Filter */}
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {filterOptions?.types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Action Filter */}
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {filterOptions?.actions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action.charAt(0).toUpperCase() + action.slice(1).replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date Range */}
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleExport("json")}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Export JSON
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleExport("csv")}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Export CSV
                    </Button>
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-[var(--text-secondary)] hover:text-gray-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Logs List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Activity Log</span>
                  {pagination && (
                    <span className="text-sm font-normal text-[var(--text-secondary)]">
                      Showing {logs.length} of {pagination.total} entries
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <SkeletonAuditLogList rows={5} />
                ) : logs.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={hasActiveFilters ? "No matching logs" : "No audit logs yet"}
                    description={
                      hasActiveFilters
                        ? "Try adjusting your filters to find what you're looking for."
                        : "Audit logs will appear here as activities are recorded."
                    }
                    action={
                      hasActiveFilters
                        ? {
                            label: "Clear filters",
                            onClick: clearFilters,
                            variant: "secondary",
                          }
                        : undefined
                    }
                  />
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 rounded-lg border border-[var(--border-primary)] hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getTypeColor(log.type)}>
                                {log.type}
                              </Badge>
                              <Badge variant="secondary">{log.action}</Badge>
                            </div>
                            <p className="text-[var(--text-primary)] font-medium">
                              {log.description}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {log.user.name} ({log.user.email})
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(log.timestamp)}
                              </span>
                              {log.ipAddress && (
                                <span className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {log.ipAddress}
                                </span>
                              )}
                              {log.project && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {log.project.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-[var(--text-secondary)]">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={!pagination.hasMore}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {!teamId ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Users}
                    title="No Team Selected"
                    description="Please select a team to configure retention policies."
                  />
                </CardContent>
              </Card>
            ) : isLoadingRetention ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Retention Policy</CardTitle>
                    <CardDescription>
                      Configure how long audit logs are retained before automatic deletion.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <SkeletonRetentionStats />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                {/* Retention Policy Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Retention Policy</CardTitle>
                    <CardDescription>
                      Configure how long audit logs are retained before automatic deletion.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border-primary)]">
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">
                          Enable Retention Policy
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          Automatically manage audit log retention
                        </p>
                      </div>
                      <Switch
                        checked={retentionEnabled}
                        onCheckedChange={setRetentionEnabled}
                      />
                    </div>

                    {retentionEnabled && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Retention Period (days)
                          </label>
                          <Input
                            type="number"
                            min={7}
                            max={2555}
                            value={retentionDays}
                            onChange={(e) =>
                              setRetentionDays(parseInt(e.target.value) || 90)
                            }
                          />
                          <p className="text-xs text-[var(--text-secondary)]">
                            Logs older than this will be eligible for deletion (7-2555 days)
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border-primary)]">
                          <div>
                            <div className="font-medium text-[var(--text-primary)]">
                              Auto-Delete Old Logs
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">
                              Automatically delete logs older than retention period
                            </p>
                          </div>
                          <Switch
                            checked={autoDelete}
                            onCheckedChange={setAutoDelete}
                          />
                        </div>
                      </>
                    )}

                    <Button
                      variant="default"
                      onClick={handleSaveRetention}
                      disabled={isSavingRetention}
                    >
                      {isSavingRetention ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Policy"
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Retention Stats */}
                {retentionStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Storage Statistics</CardTitle>
                      <CardDescription>
                        Overview of audit log storage and cleanup impact
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-[var(--surface-primary)] text-center">
                          <div className="text-2xl font-bold text-[var(--text-primary)]">
                            {retentionStats.preview.totalLogs.toLocaleString()}
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">Total Logs</p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {retentionStats.preview.logsToDelete.toLocaleString()}
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">
                            Logs to Delete ({retentionDays}+ days old)
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-[var(--surface-primary)] text-center">
                          <div className="text-2xl font-bold text-[var(--text-primary)]">
                            {(retentionStats.storageEstimate.currentSizeKB / 1024).toFixed(
                              2
                            )}{" "}
                            MB
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">Estimated Storage</p>
                        </div>
                      </div>

                      {retentionStats.preview.oldestLog && (
                        <p className="mt-4 text-sm text-[var(--text-secondary)]">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Oldest log: {formatDate(retentionStats.preview.oldestLog)}
                        </p>
                      )}

                      {retentionEnabled && retentionStats.preview.logsToDelete > 0 && (
                        <div className="mt-6 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                          <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                            <Trash2 className="h-4 w-4" />
                            Manual Cleanup
                          </h4>
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            Delete {retentionStats.preview.logsToDelete.toLocaleString()}{" "}
                            logs older than {retentionDays} days. This action cannot be
                            undone.
                          </p>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="mt-3"
                            onClick={handleApplyRetention}
                            disabled={isApplyingRetention}
                          >
                            {isApplyingRetention ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                Delete Old Logs
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
