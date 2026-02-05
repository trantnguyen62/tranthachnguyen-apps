import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        "background-secondary": "var(--background-secondary)",
        foreground: "var(--foreground)",
        "foreground-secondary": "var(--foreground-secondary)",
        border: "var(--border)",
        "border-light": "var(--border-light)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-light": "var(--accent-light)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",
        "code-bg": "var(--code-bg)",
        "code-text": "var(--code-text)",
      },
      spacing: {
        "sidebar": "var(--sidebar-width)",
        "topbar": "var(--topbar-height)",
        "content": "var(--content-max-width)",
        "toc": "var(--toc-width)",
      },
      fontSize: {
        "display": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        "heading-1": ["36px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "heading-2": ["24px", { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "600" }],
        "heading-3": ["20px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "1.7" }],
        "body": ["16px", { lineHeight: "1.6" }],
        "body-sm": ["14px", { lineHeight: "1.5" }],
        "caption": ["12px", { lineHeight: "1.4" }],
        "label": ["11px", { lineHeight: "1.3", letterSpacing: "0.02em", fontWeight: "500" }],
      },
      borderRadius: {
        "xl": "12px",
        "lg": "8px",
        "md": "6px",
      },
      boxShadow: {
        "sm": "var(--shadow-sm)",
        "md": "var(--shadow-md)",
        "lg": "var(--shadow-lg)",
      },
      transitionDuration: {
        "fast": "150ms",
        "base": "300ms",
        "slow": "500ms",
      },
      animation: {
        "fade-in": "fadeIn 300ms ease forwards",
        "fade-up": "fadeUp 300ms ease forwards",
        "slide-in-left": "slideInLeft 300ms ease forwards",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "var(--foreground)",
            a: {
              color: "var(--accent)",
              textDecoration: "none",
              "&:hover": {
                color: "var(--accent-hover)",
              },
            },
            code: {
              backgroundColor: "var(--background-secondary)",
              borderRadius: "6px",
              padding: "0.125rem 0.375rem",
              fontWeight: "500",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            pre: {
              backgroundColor: "var(--code-bg)",
              borderRadius: "12px",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
