# 🔌 Tema Sistemi Entegrasyon Kılavuzu

**Tarih:** 2025-10-10
**Versiyon:** v4.1
**Hedef:** Lydian-IQ Unified Surface

---

## 📋 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Layout Entegrasyonu](#layout-entegrasyonu)
3. [Component Entegrasyonu](#component-entegrasyonu)
4. [Utility Class Kullanımı](#utility-class-kullanımı)
5. [Custom Styling](#custom-styling)
6. [Migrasyon Örnekleri](#migrasyon-örnekleri)
7. [Best Practices](#best-practices)

---

## 🚀 Hızlı Başlangıç

### 1. ThemeProvider'ı Root Layout'a Ekleyin

```tsx
// apps/console/src/app/lydian-iq/layout.tsx

import { ThemeProvider } from '../../context/ThemeContext';
import '../../styles/theme.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <ThemeProvider defaultTheme="auto">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Not:** `defaultTheme` seçenekleri:
- `"light"` - Açık tema
- `"dark"` - Koyu tema (önerilen)
- `"auto"` - Sistem tercihini takip eder (önerilen)

### 2. ThemeToggle'ı Header'a Ekleyin

```tsx
// apps/console/src/components/layout/Header.tsx

import ThemeToggle from '../theme/ThemeToggle';

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <h1>Lydian-IQ</h1>
      </div>

      <div className="header-right">
        <ThemeToggle />
        {/* Diğer header kontrolleri */}
      </div>
    </header>
  );
}
```

### 3. Component'te Tema Kullanın

```tsx
// Herhangi bir component

import { useTheme, useIsDark } from '../../context/ThemeContext';

export default function MyComponent() {
  const { theme, setTheme } = useTheme();
  const isDark = useIsDark();

  return (
    <div className="card glass">
      <p>Aktif tema: {theme}</p>
      <p>Mod: {isDark ? 'Koyu' : 'Açık'}</p>
    </div>
  );
}
```

---

## 🏗️ Layout Entegrasyonu

### LayoutRoot Tam Örneği

```tsx
// apps/console/src/app/lydian-iq/layout/LayoutRoot.tsx

'use client';

import React from 'react';
import { ThemeProvider } from '../../../context/ThemeContext';
import { StoreProvider } from '../../../store';
import '../../../styles/theme.css';
import './layout.css'; // Layout-specific styles

interface LayoutRootProps {
  children: React.ReactNode;
}

export default function LayoutRoot({ children }: LayoutRootProps) {
  return (
    <ThemeProvider defaultTheme="auto" storageKey="lydian-iq-theme">
      <StoreProvider>
        <div className="layout-container">
          <a href="#main-content" className="skip-to-main">
            Ana içeriğe atla
          </a>
          {children}
        </div>
      </StoreProvider>
    </ThemeProvider>
  );
}
```

### Layout CSS Örneği

```css
/* apps/console/src/app/lydian-iq/layout/layout.css */

.layout-container {
  min-height: 100vh;
  background: var(--gradient-background);
  color: var(--color-text);
  font-family: var(--font-base);
}

.layout-grid {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.layout-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-md) var(--spacing-xl);
}

.layout-main {
  overflow: auto;
  padding: var(--spacing-xl);
}

/* Responsive */
@media (min-width: 768px) {
  .layout-grid {
    grid-template-columns: 280px 1fr 320px;
  }
}
```

---

## 🧩 Component Entegrasyonu

### Button Component

```tsx
// apps/console/src/components/ui/Button.tsx

'use client';

import React from 'react';
import { cn } from '../../lib/theme-utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'btn',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'ghost' && 'btn-ghost',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Card Component

```tsx
// apps/console/src/components/ui/Card.tsx

'use client';

import React from 'react';
import { cn, glassEffect } from '../../lib/theme-utils';

interface CardProps {
  children: React.ReactNode;
  glass?: boolean;
  className?: string;
}

export default function Card({ children, glass = false, className }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        glass && 'card-glass',
        className
      )}
      style={glass ? glassEffect() : undefined}
    >
      {children}
    </div>
  );
}

// Kullanım
<Card glass>
  <h3>Glassmorphism Card</h3>
  <p>İçerik</p>
</Card>
```

### Badge Component

```tsx
// apps/console/src/components/ui/Badge.tsx

'use client';

import React from 'react';
import { cn, getSemanticColor } from '../../lib/theme-utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'primary';
  className?: string;
}

export default function Badge({ children, variant = 'primary', className }: BadgeProps) {
  const semanticColors = variant !== 'primary' ? getSemanticColor(variant) : null;

  return (
    <span
      className={cn(
        'badge',
        `badge-${variant}`,
        className
      )}
      style={semanticColors ? { background: semanticColors.bg, color: semanticColors.color } : undefined}
    >
      {children}
    </span>
  );
}

// Kullanım
<Badge variant="success">Aktif</Badge>
<Badge variant="error">Hata</Badge>
```

### Input Component

```tsx
// apps/console/src/components/ui/Input.tsx

'use client';

import React from 'react';
import { cn } from '../../lib/theme-utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label text-secondary">
          {label}
        </label>
      )}
      <input
        className={cn(
          'input',
          error && 'input-error',
          className
        )}
        {...props}
      />
      {error && (
        <span className="input-error-text text-error">
          {error}
        </span>
      )}
    </div>
  );
}
```

---

## 🎨 Utility Class Kullanımı

### Metin Renkleri

```tsx
<h1 className="text-primary">Birincil Başlık</h1>
<p className="text-secondary">İkincil metin</p>
<span className="text-tertiary">Tertiary metin</span>

<p className="text-success">Başarılı işlem</p>
<p className="text-warning">Uyarı mesajı</p>
<p className="text-error">Hata mesajı</p>
<p className="text-info">Bilgi mesajı</p>
```

### Arka Planlar

```tsx
<div className="bg-surface">Surface arka plan</div>
<div className="bg-surface-hover">Hover surface</div>

<div className="bg-success">Başarı arka planı</div>
<div className="bg-error">Hata arka planı</div>
```

### Border Radius

```tsx
<div className="radius-sm">Küçük radius (4px)</div>
<div className="radius-md">Orta radius (8px)</div>
<div className="radius-lg">Büyük radius (12px)</div>
<div className="radius-xl">XL radius (16px)</div>
<div className="radius-full">Tam yuvarlak</div>
```

### Shadows

```tsx
<div className="shadow-sm">Küçük gölge</div>
<div className="shadow-md">Orta gölge</div>
<div className="shadow-lg">Büyük gölge</div>
<div className="shadow-gold">Altın gölge</div>
```

### Glassmorphism

```tsx
<div className="glass">
  Glassmorphism efekti
</div>

<div className="card glass">
  Card + Glass
</div>
```

### Typography

```tsx
<p className="font-mono">Monospace font</p>
<p className="font-normal">Normal weight</p>
<p className="font-medium">Medium weight</p>
<p className="font-semibold">Semibold weight</p>
<p className="font-bold">Bold weight</p>
```

### Animations

```tsx
<div className="animate-fadeIn">Fade in animasyonu</div>
<div className="animate-slideIn">Slide in animasyonu</div>
<div className="animate-pulse">Pulse animasyonu</div>
<div className="animate-spin">Spin animasyonu</div>
```

---

## 🎯 Custom Styling

### Inline Styles ile CSS Variables

```tsx
<div
  style={{
    background: 'var(--gradient-primary)',
    padding: 'var(--spacing-xl)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
  }}
>
  Custom styled div
</div>
```

### CSS-in-JS ile styled-jsx

```tsx
<div className="custom-component">
  <style jsx>{`
    .custom-component {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      transition: all var(--transition-base);
    }

    .custom-component:hover {
      background: var(--color-surface-hover);
      box-shadow: var(--shadow-md);
    }

    .custom-title {
      color: var(--color-primary);
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      margin-bottom: var(--spacing-md);
    }
  `}</style>

  <h3 className="custom-title">Başlık</h3>
  <p>İçerik</p>
</div>
```

### Helper Functions Kullanımı

```tsx
import {
  getGradient,
  getShadow,
  getSpacing,
  getRadius,
  getSemanticColor,
  glassEffect
} from '../../lib/theme-utils';

function CustomCard() {
  const successColor = getSemanticColor('success');

  return (
    <div
      style={{
        background: getGradient('surface'),
        padding: getSpacing('xl'),
        borderRadius: getRadius('xl'),
        boxShadow: getShadow('gold'),
        ...glassEffect(),
      }}
    >
      <span style={{ color: successColor.color }}>
        Başarılı!
      </span>
    </div>
  );
}
```

---

## 🔄 Migrasyon Örnekleri

### Öncesi: Hardcoded Colors

```tsx
// ❌ Eski yöntem - hardcoded renkler
<div
  style={{
    background: '#1a1a1a',
    color: '#f5f5f5',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '12px',
    padding: '1rem',
  }}
>
  İçerik
</div>
```

### Sonrası: CSS Variables

```tsx
// ✅ Yeni yöntem - CSS variables
<div className="card">
  İçerik
</div>

// veya inline
<div
  style={{
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
  }}
>
  İçerik
</div>
```

### Öncesi: Manuel Theme Switching

```tsx
// ❌ Eski yöntem - manuel theme switching
const [isDark, setIsDark] = useState(true);

<div style={{ background: isDark ? '#1a1a1a' : '#ffffff' }}>
  <button onClick={() => setIsDark(!isDark)}>
    Toggle Theme
  </button>
</div>
```

### Sonrası: Theme Context

```tsx
// ✅ Yeni yöntem - Theme context
import { useTheme } from '../../context/ThemeContext';

const { theme, toggleTheme } = useTheme();

<div className="bg-surface">
  <button className="btn btn-primary" onClick={toggleTheme}>
    Toggle Theme
  </button>
</div>
```

### Öncesi: Inline Color Logic

```tsx
// ❌ Eski yöntem - inline logic
<span
  style={{
    color: status === 'success' ? '#2ed573' :
          status === 'error' ? '#ff4757' :
          status === 'warning' ? '#ff9f40' : '#3498db'
  }}
>
  {message}
</span>
```

### Sonrası: Semantic Classes

```tsx
// ✅ Yeni yöntem - semantic classes
<span className={`text-${status}`}>
  {message}
</span>

// veya Badge component
<Badge variant={status}>{message}</Badge>
```

---

## 💡 Best Practices

### 1. Her Zaman CSS Variables Kullanın

```tsx
// ✅ İYİ
background: 'var(--color-surface)'

// ❌ KÖTÜ
background: '#1a1a1a'
```

### 2. Utility Classes'i Tercih Edin

```tsx
// ✅ İYİ - Utility classes
<div className="card glass shadow-lg radius-xl">

// ❌ KÖTÜ - Inline styles
<div style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', ... }}>
```

### 3. Semantic Renkler Kullanın

```tsx
// ✅ İYİ - Semantic
<Badge variant="success">Aktif</Badge>

// ❌ KÖTÜ - Generic
<span style={{ color: 'green' }}>Aktif</span>
```

### 4. Theme Context'i Kullanın

```tsx
// ✅ İYİ - Context
const { effectiveTheme } = useTheme();
const logo = effectiveTheme === 'dark' ? logoDark : logoLight;

// ❌ KÖTÜ - Manual detection
const isDark = document.documentElement.classList.contains('dark');
```

### 5. A11y Unutmayın

```tsx
// ✅ İYİ - A11y compliant
<button
  className="btn btn-primary"
  aria-label="Kaydet"
  onClick={handleSave}
>
  <SaveIcon aria-hidden="true" />
  Kaydet
</button>

// ❌ KÖTÜ - No labels
<button onClick={handleSave}>
  <SaveIcon />
</button>
```

### 6. Responsive Tasarım

```tsx
// ✅ İYİ - CSS variables with media queries
<style jsx>{`
  .container {
    padding: var(--spacing-md);
  }

  @media (min-width: 768px) {
    .container {
      padding: var(--spacing-xl);
    }
  }
`}</style>
```

### 7. Conditional Styling

```tsx
// ✅ İYİ - cn() helper
import { cn } from '../../lib/theme-utils';

<div className={cn(
  'card',
  isActive && 'card-active',
  hasError && 'card-error',
  glass && 'glass'
)}>

// ❌ KÖTÜ - String concatenation
<div className={'card' + (isActive ? ' card-active' : '') + (hasError ? ' card-error' : '')}>
```

---

## 📝 Migration Checklist

### Component Migration

- [ ] Import theme CSS (`import '../../styles/theme.css'`)
- [ ] Replace hardcoded colors with CSS variables
- [ ] Replace inline styles with utility classes
- [ ] Use `cn()` for conditional classes
- [ ] Add ARIA labels
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Test light/dark modes
- [ ] Test reduced motion
- [ ] Test high contrast

### Layout Migration

- [ ] Wrap with ThemeProvider
- [ ] Add ThemeToggle to header
- [ ] Add skip-to-main link
- [ ] Use semantic HTML
- [ ] Test responsive layout
- [ ] Test tab order
- [ ] Validate HTML
- [ ] Run Lighthouse audit

### Styling Migration

- [ ] Replace all hex colors with CSS variables
- [ ] Replace all px values with spacing variables
- [ ] Replace all border-radius with radius variables
- [ ] Replace all box-shadow with shadow variables
- [ ] Replace all font-size with size variables
- [ ] Test theme switching
- [ ] Test auto theme
- [ ] Verify contrast ratios

---

## 🧪 Testing Examples

### Unit Tests

```tsx
// __tests__/Card.test.tsx
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/context/ThemeContext';
import Card from '@/components/ui/Card';

describe('Card', () => {
  it('should apply glass effect', () => {
    const { container } = render(
      <ThemeProvider>
        <Card glass>Content</Card>
      </ThemeProvider>
    );

    const card = container.querySelector('.card-glass');
    expect(card).toBeInTheDocument();
  });

  it('should use CSS variables', () => {
    const { container } = render(
      <ThemeProvider>
        <Card>Content</Card>
      </ThemeProvider>
    );

    const card = container.querySelector('.card');
    const styles = window.getComputedStyle(card!);

    // CSS variable kullanıldığını doğrula
    expect(styles.background).toContain('var(--color-surface)');
  });
});
```

### E2E Tests

```tsx
// tests/theme.spec.ts
import { test, expect } from '@playwright/test';

test('theme switching works', async ({ page }) => {
  await page.goto('/');

  // Varsayılan dark mode
  let theme = await page.getAttribute('html', 'data-theme');
  expect(theme).toBe('dark');

  // Light mode'a geç
  await page.click('[aria-label="Açık tema"]');
  theme = await page.getAttribute('html', 'data-theme');
  expect(theme).toBe('light');

  // Auto mode'a geç
  await page.click('[aria-label="Otomatik tema"]');

  // localStorage'da kaydedildi mi?
  const stored = await page.evaluate(() => localStorage.getItem('lydian-iq-theme'));
  expect(stored).toBe('auto');
});
```

---

## 📚 Kaynaklar

### İlgili Dosyalar

- `apps/console/src/styles/theme.css` - Global tema CSS
- `apps/console/src/context/ThemeContext.tsx` - Theme provider
- `apps/console/src/components/theme/ThemeToggle.tsx` - Toggle UI
- `apps/console/src/lib/theme-utils.ts` - Utility functions

### Dokümantasyon

- [PHASE-4-THEME-SYSTEM-COMPLETE.md](/docs/PHASE-4-THEME-SYSTEM-COMPLETE.md)
- [THEME-A11Y-COMPLIANCE-GUIDE.md](/docs/THEME-A11Y-COMPLIANCE-GUIDE.md)

---

**Son Güncelleme:** 2025-10-10
**Geliştirici:** Claude Code (Sonnet 4.5)
**Durum:** ✅ Production Ready
