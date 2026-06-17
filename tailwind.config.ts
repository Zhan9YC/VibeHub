import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-space)", "Space Grotesk", "sans-serif"]
      },
      colors: {
        background: "#08111F",
        panel: "rgba(15, 23, 42, 0.72)",
        line: "rgba(148, 163, 184, 0.18)",
        cyanGlow: "#0EA5E9",
        pinkGlow: "#7C3AED",
        mint: "#10B981"
      },
      boxShadow: {
        neon: "0 20px 58px rgba(14, 165, 233, 0.26)",
        pink: "0 18px 48px rgba(124, 58, 237, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
