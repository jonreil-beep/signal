import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
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
      },
    },
  },
  plugins: [],
};
export default config;
