# Visual Assets Creation Guide
**LyDian AI Ecosystem**
**Date:** 2025-10-09
**Status:** Ready for Design

---

## Overview

This guide provides exact specifications and recommendations for creating all visual assets needed for LyDian AI Ecosystem's online presence. All assets must follow the brand guidelines and be optimized for their intended use.

**Required Assets:** 8 core assets
**Tools Recommended:** Canva (easiest), Figma (professional), Adobe Photoshop/Illustrator (advanced)

---

## PRIORITY ASSETS

### Asset 1: Company Logo (Primary)
**Filename:** `logo-400x400.png`
**Purpose:** LinkedIn profile, website favicon, social media profiles

**Specifications:**
- **Dimensions:** 400×400 pixels minimum (can be 800×800 for retina displays)
- **Format:** PNG with transparent background
- **Color:** LyDian Blue (#00B4FF) on transparent
- **File Size:** < 500 KB
- **Safe Area:** Keep important elements within center 80% (edge cropping on some platforms)

**Design Requirements:**
- Simple, recognizable at small sizes (32×32 px)
- Works well in monochrome
- No text (just icon/symbol)
- Circular or square composition

**Design Suggestions:**

**Option 1: Neural Network Icon**
```
Concept: Interconnected nodes forming "L" or "AI" shape
Style: Minimalist, geometric
Colors: LyDian Blue (#00B4FF) with gradient to lighter blue
Example: Multiple circles connected by lines forming letter pattern
```

**Option 2: Abstract Brain + Circuit**
```
Concept: Half brain, half circuit board
Style: Modern, tech-forward
Colors: LyDian Blue with subtle dark gray (#121826) accents
```

**Option 3: Hexagonal Pattern**
```
Concept: Hexagon with internal geometric pattern
Style: Clean, corporate
Colors: Solid LyDian Blue or gradient
```

**Canva Template Search:**
- Search: "AI logo template"
- Filter: Square, minimalist, tech
- Customize with LyDian Blue color

**Where to Use:**
- `/public/logo-400x400.png`
- LinkedIn profile photo
- Twitter profile
- Favicon (scaled to 32×32, 64×64, 128×128)

---

### Asset 2: Logo (White Version)
**Filename:** `logo-400x400-white.png`
**Purpose:** Dark backgrounds, videos, presentations

**Specifications:**
- Same as Asset 1 but WHITE (#FFFFFF) color
- Transparent background
- 400×400 px minimum

**Where to Use:**
- Dark mode website
- Video overlays
- Dark-themed presentations
- Print materials on dark paper

---

### Asset 3: LinkedIn Cover Image
**Filename:** `cover-linkedin-1584x396.png`
**Purpose:** LinkedIn company page header banner

**Specifications:**
- **Dimensions:** 1584×396 pixels (exact, 4:1 ratio)
- **Format:** PNG or JPG
- **File Size:** < 8 MB
- **Safe Area:** Keep text/logo within center 1400×300 (avoid edges)
- **Colors:** LyDian Blue, Dark Gray, White

**Design Requirements:**
- Company name: "LyDian AI Ecosystem"
- Tagline: "Intelligence for Every Domain"
- Subtle tech/AI visual elements
- Professional, not cluttered
- Readable on mobile (test at small size)

**Design Concept: Neural Network Data Flow**

**Layout:**
```
[Left 40%]                    [Center 20%]        [Right 40%]
Neural network               LyDian AI            Module icons
pattern background           Ecosystem            connected by lines
(opacity 20%)               (large, bold)         (6 modules)

                         Intelligence for
                          Every Domain
                           (subtitle)
```

**Elements to Include:**
1. **Background:** Gradient (Dark Gray #121826 → LyDian Blue #00B4FF)
2. **Overlay:** Subtle neural network pattern (dots + connecting lines, 10-20% opacity)
3. **Company Name:** "LyDian AI Ecosystem" (Inter Extra Bold, 72pt, White)
4. **Tagline:** "Intelligence for Every Domain" (Inter Regular, 32pt, White 80% opacity)
5. **Module Icons:** Small icons for 6 modules in a row at bottom
6. **Logo:** Small logo bottom-right corner (80×80 px)

**Color Palette:**
- Background gradient: #121826 (left) → #00B4FF (right)
- Text: #FFFFFF (white)
- Accent: #60A5FA (light blue for icons)

**Typography:**
- Primary: Inter Extra Bold (company name)
- Secondary: Inter Regular (tagline)

**Canva Template:**
1. Go to Canva.com
2. Search: "LinkedIn cover photo" (1584×396 preset)
3. Choose tech/AI theme template
4. Customize:
   - Background: Gradient (dark → blue)
   - Add text: "LyDian AI Ecosystem"
   - Add tagline: "Intelligence for Every Domain"
   - Add geometric shapes or neural network illustration
   - Add small icons for modules
5. Export as PNG

**Where to Use:**
- `/public/cover-linkedin-1584x396.png`
- LinkedIn company page header

---

### Asset 4: Open Graph Image
**Filename:** `og-image.png`
**Purpose:** Social media sharing preview (Facebook, LinkedIn, Twitter)

**Specifications:**
- **Dimensions:** 1200×628 pixels (1.91:1 ratio)
- **Format:** PNG or JPG
- **File Size:** < 1 MB
- **Safe Area:** Keep text/logo within center 1100×550 (avoid edges for mobile crop)

**Design Requirements:**
- Eye-catching but professional
- Readable text (test at thumbnail size)
- LyDian branding clear
- High contrast for readability

**Design Concept: Multi-Module Showcase**

**Layout:**
```
[Header - 200px height]
LyDian AI Ecosystem
Intelligence for Every Domain

[Body - 328px height]
[Grid: 2 rows × 3 columns of module cards]
- LyDian IQ        - Quantum Pro      - SmartCity OS
- Medical AI       - Legal AI         - AI Lens

[Footer - 100px height]
www.ailydian.com    |    20+ Languages    |    Multi-Model AI
```

**Visual Style:**
- Background: Dark Gray (#121826)
- Cards: LyDian Blue (#00B4FF) with module icon + name
- Text: White (#FFFFFF)
- Accents: Light blue (#60A5FA) for icons

**Typography:**
- Title: Inter Extra Bold, 64pt
- Tagline: Inter Regular, 28pt
- Module names: Inter Semi-Bold, 20pt
- Footer: Inter Regular, 16pt

**Canva Template:**
1. Create custom size: 1200×628 px
2. Dark background (#121826)
3. Add title at top: "LyDian AI Ecosystem"
4. Add 6 small cards (2 rows × 3 columns)
5. Add footer with website + key features
6. Export as PNG

**Where to Use:**
- `/public/og-image.png`
- Referenced in `<meta property="og:image">`
- Appears when sharing links on Facebook, LinkedIn, Twitter

---

### Asset 5: Twitter Card Image
**Filename:** `twitter-card.png`
**Purpose:** Twitter-specific sharing image

**Specifications:**
- **Dimensions:** 1200×675 pixels (16:9 ratio) OR use same as OG image (1200×628)
- **Format:** PNG or JPG
- **File Size:** < 5 MB

**Design:**
- Can reuse OG image (1200×628) — Twitter accepts this
- OR create specific 16:9 version with adjusted layout

**Where to Use:**
- `/public/twitter-card.png`
- Referenced in `<meta name="twitter:image">`

---

### Asset 6: Favicon Set
**Filenames:** `favicon-32x32.png`, `favicon-64x64.png`, `favicon-128x128.png`
**Purpose:** Browser tab icon

**Specifications:**
- **Dimensions:** 32×32, 64×64, 128×128 pixels (set of 3)
- **Format:** PNG or ICO
- **Design:** Simplified version of main logo
- **Background:** Transparent OR solid color

**Design Requirements:**
- Extremely simple (recognizable at 16×16 px)
- High contrast
- No text

**Creation:**
1. Start with logo (400×400)
2. Simplify if needed (remove fine details)
3. Scale down to 128×128, 64×64, 32×32
4. Test at actual size (should be recognizable)

**Where to Use:**
- `/public/favicon-*.png`
- Referenced in `<link rel="icon">`

---

### Asset 7: Apple Touch Icon
**Filename:** `apple-touch-icon.png`
**Purpose:** iOS/macOS bookmark icon

**Specifications:**
- **Dimensions:** 180×180 pixels
- **Format:** PNG
- **Background:** Can be transparent OR solid color (rounded by iOS automatically)

**Design:**
- Use same design as main logo
- Ensure works well when rounded (iOS adds rounded corners)

**Where to Use:**
- `/public/apple-touch-icon.png`
- Referenced in `<link rel="apple-touch-icon">`

---

### Asset 8: LinkedIn Post Template
**Filename:** `post-template-1200x628.psd` or `.fig`
**Purpose:** Reusable template for LinkedIn posts

**Specifications:**
- **Dimensions:** 1200×628 pixels
- **Format:** PSD (Photoshop), FIG (Figma), or Canva template
- **Layers:** Background, logo, text layers, module icon layers

**Design Elements:**
- Background layer (editable gradient or solid)
- Logo position (bottom-right, 80×80 px, 20px padding)
- Title text layer (placeholder text)
- Body text layer (placeholder text)
- Module icon placeholder
- LyDian Blue accent elements

**Variations Needed:**
1. General template (any topic)
2. Educational template (with "Learn" badge)
3. Product template (with module icon)
4. Announcement template (with "New" badge)

**Where to Store:**
- `/linkedin/templates/` (create this folder)

---

## COLOR REFERENCE

### Primary Colors
```css
LyDian Blue:    #00B4FF (RGB: 0, 180, 255)
Dark Gray:      #121826 (RGB: 18, 24, 38)
White:          #FFFFFF (RGB: 255, 255, 255)
```

### Secondary Colors
```css
Light Gray:     #F3F4F6 (RGB: 243, 244, 246)
Medium Gray:    #6B7280 (RGB: 107, 114, 128)
Light Blue:     #60A5FA (RGB: 96, 165, 250)
```

### Module Colors
```css
Discovery:      #8B5CF6 (Purple)
Quantum Pro:    #10B981 (Green)
SmartCity:      #F59E0B (Orange)
Medical AI:     #EF4444 (Red)
Legal AI:       #6366F1 (Indigo)
AI Lens:        #EC4899 (Pink)
```

---

## TYPOGRAPHY REFERENCE

### Fonts
**Primary:** Inter (Google Fonts)
- Download: https://fonts.google.com/specimen/Inter
- Weights: 300, 400, 500, 600, 700, 800, 900

**Secondary:** Source Sans Pro (alternative)
- Download: https://fonts.google.com/specimen/Source+Sans+Pro

### Font Sizes (Reference)
- **Hero Title:** 64-96pt (covers, hero sections)
- **Section Title:** 48-64pt (section headers)
- **Subtitle:** 28-32pt (taglines)
- **Body Large:** 20-24pt (important body text)
- **Body Regular:** 16-18pt (standard text)
- **Caption:** 12-14pt (small text, footnotes)

---

## DESIGN TOOLS & RESOURCES

### Recommended Tools

**Option 1: Canva (Easiest - No Design Experience)**
- **Cost:** Free (with paid templates ~$1 each) or Pro ($12.99/month)
- **URL:** https://www.canva.com
- **Best For:** Quick, professional designs
- **Templates:** Pre-made LinkedIn covers, social media graphics
- **Process:**
  1. Sign up for free account
  2. Search "LinkedIn cover" or "logo design"
  3. Choose AI/tech themed template
  4. Customize colors (use LyDian Blue #00B4FF)
  5. Download as PNG

**Option 2: Figma (Professional - Free for Personal)**
- **Cost:** Free for personal use
- **URL:** https://www.figma.com
- **Best For:** Professional designs, reusable components
- **Learning Curve:** Medium
- **Process:**
  1. Sign up for free account
  2. Create new file
  3. Design from scratch or use community templates
  4. Export as PNG/JPG

**Option 3: Adobe Photoshop/Illustrator (Advanced)**
- **Cost:** $54.99/month (Creative Cloud)
- **Best For:** Advanced users, print-ready files
- **Learning Curve:** High

**Option 4: GIMP / Inkscape (Free Open-Source)**
- **Cost:** Free
- **GIMP:** https://www.gimp.org (Photoshop alternative)
- **Inkscape:** https://inkscape.org (Illustrator alternative)
- **Learning Curve:** Medium-High

### Free Stock Resources

**Icons:**
- **Heroicons:** https://heroicons.com (free, MIT license)
- **Feather Icons:** https://feathericons.com (free, MIT license)
- **Iconify:** https://iconify.design (thousands of free icons)

**Illustrations:**
- **Undraw:** https://undraw.co (free, customizable illustrations)
- **Humaaans:** https://www.humaaans.com (free, people illustrations)
- **Storyset:** https://storyset.com (free, animated illustrations)

**Patterns/Backgrounds:**
- **SVG Backgrounds:** https://www.svgbackgrounds.com
- **Hero Patterns:** https://heropatterns.com
- **Cool Backgrounds:** https://coolbackgrounds.io

**Neural Network Graphics:**
- Search: "neural network illustration free"
- **Freepik:** https://www.freepik.com (free with attribution)
- **Vecteezy:** https://www.vecteezy.com (free vectors)

---

## STEP-BY-STEP: CREATE LOGO IN CANVA

### Step 1: Start New Design
1. Go to https://www.canva.com
2. Click "Create a design"
3. Select "Custom size" → 800×800 px
4. Click "Create new design"

### Step 2: Find Template
1. In left sidebar, click "Elements"
2. Search: "AI logo" or "tech logo"
3. Filter by: Graphics, Icons
4. Choose a neural network or circuit-style icon

### Step 3: Customize
1. Click the icon to select
2. Change color to LyDian Blue (#00B4FF)
   - Click color picker
   - Enter hex code: #00B4FF
3. Resize to fill canvas (leave ~10% margin)
4. Optionally add text: "LyDian" below icon

### Step 4: Add Background
1. Click "Background"
2. Select "Transparent" (for PNG with transparency)
3. OR select solid color if preferred

### Step 5: Download
1. Click "Share" → "Download"
2. File type: PNG
3. Check "Transparent background" (if applicable)
4. Click "Download"
5. Save as: `logo-800x800.png`

### Step 6: Create Variations
1. Duplicate design (File → Make a copy)
2. Change color to white (#FFFFFF)
3. Download as: `logo-800x800-white.png`
4. Resize to 400×400 using online tool or Canva
5. Save as: `logo-400x400.png` and `logo-400x400-white.png`

---

## STEP-BY-STEP: CREATE LINKEDIN COVER IN CANVA

### Step 1: Start with Preset
1. Canva → Create a design
2. Search: "LinkedIn banner"
3. Select preset (1584×396 px)

### Step 2: Choose Template
1. Browse templates (search "tech" or "AI")
2. Select modern, minimalist template
3. Click to use

### Step 3: Customize Background
1. Click background
2. Change to gradient:
   - Click "Color" → "Gradient"
   - Set left color: #121826 (Dark Gray)
   - Set right color: #00B4FF (LyDian Blue)
   - Adjust gradient angle if needed

### Step 4: Add Text
1. Click "Text" in left sidebar
2. Add heading: "LyDian AI Ecosystem"
   - Font: Inter Extra Bold
   - Size: 72pt
   - Color: White (#FFFFFF)
   - Position: Center-left
3. Add subheading: "Intelligence for Every Domain"
   - Font: Inter Regular
   - Size: 32pt
   - Color: White 80% opacity
   - Position: Below main heading

### Step 5: Add Visual Elements
1. Click "Elements"
2. Search: "neural network" or "tech pattern"
3. Add illustration/graphic to right side
4. Adjust opacity: 20-40% (subtle background)
5. Optionally add small module icons at bottom

### Step 6: Add Logo
1. Upload your logo (logo-400x400.png)
2. Resize to ~80×80 px
3. Position: Bottom-right corner, 20px from edges

### Step 7: Download
1. Click "Share" → "Download"
2. File type: PNG
3. Quality: Standard or High
4. Download
5. Save as: `cover-linkedin-1584x396.png`

---

## QUALITY CHECKLIST

Before finalizing any asset, verify:

### Technical
- [ ] Correct dimensions (exact pixels)
- [ ] Correct file format (PNG for transparency, JPG for photos)
- [ ] File size under limit
- [ ] High resolution (not blurry/pixelated)
- [ ] Colors match brand palette (hex codes correct)

### Design
- [ ] Follows brand guidelines
- [ ] Readable at small size (test thumbnail)
- [ ] Works in both light and dark contexts
- [ ] No copyright violations (stock images licensed)
- [ ] Professional appearance
- [ ] Consistent with other assets

### Testing
- [ ] Test on actual platform (upload to LinkedIn/website)
- [ ] View on mobile device
- [ ] Check in different browsers
- [ ] Verify transparent backgrounds work correctly
- [ ] Ensure text is readable

---

## FILE NAMING CONVENTION

```
logo-[size]-[variant].[ext]
cover-[platform]-[dimensions].[ext]
og-image.[ext]
favicon-[size].[ext]
post-template-[dimensions].[ext]
```

**Examples:**
```
logo-400x400.png
logo-400x400-white.png
logo-800x800.png
cover-linkedin-1584x396.png
cover-twitter-1500x500.png
og-image.png
og-image-1200x628.png
favicon-32x32.png
favicon-64x64.png
apple-touch-icon-180x180.png
post-template-1200x628.psd
```

---

## DELIVERY CHECKLIST

### Required Assets (Priority 1)
- [ ] `logo-400x400.png` — Main logo
- [ ] `logo-400x400-white.png` — White logo
- [ ] `cover-linkedin-1584x396.png` — LinkedIn cover
- [ ] `og-image.png` — Social sharing image (1200×628)

### Recommended Assets (Priority 2)
- [ ] `favicon-32x32.png`
- [ ] `favicon-64x64.png`
- [ ] `apple-touch-icon-180x180.png`
- [ ] `twitter-card.png` (or reuse og-image)

### Optional Assets (Priority 3)
- [ ] Logo variations (monochrome, icon-only)
- [ ] Post templates (Canva/Figma)
- [ ] Module icons (6 individual icons)
- [ ] Cover variations for different platforms

---

## WHERE TO SAVE FILES

```
/public/
  ├── logo-400x400.png
  ├── logo-400x400-white.png
  ├── og-image.png
  ├── cover-linkedin-1584x396.png
  ├── favicon-32x32.png
  ├── favicon-64x64.png
  ├── apple-touch-icon-180x180.png
  └── twitter-card.png (optional)

/linkedin/templates/ (create this folder)
  ├── post-template-1200x628.psd
  ├── post-educational-1200x628.psd
  └── post-announcement-1200x628.psd
```

---

## TIMELINE ESTIMATE

### DIY with Canva (No Design Experience)
- **Logo:** 1-2 hours
- **LinkedIn Cover:** 1-2 hours
- **OG Image:** 30-60 minutes
- **Favicon Set:** 30 minutes (resize logo)
- **Total:** 3-5 hours

### Professional Designer (Fiverr/Upwork)
- **Cost:** $50-200 for complete set
- **Timeline:** 3-7 days
- **Quality:** Higher quality, custom designs

### DIY with Figma (Some Design Experience)
- **Logo:** 2-3 hours
- **LinkedIn Cover:** 1-2 hours
- **OG Image:** 1 hour
- **Total:** 4-6 hours

---

## NEXT STEPS

1. **Choose tool:** Canva (easiest) or Figma (professional)
2. **Start with logo:** Most important asset, needed for everything else
3. **Create LinkedIn cover:** Needed for LinkedIn page setup
4. **Create OG image:** Improves social sharing
5. **Generate favicons:** Scale down logo
6. **Upload to website:** Place in `/public/` directory
7. **Test:** Upload to LinkedIn, share link to test OG image

---

**Document Version:** 1.0
**Last Updated:** 2025-10-09
**Status:** Ready for Design
**Priority:** High — Needed for LinkedIn launch

**Related Documents:**
- Brand Kit: `/linkedin/profile/brand-kit.md`
- LinkedIn Setup Guide: `/docs/LINKEDIN-SETUP-GUIDE.md`
- Search Console Guide: `/docs/SEARCH-CONSOLE-SETUP-GUIDE.md`

**Support:** For questions, contact info@ailydian.com
