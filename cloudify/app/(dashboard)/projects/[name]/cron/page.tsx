"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
} from "lucide-react";

interface CronExecution {
  id: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  error?: string;
}

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  scheduleDescription: string;
  path: string;
  enabled: boolean;
  timezone: string;
  timeout: number;
  retryCount: number;
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus?: string;
  createdAt: string;
  recentExecutions: CronExecution[];
  totalExecutions: number;
}

interface NewCronJob {
  name: string;
  schedule: string;
  path: string;
  enabled: boolean;
  timezone: string;
  timeout: number;
  retryCount: number;
}

const SCHEDULE_PRESETS = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every 30 minutes", value: "*/30 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every day at midnight", value: "0 0 * * *" },
  { label: "Every day at noon", value: "0 12 * * *" },
  { label: "Every Monday at midnight", value: "0 0 * * 1" },
  { label: "First day of month", value: "0 0 1 * *" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default function CronJobsPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.name as string;

  const [project, setProject] = useState<{ id: string; name: string } | null>(null);
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [newJob, setNewJob] = useState<NewCronJob>({
    name: "",
    schedule: "0 * * * *",
    path: "/api/cron/",
    enabled: true,
    timezone: "UTC",
    timeout: 60,
    retryCount: 0,
  });

  // Fetch project and cron jobs
  useEffect(() => {
    async function fetchData() {
      try {
        // First get the project
        const projectRes = await fetch(`/api/projects/by-slug/${projectSlug}`);
        if (!projectRes.ok) {
          throw new Error("Project not found");
        }
        const projectData = await projectRes.json();
        setProject(projectData.project);

        // Then get cron jobs
        const jobsRes = await fetch(`/api/projects/${projectData.project.id}/cron`);
        if (!jobsRes.ok) {
          throw new Error("Failed to fetch cron jobs");
        }
        const jobsData = await jobsRes.json();
        setJobs(jobsData.jobs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectSlug]);

  // Create a new cron job
  async function handleCreateJob() {
    if (!project) return;

    setActionLoading("create");
    try {
      const res = await fetch(`/api/projects/${project.id}/cron`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newJob),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create cron job");
      }

      const data = await res.json();
      setJobs([data.job, ...jobs]);
      setShowCreateModal(false);
      setNewJob({
        name: "",
        schedule: "0 * * * *",
        path: "/api/cron/",
        enabled: true,
        timezone: "UTC",
        timeout: 60,
        retryCount: 0,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setActionLoading(null);
    }
  }

  // Toggle job enabled state
  async function handleToggleJob(job: CronJob) {
    if (!project) return;

    setActionLoading(job.id);
    try {
      const res = await fetch(`/api/projects/${project.id}/cron/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !job.enabled }),
      });

      if (!res.ok) {
        throw new Error("Failed to update job");
      }

      setJobs(jobs.map((j) => (j.id === job.id ? { ...j, enabled: !j.enabled } : j)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update job");
    } finally {
      setActionLoading(null);
    }
  }

  // Run job manually
  async function handleRunJob(job: CronJob) {
    if (!project) return;

    setActionLoading(`run-${job.id}`);
    try {
      const res = await fetch(`/api/projects/${project.id}/cron/${job.id}`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to trigger job");
      }

      alert("Job triggered successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to trigger job");
    } finally {
      setActionLoading(null);
    }
  }

  // Delete job
  async function handleDeleteJob(job: CronJob) {
    if (!project) return;
    if (!confirm(`Are you sure you want to delete "${job.name}"?`)) return;

    setActionLoading(`delete-${job.id}`);
    try {
      const res = await fetch(`/api/projects/${project.id}/cron/${job.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete job");
      }

      setJobs(jobs.filter((j) => j.id !== job.id));
      if (selectedJob?.id === job.id) {
        setSelectedJob(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete job");
    } finally {
      setActionLoading(null);
    }
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
        <span className="text-white">Cron Jobs</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Cron Jobs
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Schedule recurring tasks for your project
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-primary)] text-[var(--text-primary)] rounded-lg hover:bg-secondary transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </button>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="border border-gray-800 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Cron Jobs</h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Create your first cron job to run scheduled tasks.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/90"
          >
            Create Cron Job
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`border rounded-lg p-4 transition-colors ${
                selectedJob?.id === job.id
                  ? "border-foreground bg-foreground/5"
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        job.enabled ? "bg-green-500" : "bg-gray-500"
                      }`}
                    />
                    <h3 className="font-semibold">{job.name}</h3>
                    {job.lastStatus && (
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          job.lastStatus === "success"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {job.lastStatus}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                    <code className="bg-gray-800 px-2 py-0.5 rounded">
                      {job.schedule}
                    </code>
                    <span>{job.scheduleDescription}</span>
                    <span className="text-gray-600">|</span>
                    <span>{job.path}</span>
                  </div>
                  {job.nextRunAt && (
                    <div className="mt-2 text-sm text-[var(--text-secondary)]">
                      Next run: {new Date(job.nextRunAt).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunJob(job)}
                    disabled={actionLoading === `run-${job.id}`}
                    className="p-2 hover:bg-gray-800 rounded transition-colors"
                    title="Run now"
                  >
                    {actionLoading === `run-${job.id}` ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleJob(job)}
                    disabled={actionLoading === job.id}
                    className="p-2 hover:bg-gray-800 rounded transition-colors"
                    title={job.enabled ? "Disable" : "Enable"}
                  >
                    {job.enabled ? (
                      <Pause className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Play className="w-4 h-4 text-[var(--text-secondary)]" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job)}
                    disabled={actionLoading === `delete-${job.id}`}
                    className="p-2 hover:bg-gray-800 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Expanded view with execution history */}
              {selectedJob?.id === job.id && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                    Recent Executions ({job.totalExecutions} total)
                  </h4>
                  {job.recentExecutions.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">No executions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {job.recentExecutions.map((exec) => (
                        <div
                          key={exec.id}
                          className="flex items-center justify-between text-sm bg-gray-900 p-2 rounded"
                        >
                          <div className="flex items-center gap-2">
                            {exec.status === "success" ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : exec.status === "failed" ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <RefreshCw className="w-4 h-4 text-[#0070f3] animate-spin" />
                            )}
                            <span className="text-gray-300">
                              {new Date(exec.startedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[var(--text-secondary)]">
                            {exec.duration && <span>{exec.duration}ms</span>}
                            {exec.error && (
                              <span className="text-red-400 truncate max-w-xs" title={exec.error}>
                                {exec.error.substring(0, 50)}...
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Create Cron Job</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newJob.name}
                  onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                  placeholder="e.g., daily-cleanup"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Schedule (Cron Expression)
                </label>
                <input
                  type="text"
                  value={newJob.schedule}
                  onChange={(e) => setNewJob({ ...newJob, schedule: e.target.value })}
                  placeholder="* * * * *"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none font-mono"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {SCHEDULE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setNewJob({ ...newJob, schedule: preset.value })}
                      className={`text-xs px-2 py-1 rounded ${
                        newJob.schedule === preset.value
                          ? "bg-foreground text-background"
                          : "bg-gray-800 text-[var(--text-secondary)] hover:bg-gray-700"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Endpoint Path
                </label>
                <input
                  type="text"
                  value={newJob.path}
                  onChange={(e) => setNewJob({ ...newJob, path: e.target.value })}
                  placeholder="/api/cron/my-job"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none font-mono"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  The path to your API route that will be called (POST request)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Timezone
                  </label>
                  <select
                    value={newJob.timezone}
                    onChange={(e) => setNewJob({ ...newJob, timezone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={newJob.timeout}
                    onChange={(e) =>
                      setNewJob({ ...newJob, timeout: parseInt(e.target.value) || 60 })
                    }
                    min={1}
                    max={300}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-foreground outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newJob.enabled}
                  onChange={(e) => setNewJob({ ...newJob, enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enabled" className="text-sm text-[var(--text-secondary)]">
                  Enable immediately after creation
                </label>
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
                onClick={handleCreateJob}
                disabled={!newJob.name || !newJob.schedule || !newJob.path || actionLoading === "create"}
                className="px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading === "create" && <RefreshCw className="w-4 h-4 animate-spin" />}
                Create Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
