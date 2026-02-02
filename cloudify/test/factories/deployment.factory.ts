// Deployment test factory
let deploymentIdCounter = 1;

export type DeploymentStatus = "QUEUED" | "BUILDING" | "DEPLOYING" | "READY" | "ERROR" | "CANCELLED";

export interface MockDeployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  commitSha?: string;
  commitMsg?: string;
  branch: string;
  url?: string;
  buildTime?: number;
  artifactPath?: string;
  siteSlug?: string;
  createdAt: Date;
  updatedAt: Date;
  finishedAt?: Date;
}

export function createMockDeployment(overrides: Partial<MockDeployment> = {}): MockDeployment {
  const id = `deploy-${deploymentIdCounter++}`;
  return {
    id,
    projectId: "proj-1",
    status: "QUEUED",
    commitSha: "abc123def456",
    commitMsg: "Test commit message",
    branch: "main",
    url: undefined,
    buildTime: undefined,
    artifactPath: undefined,
    siteSlug: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    finishedAt: undefined,
    ...overrides,
  };
}

export interface MockDeploymentLog {
  id: string;
  deploymentId: string;
  level: "info" | "warn" | "error" | "success";
  message: string;
  timestamp: Date;
}

let logIdCounter = 1;

export function createMockLog(overrides: Partial<MockDeploymentLog> = {}): MockDeploymentLog {
  const id = `log-${logIdCounter++}`;
  return {
    id,
    deploymentId: "deploy-1",
    level: "info",
    message: "Test log message",
    timestamp: new Date(),
    ...overrides,
  };
}

export function resetDeploymentFactory() {
  deploymentIdCounter = 1;
  logIdCounter = 1;
}
