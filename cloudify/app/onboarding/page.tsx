import { redirect } from "next/navigation";

/**
 * Redirect /onboarding to the canonical onboarding flow at /welcome.
 *
 * The full onboarding wizard lives at /welcome inside the (dashboard)
 * route group and persists progress via /api/onboarding.
 */
export default function OnboardingRedirectPage() {
  redirect("/welcome");
}
