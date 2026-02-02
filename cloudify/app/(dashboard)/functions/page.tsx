"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Search,
  Filter,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  Terminal,
  Globe,
  Activity,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useFunctions } from "@/hooks/use-functions";
import { useProjects } from "@/hooks/use-projects";

interface FunctionDetail {
  id: string;
  name: string;
  runtime: string;
  entrypoint: string;
  memory: number;
  timeout: number;
  regions: string[];
  project?: { id: string; name: string; slug: string };
  invocations24h?: number;
  avgDuration?: number;
  errorRate?: number;
  status?: "healthy" | "degraded" | "error";
}

const statusConfig = {
  healthy: { icon: CheckCircle2, color: "text-green-500", label: "Healthy" },
  degraded: { icon: AlertTriangle, color: "text-yellow-500", label: "Degraded" },
  error: { icon: AlertTriangle, color: "text-red-500", label: "Error" },
};

const runtimes = [
  { value: "nodejs20", label: "Node.js 20" },
  { value: "nodejs18", label: "Node.js 18" },
  { value: "python3.11", label: "Python 3.11" },
  { value: "edge", label: "Edge Runtime" },
];

export default function FunctionsPage() {
  const { functions, loading, error, createFunction, deleteFunction, refetch } = useFunctions();
  const { projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedFunction, setSelectedFunction] = useState<FunctionDetail | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Create function form state
  const [newFunction, setNewFunction] = useState({
    name: "",
    projectId: "",
    runtime: "nodejs20",
    entrypoint: "api/index.js",
    memory: 128,
    timeout: 10,
  });

  const filteredFunctions = functions.filter((fn) => {
    const matchesSearch =
      fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fn.entrypoint.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || fn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvocations = functions.reduce((acc, f) => acc + (f.invocations24h || 0), 0);
  const avgDuration =
    functions.length > 0
      ? functions.reduce((acc, f) => acc + (f.avgDuration || 0), 0) / functions.length
      : 0;
  const healthyCount = functions.filter((f) => f.status === "healthy").length;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const handleCreate = async () => {
    if (!newFunction.name || !newFunction.projectId) {
      setCreateError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      await createFunction({
        projectId: newFunction.projectId,
        name: newFunction.name,
        runtime: newFunction.runtime,
        entrypoint: newFunction.entrypoint,
        memory: newFunction.memory,
        timeout: newFunction.timeout,
      });
      setDialogOpen(false);
      setNewFunction({
        name: "",
        projectId: "",
        runtime: "nodejs20",
        entrypoint: "api/index.js",
        memory: 128,
        timeout: 10,
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create function");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this function?")) return;
    try {
      await deleteFunction(id);
      if (selectedFunction?.id === id) {
        setSelectedFunction(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete function");
    }
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
          Failed to load functions
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Serverless Functions
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Monitor and manage your API routes and serverless functions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="primary">
                <Plus className="h-4 w-4" />
                Create Function
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Serverless Function</DialogTitle>
                <DialogDescription>
                  Configure a new serverless function for your project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select
                    value={newFunction.projectId}
                    onValueChange={(v) => setNewFunction({ ...newFunction, projectId: v })}
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
                  <label className="text-sm font-medium">Function Name</label>
                  <Input
                    placeholder="api/users"
                    value={newFunction.name}
                    onChange={(e) => setNewFunction({ ...newFunction, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Runtime</label>
                  <Select
                    value={newFunction.runtime}
                    onValueChange={(v) => setNewFunction({ ...newFunction, runtime: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {runtimes.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Memory (MB)</label>
                    <Select
                      value={newFunction.memory.toString()}
                      onValueChange={(v) => setNewFunction({ ...newFunction, memory: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[128, 256, 512, 1024, 2048, 3008].map((m) => (
                          <SelectItem key={m} value={m.toString()}>
                            {m} MB
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timeout (s)</label>
                    <Select
                      value={newFunction.timeout.toString()}
                      onValueChange={(v) => setNewFunction({ ...newFunction, timeout: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 30, 60, 120, 300, 900].map((t) => (
                          <SelectItem key={t} value={t.toString()}>
                            {t}s
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {createError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Function"
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
          { label: "Total Functions", value: functions.length, icon: Zap },
          { label: "Invocations (24h)", value: formatNumber(totalInvocations), icon: Activity },
          { label: "Avg Duration", value: `${avgDuration.toFixed(0)}ms`, icon: Clock },
          { label: "Healthy", value: `${healthyCount}/${functions.length}`, icon: CheckCircle2 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
          >
            <stat.icon className="h-5 w-5 text-gray-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search functions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4" />
              {statusFilter === "all" ? "All Status" : statusConfig[statusFilter as keyof typeof statusConfig]?.label}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All Functions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("healthy")}>
              Healthy Only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("degraded")}>
              Degraded Only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Functions list */}
      {filteredFunctions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Zap className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No functions found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {functions.length === 0
              ? "Create your first serverless function to get started."
              : "No functions match your search criteria."}
          </p>
          {functions.length === 0 && (
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Function
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Function</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Invocations</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Avg Duration</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Error Rate</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFunctions.map((fn, index) => {
                  const config = statusConfig[fn.status || "healthy"];
                  const StatusIcon = config.icon;

                  return (
                    <motion.tr
                      key={fn.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => setSelectedFunction(fn as FunctionDetail)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {fn.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {fn.project?.name || "Unknown"} • {runtimes.find(r => r.value === fn.runtime)?.label || fn.runtime}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn("h-4 w-4", config.color)} />
                          <span className={cn("text-sm", config.color)}>
                            {config.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {formatNumber(fn.invocations24h || 0)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {fn.avgDuration || 0}ms
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "text-sm",
                            (fn.errorRate || 0) > 1
                              ? "text-red-500"
                              : (fn.errorRate || 0) > 0.1
                              ? "text-yellow-500"
                              : "text-green-500"
                          )}
                        >
                          {fn.errorRate || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(fn.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Function detail panel */}
      {selectedFunction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedFunction.name}
                </h3>
                <p className="text-sm text-gray-500">{selectedFunction.entrypoint}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSelectedFunction(null)}>
              Close
            </Button>
          </div>

          <Tabs defaultValue="metrics">
            <TabsList>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="mt-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Invocations (24h)</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(selectedFunction.invocations24h || 0)}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedFunction.avgDuration || 0}ms
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Error Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedFunction.errorRate || 0}%
                  </p>
                </div>
              </div>

              <div className="mt-6 p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500">Invocation metrics chart</p>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="mt-6">
              <div className="p-4 bg-gray-950 rounded-lg font-mono text-sm">
                <div className="text-gray-400">
                  <p><span className="text-gray-500">[10:32:45]</span> <span className="text-green-400">INFO</span> Request received: GET /{selectedFunction.entrypoint}</p>
                  <p><span className="text-gray-500">[10:32:45]</span> <span className="text-blue-400">DEBUG</span> Processing request...</p>
                  <p><span className="text-gray-500">[10:32:45]</span> <span className="text-green-400">INFO</span> Response sent: 200 OK ({selectedFunction.avgDuration || 45}ms)</p>
                </div>
              </div>
              <Button variant="outline" className="mt-4">
                <Terminal className="h-4 w-4" />
                View Full Logs
              </Button>
            </TabsContent>

            <TabsContent value="config" className="mt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Runtime</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {runtimes.find(r => r.value === selectedFunction.runtime)?.label || selectedFunction.runtime}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Regions</p>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedFunction.regions?.join(", ") || "Global"}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Memory</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedFunction.memory} MB</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Timeout</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedFunction.timeout} seconds</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
}
