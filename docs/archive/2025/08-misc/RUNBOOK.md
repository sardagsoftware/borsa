# AILYDIAN - Development Runbook

## Overview

AILYDIAN is an advanced AI platform with Claude-inspired design, featuring:
- Modern landing page with video hero
- Authentication page (Claude login style)
- Baseline chat interface with full functionality
- Title Case normalization across all menus
- Comprehensive smoke tests

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Git

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Install Playwright browsers (first time only)
npx playwright install
```

### Development

```bash
# Start development server
npm run dev
# Server runs on http://localhost:3100

# Alternative: Direct node command
PORT=3100 node server.js
```

### Testing

```bash
# Run all smoke tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed
```

## Project Structure

```
ailydian-ultra-pro/
├── public/
│   ├── index.html          # Landing page (/) with video hero
│   ├── auth.html           # Authentication page (/auth)
│   ├── chat.html           # Chat interface (/chat) - baseline
│   ├── css/
│   │   └── claude-theme.css # Global Claude-inspired theme
│   ├── js/
│   │   └── title-case.js    # Title Case utility
│   ├── videos/             # Hero video (placeholder)
│   └── images/             # Hero poster (placeholder)
├── tests/
│   └── smoke.spec.ts       # Playwright smoke tests
├── server.js               # Express server
├── package.json
├── playwright.config.ts
└── RUNBOOK.md             # This file
```

## Key Features

### 1. Landing Page (/)
- **Video Hero**: Fullscreen video background with overlay gradients
- **Feature Pills**: Text, Vision, Audio, Video, Code, RAG
- **Why Cards**: 3 glass-morphism cards with hover effects
- **Footer**: 3-column layout with social links
- **Performance**: Optimized for LCP < 2.0s (desktop target)

### 2. Auth Page (/auth)
- **Minimal Design**: Claude login aesthetic
- **Form Fields**: Email, Password with proper ARIA labels
- **Actions**: Continue button + SSO option
- **UX**: 700ms loading animation, success toast
- **Security**: Password field never logged

### 3. Chat Page (/chat)
- **Baseline Features**:
  - `copyMessage(btn)`: Copy message text to clipboard
  - `regenerateMessage()`: Remove last assistant message and regenerate
  - `loadChatHistory()`: Load from localStorage, excluding `shared_` keys
- **UI**: 
  - Sidebar with chat history
  - Message avatars (36×36px)
  - Typing indicator with 3-dot animation
  - Fade/slide message animations
- **Storage**: Auto-save to localStorage with `chat_` prefix
- **A11y**: Supports `prefers-reduced-motion`

## Title Case Normalization

The `toTitleCase()` utility automatically normalizes menu text:

```javascript
// Usage
toTitleCase("api keys") // → "Api Keys"

// Auto-applied on DOM load to:
- [data-title-case] elements
- nav a, .menu-item, .nav-link
- [role="menuitem"]
- [data-testid="menu-item"]
```

**Implementation**: `/public/js/title-case.js`  
**Scope**: All navigation menus and menu content

## Smoke Tests

Located in `tests/smoke.spec.ts`:

### Landing Tests
- ✅ Hero video + CTA visibility
- ✅ Title Case normalization

### Auth Tests
- ✅ Form fields and buttons present
- ✅ ARIA labels correct
- ✅ Form submission works

### Chat Tests  
- ✅ History loads (excludes `shared_`)
- ✅ `copyMessage` and `regenerateMessage` work
- ✅ Title Case in menus
- ✅ Typing indicator animation

### Performance Tests
- ✅ Landing page LCP < 3s (relaxed)
- ✅ All pages respond with 200

## Media Assets (Telif Güvenli)

### Video (Placeholder)
- **Path**: `/public/videos/hero-loop.mp4`
- **Required**: 5-7s loop, 1080p, muted, autoplay-safe
- **Poster**: `/public/images/hero-poster.jpg`
- **Note**: Currently placeholder, add your own copyright-free video

### Icons
- All SVG icons are custom, no brand copying
- Feather-style line icons used throughout

## Running in Production

```bash
# Build (if using bundler)
npm run build

# Start server
npm start
# or
PORT=3100 node server.js
```

## Acceptance Criteria (DoD)

- [x] `/`: Video hero + CTA visible, LCP < 2.0s target
- [x] `/auth`: Form fields work, a11y labels complete
- [x] `/chat`: Baseline functions (copy, regenerate, history) work
- [x] Title Case applied to all menus
- [x] Smoke tests pass
- [x] No copyright violations (original assets)

## Common Commands

```bash
# Development
npm run dev                  # Start dev server on :3100

# Testing
npm test                     # Run Playwright tests
npm run test:ui              # Run with Playwright UI
npm run test:headed          # Run in headed mode

# Linting/Formatting (if configured)
# npm run lint
# npm run format
```

## Environment Variables

```bash
# Optional: Port configuration
PORT=3100

# Optional: Node environment
NODE_ENV=production
```

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 3100
lsof -i :3100

# Kill process
kill -9 <PID>
```

### Playwright Browser Install
```bash
npx playwright install chromium
```

### npm Peer Dependency Issues
```bash
npm install --legacy-peer-deps
```

## License & Copyright

- **Code**: ISC (or your license)
- **Assets**: All original, no brand assets copied
- **Video/Images**: Use copyright-free media (Pexels, Unsplash, etc.)

## Contributors

Generated with Claude 4.5 (Anthropic) as specified in requirements.

---

**Last Updated**: 2025-09-30  
**Version**: 1.0.0
