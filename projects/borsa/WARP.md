# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Next.js 15 application named "borsa" built with React 19, TypeScript, and Tailwind CSS v4. The project uses the modern App Router architecture and includes several key libraries for enhanced functionality.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Turbopack (recommended for development)
- `npm run build` - Build production version with Turbopack optimization
- `npm start` - Start production server (requires build first)
- `npm run lint` - Run ESLint checks

### Development Server
The dev server runs on http://localhost:3000 by default. Turbopack is enabled for faster development builds.

## Architecture & Key Dependencies

### Framework Stack
- **Next.js 15** with App Router (`src/app/` directory structure)
- **React 19** with latest features
- **TypeScript 5** with strict mode enabled
- **Tailwind CSS v4** via PostCSS plugin architecture

### Key Libraries
- **Framer Motion** (`framer-motion`) - Animation and motion graphics
- **Axios** - HTTP client for API requests
- **Lucide React** - Modern icon library
- **Recharts** - Chart and data visualization components
- **Next Themes** - Theme switching functionality

### Project Structure
```
src/
  app/
    layout.tsx     # Root layout with Geist font configuration
    page.tsx       # Homepage component
    globals.css    # Global styles with CSS custom properties
    favicon.ico    # App icon
```

## Code Standards & Configuration

### TypeScript Configuration
- Target: ES2017 with modern browser support
- Path alias: `@/*` maps to `./src/*`
- Strict mode enabled for type safety
- Next.js plugin integration for enhanced IntelliSense

### ESLint Rules
- Extends `next/core-web-vitals` and `next/typescript`
- Ignores: node_modules, .next, out, build directories

### Styling Architecture
- **Tailwind CSS v4** with PostCSS integration
- CSS custom properties for theming (`--background`, `--foreground`)
- Dark mode support via `prefers-color-scheme`
- Geist font family (sans and mono variants) loaded via Next.js font optimization

## Theme Integration

The user prefers websites similar to ailydian.com with specific color variables:
- `--ac-1: #FF214D` (accent primary)
- `--ac-2: #FF6A45` (accent secondary) 
- `--bg-0: #0A0A0B` (background dark)
- `--tx-1: #F3F4F6` (text light)

When implementing themes, incorporate neon text effects, animated orbits/visuals, and ensure mobile compatibility.

## Development Notes

### Turbopack Integration
Both development and build commands use `--turbopack` flag for enhanced performance. This is the default configuration.

### Font Optimization
Project uses Next.js font optimization with Geist Sans and Geist Mono fonts, configured as CSS variables for consistent theming.

### Modern React Features
Built with React 19, enabling use of latest React features including improved Suspense, concurrent features, and enhanced server components.