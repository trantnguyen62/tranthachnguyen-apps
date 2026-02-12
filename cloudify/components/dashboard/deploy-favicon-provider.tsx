"use client";

import { useEffect, useState } from "react";
import { DeployFavicon } from "./deploy-favicon";

type DeployStatus = "success" | "building" | "error" | "idle";

/**
 * Polls the latest deployment status and feeds it to DeployFavicon.
 *
 * This component is designed to be placed in the dashboard layout.
 * It polls /api/deployments?limit=1 every 10 seconds to check if
 * there is an active build, and updates the favicon accordingly.
 *
 * Polling stops when the tab is not visible to avoid wasted requests.
 */
export function DeployFaviconProvider() {
  const [status, setStatus] = useState<DeployStatus>("idle");

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    async function checkLatestDeployment() {
      try {
        const response = await fetch("/api/deployments?limit=1");
        if (!response.ok) return;

        const data = await response.json();
        const deployments = data.deployments || [];

        if (deployments.length === 0) {
          setStatus("idle");
          return;
        }

        const latest = deployments[0];
        const deployStatus = (latest.status || "").toLowerCase();

        switch (deployStatus) {
          case "building":
          case "deploying":
          case "queued":
            setStatus("building");
            break;
          case "ready":
            setStatus("success");
            break;
          case "error":
          case "failed":
            setStatus("error");
            break;
          default:
            setStatus("idle");
        }
      } catch {
        // Silently ignore — favicon will stay as is
      }
    }

    // Initial check
    checkLatestDeployment();

    // Poll every 10 seconds
    intervalId = setInterval(checkLatestDeployment, 10_000);

    // Pause polling when tab is hidden
    function handleVisibility() {
      if (document.hidden) {
        clearInterval(intervalId);
      } else {
        checkLatestDeployment();
        intervalId = setInterval(checkLatestDeployment, 10_000);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return <DeployFavicon status={status} />;
}
