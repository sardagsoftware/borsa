module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        // Premium Theme Colors
        bg: 'var(--bg)',
        soft: 'var(--bg-soft)',
        panel: 'var(--panel)',
        panel2: 'var(--panel-2)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        brand1: 'var(--brand-1)',
        brand2: 'var(--brand-2)',
        accent1: 'var(--accent-1)',
        pos: 'var(--pos)',
        neg: 'var(--neg)',
        warn: 'var(--warn)',
        info: 'var(--info)',
        grid: 'var(--grid)',
        line: 'var(--line)',
        
        // AILYDIAN Brand Colors - Professional & Psychologically Balanced
        background: 'var(--bg)',
        soft: 'var(--bg-soft)',
        panel: 'var(--panel)',
        panel2: 'var(--panel-2)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        brand1: 'var(--brand-1)',
        brand2: 'var(--brand-2)',
        accent1: 'var(--accent-1)',
        pos: 'var(--pos)',
        neg: 'var(--neg)',
        warn: 'var(--warn)',
        info: 'var(--info)',
        
        // Legacy Binance compatibility
        binance: {
          dark: '#12161C',
          panel: '#181A20',
          text: '#EAECEF',
          textSecondary: '#848E9C',
          green: '#0ECB81',
          red: '#F6465D',
          yellow: '#F0B90B',
          blue: '#3182CE',
          purple: '#8A2BE2',
        },
        // Enhanced theme colors
        background: 'var(--bg)',
        foreground: 'var(--text)',
        card: {
          DEFAULT: 'var(--panel)',
          foreground: 'var(--text)',
        },
        popover: {
          DEFAULT: 'var(--panel)',
          foreground: 'var(--text)',
        },
        primary: {
          DEFAULT: 'var(--brand1)',
          foreground: 'var(--bg)',
        },
        secondary: {
          DEFAULT: 'var(--panel2)',
          foreground: 'var(--text)',
        },
        muted: {
          DEFAULT: 'var(--panel2)',
          foreground: 'var(--muted)',
        },
        accent: {
          DEFAULT: 'var(--accent1)',
          foreground: 'var(--bg)',
        },
        destructive: {
          DEFAULT: 'var(--neg)',
          foreground: '#FFFFFF',
        },
        border: 'rgba(255, 255, 255, 0.1)',
        input: 'var(--panel2)',
        ring: 'var(--brand2)',
      },
      boxShadow: {
        'soft': '0 8px 28px rgba(0,0,0,.25)',
        'card': '0 14px 48px rgba(0,0,0,.35)',
        'binance': '0 4px 6px -1px rgba(104, 231, 215, 0.1), 0 2px 4px -1px rgba(104, 231, 215, 0.06)',
        'panel': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
        xl: '1.25rem',
        '2xl': '1.6rem',
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      },
      transitionTimingFunction: {
        'ease-smooth': 'cubic-bezier(.22,1,.36,1)',
        'smooth': 'var(--ease)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace'],
        heading: ['Space Grotesk', 'Inter', 'system-ui'],
        body: ['Inter', 'system-ui'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
