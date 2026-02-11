"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  HardDrive,
  Upload,
  Trash2,
  Search,
  Plus,
  Copy,
  Check,
  Database,
  Key,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { useBlobStorage, useKVStorage } from "@/hooks/use-storage";
import { useProjects } from "@/hooks/use-projects";

export default function StoragePage() {
  const { stores: blobStores, loading: blobLoading, error: blobError, createStore: createBlobStore, deleteStore: deleteBlobStore, refetch: refetchBlobs } = useBlobStorage();
  const { stores: kvStores, loading: kvLoading, error: kvError, createStore: createKVStore, deleteStore: deleteKVStore, refetch: refetchKV } = useKVStorage();
  const { projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [storeType, setStoreType] = useState<"blob" | "kv">("blob");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Create store form
  const [newStore, setNewStore] = useState({
    name: "",
    projectId: "",
    isPublic: false,
  });

  const filteredBlobStores = blobStores.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredKVStores = kvStores.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBlobSize = blobStores.reduce((acc, s) => acc + s.totalSize, 0);
  const totalBlobCount = blobStores.reduce((acc, s) => acc + s.blobCount, 0);
  const totalKVEntries = kvStores.reduce((acc, s) => acc + (s._count?.entries || 0), 0);
  const usedPercentage = (totalBlobSize / (5 * 1024 * 1024 * 1024)) * 100;

  const formatSize = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + " MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
    return bytes + " B";
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreateStore = async () => {
    if (!newStore.name || !newStore.projectId) {
      setCreateError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      if (storeType === "blob") {
        await createBlobStore(newStore.projectId, newStore.name, newStore.isPublic);
      } else {
        await createKVStore(newStore.projectId, newStore.name);
      }
      setDialogOpen(false);
      setNewStore({ name: "", projectId: "", isPublic: false });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create store");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBlobStore = async (id: string) => {
    if (!confirm("Are you sure? This will delete all files in the store.")) return;
    try {
      await deleteBlobStore(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete store");
    }
  };

  const handleDeleteKVStore = async (id: string) => {
    if (!confirm("Are you sure? This will delete all keys in the store.")) return;
    try {
      await deleteKVStore(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete store");
    }
  };

  const loading = blobLoading || kvLoading;
  const error = blobError || kvError;

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
          Failed to load storage
        </h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => { refetchBlobs(); refetchKV(); }}>
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
            Storage
          </h1>
          <p className="text-muted-foreground">
            Manage blob storage and key-value stores for your projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { refetchBlobs(); refetchKV(); }}>
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
                <DialogTitle>Create Storage Store</DialogTitle>
                <DialogDescription>
                  Create a new blob or key-value store for your project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Type</label>
                  <div className="flex gap-2">
                    <Button
                      variant={storeType === "blob" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStoreType("blob")}
                    >
                      <HardDrive className="h-4 w-4 mr-1" />
                      Blob Storage
                    </Button>
                    <Button
                      variant={storeType === "kv" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStoreType("kv")}
                    >
                      <Database className="h-4 w-4 mr-1" />
                      KV Store
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select
                    value={newStore.projectId}
                    onValueChange={(v) => setNewStore({ ...newStore, projectId: v })}
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
                    placeholder="my-store"
                    value={newStore.name}
                    onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  />
                </div>
                {storeType === "blob" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={newStore.isPublic}
                      onChange={(e) => setNewStore({ ...newStore, isPublic: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="isPublic" className="text-sm">
                      Make files publicly accessible
                    </label>
                  </div>
                )}
                {createError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="default" onClick={handleCreateStore} disabled={isCreating}>
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

      {/* Usage */}
      <div className="p-6 bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">
              Storage Usage
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatSize(totalBlobSize)} of 5 GB used
            </p>
          </div>
          <Badge variant={usedPercentage > 80 ? "error" : usedPercentage > 50 ? "warning" : "success"}>
            {usedPercentage.toFixed(1)}% used
          </Badge>
        </div>
        <Progress value={usedPercentage} className="h-2" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Blob Stores", value: blobStores.length, icon: HardDrive },
          { label: "Total Files", value: totalBlobCount, icon: Upload },
          { label: "KV Stores", value: kvStores.length, icon: Database },
          { label: "Total Keys", value: totalKVEntries, icon: Key },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 bg-card rounded-xl border border-border"
          >
            <stat.icon className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search stores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="blob">
        <TabsList>
          <TabsTrigger value="blob">
            <HardDrive className="h-4 w-4 mr-2" />
            Blob Storage ({blobStores.length})
          </TabsTrigger>
          <TabsTrigger value="kv">
            <Database className="h-4 w-4 mr-2" />
            KV Stores ({kvStores.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blob" className="mt-6">
          {filteredBlobStores.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <HardDrive className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No blob stores
              </h3>
              <p className="text-muted-foreground mb-4">
                Create a blob store to start uploading files.
              </p>
              <Button variant="default" onClick={() => { setStoreType("blob"); setDialogOpen(true); }}>
                <Plus className="h-4 w-4" />
                Create Blob Store
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBlobStores.map((store, index) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 bg-card rounded-xl border border-border hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <HardDrive className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {store.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {store.project?.name || "Unknown project"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" title={store.isPublic ? "Public" : "Private"}>
                      {store.isPublic ? (
                        <Unlock className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Files</span>
                      <span className="text-foreground">{store.blobCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size</span>
                      <span className="text-foreground">{formatSize(store.totalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span>{formatDate(store.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(store.id, store.id)}
                    >
                      {copied === store.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      Copy ID
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDeleteBlobStore(store.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="kv" className="mt-6">
          {filteredKVStores.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Database className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No KV stores
              </h3>
              <p className="text-muted-foreground mb-4">
                Create a KV store to start storing key-value data.
              </p>
              <Button variant="default" onClick={() => { setStoreType("kv"); setDialogOpen(true); }}>
                <Plus className="h-4 w-4" />
                Create KV Store
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredKVStores.map((store, index) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 bg-card rounded-xl border border-border hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {store.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {store.project?.name || "Unknown project"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Keys</span>
                      <span className="text-foreground">{store._count?.entries || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span>{formatDate(store.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(store.id, store.id)}
                    >
                      {copied === store.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      Copy ID
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDeleteKVStore(store.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
