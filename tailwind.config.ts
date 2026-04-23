import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:               ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
        inter:              ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        "instrument-serif": ["var(--font-instrument-serif)", "Georgia", "serif"],
        "jetbrains-mono":   ["var(--font-jetbrains-mono)", "monospace"],
        mono:               ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        // Manuscript design tokens
        "ms-bg":      "#F6F0E4",
        "ms-surface": "#FDF7EA",
        "ms-ink":     "#231812",
        "ms-ink2":    "#4A3C34",
        "ms-mute":    "#8A857F",
        "ms-accent":  "#8C3B1F",

        // Status tokens (Manuscript)
        status: {
          apply:   "#2D6A4F",
          tailor:  "#A86B2D",
          stretch: "#C4622D",
          skip:    "#6B6660",
        },

        // Legacy aliases kept for backward compatibility
        brand: {
          bg:     "#F6F0E4",
          text:   "#231812",
          accent: "#8C3B1F",
          g:      "#A86B2D",
        },
        "brand-cta":       "#231812",
        "brand-cta-hover": "#3D2A22",
        surface:           "#FDF7EA",
        "border-default":  "rgba(26,26,26,0.12)",
        "border-strong":   "rgba(26,26,26,0.24)",
        "text-primary":    "#231812",
        "text-secondary":  "#4A3C34",
        "text-tertiary":   "#8A857F",
        "text-body":       "#4A3C34",
        "accent-slate":    "#8C3B1F",
        "accent-slate-hover": "#6B2E18",
      },
      boxShadow: {
        card: "none",
      },
    },
  },
  plugins: [],
};
export default config;
