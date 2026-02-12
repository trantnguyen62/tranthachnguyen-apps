"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Github,
  GitBranch,
  Slack,
  MessageSquare,
  Database,
  Zap,
  Check,
  ExternalLink,
  Settings,
  Plus,
  Search,
  Webhook,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Trash2,
  Power,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIntegrations } from "@/hooks/use-integrations";
import { useProjects } from "@/hooks/use-projects";

// Icon mapping for integration types
const integrationIcons: Record<string, React.ElementType> = {
  github: Github,
  gitlab: GitBranch,
  bitbucket: GitBranch,
  slack: Slack,
  discord: MessageSquare,
  webhook: Webhook,
  datadog: Zap,
  sentry: Zap,
};

const categories = [
  { id: "all", name: "All" },
  { id: "git", name: "Git Providers" },
  { id: "communication", name: "Communication" },
  { id: "monitoring", name: "Monitoring" },
];

const categoryMapping: Record<string, string> = {
  github: "git",
  gitlab: "git",
  bitbucket: "git",
  slack: "communication",
  discord: "communication",
  webhook: "monitoring",
  datadog: "monitoring",
  sentry: "monitoring",
};

export default function IntegrationsPage() {
  const { integrations, availableTypes, loading, error, connectIntegration, disconnectIntegration, toggleIntegration, refetch } = useIntegrations();
  const { projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Connect integration form
  const [newIntegration, setNewIntegration] = useState({
    projectId: "",
    type: "",
    webhookUrl: "",
  });

  const connectedCount = integrations.length;

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.type.toLowerCase().includes(searchQuery.toLowerCase());
    const category = categoryMapping[integration.type] || "monitoring";
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableTypesArray = Object.entries(availableTypes).filter(([type]) => {
    const matchesSearch =
      type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      availableTypes[type].name.toLowerCase().includes(searchQuery.toLowerCase());
    const category = categoryMapping[type] || "monitoring";
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleConnect = async () => {
    if (!newIntegration.projectId || !newIntegration.type) {
      setConnectError("Please fill in all required fields");
      return;
    }

    setIsConnecting(true);
    setConnectError(null);

    try {
      await connectIntegration(
        newIntegration.projectId,
        newIntegration.type,
        undefined,
        undefined,
        newIntegration.webhookUrl || undefined
      );
      setDialogOpen(false);
      setNewIntegration({ projectId: "", type: "", webhookUrl: "" });
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Failed to connect integration");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this integration?")) return;
    try {
      await disconnectIntegration(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to disconnect integration");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleIntegration(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle integration");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return `${Math.floor(days / 7)} weeks ago`;
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
          Failed to load integrations
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
            Integrations
          </h1>
          <p className="text-[var(--text-secondary)]">
            Connect third-party services to enhance your workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="h-4 w-4" />
                Connect Integration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Integration</DialogTitle>
                <DialogDescription>
                  Connect a new integration to your project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select
                    value={newIntegration.projectId}
                    onValueChange={(v) => setNewIntegration({ ...newIntegration, projectId: v })}
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
                  <label className="text-sm font-medium">Integration Type</label>
                  <Select
                    value={newIntegration.type}
                    onValueChange={(v) => setNewIntegration({ ...newIntegration, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select integration type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(availableTypes).map(([type, info]) => (
                        <SelectItem key={type} value={type}>
                          {info.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(newIntegration.type === "webhook" || newIntegration.type === "slack" || newIntegration.type === "discord") && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Webhook URL</label>
                    <Input
                      placeholder="https://..."
                      value={newIntegration.webhookUrl}
                      onChange={(e) => setNewIntegration({ ...newIntegration, webhookUrl: e.target.value })}
                    />
                  </div>
                )}
                {connectError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{connectError}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="default" onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect"
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
          { label: "Connected", value: connectedCount },
          { label: "Available Types", value: Object.keys(availableTypes).length },
          { label: "Projects", value: new Set(integrations.map(i => i.projectId)).size },
          { label: "Categories", value: categories.length - 1 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-card rounded-xl border border-[var(--border-primary)]"
          >
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {stat.value}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Connected Integrations */}
      {filteredIntegrations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Connected Integrations
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration, index) => {
              const Icon = integrationIcons[integration.type] || Zap;
              return (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 bg-card rounded-xl border border-[var(--border-primary)]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[var(--surface-secondary)]">
                        <Icon className="h-5 w-5 text-[var(--text-secondary)]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                          {integration.name}
                          {integration.enabled && <Check className="h-4 w-4 text-green-500" />}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {integration.project?.name || "Unknown project"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={integration.enabled ? "success" : "secondary"}>
                      {integration.enabled ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    Last sync: {formatDate(integration.lastSyncAt)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggle(integration.id)}
                    >
                      <Power className="h-4 w-4" />
                      {integration.enabled ? "Pause" : "Enable"}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDisconnect(integration.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Available Integrations
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTypesArray.map(([type, info], index) => {
            const Icon = integrationIcons[type] || Zap;
            const isConnected = integrations.some(i => i.type === type);

            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 bg-card rounded-xl border border-[var(--border-primary)] hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-[var(--surface-secondary)]">
                    <Icon className="h-5 w-5 text-[var(--text-secondary)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {info.name}
                      </h3>
                      {isConnected && (
                        <Badge variant="success" className="text-xs">
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {info.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setNewIntegration({ ...newIntegration, type });
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Connect
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                    Docs
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {filteredIntegrations.length === 0 && availableTypesArray.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-[var(--border-primary)]">
          <Zap className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            No integrations found
          </h3>
          <p className="text-[var(--text-secondary)]">
            No integrations match your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
