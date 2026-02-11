"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Plus,
  Search,
  MoreVertical,
  Copy,
  Check,
  Trash2,
  Edit2,
  Clock,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useEdgeConfig } from "@/hooks/use-edge-config";
import { useProjects } from "@/hooks/use-projects";

export default function EdgeConfigPage() {
  const { configs, loading, error, createConfig, deleteConfig, refetch } = useEdgeConfig();
  const { projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConfig, setSelectedConfig] = useState<typeof configs[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Create config form
  const [newConfig, setNewConfig] = useState({
    name: "",
    projectId: "",
  });

  const filteredConfigs = configs.filter(
    (config) =>
      config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = async () => {
    if (!newConfig.name || !newConfig.projectId) {
      setCreateError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const config = await createConfig(newConfig.projectId, newConfig.name);
      setDialogOpen(false);
      setNewConfig({ name: "", projectId: "" });
      setSelectedConfig(config);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create config");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete all items in this config.")) return;
    try {
      await deleteConfig(id);
      if (selectedConfig?.id === id) {
        setSelectedConfig(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete config");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
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
          Failed to load edge configs
        </h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => refetch()}>
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
          <h1 className="text-2xl font-bold text-foreground">
            Edge Config
          </h1>
          <p className="text-muted-foreground">
            Ultra-low latency data at the edge
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="h-4 w-4" />
                Create Store
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Edge Config Store</DialogTitle>
                <DialogDescription>
                  Create a new configuration store for ultra-low latency reads.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select
                    value={newConfig.projectId}
                    onValueChange={(v) => setNewConfig({ ...newConfig, projectId: v })}
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
                  <label className="text-sm font-medium">Store Name</label>
                  <Input
                    placeholder="e.g., Feature Toggles"
                    value={newConfig.name}
                    onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  />
                  {newConfig.name && (
                    <p className="text-xs text-muted-foreground">
                      Slug: <code className="font-mono">{newConfig.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}</code>
                    </p>
                  )}
                </div>
                {createError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="default" onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Store"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Config Stores", value: configs.length },
          { label: "Total Items", value: configs.reduce((acc, c) => acc + (c._count?.items || 0), 0) },
          { label: "Total Projects", value: new Set(configs.map(c => c.projectId)).size },
          { label: "Latency", value: "<1ms" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-card rounded-xl border border-border"
          >
            <p className="text-2xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-secondary rounded-xl border border-border">
        <Zap className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Edge Config provides ultra-low latency reads
          </p>
          <p className="text-sm text-foreground mt-1">
            Perfect for feature flags, A/B tests, and configuration that needs to be read frequently at the edge.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search configs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Config list */}
      {filteredConfigs.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Zap className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No edge configs
          </h3>
          <p className="text-muted-foreground mb-4">
            Create an edge config store to start storing configuration.
          </p>
          <Button variant="default" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Store
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConfigs.map((config, index) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 bg-card rounded-xl border border-border hover:border-foreground/20 cursor-pointer transition-colors"
              onClick={() => setSelectedConfig(config)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {config.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {config.project?.name || "Unknown project"}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(config.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <code className="font-mono text-xs">{config.slug}</code>
                <span>·</span>
                <span>{config._count?.items || 0} items</span>
              </div>

              <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Updated {formatDate(config.updatedAt)}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selected config detail */}
      {selectedConfig && (
        <Dialog open={!!selectedConfig} onOpenChange={() => setSelectedConfig(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                {selectedConfig.name}
              </DialogTitle>
              <DialogDescription>
                <code className="font-mono">{selectedConfig.slug}</code> · {selectedConfig._count?.items || 0} items
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Usage code */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Usage
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-950 rounded-lg">
                  <code className="flex-1 text-sm text-gray-300 font-mono">
                    {`import { get } from '@cloudify/edge-config';`}
                    <br />
                    {`const value = await get('key');`}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`get('key')`, "code")}
                  >
                    {copied === "code" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Items
                  </label>
                  <Button variant="outline" size="sm">
                    <Plus className="h-3 w-3" />
                    Add Item
                  </Button>
                </div>
                <div className="border border-border rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedConfig.items && selectedConfig.items.length > 0 ? (
                    selectedConfig.items.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-3 hover:bg-secondary"
                      >
                        <div className="flex items-center gap-3">
                          <code className="text-sm font-mono text-foreground">
                            {item.key}
                          </code>
                          <Badge variant="outline" className="text-xs">
                            {typeof item.value}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <code className="text-sm text-muted-foreground font-mono max-w-[200px] truncate">
                            {JSON.stringify(item.value)}
                          </code>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No items yet. Add your first configuration item.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedConfig(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
