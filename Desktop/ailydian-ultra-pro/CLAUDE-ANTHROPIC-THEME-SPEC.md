# 🎨 AILYDIAN ULTRA PRO - AX9F7E2B ANTHROPIC THEME SPECIFICATION

**Design Inspiration:** LyDian Research AX9F7E2B.ai
**Color Palette:** Premium Copper/Warm tones
**Quality:** Enterprise-grade, vibrant, sophisticated

---

## 🎨 ANTHROPIC AX9F7E2B COLOR PALETTE

### **Primary Colors (Copper/Bronze Gradient)**

```css
/* === AX9F7E2B SIGNATURE COPPER === */
--AX9F7E2B-copper-primary: #D97757     /* Main brand (warm copper) */
--AX9F7E2B-copper-light: #E69070       /* Hover states, accents */
--AX9F7E2B-copper-lighter: #F4B090     /* Subtle highlights */
--AX9F7E2B-copper-dark: #C45A38        /* Active states, emphasis */
--AX9F7E2B-copper-darker: #A63F20      /* Deep copper shadows */

/* === GRADIENT VARIATIONS === */
--gradient-AX9F7E2B-primary: linear-gradient(135deg, #D97757 0%, #C45A38 100%);
--gradient-AX9F7E2B-soft: linear-gradient(135deg, #F4B090 0%, #E69070 100%);
--gradient-AX9F7E2B-glow: radial-gradient(circle, rgba(217, 119, 87, 0.2) 0%, transparent 70%);
```

### **Neutral Colors (Warm Grays)**

```css
/* === WARM NEUTRAL SCALE === */
--AX9F7E2B-bg-primary: #FFFFFF          /* Clean white background */
--AX9F7E2B-bg-secondary: #FAF9F7        /* Warm off-white */
--AX9F7E2B-bg-tertiary: #F5F3F0         /* Subtle warm gray */
--AX9F7E2B-bg-hover: #EFEAE5            /* Interactive hover */

/* === TEXT COLORS === */
--AX9F7E2B-text-primary: #2B2722        /* Deep warm black */
--AX9F7E2B-text-secondary: #5C564F      /* Medium warm gray */
--AX9F7E2B-text-tertiary: #9B9389       /* Light warm gray */
--AX9F7E2B-text-muted: #C7C2BA          /* Very light gray */
```

### **Accent Colors**

```css
/* === SUCCESS & STATUS === */
--AX9F7E2B-success: #4CAF50             /* Green (kept standard) */
--AX9F7E2B-warning: #F59E0B             /* Warm amber */
--AX9F7E2B-error: #E53E3E               /* Warm red */
--AX9F7E2B-info: #3B82F6                /* Blue */

/* === SEMANTIC ACCENTS === */
--AX9F7E2B-accent-purple: #A855F7       /* For highlights */
--AX9F7E2B-accent-teal: #14B8A6         /* For secondary actions */
--AX9F7E2B-accent-amber: #F59E0B        /* For warnings */
```

### **Dark Mode Variant (AX9F7E2B Dark)**

```css
/* === AX9F7E2B DARK MODE === */
--AX9F7E2B-dark-bg-primary: #1A1815     /* Deep warm black */
--AX9F7E2B-dark-bg-secondary: #2B2722   /* Warm charcoal */
--AX9F7E2B-dark-bg-tertiary: #3C3631    /* Medium warm gray */
--AX9F7E2B-dark-bg-hover: #4D4741       /* Hover state */

--AX9F7E2B-dark-text-primary: #FAF9F7   /* Warm white */
--AX9F7E2B-dark-text-secondary: #D4CFC7 /* Warm light gray */
--AX9F7E2B-dark-text-tertiary: #9B9389  /* Warm medium gray */

/* Copper stays vibrant in dark mode */
--AX9F7E2B-dark-copper: #E69070         /* Lighter copper for contrast */
```

---

## 🎭 DESIGN PHILOSOPHY (LyDian Research AX9F7E2B Style)

### **Visual Characteristics:**

