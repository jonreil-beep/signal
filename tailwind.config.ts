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
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Legacy brand tokens — kept for landing page compatibility
        brand: {
          bg:     "#F8F7F4",
          text:   "#1A1A1A",
          accent: "#2E4057",
          g:      "#C5892D",
        },
        status: {
          apply:   "#2D6A4F",
          tailor:  "#A86B2D",
          stretch: "#C4622D",
          skip:    "#888888",
        },
        // New design system tokens
        surface:       "#F9FAFB",
        "border-default": "#E5E7EB",
        "border-strong":  "#D1D5DB",
        "text-primary":   "#111827",
        "text-secondary": "#6B7280",
        "text-tertiary":  "#9CA3AF",
        "text-body":      "#374151",
        "accent-slate":      "#2E4057",
        "accent-slate-hover": "#243445",
      },
    },
  },
  plugins: [],
};
export default config;
