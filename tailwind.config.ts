import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Telemart design tokens (src/styles/tokens.css).
        tm: {
          canvas: "var(--tm-color-canvas)",
          ink: "var(--tm-color-ink)",
          muted: "var(--tm-color-ink-muted)",
          surface: "var(--tm-color-surface)",
          line: "var(--tm-color-line)",
          red: {
            DEFAULT: "var(--tm-color-red)",
            press: "var(--tm-color-red-press)",
            wash: "var(--tm-color-red-wash)",
          },
          "on-red": "var(--tm-color-on-red)",
          "on-ink": {
            DEFAULT: "var(--tm-color-on-ink)",
            muted: "var(--tm-color-on-ink-muted)",
          },
          danger: {
            DEFAULT: "var(--tm-color-danger)",
            wash: "var(--tm-color-danger-wash)",
          },
          success: {
            DEFAULT: "var(--tm-color-success)",
            wash: "var(--tm-color-success-wash)",
          },
          glow: "var(--tm-color-glow)",
          focus: "var(--tm-color-focus)",
          "focus-inverse": "var(--tm-color-focus-inverse)",
        },
      },
      fontFamily: {
        "tm-sans": ["var(--tm-font-sans)"],
        "tm-display": ["var(--tm-font-display)"],
      },
      boxShadow: {
        "tm-raised": "var(--tm-shadow-raised)",
        "tm-float": "var(--tm-shadow-float)",
      },
      fontSize: {
        "tm-caption": ["var(--tm-text-caption)", { lineHeight: "var(--tm-leading-body)" }],
        "tm-small": ["var(--tm-text-small)", { lineHeight: "var(--tm-leading-body)" }],
        "tm-body": ["var(--tm-text-body)", { lineHeight: "var(--tm-leading-body)" }],
        "tm-lead": ["var(--tm-text-lead)", { lineHeight: "var(--tm-leading-body)" }],
        "tm-h4": ["var(--tm-text-h4)", { lineHeight: "var(--tm-leading-heading)" }],
        "tm-h3": ["var(--tm-text-h3)", { lineHeight: "var(--tm-leading-heading)" }],
        "tm-h2": ["var(--tm-text-h2)", { lineHeight: "var(--tm-leading-heading)" }],
        "tm-h1": ["var(--tm-text-h1)", { lineHeight: "var(--tm-leading-heading)" }],
        "tm-display": ["var(--tm-text-display)", { lineHeight: "var(--tm-leading-heading)" }],
      },
      borderRadius: {
        "tm-control": "var(--tm-radius-control)",
        "tm-panel": "var(--tm-radius-panel)",
        "tm-pill": "var(--tm-radius-pill)",
      },
      maxWidth: {
        "tm-content": "var(--tm-content-max)",
      },
      width: {
        "tm-admin-nav": "var(--tm-admin-nav-width)",
      },
      minHeight: {
        "tm-control": "var(--tm-control-height)",
      },
      padding: {
        "tm-gutter": "var(--tm-gutter)",
      },
      transitionDuration: {
        "tm-fast": "var(--tm-duration-fast)",
        "tm-base": "var(--tm-duration-base)",
      },
      transitionTimingFunction: {
        "tm-out": "var(--tm-ease-out)",
      },
    },
  },
  plugins: [],
} satisfies Config;
