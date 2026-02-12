"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Globe,
  Ban,
  Zap,
  Settings,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface SecuritySettings {
  configured: boolean;
  message?: string;
  settings?: {
    securityLevel: string;
    wafEnabled: boolean;
    browserIntegrityCheck: boolean;
    challengeTTL: number;
    firewallRules: {
      total: number;
      ipBlocking: number;
      countryBlocking: number;
      rateLimiting: number;
    };
    rules: Array<{
      id: string;
      description: string;
      action: string;
      paused: boolean;
    }>;
  };
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

const securityLevels = [
  { value: "off", label: "Off", description: "No security challenge" },
  { value: "essentially_off", label: "Essentially Off", description: "Minimal protection" },
  { value: "low", label: "Low", description: "Challenge only the most threatening visitors" },
  { value: "medium", label: "Medium", description: "Challenge more threatening visitors" },
  { value: "high", label: "High", description: "Challenge all visitors with threat score" },
  { value: "under_attack", label: "Under Attack", description: "Maximum protection (DDoS mode)" },
];

const countries = [
  { code: "CN", name: "China" },
  { code: "RU", name: "Russia" },
  { code: "KP", name: "North Korea" },
  { code: "IR", name: "Iran" },
  { code: "SY", name: "Syria" },
  { code: "CU", name: "Cuba" },
];

export default function SecuritySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.name as string;

  const [project, setProject] = useState<Project | null>(null);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [securityLevel, setSecurityLevel] = useState("medium");
  const [rateLimitEnabled, setRateLimitEnabled] = useState(false);
  const [rateLimitRequests, setRateLimitRequests] = useState(100);
  const [rateLimitAction, setRateLimitAction] = useState("challenge");
  const [ipBlockEnabled, setIpBlockEnabled] = useState(false);
  const [blockedIps, setBlockedIps] = useState("");
  const [countryBlockEnabled, setCountryBlockEnabled] = useState(false);
  const [blockedCountries, setBlockedCountries] = useState<string[]>([]);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/by-slug/${projectSlug}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      const data = await res.json();
      setProject(data.project);
      return data.project;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project");
      return null;
    }
  }, [projectSlug]);

  const fetchSecuritySettings = useCallback(async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/security`);
      if (!res.ok) throw new Error("Failed to fetch security settings");
      const data = await res.json();
      setSettings(data);

      // Initialize form state from fetched settings
      if (data.settings) {
        setSecurityLevel(data.settings.securityLevel || "medium");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch security settings");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const proj = await fetchProject();
      if (proj) {
        await fetchSecuritySettings(proj.id);
      }
      setLoading(false);
    };
    init();
  }, [fetchProject, fetchSecuritySettings]);

  const handleSave = async () => {
    if (!project) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/security`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          securityLevel,
          rateLimiting: rateLimitEnabled
            ? {
                enabled: true,
                requestsPerMinute: rateLimitRequests,
                action: rateLimitAction,
              }
            : undefined,
          ipBlocking: ipBlockEnabled
            ? {
                enabled: true,
                blockedIps: blockedIps.split("\n").filter(Boolean),
              }
            : undefined,
          countryBlocking: countryBlockEnabled
            ? {
                enabled: true,
                blockedCountries,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      // Refresh settings
      await fetchSecuritySettings(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!project) return;

    try {
      const res = await fetch(`/api/projects/${project.id}/security?ruleId=${ruleId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete rule");
      }

      // Refresh settings
      await fetchSecuritySettings(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Project Not Found</AlertTitle>
          <AlertDescription>
            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/projects/${projectSlug}`}>
          <Button variant="ghost" size="sm" >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Settings
          </h1>
          <p className="text-[var(--text-secondary)]">{project.name}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Not Configured Warning */}
      {settings && !settings.configured && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Cloudflare Not Configured</AlertTitle>
          <AlertDescription>
            {settings.message || "Add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID environment variables to enable security features."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Security Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Level
            </CardTitle>
            <CardDescription>
              Control how aggressively Cloudflare challenges visitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={securityLevel}
              onValueChange={setSecurityLevel}
              disabled={!settings?.configured}
            >
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Select security level" />
              </SelectTrigger>
              <SelectContent>
                {securityLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{level.label}</span>
                      <span className="text-xs text-[var(--text-secondary)]">{level.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {securityLevel === "under_attack" && (
              <Alert className="mt-4" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Under Attack Mode</AlertTitle>
                <AlertDescription>
                  This mode adds a JavaScript challenge to every request. Only use during active DDoS attacks.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Rate Limiting
            </CardTitle>
            <CardDescription>
              Protect against brute force and DDoS attacks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="rate-limit">Enable Rate Limiting</Label>
              <Switch
                id="rate-limit"
                checked={rateLimitEnabled}
                onCheckedChange={setRateLimitEnabled}
                disabled={!settings?.configured}
              />
            </div>

            {rateLimitEnabled && (
              <div className="grid gap-4 pl-4 border-l-2 border-muted">
                <div className="grid gap-2">
                  <Label>Requests per minute</Label>
                  <Input
                    type="number"
                    value={rateLimitRequests}
                    onChange={(e) => setRateLimitRequests(parseInt(e.target.value) || 100)}
                    min={10}
                    max={10000}
                    className="w-32"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Action when limit exceeded</Label>
                  <Select value={rateLimitAction} onValueChange={setRateLimitAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="challenge">Challenge</SelectItem>
                      <SelectItem value="managed_challenge">Managed Challenge</SelectItem>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="log">Log Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* IP Blocking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              IP Blocking
            </CardTitle>
            <CardDescription>
              Block specific IP addresses from accessing your site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ip-block">Enable IP Blocking</Label>
              <Switch
                id="ip-block"
                checked={ipBlockEnabled}
                onCheckedChange={setIpBlockEnabled}
                disabled={!settings?.configured}
              />
            </div>

            {ipBlockEnabled && (
              <div className="pl-4 border-l-2 border-muted">
                <Label>Blocked IPs (one per line)</Label>
                <textarea
                  value={blockedIps}
                  onChange={(e) => setBlockedIps(e.target.value)}
                  className="mt-2 w-full h-32 p-2 border rounded-md font-mono text-sm"
                  placeholder="192.168.1.1&#10;10.0.0.0/8&#10;203.0.113.0"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Country Blocking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Country Blocking
            </CardTitle>
            <CardDescription>
              Block traffic from specific countries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="country-block">Enable Country Blocking</Label>
              <Switch
                id="country-block"
                checked={countryBlockEnabled}
                onCheckedChange={setCountryBlockEnabled}
                disabled={!settings?.configured}
              />
            </div>

            {countryBlockEnabled && (
              <div className="pl-4 border-l-2 border-muted">
                <Label>Select countries to block</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {countries.map((country) => (
                    <Button
                      key={country.code}
                      variant={blockedCountries.includes(country.code) ? "default" : "secondary"}
                      size="sm"
                      onClick={() => {
                        if (blockedCountries.includes(country.code)) {
                          setBlockedCountries(blockedCountries.filter((c) => c !== country.code));
                        } else {
                          setBlockedCountries([...blockedCountries, country.code]);
                        }
                      }}
                    >
                      {country.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Rules */}
        {settings?.settings?.rules && settings.settings.rules.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Active Firewall Rules
              </CardTitle>
              <CardDescription>
                {settings.settings.firewallRules.total} active rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {settings.settings.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {rule.paused ? (
                        <XCircle className="h-4 w-4 text-[var(--text-secondary)]" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{rule.description}</p>
                        <Badge variant="secondary" className="mt-1">
                          {rule.action}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm" 
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={() => router.push(`/projects/${projectSlug}`)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !settings?.configured}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
