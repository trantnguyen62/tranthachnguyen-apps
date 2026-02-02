// Project test factory
let projectIdCounter = 1;

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  userId: string;
  repoUrl?: string;
  repoBranch: string;
  framework: string;
  buildCmd: string;
  outputDir: string;
  installCmd: string;
  rootDir: string;
  nodeVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export function createMockProject(overrides: Partial<MockProject> = {}): MockProject {
  const id = `proj-${projectIdCounter++}`;
  const name = overrides.name || `Test Project ${projectIdCounter}`;
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    userId: "user-1",
    repoUrl: "https://github.com/test/repo",
    repoBranch: "main",
    framework: "nextjs",
    buildCmd: "npm run build",
    outputDir: ".next",
    installCmd: "npm install",
    rootDir: "./",
    nodeVersion: "20",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function resetProjectFactory() {
  projectIdCounter = 1;
}
