export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  framework: Framework;
  domain: string;
  gitRepo?: string;
  status: DeploymentStatus;
  createdAt: Date;
  updatedAt: Date;
  lastDeployment?: Deployment;
  userId: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  url: string;
  branch: string;
  commit: string;
  commitMessage?: string;
  createdAt: Date;
  readyAt?: Date;
  duration?: number;
}

export interface Domain {
  id: string;
  name: string;
  projectId: string;
  verified: boolean;
  createdAt: Date;
}

export interface Analytics {
  projectId: string;
  visitors: number;
  pageViews: number;
  bandwidth: number;
  requests: number;
  period: string;
}

export interface ServerlessFunction {
  id: string;
  projectId: string;
  name: string;
  runtime: string;
  region: string;
  invocations: number;
  avgDuration: number;
}

export type DeploymentStatus =
  | "queued"
  | "building"
  | "ready"
  | "error"
  | "canceled";

export type Framework =
  | "nextjs"
  | "react"
  | "vue"
  | "nuxt"
  | "svelte"
  | "sveltekit"
  | "astro"
  | "remix"
  | "gatsby"
  | "angular"
  | "static"
  | "other";

export interface Template {
  id: string;
  name: string;
  description: string;
  framework: Framework;
  repo: string;
  demo: string;
  image: string;
}
