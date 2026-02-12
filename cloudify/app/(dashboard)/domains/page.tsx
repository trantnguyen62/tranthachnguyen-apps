"use client";

import { useState } from "react";
import {
  Plus,
  Globe,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Copy,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useDomains } from "@/hooks/use-domains";
import { useProjects } from "@/hooks/use-projects";
import { useToast } from "@/components/notifications/toast";

function LoadingSkeleton() {
  return (
    <div className="px-6 py-8 max-w-[980px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-[var(--separator,theme(colors.border))]">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16 flex-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusDot(verified: boolean, sslStatus: string) {
  if (verified && sslStatus === "active") return "bg-[var(--success,#34C759)]";
  if (verified) return "bg-[var(--warning,#FF9F0A)]";
  return "bg-[var(--warning,#FF9F0A)]";
}

function getSslLabel(verified: boolean, sslStatus: string) {
  if (!verified) return "Pending";
  if (sslStatus === "active") return "Valid SSL";
  if (sslStatus === "provisioning") return "SSL Provisioning";
  if (sslStatus === "error") return "SSL Error";
  return "SSL Pending";
}

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
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const { addToast } = useToast();

  const toggleExpanded = (domainId: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  };

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
      addToast({ type: "success", title: "Domain added", message: `${newDomain} has been added to your project` });
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
        addToast({ type: "success", title: "Domain verified", message: "DNS records are configured correctly" });
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
      addToast({ type: "success", title: "Domain removed", message: "The domain has been disconnected from your project" });
    } catch (err) {
      addToast({ type: "error", title: "Delete failed", message: err instanceof Error ? err.message : "Failed to delete domain" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(text);
    setTimeout(() => setCopiedValue(null), 2000);
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
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="px-6 py-8 max-w-[980px]">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="h-6 w-6 text-[var(--error,#FF3B30)] mb-4" />
          <h3 className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-1">
            Failed to load domains
          </h3>
          <p className="text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))] mb-5">
            {error}
          </p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-[980px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary,theme(colors.foreground))] mb-1">
            Domains
          </h1>
          <p className="text-[15px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
            Manage custom domains for your projects.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="text-[20px]">Add Custom Domain</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]">Domain</label>
                <Input
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-medium text-[var(--text-primary,theme(colors.foreground))]">Project</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="h-10">
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
                <p className="text-[13px] text-[var(--error,#FF3B30)]">{addError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleAddDomain}
                disabled={isAddingDomain || !newDomain || !selectedProject}
              >
                {isAddingDomain ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Domains list */}
      {domains.length > 0 ? (
        <div className="border-t border-[var(--separator,theme(colors.border))]">
          {domains.map((domain) => {
            const isExpanded = expandedDomains.has(domain.id);
            const domainErrors = verifyResult[domain.id]?.errors || [];
            const domainWarnings = verifyResult[domain.id]?.warnings || [];

            return (
              <div key={domain.id} className="border-b border-[var(--separator,theme(colors.border))]">
                {/* Domain row */}
                <div className="flex items-center gap-4 py-4 -mx-3 px-3 group">
                  {/* Status dot */}
                  <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusDot(domain.verified, domain.sslStatus)}`} />

                  {/* Domain name */}
                  <a
                    href={`https://${domain.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[16px] font-semibold text-[var(--text-primary,theme(colors.foreground))] hover:text-[var(--accent,#0071E3)] transition-colors min-w-[180px]"
                  >
                    {domain.domain}
                  </a>

                  {/* Project name */}
                  <span className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] min-w-[100px]">
                    {domain.project.name}
                  </span>

                  {/* SSL / Verification status */}
                  <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] min-w-[100px]">
                    {getSslLabel(domain.verified, domain.sslStatus)}
                  </span>

                  {/* Verification dot + label */}
                  <span className="flex items-center gap-1.5 text-[13px] min-w-[80px]">
                    {domain.verified ? (
                      <span className="text-[var(--success,#34C759)]">Verified</span>
                    ) : (
                      <span className="text-[var(--warning,#FF9F0A)]">Pending</span>
                    )}
                  </span>

                  {/* Date */}
                  <span className="text-[13px] text-[var(--text-tertiary,theme(colors.muted.foreground/70))] flex-1 text-right">
                    Added {formatDate(domain.createdAt)}
                  </span>

                  {/* Expand DNS config toggle for unverified */}
                  {!domain.verified && (
                    <button
                      onClick={() => toggleExpanded(domain.id)}
                      className="text-[var(--text-tertiary,theme(colors.muted.foreground/70))] hover:text-[var(--text-primary,theme(colors.foreground))] transition-colors shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {/* Three-dot menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm" 
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
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
                        <RefreshCw className={`h-4 w-4 mr-2 ${verifyingId === domain.id ? "animate-spin" : ""}`} />
                        Verify DNS
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-[var(--error,#FF3B30)]"
                        onClick={() => handleDelete(domain.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Expandable DNS config panel for unverified domains */}
                {!domain.verified && isExpanded && (
                  <div className="pb-4 px-3 -mx-3">
                    <div className="bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] rounded-lg p-4 ml-6">
                      {/* Error / warning messages */}
                      {domainErrors.length > 0 && (
                        <div className="mb-3">
                          {domainErrors.map((err, i) => (
                            <div key={i} className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-[var(--error,#FF3B30)] shrink-0" />
                              <span className="text-[13px] text-[var(--error,#FF3B30)]">{err}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {domainWarnings.length > 0 && (
                        <div className="mb-3">
                          {domainWarnings.map((warn, i) => (
                            <div key={i} className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-3.5 w-3.5 text-[var(--warning,#FF9F0A)] shrink-0" />
                              <span className="text-[13px] text-[var(--warning,#FF9F0A)]">{warn}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <h4 className="text-[13px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-3">
                        Configure DNS Records
                      </h4>

                      {/* DNS records table */}
                      <div className="space-y-2">
                        {/* Header row */}
                        <div className="grid grid-cols-[60px_1fr_1fr_40px] gap-3 text-[11px] font-medium text-[var(--text-tertiary,theme(colors.muted.foreground/70))] uppercase tracking-wider">
                          <span>Type</span>
                          <span>Name</span>
                          <span>Value</span>
                          <span></span>
                        </div>

                        {/* TXT record */}
                        <div className="grid grid-cols-[60px_1fr_1fr_40px] gap-3 items-center py-2 px-2 rounded bg-[var(--surface-primary,theme(colors.background))] border border-[var(--border-primary,theme(colors.border))]">
                          <span className="text-[13px] font-mono font-medium text-[var(--text-primary,theme(colors.foreground))]">TXT</span>
                          <span className="text-[13px] font-mono text-[var(--text-secondary,theme(colors.muted.foreground))] truncate">
                            _cloudify-verify.{domain.domain}
                          </span>
                          <span className="text-[13px] font-mono text-[var(--text-primary,theme(colors.foreground))] truncate" title={domain.verificationToken}>
                            {domain.verificationToken}
                          </span>
                          <button
                            onClick={() => copyToClipboard(domain.verificationToken)}
                            className="flex items-center justify-center h-7 w-7 rounded hover:bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] transition-colors"
                          >
                            {copiedValue === domain.verificationToken ? (
                              <Check className="h-3.5 w-3.5 text-[var(--success,#34C759)]" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-[var(--text-tertiary,theme(colors.muted.foreground/70))]" />
                            )}
                          </button>
                        </div>

                        {/* CNAME or A record */}
                        {(() => {
                          const isApex = domain.domain.split(".").length === 2;
                          const recordType = isApex ? "A" : "CNAME";
                          const recordName = isApex ? "@" : domain.domain.split(".")[0];
                          const recordValue = isApex ? "76.76.21.21" : "cname.cloudify.tranthachnguyen.com";
                          return (
                            <div className="grid grid-cols-[60px_1fr_1fr_40px] gap-3 items-center py-2 px-2 rounded bg-[var(--surface-primary,theme(colors.background))] border border-[var(--border-primary,theme(colors.border))]">
                              <span className="text-[13px] font-mono font-medium text-[var(--text-primary,theme(colors.foreground))]">{recordType}</span>
                              <span className="text-[13px] font-mono text-[var(--text-secondary,theme(colors.muted.foreground))]">
                                {recordName}
                              </span>
                              <span className="text-[13px] font-mono text-[var(--text-primary,theme(colors.foreground))]">
                                {recordValue}
                              </span>
                              <button
                                onClick={() => copyToClipboard(recordValue)}
                                className="flex items-center justify-center h-7 w-7 rounded hover:bg-[var(--surface-secondary,theme(colors.secondary.DEFAULT))] transition-colors"
                              >
                                {copiedValue === recordValue ? (
                                  <Check className="h-3.5 w-3.5 text-[var(--success,#34C759)]" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-[var(--text-tertiary,theme(colors.muted.foreground/70))]" />
                                )}
                              </button>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Check DNS button */}
                      <div className="mt-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleVerify(domain.id)}
                          disabled={verifyingId === domain.id}
                        >
                          {verifyingId === domain.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3.5 w-3.5" />
                              Check DNS
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SSL provisioning status for verified but not active SSL */}
                {domain.verified && domain.sslStatus !== "active" && (
                  <div className="pb-4 px-3 -mx-3">
                    <div className="flex items-center gap-2 ml-6 text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))]">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>SSL certificate is being provisioned...</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Globe className="h-12 w-12 text-[var(--text-quaternary,theme(colors.muted.foreground/40))] mb-4" strokeWidth={1.5} />
          <p className="text-[17px] font-semibold text-[var(--text-primary,theme(colors.foreground))] mb-1">
            No custom domains
          </p>
          <p className="text-[13px] text-[var(--text-secondary,theme(colors.muted.foreground))] max-w-[320px] mb-5">
            Connect a custom domain to make your project accessible on your own URL.
          </p>
          <Button variant="default" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Domain
          </Button>
        </div>
      )}
    </div>
  );
}