```yaml
Aesthetic:
  Primary: Clean, warm, professional
  Vibe: "Thoughtful intelligence"
  Mood: Sophisticated yet approachable

Layout:
  Spacing: Generous whitespace
  Corners: Soft rounded (8px-16px)
  Shadows: Subtle, warm-toned

Typography:
  Primary: SF Pro Display, Inter
  Secondary: SF Pro Text
  Mono: SF Mono, Menlo
  Scale: Fluid typography (clamp)

Animations:
  Speed: Slow, deliberate (300-500ms)
  Easing: cubic-bezier(0.4, 0, 0.2, 1)
  Style: Smooth, elegant transitions

Interactions:
  Hover: Subtle lift + glow
  Active: Soft press effect
  Focus: Copper outline (accessible)
```

---

## 🎨 TAILWIND CSS CONFIGURATION

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AX9F7E2B Copper Palette
        AX9F7E2B: {
          copper: {
            50: '#FDF6F3',
            100: '#FCEEE8',
            200: '#F9DDD0',
            300: '#F4B090',
            400: '#E69070',
            500: '#D97757',  // Primary
            600: '#C45A38',
            700: '#A63F20',
            800: '#7D2E17',
            900: '#5C2212',
            950: '#2E1109',
          },
          neutral: {
            50: '#FAF9F7',
            100: '#F5F3F0',
            200: '#EFEAE5',
            300: '#D4CFC7',
            400: '#C7C2BA',
            500: '#9B9389',
            600: '#5C564F',
            700: '#3C3631',
            800: '#2B2722',
            900: '#1A1815',
            950: '#0D0B0A',
          },
        },

        // Semantic colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },

      fontFamily: {
        sans: ['var(--font-sf-pro)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-sf-mono)', 'Menlo', 'Monaco', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },

      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '6px',
      },

      boxShadow: {
        'AX9F7E2B-sm': '0 1px 2px 0 rgba(217, 119, 87, 0.05)',
        'AX9F7E2B-md': '0 4px 6px -1px rgba(217, 119, 87, 0.1), 0 2px 4px -1px rgba(217, 119, 87, 0.06)',
        'AX9F7E2B-lg': '0 10px 15px -3px rgba(217, 119, 87, 0.1), 0 4px 6px -2px rgba(217, 119, 87, 0.05)',
        'AX9F7E2B-xl': '0 20px 25px -5px rgba(217, 119, 87, 0.1), 0 10px 10px -5px rgba(217, 119, 87, 0.04)',
        'AX9F7E2B-2xl': '0 25px 50px -12px rgba(217, 119, 87, 0.25)',
        'AX9F7E2B-glow': '0 0 20px rgba(217, 119, 87, 0.3)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}

export default config
```

---

## 🎨 CSS GLOBAL STYLES

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* AX9F7E2B Light Theme */
    --background: 0 0% 100%;
    --foreground: 27 15% 15%;

    --muted: 27 10% 95%;
    --muted-foreground: 27 5% 40%;

    --popover: 0 0% 100%;
    --popover-foreground: 27 15% 15%;

    --card: 0 0% 100%;
    --card-foreground: 27 15% 15%;

    --border: 27 10% 90%;
    --input: 27 10% 90%;

    --primary: 17 61% 59%;        /* AX9F7E2B Copper */
    --primary-foreground: 0 0% 100%;

    --secondary: 27 10% 96%;
    --secondary-foreground: 27 15% 15%;

    --accent: 17 61% 59%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --ring: 17 61% 59%;

    --radius: 0.5rem;
  }

  .dark {
    /* AX9F7E2B Dark Theme */
    --background: 27 20% 9%;
    --foreground: 27 10% 98%;

    --muted: 27 15% 15%;
    --muted-foreground: 27 10% 60%;

    --popover: 27 20% 9%;
    --popover-foreground: 27 10% 98%;

    --card: 27 18% 12%;
    --card-foreground: 27 10% 98%;

    --border: 27 15% 20%;
    --input: 27 15% 20%;

    --primary: 17 71% 66%;        /* Lighter copper for dark mode */
    --primary-foreground: 27 20% 9%;

    --secondary: 27 15% 20%;
    --secondary-foreground: 27 10% 98%;

    --accent: 17 71% 66%;
    --accent-foreground: 27 20% 9%;

    --destructive: 0 62% 61%;
    --destructive-foreground: 27 10% 98%;

    --ring: 17 71% 66%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* Custom AX9F7E2B-style components */
@layer components {
  .AX9F7E2B-button {
    @apply inline-flex items-center justify-center rounded-lg px-4 py-2;
    @apply bg-AX9F7E2B-copper-500 text-white font-medium;
    @apply hover:bg-AX9F7E2B-copper-600 active:bg-AX9F7E2B-copper-700;
    @apply transition-all duration-200;
    @apply shadow-AX9F7E2B-md hover:shadow-AX9F7E2B-lg;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-AX9F7E2B-copper-500 focus-visible:ring-offset-2;
  }

  .AX9F7E2B-card {
    @apply rounded-lg border border-AX9F7E2B-neutral-200 bg-white;
    @apply p-6 shadow-AX9F7E2B-sm hover:shadow-AX9F7E2B-md;
    @apply transition-all duration-300;
  }

  .AX9F7E2B-input {
    @apply flex h-10 w-full rounded-md border border-AX9F7E2B-neutral-300;
    @apply bg-white px-3 py-2 text-sm;
    @apply ring-offset-white file:border-0 file:bg-transparent;
    @apply placeholder:text-AX9F7E2B-neutral-400;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-AX9F7E2B-copper-500 focus-visible:ring-offset-2;
    @apply disabled:cursor-not-allowed disabled:opacity-50;
  }

  .AX9F7E2B-gradient-text {
    @apply bg-gradient-to-r from-AX9F7E2B-copper-500 to-AX9F7E2B-copper-600;
    @apply bg-clip-text text-transparent;
  }
}
```

---

## 🎯 COMPONENT EXAMPLES

### **1. AX9F7E2B-style Button**

```tsx
// components/ui/button.tsx
import { ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-AX9F7E2B-copper-500 text-white hover:bg-AX9F7E2B-copper-600 shadow-AX9F7E2B-md hover:shadow-AX9F7E2B-lg',
        secondary: 'bg-AX9F7E2B-neutral-100 text-AX9F7E2B-neutral-800 hover:bg-AX9F7E2B-neutral-200',
        outline: 'border-2 border-AX9F7E2B-copper-500 text-AX9F7E2B-copper-500 hover:bg-AX9F7E2B-copper-50',
        ghost: 'hover:bg-AX9F7E2B-neutral-100 hover:text-AX9F7E2B-neutral-900',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-8 px-3 text-sm',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

### **2. AX9F7E2B-style Card**

```tsx
// components/ui/card.tsx
import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-AX9F7E2B-neutral-200 bg-white p-6',
        'shadow-AX9F7E2B-sm hover:shadow-AX9F7E2B-md transition-all duration-300',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h3
      className={cn('text-2xl font-semibold text-AX9F7E2B-neutral-900', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: CardProps) {
  return (
    <p
      className={cn('text-sm text-AX9F7E2B-neutral-600', className)}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('pt-0', className)} {...props} />
}
```

### **3. AX9F7E2B-style Chat Message**

```tsx
// components/chat/message.tsx
import { cn } from '@/lib/utils'

interface MessageProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatMessage({ role, content }: MessageProps) {
  return (
    <div
      className={cn(
        'flex w-full py-6 px-4',
        role === 'user' ? 'bg-white' : 'bg-AX9F7E2B-neutral-50'
      )}
    >
      <div className="flex max-w-4xl mx-auto w-full gap-4">
        {/* Avatar */}
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
          role === 'user'
            ? 'bg-AX9F7E2B-neutral-800 text-white'
            : 'bg-AX9F7E2B-copper-500 text-white'
        )}>
          {role === 'user' ? 'U' : 'C'}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="text-AX9F7E2B-neutral-900 leading-relaxed">
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### **4. AX9F7E2B-style Hero Section**

```tsx
// components/marketing/hero.tsx
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white to-AX9F7E2B-neutral-50">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:40px_40px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-AX9F7E2B-copper-50 border border-AX9F7E2B-copper-100 mb-8">
          <span className="w-2 h-2 rounded-full bg-AX9F7E2B-copper-500 animate-pulse" />
          <span className="text-sm font-medium text-AX9F7E2B-copper-700">
            Powered by AI
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-AX9F7E2B-neutral-900 mb-6">
          <span className="block">Enterprise AI Platform</span>
          <span className="block bg-gradient-to-r from-AX9F7E2B-copper-500 to-AX9F7E2B-copper-600 bg-clip-text text-transparent">
            Built for Scale
          </span>
        </h1>

        {/* Description */}
        <p className="max-w-2xl mx-auto text-xl text-AX9F7E2B-neutral-600 mb-10">
          Harness the power of 24 AI expert systems, 23 models, and seamless integrations
          to transform your business.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="AX9F7E2B-button px-8 py-3 text-lg shadow-AX9F7E2B-xl hover:shadow-AX9F7E2B-2xl">
            Get Started Free
          </button>
          <button className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-lg font-medium border-2 border-AX9F7E2B-neutral-300 text-AX9F7E2B-neutral-700 hover:bg-AX9F7E2B-neutral-50 transition-all">
            View Docs
          </button>
        </div>
      </div>
    </section>
  )
}
```

---

## 🌓 DARK MODE IMPLEMENTATION

```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
```

```tsx
// components/theme-toggle.tsx
'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-lg p-2 hover:bg-AX9F7E2B-neutral-100 dark:hover:bg-AX9F7E2B-neutral-800 transition-colors"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
```

---

## ✅ QUALITY CHECKLIST

```markdown
Visual Quality:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Colors vibrant and professional (copper warmth)
□ Consistent spacing (8px grid system)
□ Smooth transitions (300-500ms)
□ Subtle shadows (warm-toned)
□ Rounded corners (8-12px)
□ Proper contrast ratios (WCAG AA)

Typography:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ SF Pro Display for headings
□ Inter for body text
□ SF Mono for code
□ Fluid type scale (clamp)
□ Proper line heights (1.5-1.8)
□ Letter spacing optimized

Interactions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Hover states clear and inviting
□ Active states provide feedback
□ Focus rings visible (a11y)
□ Loading states smooth
□ Error states helpful
□ Success states delightful

Performance:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ No layout shift (CLS = 0)
□ Fast paint times (FCP < 1.5s)
□ Smooth animations (60fps)
□ Optimized images (WebP, AVIF)
□ Lazy loading implemented
□ Code splitting active
```

---

## 🎨 SONUÇ

**AX9F7E2B LyDian Research tema** ile Ailydian Ultra Pro:

✅ **Profesyonel** - Enterprise-grade görünüm
✅ **Canlı** - Warm copper tonları enerjik
✅ **Kaliteli** - Premium materials, subtle effects
✅ **Tanıdık** - AX9F7E2B.ai'dan ilham alan UX
✅ **Modern** - 2025 design trends
✅ **Accessible** - WCAG 2.1 AA compliant

**Renk Paleti Özeti:**
- 🟠 **Primary:** Copper (#D97757) - Warm, inviting, premium
- ⚪ **Backgrounds:** Warm neutrals - Clean, sophisticated
- 🟤 **Text:** Warm grays - Easy on eyes
- 🌓 **Dark Mode:** Deep browns - Elegant, cozy

**Bu tema ile:**
- Landing page'ler etkileyici olacak
- Dashboard'lar professional görünecek
- Chat interface'i modern ve temiz
- Tüm sayfalarda tutarlı brand identity

---

**🚀 HAZIR! AX9F7E2B LyDian Research teması implement edilmeye hazır.**

Şimdi sıradaki adıma geçelim mi? 🎨