import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "Cloudify";
  const description =
    searchParams.get("description") ||
    "The Cloud Platform for Developers";
  const status = searchParams.get("status"); // optional: "deployed", "building", "error"

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    deployed: { bg: "#22c55e", text: "#ffffff", label: "Deployed" },
    building: { bg: "#eab308", text: "#000000", label: "Building" },
    error: { bg: "#ef4444", text: "#ffffff", label: "Error" },
  };

  const statusInfo = status ? statusColors[status] : null;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#000000",
          padding: "60px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Background gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at top left, rgba(0, 112, 243, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(124, 58, 237, 0.1) 0%, transparent 50%)",
            display: "flex",
          }}
        />

        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Top section: Logo + status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "-0.02em",
                }}
              >
                Cloudify
              </span>
            </div>

            {/* Status badge */}
            {statusInfo && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: statusInfo.bg,
                  color: statusInfo.text,
                  padding: "8px 16px",
                  borderRadius: "9999px",
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: statusInfo.text,
                    display: "flex",
                  }}
                />
                {statusInfo.label}
              </div>
            )}
          </div>

          {/* Middle section: Title + Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h1
              style={{
                fontSize: title.length > 30 ? "52px" : "64px",
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                margin: 0,
                maxWidth: "900px",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: "24px",
                color: "#a1a1aa",
                lineHeight: 1.4,
                margin: 0,
                maxWidth: "700px",
              }}
            >
              {description}
            </p>
          </div>

          {/* Bottom section: URL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                color: "#71717a",
                fontFamily: "monospace",
              }}
            >
              cloudify.tranthachnguyen.com
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#71717a",
                  fontSize: "14px",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    display: "flex",
                  }}
                />
                Open Source
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#71717a",
                  fontSize: "14px",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#0070f3",
                    display: "flex",
                  }}
                />
                Self-Hosted
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
