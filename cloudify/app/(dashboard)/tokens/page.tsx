"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Check,
  AlertTriangle,
  Clock,
  Shield,
  Loader2,
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
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTokens } from "@/hooks/use-tokens";

const availableScopes = [
  { id: "read", name: "Read", description: "View projects and deployments" },
  { id: "write", name: "Write", description: "Create and update projects" },
  { id: "deploy", name: "Deploy", description: "Trigger new deployments" },
  { id: "admin", name: "Admin", description: "Full account access" },
];

export default function TokensPage() {
  const { tokens, loading, error, createToken, deleteToken } = useTokens();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read"]);
  const [expiresIn, setExpiresIn] = useState<string>("");
  const [newTokenValue, setNewTokenValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreateToken = async () => {
    try {
      setIsCreating(true);
      const result = await createToken(
        newTokenName,
        selectedScopes,
        expiresIn ? parseInt(expiresIn) : undefined
      );
      setNewTokenValue(result.token || null);
    } catch (err) {
      console.error("Failed to create token:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteToken = async (id: string) => {
    try {
      await deleteToken(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete token:", err);
    }
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewTokenName("");
    setSelectedScopes(["read"]);
    setExpiresIn("");
    setNewTokenValue(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatLastUsed = (dateString: string | null) => {
    if (!dateString) return "Never used";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Used just now";
    if (hours < 24) return `Used ${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `Used ${days} day${days > 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            API Tokens
          </h1>
          <p className="text-muted-foreground">
            Manage API tokens for programmatic access
          </p>
        </div>
        <Button variant="default" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Token
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Keep your tokens secure
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Tokens provide full access to your account based on their scopes. Never share them publicly or commit them to version control.
          </p>
        </div>
      </div>

      {/* Tokens list */}
      <div className="space-y-4">
        {tokens.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Key className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-muted-foreground">No API tokens yet</p>
            <Button
              variant="default"
              className="mt-4"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create your first token
            </Button>
          </div>
        ) : (
          tokens.map((token, index) => (
            <motion.div
              key={token.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-5 bg-card rounded-xl border border-border"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Key className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {token.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm text-muted-foreground font-mono">
                        {token.tokenPrefix}••••••••••••
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {token.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatLastUsed(token.lastUsedAt)}
                    </div>
                    <div className="mt-1">Created {formatDate(token.createdAt)}</div>
                    {token.expiresAt && (
                      <div className="text-yellow-600 dark:text-yellow-400 mt-1">
                        Expires {formatDate(token.expiresAt)}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(token.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Token Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={closeCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {newTokenValue ? "Token Created" : "Create API Token"}
            </DialogTitle>
            <DialogDescription>
              {newTokenValue
                ? "Make sure to copy your token now. You won't be able to see it again!"
                : "Create a new API token with specific scopes."}
            </DialogDescription>
          </DialogHeader>

          {newTokenValue ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-800 dark:text-green-200">
                    Token created successfully
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono p-2 bg-card rounded border break-all">
                    {newTokenValue}
                  </code>
                  <Button variant="outline" onClick={() => handleCopy(newTokenValue)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>This token will only be shown once. Store it securely.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Token Name
                </label>
                <Input
                  placeholder="e.g., Production Deploy"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Expiration (optional)
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 bg-transparent"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                >
                  <option value="">Never expires</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Scopes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableScopes.map((scope) => (
                    <label
                      key={scope.id}
                      className={cn(
                        "flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedScopes.includes(scope.id)
                          ? "border-foreground bg-secondary"
                          : "border-border hover:bg-secondary"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScopes([...selectedScopes, scope.id]);
                          } else {
                            setSelectedScopes(selectedScopes.filter((s) => s !== scope.id));
                          }
                        }}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {scope.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{scope.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {newTokenValue ? (
              <Button variant="default" onClick={closeCreateDialog}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeCreateDialog}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleCreateToken}
                  disabled={!newTokenName || selectedScopes.length === 0 || isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Create Token
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Token</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Any applications using this token will no longer have access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteToken(deleteConfirm)}
            >
              Revoke Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
