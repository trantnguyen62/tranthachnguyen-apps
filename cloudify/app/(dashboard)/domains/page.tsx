"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  RefreshCw,
  Shield,
  AlertTriangle,
  Copy,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  DropdownMenuSeparator,
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
import { useDomains } from "@/hooks/use-domains";
import { useProjects } from "@/hooks/use-projects";

const statusConfig = {
  verified: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    label: "Verified",
  },
  pending: {
    icon: Clock,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "Pending",
  },
  error: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    label: "Error",
  },
};

const sslStatusLabels: Record<string, string> = {
  pending: "SSL Pending",
  provisioning: "SSL Provisioning",
  active: "SSL Active",
  error: "SSL Error",
};

export default function DomainsPage() {
  const { domains, loading, error, addDomain, deleteDomain, verifyDomain } = useDomains();
  const { projects } = useProjects();

  const [newDomain, setNewDomain] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<Record<string, { errors: string[]; warnings: string[] }>>({});

  const handleAddDomain = async () => {
    if (!newDomain || !selectedProject) {
      setAddError("Please enter a domain and select a project");
      return;
    }

    setIsAddingDomain(true);
    setAddError(null);

    try {
      await addDomain(newDomain, selectedProject);
      setDialogOpen(false);
      setNewDomain("");
      setSelectedProject("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add domain");
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerify = async (domainId: string) => {
    setVerifyingId(domainId);
    try {
      const result = await verifyDomain(domainId);
      // Store both errors and warnings
      if (!result.verified || result.warnings?.length > 0) {
        setVerifyResult((prev) => ({
          ...prev,
          [domainId]: {
            errors: result.errors || [],
            warnings: result.warnings || [],
          },
        }));
      } else {
        setVerifyResult((prev) => {
          const next = { ...prev };
          delete next[domainId];
          return next;
        });
      }
    } catch (err) {
      setVerifyResult((prev) => ({
        ...prev,
        [domainId]: {
          errors: [err instanceof Error ? err.message : "Verification failed"],
          warnings: [],
        },
      }));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (domainId: string) => {
    if (!confirm("Are you sure you want to remove this domain?")) return;
    try {
      await deleteDomain(domainId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete domain");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to load domains
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

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
            Domains
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-gray-600 dark:text-gray-400"
          >
            Manage custom domains for your projects.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="primary">
                <Plus className="h-4 w-4" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Domain</DialogTitle>
                <DialogDescription>
                  Enter your domain name and select the project to connect it to.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Domain</label>
                  <Input
                    placeholder="example.com or subdomain.example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {addError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{addError}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddDomain}
                  disabled={isAddingDomain || !newDomain || !selectedProject}
                >
                  {isAddingDomain ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Domain"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      {/* Domains List */}
      {domains.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {domains.map((domain, index) => {
            const status = domain.verified
              ? statusConfig.verified
              : statusConfig.pending;
            const StatusIcon = status.icon;
            const domainErrors = verifyResult[domain.id]?.errors || [];
            const domainWarnings = verifyResult[domain.id]?.warnings || [];

            return (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", status.bg)}>
                          <Globe className={cn("h-5 w-5", status.color)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <a
                              href={`https://${domain.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {domain.domain}
                            </a>
                            <Badge
                              variant={domain.verified ? "success" : "warning"}
                            >
                              {status.label}
                            </Badge>
                            {domain.sslStatus === "active" && (
                              <Badge variant="secondary" className="gap-1">
                                <Shield className="h-3 w-3" />
                                SSL
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Connected to {domain.project.name} • Added{" "}
                            {formatDate(domain.createdAt)}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => window.open(`https://${domain.domain}`, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleVerify(domain.id)}
                            disabled={verifyingId === domain.id}
                          >
                            <RefreshCw
                              className={cn(
                                "h-4 w-4 mr-2",
                                verifyingId === domain.id && "animate-spin"
                              )}
                            />
                            Verify DNS
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleDelete(domain.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Error messages from verification */}
                    {domainErrors.length > 0 && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                        {domainErrors.map((err, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <span className="text-sm text-red-600 dark:text-red-400">
                              {err}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Warning messages from verification */}
                    {domainWarnings.length > 0 && (
                      <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        {domainWarnings.map((warn, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            <span className="text-sm text-yellow-600 dark:text-yellow-400">
                              {warn}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* DNS Records to configure */}
                    {!domain.verified && (
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Configure these DNS records to verify your domain:
                        </h4>
                        <div className="space-y-2">
                          {/* TXT Record for verification */}
                          <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">TXT</Badge>
                              <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                _cloudify-verify.{domain.domain}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="font-mono text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                                {domain.verificationToken}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyToClipboard(domain.verificationToken)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* CNAME Record */}
                          <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">
                                {domain.domain.split(".").length === 2 ? "A" : "CNAME"}
                              </Badge>
                              <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                {domain.domain.split(".").length === 2
                                  ? "@"
                                  : domain.domain.split(".")[0]}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="font-mono text-sm text-gray-900 dark:text-white">
                                {domain.domain.split(".").length === 2
                                  ? "76.76.21.21"
                                  : "cname.cloudify.tranthachnguyen.com"}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                copyToClipboard(
                                  domain.domain.split(".").length === 2
                                    ? "76.76.21.21"
                                    : "cname.cloudify.tranthachnguyen.com"
                                )
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerify(domain.id)}
                            disabled={verifyingId === domain.id}
                          >
                            {verifyingId === domain.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Verify DNS Configuration
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* SSL Status for verified domains */}
                    {domain.verified && domain.sslStatus !== "active" && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                          {sslStatusLabels[domain.sslStatus] || "Processing SSL certificate..."}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No domains configured
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add a custom domain to make your project available on your own URL.
          </p>
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Domain
          </Button>
        </div>
      )}
    </div>
  );
}
