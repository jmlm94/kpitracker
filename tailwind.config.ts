import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07090d",
          900: "#0b0f16",
          800: "#11161f",
          700: "#171d29",
          600: "#1e2533",
          500: "#2a3242",
          400: "#3b4454",
        },
        carbon: {
          50: "#f4f6f8",
          100: "#e7ebef",
          200: "#c6cfd7",
          300: "#95a3b1",
          400: "#5f6f80",
          500: "#3d4c5c",
          600: "#2a3644",
          700: "#1e2733",
          800: "#131a23",
          900: "#0b1017",
        },
        accent: {
          DEFAULT: "#ff6a3d",
          soft: "#ff8a63",
          muted: "#c94e29",
        },
        ok: "#34d399",
        warn: "#fbbf24",
        bad: "#f87171",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["Space Grotesk", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,106,61,0.25), 0 10px 30px -12px rgba(255,106,61,0.35)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 40px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "grid-dark":
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "radial-accent":
          "radial-gradient(800px circle at 10% -10%, rgba(255,106,61,0.18), transparent 40%), radial-gradient(600px circle at 90% 0%, rgba(59,130,246,0.10), transparent 40%)",
      },
    },
  },
  plugins: [],
};
export default config;
