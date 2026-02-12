"use client";

import { useEffect, useRef, useCallback } from "react";

type DeployStatus = "success" | "building" | "error" | "idle";

interface DeployFaviconProps {
  /**
   * Current deployment status.
   * - "success": green check
   * - "building": yellow spinner (animated)
   * - "error": red X
   * - "idle": default Cloudify favicon
   */
  status: DeployStatus;
}

/**
 * Generates a data:image/svg+xml URL for the given deployment status.
 * Uses inline SVG so no extra asset files are needed.
 */
function generateFaviconSvg(status: DeployStatus): string {
  let svg: string;

  switch (status) {
    case "success":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#22c55e"/>
        <path d="M10 16l4 4 8-8" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
      break;

    case "building":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#eab308"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="white" stroke-width="3" stroke-dasharray="20 30" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="1s" repeatCount="indefinite"/>
        </circle>
      </svg>`;
      break;

    case "error":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#ef4444"/>
        <path d="M11 11l10 10M21 11l-10 10" stroke="white" stroke-width="3" stroke-linecap="round"/>
      </svg>`;
      break;

    case "idle":
    default:
      // Blue "C" for Cloudify default
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#0070f3"/>
        <text x="16" y="22" text-anchor="middle" fill="white" font-size="18" font-weight="bold" font-family="system-ui, sans-serif">C</text>
      </svg>`;
      break;
  }

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * DeployFavicon - dynamically changes the browser tab favicon based on
 * the current deployment status.
 *
 * Place this component in the dashboard layout. It modifies the
 * <link rel="icon"> element in the document head.
 *
 * Usage:
 *   <DeployFavicon status="building" />
 *
 * The original favicon is restored when the component unmounts or when
 * status returns to "idle".
 */
export function DeployFavicon({ status }: DeployFaviconProps) {
  const originalHrefRef = useRef<string | null>(null);

  const setFavicon = useCallback((href: string) => {
    let link = document.querySelector(
      'link[rel="icon"]'
    ) as HTMLLinkElement | null;

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    // Save original on first change
    if (originalHrefRef.current === null) {
      originalHrefRef.current = link.href || "/favicon.ico";
    }

    link.href = href;
  }, []);

  const restoreOriginal = useCallback(() => {
    if (originalHrefRef.current) {
      const link = document.querySelector(
        'link[rel="icon"]'
      ) as HTMLLinkElement | null;
      if (link) {
        link.href = originalHrefRef.current;
      }
    }
  }, []);

  useEffect(() => {
    if (status === "idle") {
      restoreOriginal();
    } else {
      const svgDataUrl = generateFaviconSvg(status);
      setFavicon(svgDataUrl);
    }

    // Restore on unmount
    return () => {
      restoreOriginal();
    };
  }, [status, setFavicon, restoreOriginal]);

  // This component renders nothing visible
  return null;
}
