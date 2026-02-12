/**
 * Deployment Diff Service
 * Compares deployments to show changes between versions
 */

import { prisma } from "@/lib/prisma";

export interface FileDiff {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
  oldPath?: string;
  patch?: string;
}

export interface DeploymentDiff {
  deploymentId: string;
  previousDeploymentId: string;
  commitDiff: {
    from: string;
    to: string;
    commits: Array<{
      sha: string;
      message: string;
      author: string;
      date: string;
    }>;
  };
  fileDiff: {
    files: FileDiff[];
    additions: number;
    deletions: number;
    changedFiles: number;
  };
  envDiff: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  configDiff: {
    buildCmd: { old?: string; new?: string } | null;
    outputDir: { old?: string; new?: string } | null;
    nodeVersion: { old?: string; new?: string } | null;
    framework: { old?: string; new?: string } | null;
  };
  stats: {
    buildTimeChange: number; // positive = slower, negative = faster
    bundleSizeChange: number; // bytes
  };
}

/**
 * Get diff between two deployments
 */
export async function getDeploymentDiff(
  deploymentId: string,
  previousDeploymentId?: string
): Promise<DeploymentDiff | null> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: {
      project: true,
    },
  });

  if (!deployment) {
    return null;
  }

  // If no previous deployment specified, get the one before this
  let previousDeployment;
  if (previousDeploymentId) {
    previousDeployment = await prisma.deployment.findUnique({
      where: { id: previousDeploymentId },
    });
  } else {
    previousDeployment = await prisma.deployment.findFirst({
      where: {
        projectId: deployment.projectId,
        createdAt: { lt: deployment.createdAt },
        status: "READY",
      },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!previousDeployment) {
    // First deployment, no diff available
    return {
      deploymentId,
      previousDeploymentId: "",
      commitDiff: {
        from: "",
        to: deployment.commitSha || "",
        commits: [],
      },
      fileDiff: {
        files: [],
        additions: 0,
        deletions: 0,
        changedFiles: 0,
      },
      envDiff: {
        added: [],
        removed: [],
        modified: [],
      },
      configDiff: {
        buildCmd: null,
        outputDir: null,
        nodeVersion: null,
        framework: null,
      },
      stats: {
        buildTimeChange: 0,
        bundleSizeChange: 0,
      },
    };
  }

  // Get commit diff (if Git repo connected)
  const commitDiff = await getCommitDiff(
    deployment.project.repositoryUrl,
    previousDeployment.commitSha,
    deployment.commitSha
  );

  // Get file diff
  const fileDiff = await getFileDiff(
    deployment.project.repositoryUrl,
    previousDeployment.commitSha,
    deployment.commitSha
  );

  // Get environment variable diff
  const envDiff = await getEnvDiff(
    deployment.projectId,
    previousDeployment.createdAt,
    deployment.createdAt
  );

  // Calculate stats diff
  const buildTimeChange = (deployment.buildTime || 0) - (previousDeployment.buildTime || 0);

  return {
    deploymentId,
    previousDeploymentId: previousDeployment.id,
    commitDiff,
    fileDiff,
    envDiff,
    configDiff: {
      buildCmd: null, // Would compare project config snapshots
      outputDir: null,
      nodeVersion: null,
      framework: null,
    },
    stats: {
      buildTimeChange,
      bundleSizeChange: 0, // Would need build artifact size tracking
    },
  };
}

/**
 * Get commit diff between two SHAs
 */
async function getCommitDiff(
  repoUrl: string | null,
  fromSha: string | null,
  toSha: string | null
): Promise<DeploymentDiff["commitDiff"]> {
  if (!repoUrl || !fromSha || !toSha) {
    return {
      from: fromSha || "",
      to: toSha || "",
      commits: [],
    };
  }

  // Parse GitHub repo URL
  const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
  if (!match) {
    return { from: fromSha, to: toSha, commits: [] };
  }

  const [, owner, repo] = match;

  try {
    // Use GitHub API to get commits
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/compare/${fromSha}...${toSha}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );

    if (!response.ok) {
      return { from: fromSha, to: toSha, commits: [] };
    }

    const data = await response.json();

    return {
      from: fromSha,
      to: toSha,
      commits: data.commits?.map((c: any) => ({
        sha: c.sha.substring(0, 7),
        message: c.commit.message.split("\n")[0],
        author: c.commit.author.name,
        date: c.commit.author.date,
      })) || [],
    };
  } catch (error) {
    console.error("Failed to fetch commit diff:", error);
    return { from: fromSha, to: toSha, commits: [] };
  }
}

