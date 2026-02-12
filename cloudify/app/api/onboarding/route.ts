import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAuthError } from "@/lib/auth/api-auth";
import { getRouteLogger } from "@/lib/api/logger";
import { ok, fail } from "@/lib/api/response";

const log = getRouteLogger("onboarding");

const ONBOARDING_STEPS = [
  { id: 1, name: "profile", label: "Set up profile" },
  { id: 2, name: "repository", label: "Connect repository" },
  { id: 3, name: "configure", label: "Configure project" },
  { id: 4, name: "deploy", label: "Deploy" },
  { id: 5, name: "success", label: "Success" },
] as const;

// GET /api/onboarding - Returns onboarding status for current user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (isAuthError(authResult)) return authResult;
    const { user: authUser } = authResult;

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        image: true,
        onboardingCompleted: true,
        onboardingStep: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!user) {
      return fail("NOT_FOUND", "User not found", 404);
    }

    // If user has projects, they've effectively completed onboarding
    const hasProjects = user._count.projects > 0;

    return ok({
      completed: user.onboardingCompleted || hasProjects,
      currentStep: user.onboardingStep,
      hasProjects,
      steps: ONBOARDING_STEPS.map((step) => ({
        ...step,
        completed: step.id < user.onboardingStep,
        current: step.id === user.onboardingStep,
      })),
      user: {
        name: user.name,
        image: user.image,
      },
    });
  } catch (error) {
    log.error("Failed to fetch onboarding status", error);
    return fail("INTERNAL_ERROR", "Failed to fetch onboarding status", 500);
  }
}

// POST /api/onboarding - Mark a step as completed or update onboarding state
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (isAuthError(authResult)) return authResult;
    const { user: authUser } = authResult;

    let body;
    try {
      body = await request.json();
    } catch {
      return fail("VALIDATION_ERROR", "Invalid request body", 400);
    }

    const { step, completed } = body;

    // Validate step number
    if (step !== undefined) {
      if (typeof step !== "number" || step < 0 || step > 5) {
        return fail("VALIDATION_ERROR", "Step must be a number between 0 and 5", 400);
      }
    }

    const updateData: Record<string, unknown> = {};

    if (step !== undefined) {
      updateData.onboardingStep = step;
    }

    if (completed === true) {
      updateData.onboardingCompleted = true;
      updateData.onboardingStep = 5;
    }

    const user = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
      },
    });

    log.info("Onboarding step updated", {
      userId: authUser.id,
      step: user.onboardingStep,
      completed: user.onboardingCompleted,
    });

    // Create an activity record for audit trail
    await prisma.activity.create({
      data: {
        userId: authUser.id,
        type: "onboarding",
        action: completed ? "completed" : "step_completed",
        description: completed
          ? "Completed onboarding"
          : `Completed onboarding step ${step}`,
        metadata: { step, completed: completed || false },
      },
    });

    return ok({
      completed: user.onboardingCompleted,
      currentStep: user.onboardingStep,
    });
  } catch (error) {
    log.error("Failed to update onboarding status", error);
    return fail("INTERNAL_ERROR", "Failed to update onboarding status", 500);
  }
}
