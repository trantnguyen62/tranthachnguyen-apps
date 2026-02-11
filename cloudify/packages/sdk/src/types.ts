/**
 * Cloudify SDK Types
 */

// ============================================================================
// Common Types
// ============================================================================

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode: number;
}

// ============================================================================
// Project Types
// ============================================================================

export type Framework =
  | "nextjs"
  | "react"
  | "vue"
  | "nuxt"
  | "astro"
  | "svelte"
  | "sveltekit"
  | "remix"
  | "gatsby"
  | "vite"
  | "static"
  | "other";

export interface Project {
  id: string;
  name: string;
  slug: string;
  framework: Framework;
  gitRepository?: string;
  gitBranch?: string;
  productionBranch: string;
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  rootDirectory?: string;
  nodeVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  slug?: string;
  framework?: Framework;
  gitRepository?: string;
  gitBranch?: string;
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  rootDirectory?: string;
}

export interface UpdateProjectInput {
  name?: string;
  framework?: Framework;
  gitBranch?: string;
  productionBranch?: string;
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  rootDirectory?: string;
  nodeVersion?: string;
}

// ============================================================================
// Deployment Types
// ============================================================================

export type DeploymentStatus =
  | "QUEUED"
  | "BUILDING"
  | "DEPLOYING"
  | "READY"
  | "ERROR"
  | "CANCELLED";

export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  url?: string;
  branch?: string;
  commit?: string;
  commitMessage?: string;
  buildLogs?: string;
  isProduction: boolean;
  createdAt: string;
  readyAt?: string;
  buildTime?: number;
}

export interface CreateDeploymentInput {
  projectId: string;
  branch?: string;
  commit?: string;
  isProduction?: boolean;
}

export interface DeployFileInput {
  projectId: string;
  file: Blob | Buffer;
  production?: boolean;
}

// ============================================================================
// Domain Types
// ============================================================================

export type SSLStatus = "pending" | "active" | "error" | "expired";

export interface Domain {
  id: string;
  projectId: string;
  domain: string;
  verified: boolean;
  isPrimary: boolean;
  sslStatus: SSLStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DNSRecord {
  type: "A" | "AAAA" | "CNAME" | "TXT";
  name: string;
  value: string;
}

export interface AddDomainInput {
  domain: string;
  isPrimary?: boolean;
}

export interface AddDomainResponse {
  domain: Domain;
  dnsRecords: DNSRecord[];
}

// ============================================================================
// Environment Variable Types
// ============================================================================

export type EnvTarget = "production" | "preview" | "development";

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  target: EnvTarget[];
  createdAt: string;
  updatedAt: string;
}

export interface SetEnvInput {
  key: string;
  value: string;
  target?: EnvTarget[];
}

// ============================================================================
// Function Types
// ============================================================================

export type FunctionRuntime = "nodejs18" | "nodejs20" | "edge";

export interface ServerlessFunction {
  id: string;
  projectId: string;
  name: string;
  runtime: FunctionRuntime;
  entryPoint: string;
  timeout: number;
  memory: number;
  regions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateFunctionInput {
  name: string;
  runtime?: FunctionRuntime;
  entryPoint: string;
  code: string;
  timeout?: number;
  memory?: number;
  regions?: string[];
}

export interface FunctionInvocation {
  id: string;
  functionId: string;
  status: "success" | "error";
  duration: number;
  memory: number;
  response?: unknown;
  error?: string;
  createdAt: string;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface BlobStore {
  id: string;
  projectId: string;
  name: string;
  isPublic: boolean;
  totalSize: number;
  blobCount: number;
  createdAt: string;
}

export interface Blob {
  id: string;
  storeId: string;
  pathname: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface UploadBlobInput {
  pathname: string;
  content: Blob | Buffer | string;
  contentType?: string;
}

export interface KVStore {
  id: string;
  projectId: string;
  name: string;
  keyCount: number;
  createdAt: string;
}

export interface KVEntry {
  key: string;
  value: string;
  expiresAt?: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsData {
  pageviews: number;
  visitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: Array<{ path: string; views: number }>;
  topReferrers: Array<{ source: string; visits: number }>;
  countries: Array<{ country: string; visitors: number }>;
  devices: Array<{ device: string; visitors: number }>;
}

export interface WebVitals {
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  fcp: number;
  inp: number;
}

// ============================================================================
// Team Types
// ============================================================================

export type TeamRole = "owner" | "admin" | "member" | "viewer";

export interface Team {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  email: string;
  name: string;
  joinedAt: string;
}

export interface InviteTeamMemberInput {
  email: string;
  role?: TeamRole;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

// ============================================================================
// Cron Types
// ============================================================================

export interface CronJob {
  id: string;
  projectId: string;
  name: string;
  schedule: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCronJobInput {
  name: string;
  schedule: string;
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  enabled?: boolean;
}

export interface CronExecution {
  id: string;
  cronJobId: string;
  status: "success" | "error";
  duration: number;
  response?: string;
  error?: string;
  executedAt: string;
}

// ============================================================================
// SDK Options
// ============================================================================

export interface CloudifyOptions {
  token: string;
  baseUrl?: string;
}
