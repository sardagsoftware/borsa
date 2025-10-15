# LCI Web - Frontend Application

KVKK/GDPR compliant complaint management platform frontend built with Next.js 14 App Router.

## White-hat Features

- ✅ Next.js 14 App Router (server components by default)
- ✅ TypeScript strict mode
- ✅ Tailwind CSS + shadcn/ui components
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ Semantic HTML & ARIA attributes
- ✅ SEO optimized (metadata, OpenGraph, Twitter cards)
- ✅ Dark mode ready
- ✅ Accessibility focused (WCAG 2.1 AA compliance target)

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local with your API URL
# NEXT_PUBLIC_API_URL=http://localhost:3201

# Start development server
pnpm dev

# Web will be available at http://localhost:3200
```

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Root layout with metadata
│   ├── page.tsx          # Home page
│   ├── globals.css       # Global styles + Tailwind
│   ├── complaints/       # Complaint pages (Phase 2.2)
│   ├── brands/           # Brand pages (Phase 3.1)
│   └── auth/             # Auth pages (Phase 2.1)
├── components/
│   └── ui/               # shadcn/ui components
└── lib/
    └── utils.ts          # Utility functions
```

## Available Scripts

```bash
# Development
pnpm dev          # Start dev server (port 3200)

# Production
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm lint         # Lint code
pnpm format       # Format with Prettier
```

## Components

Built with [shadcn/ui](https://ui.shadcn.com/):

- Button - Accessible, keyboard navigable
- Card - Semantic, composable layout
- More components will be added in Phase 2+

## Routing

- `/` - Home page with platform overview
- `/complaints` - Browse complaints (Phase 2.2)
- `/complaints/new` - Create complaint (Phase 2.2)
- `/brands` - Brand directory (Phase 3.1)
- `/brands/[slug]` - Brand profile (Phase 3.1)
- `/auth/login` - User login (Phase 2.1)
- `/auth/register` - User registration (Phase 2.1)

## Development Phases

- ✅ Phase 1.6: Frontend skeleton (current)
- ⏳ Phase 2.1: Auth UI (login, register, profile)
- ⏳ Phase 2.2: Complaint CRUD UI
- ⏳ Phase 3.1: Brand panel UI
- ⏳ Phase 4.1: SEO components

## License

Proprietary - Lydian AI © 2025
