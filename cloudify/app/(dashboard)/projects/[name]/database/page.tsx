"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Database,
  Plus,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Trash2,
  HardDrive,
  Activity,
  Download,
  Upload,
  ChevronRight,
  Server,
} from "lucide-react";

interface ManagedDatabase {
  id: string;
  name: string;
  type: string;
  provider: string;
  status: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  sslMode: string;
  plan: string;
  storageLimit: number;
  connectionLimit: number;
  storageUsed: number;
  connectionsActive: number;
  region: string;
  version?: string;
  createdAt: string;
}

interface DatabaseMetric {
  timestamp: string;
  queryCount: number;
  avgQueryTime: number;
  slowQueries: number;
  cpuUsage?: number;
  memoryUsage?: number;
  storageUsage?: number;
  connections: number;
}

interface Backup {
  id: string;
  type: string;
  status: string;
  size?: number;
  startedAt: string;
  completedAt?: string;
}

const DATABASE_TYPES = [
  { id: "postgresql", name: "PostgreSQL", icon: "🐘" },
  { id: "mysql", name: "MySQL", icon: "🐬" },
  { id: "redis", name: "Redis", icon: "🔴" },
];

const PLANS = [
  { id: "hobby", name: "Hobby", storage: 512, connections: 5 },
  { id: "pro", name: "Pro", storage: 5120, connections: 25 },
  { id: "enterprise", name: "Enterprise", storage: 51200, connections: 100 },
];

