import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0B0F14",
          soft: "#11161d",
          card: "#1a1f2e",
        },
        border: {
          DEFAULT: "#2d3748",
          light: "#4a5568",
        },
        accent: {
          green: "#10b981",
          red: "#ef4444",
          blue: "#3b82f6",
          yellow: "#f59e0b",
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
