"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Server,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Settings,
  Activity,
  MapPin,
  ChevronRight,
  Zap,
  Shield,
} from "lucide-react";

interface RegionHealthCheck {
  id: string;
  status: string;
  latency: number;
  createdAt: string;
}

interface Region {
  id: string;
  name: string;
  displayName: string;
  endpoint: string;
  status: string;
  isPrimary: boolean;
  priority: number;
  maxDeployments: number;
  activeDeployments: number;
  latitude?: number;
  longitude?: number;
  country?: string;
  provider?: string;
  lastHealthCheck?: string;
  latestHealth?: RegionHealthCheck;
  failoverCount: number;
}

interface Replication {
  id: string;
  sourceRegion: { name: string };
  targetRegion: { name: string };
  dataType: string;
  status: string;
  lagSeconds: number;
  lastSyncAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  healthy: "bg-green-500",
  degraded: "bg-yellow-500",
  unhealthy: "bg-red-500",
  maintenance: "bg-foreground",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  healthy: <CheckCircle className="w-4 h-4 text-green-500" />,
  degraded: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
  unhealthy: <XCircle className="w-4 h-4 text-red-500" />,
  maintenance: <Settings className="w-4 h-4 text-[#0070f3]" />,
};

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [replications, setReplications] = useState<Replication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [newRegion, setNewRegion] = useState({
    name: "",
    displayName: "",
    endpoint: "",
    priority: 100,
    maxDeployments: 1000,
    country: "",
    provider: "",
    latitude: "",
    longitude: "",
  });

  // Fetch regions
  useEffect(() => {
    async function fetchRegions() {
      try {
        const res = await fetch("/api/admin/regions");
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error("Admin access required to view regions");
          }
          throw new Error("Failed to fetch regions");
        }
        const data = await res.json();
        setRegions(data.regions);
        setReplications(data.replications || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchRegions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRegions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Create region
  async function handleCreateRegion() {
    setActionLoading("create");
    try {
      const res = await fetch("/api/admin/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newRegion,
          latitude: newRegion.latitude ? parseFloat(newRegion.latitude) : undefined,
          longitude: newRegion.longitude ? parseFloat(newRegion.longitude) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create region");
      }

      const data = await res.json();
      setRegions([...regions, data.region]);
      setShowCreateModal(false);
      setNewRegion({
        name: "",
        displayName: "",
        endpoint: "",
        priority: 100,
        maxDeployments: 1000,
        country: "",
        provider: "",
        latitude: "",
        longitude: "",
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create region");
    } finally {
      setActionLoading(null);
    }
  }

  // Trigger health check
  async function handleHealthCheck(regionId: string) {
    setActionLoading(`health-${regionId}`);
    try {
      const res = await fetch(`/api/admin/regions/${regionId}/health`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Health check failed");
      }

      // Refresh regions
      const regionsRes = await fetch("/api/admin/regions");
      const data = await regionsRes.json();
      setRegions(data.regions);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Health check failed");
    } finally {
      setActionLoading(null);
    }
  }

  // Trigger failover
  async function handleFailover(fromRegionId: string, toRegionId: string) {
    if (!confirm("Are you sure you want to trigger a failover? This will move all traffic to the target region.")) {
      return;
    }

    setActionLoading(`failover-${fromRegionId}`);
    try {
      const res = await fetch("/api/admin/failover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromRegionId, toRegionId, reason: "manual" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failover failed");
      }

      alert("Failover initiated successfully");
      // Refresh regions
      const regionsRes = await fetch("/api/admin/regions");
      const data = await regionsRes.json();
      setRegions(data.regions);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failover failed");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-8 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">{error}</p>
            <Link
              href="/settings"
              className="inline-block mt-4 px-4 py-2 bg-gray-800 rounded hover:bg-gray-700"
            >
              Back to Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:text-white">
          Dashboard
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/settings" className="hover:text-white">
          Settings
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">Regions</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Multi-Region Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure and monitor deployment regions worldwide
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-background text-foreground rounded-lg hover:bg-secondary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Region
        </button>
      </div>

      {/* Region Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Regions</div>
          <div className="text-2xl font-bold mt-1">{regions.length}</div>
        </div>
        <div className="border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Healthy</div>
          <div className="text-2xl font-bold mt-1 text-green-500">
            {regions.filter((r) => r.status === "healthy").length}
          </div>
        </div>
        <div className="border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Active Deployments</div>
          <div className="text-2xl font-bold mt-1">
            {regions.reduce((sum, r) => sum + r.activeDeployments, 0)}
          </div>
        </div>
        <div className="border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Replication Status</div>
          <div className="text-2xl font-bold mt-1">
            {replications.filter((r) => r.status === "synced").length}/{replications.length}
          </div>
        </div>
      </div>

      {/* Regions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Regions</h2>

        {regions.length === 0 ? (
          <div className="border border-gray-800 rounded-lg p-8 text-center">
            <Server className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Regions Configured</h3>
            <p className="text-muted-foreground mb-4">
              Add your first region to enable multi-region deployment.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/90"
            >
              Add Region
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {regions.map((region) => (
              <div
                key={region.id}
                className={`border rounded-lg p-4 ${
                  region.isPrimary ? "border-foreground bg-foreground/5" : "border-gray-800"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[region.status]}`} />
                      <h3 className="font-semibold text-lg">{region.displayName}</h3>
                      {region.isPrimary && (
                        <span className="px-2 py-0.5 text-xs bg-secondary text-[#0070f3] rounded">
                          Primary
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">({region.name})</span>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {region.country || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Server className="w-4 h-4" />
                        {region.activeDeployments}/{region.maxDeployments}
                      </span>
                      {region.latestHealth && (
                        <span className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          {region.latestHealth.latency}ms
                        </span>
                      )}
                      {region.provider && (
                        <span className="text-muted-foreground">{region.provider}</span>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      Last health check:{" "}
                      {region.lastHealthCheck
                        ? new Date(region.lastHealthCheck).toLocaleString()
                        : "Never"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleHealthCheck(region.id)}
                      disabled={actionLoading === `health-${region.id}`}
                      className="p-2 hover:bg-gray-800 rounded transition-colors"
                      title="Run health check"
                    >
                      {actionLoading === `health-${region.id}` ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>

                    {!region.isPrimary && regions.length > 1 && (
                      <button
                        onClick={() => {
                          const primaryRegion = regions.find((r) => r.isPrimary);
                          if (primaryRegion) {
                            handleFailover(primaryRegion.id, region.id);
                          }
                        }}
                        disabled={actionLoading?.startsWith("failover")}
                        className="p-2 hover:bg-gray-800 rounded transition-colors"
                        title="Failover to this region"
                      >
                        <Zap className="w-4 h-4 text-yellow-500" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status indicator */}
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    {STATUS_ICONS[region.status]}
                    <span className="capitalize">{region.status}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Priority: {region.priority}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Failovers: {region.failoverCount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Replication Status */}
      {replications.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Data Replication</h2>
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-muted-foreground">Source</th>
                  <th className="px-4 py-2 text-left text-muted-foreground">Target</th>
                  <th className="px-4 py-2 text-left text-muted-foreground">Type</th>
                  <th className="px-4 py-2 text-left text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-left text-muted-foreground">Lag</th>
                  <th className="px-4 py-2 text-left text-muted-foreground">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {replications.map((rep) => (
                  <tr key={rep.id} className="border-t border-gray-800">
                    <td className="px-4 py-2">{rep.sourceRegion.name}</td>
                    <td className="px-4 py-2">{rep.targetRegion.name}</td>
                    <td className="px-4 py-2">{rep.dataType}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          rep.status === "synced"
                            ? "bg-green-500/20 text-green-400"
                            : rep.status === "syncing"
                            ? "bg-secondary text-[#0070f3]"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {rep.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{rep.lagSeconds}s</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {rep.lastSyncAt ? new Date(rep.lastSyncAt).toLocaleString() : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add Region</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Region ID
                  </label>
                  <input
                    type="text"
                    value={newRegion.name}
                    onChange={(e) => setNewRegion({ ...newRegion, name: e.target.value })}
                    placeholder="us-east-1"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={newRegion.displayName}
                    onChange={(e) => setNewRegion({ ...newRegion, displayName: e.target.value })}
                    placeholder="US East"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Endpoint URL
                </label>
                <input
                  type="text"
                  value={newRegion.endpoint}
                  onChange={(e) => setNewRegion({ ...newRegion, endpoint: e.target.value })}
                  placeholder="https://us-east.cloudify.example.com"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={newRegion.country}
                    onChange={(e) => setNewRegion({ ...newRegion, country: e.target.value })}
                    placeholder="US"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Provider
                  </label>
                  <select
                    value={newRegion.provider}
                    onChange={(e) => setNewRegion({ ...newRegion, provider: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                  >
                    <option value="">Select provider</option>
                    <option value="aws">AWS</option>
                    <option value="gcp">Google Cloud</option>
                    <option value="azure">Azure</option>
                    <option value="cloudflare">Cloudflare</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={newRegion.priority}
                    onChange={(e) =>
                      setNewRegion({ ...newRegion, priority: parseInt(e.target.value) || 100 })
                    }
                    min={1}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Lower = higher priority</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Max Deployments
                  </label>
                  <input
                    type="number"
                    value={newRegion.maxDeployments}
                    onChange={(e) =>
                      setNewRegion({ ...newRegion, maxDeployments: parseInt(e.target.value) || 1000 })
                    }
                    min={1}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={newRegion.latitude}
                    onChange={(e) => setNewRegion({ ...newRegion, latitude: e.target.value })}
                    placeholder="37.7749"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={newRegion.longitude}
                    onChange={(e) => setNewRegion({ ...newRegion, longitude: e.target.value })}
                    placeholder="-122.4194"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-muted-foreground hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRegion}
                disabled={!newRegion.name || !newRegion.displayName || !newRegion.endpoint || actionLoading === "create"}
                className="px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading === "create" && <RefreshCw className="w-4 h-4 animate-spin" />}
                Add Region
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
