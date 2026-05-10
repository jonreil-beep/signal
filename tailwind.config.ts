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
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        dark:       '#1C2333',
        'dark-alt': '#0F1923',
        bg:         '#FFFFFF',
        'bg-alt':   '#FAFAFA',
        'bg-sunk':  '#F4F4F5',
        fg:         '#1C2333',
        status: {
          strong:   '#7A8B73',
          moderate: '#9B8E73',
          stretch:  '#8A7373',
        },
      },
      borderRadius: {
        card:   '14px',
        inset:  '10px',
        button: '8px',
        pill:   '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,25,35,0.04), 0 6px 24px rgba(15,25,35,0.05)',
        pop:  '0 1px 2px rgba(15,25,35,0.05), 0 24px 60px rgba(15,25,35,0.16)',
      },
    },
  },
  plugins: [],
};
export default config;