export default function DatabasePage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.name as string;

  const [project, setProject] = useState<{ id: string; name: string } | null>(null);
  const [databases, setDatabases] = useState<ManagedDatabase[]>([]);
  const [selectedDb, setSelectedDb] = useState<ManagedDatabase | null>(null);
  const [metrics, setMetrics] = useState<DatabaseMetric[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [newDb, setNewDb] = useState({
    name: "",
    type: "postgresql",
    plan: "hobby",
  });

  // Fetch project and databases
  useEffect(() => {
    async function fetchData() {
      try {
        // Get the project
        const projectRes = await fetch(`/api/projects/by-slug/${projectSlug}`);
        if (!projectRes.ok) {
          throw new Error("Project not found");
        }
        const projectData = await projectRes.json();
        setProject(projectData.project);

        // Get databases
        const dbRes = await fetch(`/api/projects/${projectData.project.id}/database`);
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          setDatabases(dbData.databases || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectSlug]);

  // Fetch metrics and backups when a database is selected
  useEffect(() => {
    if (!selectedDb || !project) return;

    async function fetchDbDetails() {
      try {
        const [metricsRes, backupsRes] = await Promise.all([
          fetch(`/api/projects/${project!.id}/database/${selectedDb!.id}/metrics`),
          fetch(`/api/projects/${project!.id}/database/${selectedDb!.id}/backups`),
        ]);

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData.metrics || []);
        }

        if (backupsRes.ok) {
          const backupsData = await backupsRes.json();
          setBackups(backupsData.backups || []);
        }
      } catch (err) {
        console.error("Failed to fetch database details:", err);
      }
    }

    fetchDbDetails();
  }, [selectedDb, project]);

  // Create database
  async function handleCreateDatabase() {
    if (!project) return;

    setActionLoading("create");
    try {
      const res = await fetch(`/api/projects/${project.id}/database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDb),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create database");
      }

      const data = await res.json();
      setDatabases([...databases, data.database]);
      setShowCreateModal(false);
      setNewDb({ name: "", type: "postgresql", plan: "hobby" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create database");
    } finally {
      setActionLoading(null);
    }
  }

  // Delete database
  async function handleDeleteDatabase(db: ManagedDatabase) {
    if (!project) return;
    if (!confirm(`Are you sure you want to delete "${db.name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(`delete-${db.id}`);
    try {
      const res = await fetch(`/api/projects/${project.id}/database/${db.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete database");
      }

      setDatabases(databases.filter((d) => d.id !== db.id));
      if (selectedDb?.id === db.id) {
        setSelectedDb(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete database");
    } finally {
      setActionLoading(null);
    }
  }

  // Create backup
  async function handleCreateBackup() {
    if (!project || !selectedDb) return;

    setActionLoading("backup");
    try {
      const res = await fetch(`/api/projects/${project.id}/database/${selectedDb.id}/backups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "manual" }),
      });

      if (!res.ok) {
        throw new Error("Failed to create backup");
      }

      const data = await res.json();
      setBackups([data.backup, ...backups]);
      alert("Backup initiated successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create backup");
    } finally {
      setActionLoading(null);
    }
  }

  // Copy connection string
  function copyConnectionString() {
    if (!selectedDb) return;

    let connString = "";
    switch (selectedDb.type) {
      case "postgresql":
        connString = `postgresql://${selectedDb.username}:${selectedDb.password || "[PASSWORD]"}@${selectedDb.host}:${selectedDb.port}/${selectedDb.database}?sslmode=${selectedDb.sslMode}`;
        break;
      case "mysql":
        connString = `mysql://${selectedDb.username}:${selectedDb.password || "[PASSWORD]"}@${selectedDb.host}:${selectedDb.port}/${selectedDb.database}`;
        break;
      case "redis":
        connString = `redis://:${selectedDb.password || "[PASSWORD]"}@${selectedDb.host}:${selectedDb.port}`;
        break;
    }

    navigator.clipboard.writeText(connString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-800 rounded hover:bg-gray-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-6">
        <Link href="/dashboard" className="hover:text-white">
          Dashboard
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/projects/${projectSlug}`} className="hover:text-white">
          {project?.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">Database</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="w-6 h-6" />
            Managed Databases
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Provision and manage databases for your project
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-primary)] text-[var(--text-primary)] rounded-lg hover:bg-secondary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Database
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Database List */}
        <div className="col-span-1 space-y-4">
          {databases.length === 0 ? (
            <div className="border border-gray-800 rounded-lg p-6 text-center">
              <Server className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] mb-4">No databases yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/90"
              >
                Create Database
              </button>
            </div>
          ) : (
            databases.map((db) => (
              <button
                key={db.id}
                onClick={() => setSelectedDb(db)}
                className={`w-full text-left border rounded-lg p-4 transition-colors ${
                  selectedDb?.id === db.id
                    ? "border-foreground bg-foreground/5"
                    : "border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {DATABASE_TYPES.find((t) => t.id === db.type)?.icon || "💾"}
                  </span>
                  <div>
                    <div className="font-semibold">{db.name}</div>
                    <div className="text-sm text-[var(--text-secondary)] capitalize">{db.type}</div>
                  </div>
                  <span
                    className={`ml-auto px-2 py-0.5 text-xs rounded ${
                      db.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : db.status === "provisioning"
                        ? "bg-[var(--surface-secondary)] text-[#0070f3]"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {db.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Database Details */}
        <div className="col-span-2">
          {selectedDb ? (
            <div className="space-y-6">
              {/* Connection Info */}
              <div className="border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  Connection Details
                  <button
                    onClick={copyConnectionString}
                    className="ml-auto text-sm text-[#0070f3] hover:text-[var(--text-primary)]/70 flex items-center gap-1"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy connection string"}
                  </button>
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[var(--text-secondary)]">Host</div>
                    <div className="font-mono">{selectedDb.host}</div>
                  </div>
                  <div>
                    <div className="text-[var(--text-secondary)]">Port</div>
                    <div className="font-mono">{selectedDb.port}</div>
                  </div>
                  <div>
                    <div className="text-[var(--text-secondary)]">Database</div>
                    <div className="font-mono">{selectedDb.database}</div>
                  </div>
                  <div>
                    <div className="text-[var(--text-secondary)]">Username</div>
                    <div className="font-mono">{selectedDb.username}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[var(--text-secondary)] flex items-center gap-2">
                      Password
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[var(--text-secondary)] hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="font-mono">
                      {showPassword ? selectedDb.password || "••••••••" : "••••••••"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="border border-gray-800 rounded-lg p-4">
                <h3 className="font-semibold mb-4">Usage</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-[var(--text-secondary)]">Storage</div>
                    <div className="text-lg font-semibold">
                      {selectedDb.storageUsed} / {selectedDb.storageLimit} MB
                    </div>
                    <div className="mt-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground"
                        style={{
                          width: `${(selectedDb.storageUsed / selectedDb.storageLimit) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--text-secondary)]">Connections</div>
                    <div className="text-lg font-semibold">
                      {selectedDb.connectionsActive} / {selectedDb.connectionLimit}
                    </div>
                    <div className="mt-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(selectedDb.connectionsActive / selectedDb.connectionLimit) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-[var(--text-secondary)]">Plan</div>
                    <div className="text-lg font-semibold capitalize">{selectedDb.plan}</div>
                  </div>
                </div>
              </div>

              {/* Backups */}
              <div className="border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Backups</h3>
                  <button
                    onClick={handleCreateBackup}
                    disabled={actionLoading === "backup"}
                    className="flex items-center gap-1 text-sm text-[#0070f3] hover:text-[var(--text-primary)]/70"
                  >
                    {actionLoading === "backup" ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Create Backup
                  </button>
                </div>

                {backups.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">No backups yet</p>
                ) : (
                  <div className="space-y-2">
                    {backups.slice(0, 5).map((backup) => (
                      <div
                        key={backup.id}
                        className="flex items-center justify-between text-sm bg-gray-900 p-2 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span>{new Date(backup.startedAt).toLocaleString()}</span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${
                              backup.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : backup.status === "in_progress"
                                ? "bg-[var(--surface-secondary)] text-[#0070f3]"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {backup.status}
                          </span>
                        </div>
                        {backup.size && (
                          <span className="text-[var(--text-secondary)]">
                            {(backup.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleDeleteDatabase(selectedDb)}
                  disabled={actionLoading === `delete-${selectedDb.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                >
                  {actionLoading === `delete-${selectedDb.id}` ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete Database
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-gray-800 rounded-lg p-8 text-center">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">Select a database to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Create Database</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Database Name
                </label>
                <input
                  type="text"
                  value={newDb.name}
                  onChange={(e) => setNewDb({ ...newDb, name: e.target.value })}
                  placeholder="my-database"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Database Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {DATABASE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setNewDb({ ...newDb, type: type.id })}
                      className={`p-4 border rounded-lg text-center transition-colors ${
                        newDb.type === type.id
                          ? "border-foreground bg-[var(--surface-secondary)]"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm">{type.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Plan
                </label>
                <div className="space-y-2">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setNewDb({ ...newDb, plan: plan.id })}
                      className={`w-full p-3 border rounded-lg text-left transition-colors ${
                        newDb.plan === plan.id
                          ? "border-foreground bg-[var(--surface-secondary)]"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-sm text-[var(--text-secondary)]">
                          {plan.storage} MB / {plan.connections} connections
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDatabase}
                disabled={!newDb.name || actionLoading === "create"}
                className="px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading === "create" && <RefreshCw className="w-4 h-4 animate-spin" />}
                Create Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
