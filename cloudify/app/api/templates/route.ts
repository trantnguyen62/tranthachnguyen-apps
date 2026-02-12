/**
 * Deploy Templates API
 *
 * GET  /api/templates - Returns list of available deploy templates
 * POST /api/templates - Creates a project from a template
 */

import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("templates");

/**
 * Template definition with metadata for the gallery UI
 */
interface Template {
  id: string;
  name: string;
  description: string;
  framework: string;
  category: string;
  repoUrl: string;
  branch: string;
  buildCmd: string;
  installCmd: string;
  outputDir: string;
  nodeVersion: string;
  icon: string;
  gradient: string;
  featured: boolean;
}

/**
 * Built-in templates available for one-click deploy.
 * These correspond to the projects in the examples/ directory
 * and can be extended with community templates.
 */
const TEMPLATES: Template[] = [
  {
    id: "nextjs-starter",
    name: "Next.js Starter",
    description:
      "Minimal Next.js app with TypeScript, API routes, and static export. Perfect for getting started.",
    framework: "Next.js",
    category: "Starter",
    repoUrl: "https://github.com/cloudify-platform/nextjs-starter",
    branch: "main",
    buildCmd: "npm run build",
    installCmd: "npm install",
    outputDir: "out",
    nodeVersion: "20",
    icon: "\u25B2",
    gradient: "from-black to-gray-700",
    featured: true,
  },
  {
    id: "static-site",
    name: "Static Site",
    description:
      "Clean HTML/CSS static site with zero build step. Just push and deploy.",
    framework: "Static",
    category: "Starter",
    repoUrl: "https://github.com/cloudify-platform/static-site",
    branch: "main",
    buildCmd: "",
    installCmd: "",
    outputDir: ".",
    nodeVersion: "20",
    icon: "\uD83C\uDF10",
    gradient: "from-blue-500 to-cyan-500",
    featured: true,
  },
  {
    id: "react-vite",
    name: "React + Vite",
    description:
      "Modern React app with Vite for lightning-fast builds and HMR. TypeScript included.",
    framework: "Vite",
    category: "Starter",
    repoUrl: "https://github.com/cloudify-platform/react-vite",
    branch: "main",
    buildCmd: "tsc && vite build",
    installCmd: "npm install",
    outputDir: "dist",
    nodeVersion: "20",
    icon: "\u269B\uFE0F",
    gradient: "from-cyan-500 to-blue-600",
    featured: true,
  },
  {
    id: "nextjs-commerce",
    name: "Next.js Commerce",
    description:
      "High-performance, server-rendered ecommerce storefront powered by Next.js and Tailwind CSS.",
    framework: "Next.js",
    category: "E-commerce",
    repoUrl: "https://github.com/cloudify-platform/nextjs-commerce",
    branch: "main",
    buildCmd: "npm run build",
    installCmd: "npm install",
    outputDir: ".next",
    nodeVersion: "20",
    icon: "\uD83D\uDED2",
    gradient: "from-indigo-600 to-purple-600",
    featured: false,
  },
  {
    id: "nextjs-blog",
    name: "Blog Starter",
    description:
      "Statically generated blog with Markdown support and Tailwind CSS styling.",
    framework: "Next.js",
    category: "Blog",
    repoUrl: "https://github.com/cloudify-platform/nextjs-blog",
    branch: "main",
    buildCmd: "npm run build",
    installCmd: "npm install",
    outputDir: "out",
    nodeVersion: "20",
    icon: "\u270D\uFE0F",
    gradient: "from-green-500 to-emerald-500",
    featured: false,
  },
  {
    id: "ai-chatbot",
    name: "AI Chatbot",
    description:
      "GPT-powered chatbot with streaming responses and conversation history.",
    framework: "Next.js",
    category: "AI",
    repoUrl: "https://github.com/cloudify-platform/ai-chatbot",
    branch: "main",
    buildCmd: "npm run build",
    installCmd: "npm install",
    outputDir: ".next",
    nodeVersion: "20",
    icon: "\uD83E\uDD16",
    gradient: "from-violet-500 to-purple-600",
    featured: false,
  },
];

// GET /api/templates - List available templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const framework = searchParams.get("framework");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let filtered = TEMPLATES;

    if (framework && framework !== "All") {
      filtered = filtered.filter((t) => t.framework === framework);
    }

    if (category && category !== "All") {
      filtered = filtered.filter((t) => t.category === category);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.framework.toLowerCase().includes(searchLower)
      );
    }

    return ok({
      templates: filtered,
      total: filtered.length,
      frameworks: [...new Set(TEMPLATES.map((t) => t.framework))],
      categories: [...new Set(TEMPLATES.map((t) => t.category))],
    });
  } catch (error) {
    log.error("Failed to list templates", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("INTERNAL_ERROR", "Failed to list templates", 500);
  }
}

// POST /api/templates - Create a project from a template
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWriteAccess(request);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    let body;
    try {
      body = await request.json();
    } catch {
      return fail("VALIDATION_ERROR", "Invalid request body", 400);
    }

    const { templateId, projectName } = body;

    if (!templateId) {
      return fail("VALIDATION_MISSING_FIELD", "templateId is required", 400);
    }

    // Find the template
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      return fail("NOT_FOUND", "Template not found", 404);
    }

    // Generate a unique slug
    const baseName = projectName || template.id;
    const baseSlug = baseName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.project.findFirst({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the project from the template
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: projectName || template.name,
        slug,
        repositoryUrl: template.repoUrl,
        repositoryBranch: template.branch,
        framework: template.framework.toLowerCase(),
        buildCommand: template.buildCmd,
        outputDirectory: template.outputDir,
        installCommand: template.installCmd,
        rootDirectory: ".",
        nodeVersion: template.nodeVersion,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        projectId: project.id,
        type: "project",
        action: "project.created_from_template",
        description: `Created project from template: ${template.name}`,
        metadata: {
          templateId: template.id,
          templateName: template.name,
          framework: template.framework,
        },
      },
    });

    log.info("Project created from template", {
      projectId: project.id,
      templateId: template.id,
      userId: user.id,
    });

    return ok(
      {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          repoUrl: project.repositoryUrl,
          repoBranch: project.repositoryBranch,
          framework: project.framework,
          buildCmd: project.buildCommand,
          outputDir: project.outputDirectory,
        },
        template: {
          id: template.id,
          name: template.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    log.error("Failed to create project from template", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("INTERNAL_ERROR", "Failed to create project from template", 500);
  }
}
