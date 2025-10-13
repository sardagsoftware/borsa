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
        'lydian-bg': '#0B0F19',
        'lydian-surface': '#111827',
        'lydian-border': '#374151',
        'lydian-primary': '#10A37F',
      },
    },
  },
  plugins: [],
};
export default config;
