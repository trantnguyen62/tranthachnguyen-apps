"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Client-side onboarding redirect.
 *
 * Checks whether the current user has completed onboarding.
 * If not, redirects to /welcome (unless they are already on /welcome).
 *
 * We do this client-side because the middleware runs on the Edge
 * and does not have access to Prisma / database queries.
 */
export function OnboardingRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Skip if already on the welcome page
    if (pathname === "/welcome") {
      setChecked(true);
      return;
    }

    // Check a session-level cache so we don't fetch on every navigation
    const cached = sessionStorage.getItem("cloudify-onboarding-checked");
    if (cached === "completed") {
      setChecked(true);
      return;
    }

    async function checkOnboarding() {
      try {
        const res = await fetch("/api/onboarding");
        if (!res.ok) {
          // If the API fails (e.g., schema not yet migrated), skip redirect
          setChecked(true);
          return;
        }

        const data = await res.json();

        if (data.completed) {
          sessionStorage.setItem("cloudify-onboarding-checked", "completed");
          setChecked(true);
        } else {
          // User hasn't completed onboarding - redirect to welcome
          router.push("/welcome");
        }
      } catch {
        // On error, don't block the user
        setChecked(true);
      }
    }

    checkOnboarding();
  }, [pathname, router]);

  // This component renders nothing - it's purely a side-effect
  if (!checked) return null;
  return null;
}
