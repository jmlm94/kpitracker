import type { Config } from "tailwindcss";

/**
 * Carbinox brand palette (sampled from the Marketing Toolkit PDF).
 * The brand is black + white with yellow as the hero accent, and a small
 * range of saturated accents for differentiation. No gradients — the brand
 * explicitly forbids them, so components use flat fills and textures.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base neutrals — tuned off pure black for soft depth on screens
        jet: {
          DEFAULT: "#000000",
          950: "#050505",
          900: "#0b0b0b",
          800: "#121212",
          700: "#1a1a1a",
          600: "#262626",
          500: "#333333",
          400: "#4a4a4a",
          300: "#6b6b6b",
          200: "#9e9e9e",
          100: "#cfcfcf",
        },
        paper: "#f8f8f8",
        // Primary accent — Carbinox yellow
        carbinox: {
          DEFAULT: "#f8c808",
          dark: "#d6ac00",
          light: "#ffd833",
        },
        // Accent 01 (preferred accents)
        orange: {
          DEFAULT: "#f06020",
          dark: "#c94e14",
        },
        blaze: "#e83028",
        // Accent 02 (product differentiation)
        lime: "#d0f800",
        azure: "#10a0f8",
        mint: "#48f088",
        olive: "#408038",
        // Status (mapped from brand accents so UI stays on-brand)
        ok: "#48f088", // mint
        warn: "#f8c808", // carbinox yellow
        bad: "#e83028", // blaze red
      },
      fontFamily: {
        // Morganite — impact titles (all-caps, black weights)
        display: ["Morganite", "Impact", "Oswald", "sans-serif"],
        // Konstant Grotesk substitute — condensed grotesk for secondary headings
        heading: ["'Archivo Narrow'", "Oswald", "sans-serif"],
        // Andromecha substitute — technical/tactical numeric display
        numeric: ["'Chakra Petch'", "'Space Grotesk'", "monospace"],
        // SF Pro / Inter — body
        sans: ["Inter", "ui-sans-serif", "-apple-system", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      letterSpacing: {
        brand: "0.06em",
      },
      boxShadow: {
        hard: "0 0 0 1px rgba(255,255,255,0.06), 0 24px 60px -30px rgba(0,0,0,0.9)",
        card: "0 0 0 1px rgba(255,255,255,0.06) inset",
        cta: "0 0 0 1px rgba(248,200,8,0.5), 0 8px 28px -6px rgba(248,200,8,0.35)",
      },
      backgroundImage: {
        // Hexagonal X-based tile (inline SVG referenced from CSS)
        "x-grid":
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='74' viewBox='0 0 64 74'><g fill='none' stroke='%23ffffff' stroke-opacity='0.05' stroke-width='1.2'><polygon points='16,2 48,2 62,18 62,56 48,72 16,72 2,56 2,18'/><path d='M16 2 L48 72 M48 2 L16 72' /></g></svg>\")",
      },
    },
  },
  plugins: [],
};
export default config;