/**
 * Get file diff between two commits
 */
async function getFileDiff(
  repoUrl: string | null,
  fromSha: string | null,
  toSha: string | null
): Promise<DeploymentDiff["fileDiff"]> {
  if (!repoUrl || !fromSha || !toSha) {
    return { files: [], additions: 0, deletions: 0, changedFiles: 0 };
  }

  const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
  if (!match) {
    return { files: [], additions: 0, deletions: 0, changedFiles: 0 };
  }

  const [, owner, repo] = match;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/compare/${fromSha}...${toSha}`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          }),
        },
      }
    );

    if (!response.ok) {
      return { files: [], additions: 0, deletions: 0, changedFiles: 0 };
    }

    const data = await response.json();

    const files: FileDiff[] = (data.files || []).map((f: any) => ({
      path: f.filename,
      status: f.status as FileDiff["status"],
      additions: f.additions,
      deletions: f.deletions,
      oldPath: f.previous_filename,
      patch: f.patch?.substring(0, 1000), // Truncate large patches
    }));

    return {
      files,
      additions: files.reduce((sum, f) => sum + f.additions, 0),
      deletions: files.reduce((sum, f) => sum + f.deletions, 0),
      changedFiles: files.length,
    };
  } catch (error) {
    console.error("Failed to fetch file diff:", error);
    return { files: [], additions: 0, deletions: 0, changedFiles: 0 };
  }
}

/**
 * Get environment variable changes between deployments
 */
async function getEnvDiff(
  projectId: string,
  fromDate: Date,
  toDate: Date
): Promise<DeploymentDiff["envDiff"]> {
  // Get env vars at each point in time
  // This is simplified - in reality we'd need versioning
  const envVars = await prisma.envVariable.findMany({
    where: { projectId },
    select: { key: true, createdAt: true, updatedAt: true },
  });

  const added: string[] = [];
  const modified: string[] = [];

  for (const env of envVars) {
    if (env.createdAt > fromDate && env.createdAt <= toDate) {
      added.push(env.key);
    } else if (env.updatedAt > fromDate && env.updatedAt <= toDate) {
      modified.push(env.key);
    }
  }

  return {
    added,
    removed: [], // Would need deletion tracking
    modified,
  };
}

/**
 * Get deployment comparison summary
 */
export async function getDeploymentComparisonSummary(
  deploymentId: string
): Promise<{
  hasChanges: boolean;
  summary: string;
  commitCount: number;
  fileCount: number;
}> {
  const diff = await getDeploymentDiff(deploymentId);

  if (!diff || !diff.previousDeploymentId) {
    return {
      hasChanges: false,
      summary: "Initial deployment",
      commitCount: 0,
      fileCount: 0,
    };
  }

  const commitCount = diff.commitDiff.commits.length;
  const fileCount = diff.fileDiff.changedFiles;

  let summary = "";
  if (commitCount > 0) {
    summary += `${commitCount} commit${commitCount !== 1 ? "s" : ""}`;
  }
  if (fileCount > 0) {
    if (summary) summary += ", ";
    summary += `${fileCount} file${fileCount !== 1 ? "s" : ""} changed`;
  }

  return {
    hasChanges: commitCount > 0 || fileCount > 0,
    summary: summary || "No changes detected",
    commitCount,
    fileCount,
  };
}
