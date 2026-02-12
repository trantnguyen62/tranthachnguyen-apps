"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Flag,
  Plus,
  Search,
  MoreVertical,
  Users,
  Percent,
  Code,
  Copy,
  Check,
  Trash2,
  History,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { useProjects } from "@/hooks/use-projects";

type FlagType = "boolean" | "percentage" | "user-segment";

const typeConfig = {
  boolean: { icon: Flag, label: "Boolean", color: "text-[#0070f3]" },
  percentage: { icon: Percent, label: "Percentage", color: "text-green-500" },
  "user-segment": { icon: Users, label: "User Segment", color: "text-purple-500" },
};

export default function FeatureFlagsPage() {
  const { flags, loading, error, createFlag, toggleFlag, deleteFlag, refetch } = useFeatureFlags();
  const { projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newFlag, setNewFlag] = useState({
    key: "",
    name: "",
    description: "",
    type: "boolean" as FlagType,
    projectId: "",
    percentage: 100,
  });
  const [copied, setCopied] = useState<string | null>(null);

  const filteredFlags = flags.filter(
    (flag) =>
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFlag = async (id: string) => {
    try {
      await toggleFlag(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle flag");
    }
  };

  const handleDeleteFlag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feature flag?")) return;
    try {
      await deleteFlag(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete flag");
    }
  };

  const copyCode = (key: string) => {
    navigator.clipboard.writeText(`flags.isEnabled("${key}")`);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreateFlag = async () => {
    if (!newFlag.projectId || !newFlag.key || !newFlag.name) {
      setCreateError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      // Find the project and temporarily set it for createFlag
      await createFlagWithProject();
      setCreateDialogOpen(false);
      setNewFlag({ key: "", name: "", description: "", type: "boolean", projectId: "", percentage: 100 });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create flag");
    } finally {
      setIsCreating(false);
    }
  };

  const createFlagWithProject = async () => {
    const response = await fetch("/api/feature-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: newFlag.projectId,
        key: newFlag.key,
        name: newFlag.name,
        description: newFlag.description,
        enabled: false,
        percentage: newFlag.type === "percentage" ? newFlag.percentage : 100,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create flag");
    }

    await refetch();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Failed to load feature flags
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">{error}</p>
        <Button variant="secondary" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Feature Flags
          </h1>
          <p className="text-[var(--text-secondary)]">
            Control feature rollouts with real-time flags
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="default" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Flag
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Flags", value: flags.length },
          { label: "Enabled", value: flags.filter((f) => f.enabled).length },
          { label: "Projects", value: new Set(flags.map((f) => f.projectId)).size },
          { label: "Rollouts", value: flags.filter((f) => f.percentage < 100).length },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-card rounded-xl border border-[var(--border-primary)]"
          >
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stat.value}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
        <Input
          placeholder="Search flags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Flags list */}
      <div className="space-y-3">
        {filteredFlags.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-[var(--border-primary)]">
            <Flag className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-[var(--text-secondary)]">No feature flags found</p>
          </div>
        ) : (
          filteredFlags.map((flag, index) => {
            const isPercentage = flag.percentage < 100;
            const typeInfo = isPercentage ? typeConfig.percentage : typeConfig.boolean;
            const TypeIcon = typeInfo.icon;

            return (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 bg-card rounded-xl border border-[var(--border-primary)]"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn("p-2 rounded-lg", flag.enabled ? "bg-green-100 dark:bg-green-900/30" : "bg-[var(--surface-secondary)]")}>
                      <Flag className={cn("h-5 w-5", flag.enabled ? "text-green-600 dark:text-green-400" : "text-[var(--text-secondary)]")} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          {flag.name}
                        </h3>
                        <Badge variant="secondary">
                          {flag.project?.name || "Unknown"}
                        </Badge>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {flag.key}
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {flag.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
                        <div className="flex items-center gap-1">
                          <TypeIcon className={cn("h-3 w-3", typeInfo.color)} />
                          {typeInfo.label}
                          {isPercentage && ` (${flag.percentage}%)`}
                        </div>
                        <span>Updated {formatDate(flag.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(flag.key)}
                    >
                      {copied === flag.key ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Code className="h-4 w-4" />
                      )}
                    </Button>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={() => handleToggleFlag(flag.id)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <History className="h-4 w-4 mr-2" />
                          View History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteFlag(flag.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Feature Flag</DialogTitle>
            <DialogDescription>
              Create a new feature flag to control feature rollouts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select
                value={newFlag.projectId}
                onValueChange={(v) => setNewFlag({ ...newFlag, projectId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Flag Key</label>
              <Input
                placeholder="e.g., new_checkout_flow"
                value={newFlag.key}
                onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., New Checkout Flow"
                value={newFlag.name}
                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="What does this flag control?"
                value={newFlag.description}
                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["boolean", "percentage"] as FlagType[]).map((type) => {
                  const config = typeConfig[type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setNewFlag({ ...newFlag, type })}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-colors",
                        newFlag.type === type
                          ? "border-foreground bg-[var(--surface-secondary)]"
                          : "border-[var(--border-primary)] hover:bg-secondary"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 mb-1", config.color)} />
                      <p className="text-sm font-medium">{config.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            {newFlag.type === "percentage" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Percentage</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newFlag.percentage}
                  onChange={(e) => setNewFlag({ ...newFlag, percentage: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}
            {createError && (
              <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleCreateFlag}
              disabled={!newFlag.key || !newFlag.name || !newFlag.projectId || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Flag"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
