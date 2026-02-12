import { useState } from "react";

const styles: Record<string, React.CSSProperties> = {
  app: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    maxWidth: 720,
    margin: "0 auto",
    padding: "2rem",
    minHeight: "100vh",
  },
  header: {
    textAlign: "center",
    marginBottom: "3rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #646cff, #61dafb)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#888",
    fontSize: "1.1rem",
  },
  badge: {
    display: "inline-block",
    marginTop: "1rem",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    backgroundColor: "#0070f3",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  },
  card: {
    padding: "1.5rem",
    borderRadius: "12px",
    border: "1px solid #2a2a2a",
    background: "#1a1a1a",
    marginBottom: "1.5rem",
  },
  counter: {
    textAlign: "center",
    padding: "2rem",
  },
  counterValue: {
    fontSize: "3rem",
    fontWeight: 700,
    color: "#646cff",
    marginBottom: "1rem",
  },
  buttonGroup: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "center",
  },
  button: {
    padding: "0.5rem 1.25rem",
    borderRadius: "8px",
    border: "1px solid #646cff",
    background: "transparent",
    color: "#646cff",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  featureList: {
    listStyle: "none",
    padding: 0,
  },
  featureItem: {
    padding: "0.75rem 0",
    borderBottom: "1px solid #2a2a2a",
    color: "#ccc",
    fontSize: "0.95rem",
  },
  footer: {
    marginTop: "3rem",
    paddingTop: "1rem",
    borderTop: "1px solid #2a2a2a",
    textAlign: "center",
    color: "#666",
    fontSize: "0.875rem",
  },
};

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ ...styles.app, background: "#0d0d0d", color: "#fff" }}>
      <header style={styles.header}>
        <h1 style={styles.title}>React + Vite</h1>
        <p style={styles.subtitle}>
          Deployed on <strong>Cloudify</strong>
        </p>
        <span style={styles.badge}>Powered by Cloudify</span>
      </header>

      <div style={styles.card}>
        <div style={styles.counter}>
          <div style={styles.counterValue}>{count}</div>
          <div style={styles.buttonGroup}>
            <button
              style={styles.button}
              onClick={() => setCount((c) => c - 1)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#646cff";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#646cff";
              }}
            >
              -
            </button>
            <button
              style={styles.button}
              onClick={() => setCount(0)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#646cff";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#646cff";
              }}
            >
              Reset
            </button>
            <button
              style={styles.button}
              onClick={() => setCount((c) => c + 1)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#646cff";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#646cff";
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Features</h2>
        <ul style={styles.featureList}>
          {[
            "React 18 with TypeScript",
            "Vite for lightning-fast builds",
            "Hot Module Replacement (HMR)",
            "Optimized production build",
            "Ready for Cloudify deployment",
          ].map((feature) => (
            <li key={feature} style={styles.featureItem}>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <footer style={styles.footer}>Deployed with Cloudify</footer>
    </div>
  );
}

export default App;
