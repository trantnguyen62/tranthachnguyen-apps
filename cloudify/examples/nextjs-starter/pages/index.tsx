import { useState, useEffect } from "react";

export default function Home() {
  const [apiResponse, setApiResponse] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setApiResponse(data.message))
      .catch(() => setApiResponse("API unavailable in static export"));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "2rem" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Next.js Starter
        </h1>
        <p style={{ color: "#666", fontSize: "1.1rem" }}>
          Deployed on <strong>Cloudify</strong>
        </p>
        <div
          style={{
            display: "inline-block",
            marginTop: "1rem",
            padding: "0.25rem 0.75rem",
            borderRadius: "9999px",
            backgroundColor: "#0070f3",
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Powered by Cloudify
        </div>
      </header>

      <main>
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Getting Started</h2>
          <p style={{ lineHeight: 1.7, color: "#444" }}>
            This is a minimal Next.js starter template ready to deploy on Cloudify.
            Edit <code style={{ background: "#f0f0f0", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>pages/index.tsx</code> to
            customize this page.
          </p>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>API Route</h2>
          <div
            style={{
              padding: "1rem",
              background: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #e9ecef",
            }}
          >
            <code>/api/hello</code> responds with:{" "}
            <strong>{apiResponse || "Loading..."}</strong>
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Features</h2>
          <ul style={{ lineHeight: 2, color: "#444" }}>
            <li>TypeScript support</li>
            <li>API routes</li>
            <li>Static export ready</li>
            <li>Zero configuration</li>
          </ul>
        </section>
      </main>

      <footer style={{ marginTop: "3rem", paddingTop: "1rem", borderTop: "1px solid #eee", textAlign: "center", color: "#999", fontSize: "0.875rem" }}>
        Deployed with Cloudify
      </footer>
    </div>
  );
}
