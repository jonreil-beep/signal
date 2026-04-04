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
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
      },
      colors: {
        // Legacy brand tokens — kept for landing page compatibility
        brand: {
          bg:     "#F8F7F4",
          text:   "#1A1A1A",
          accent: "#3D5A4C",
          g:      "#C5892D",
        },
        status: {
          apply:   "#4B9B7E",
          tailor:  "#7C8B9A",
          stretch: "#B0906E",
          skip:    "#A3A3A3",
        },
        // CTA colors
        "brand-cta":       "#3D5A4C",
        "brand-cta-hover": "#2E4A3C",
        // New design system tokens
        surface:       "#F9FAFB",
        "border-default": "#E5E7EB",
        "border-strong":  "#D1D5DB",
        "text-primary":   "#111827",
        "text-secondary": "#6B7280",
        "text-tertiary":  "#9CA3AF",
        "text-body":      "#374151",
        "accent-slate":      "#3D5A4C",
        "accent-slate-hover": "#2E4A3C",
      },
    },
  },
  plugins: [],
};
export default config;
