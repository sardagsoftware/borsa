#!/bin/bash
###############################################################################
# 🎨 PWA ICON GENERATOR
# Generate all required PWA icons from SVG master
###############################################################################

set -e

# Check if ImageMagick is installed
if ! command -v magick &> /dev/null && ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Installing via Homebrew..."
    brew install imagemagick
fi

# Determine ImageMagick command
if command -v magick &> /dev/null; then
    CONVERT="magick"
else
    CONVERT="convert"
fi

SVG_SOURCE="public/icons/lydian-grape-logo.svg"
ICONS_DIR="public/icons"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "🎨 LYDIAN PWA ICON GENERATOR"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Source SVG: $SVG_SOURCE"
echo "Output Dir: $ICONS_DIR"
echo ""

# Create icons directory if not exists
mkdir -p "$ICONS_DIR"

# PWA Standard Sizes
echo "📱 Generating PWA Standard Icons..."
$CONVERT -background none "$SVG_SOURCE" -resize 72x72 "$ICONS_DIR/icon-72.png"
$CONVERT -background none "$SVG_SOURCE" -resize 96x96 "$ICONS_DIR/icon-96.png"
$CONVERT -background none "$SVG_SOURCE" -resize 128x128 "$ICONS_DIR/icon-128.png"
$CONVERT -background none "$SVG_SOURCE" -resize 144x144 "$ICONS_DIR/icon-144.png"
$CONVERT -background none "$SVG_SOURCE" -resize 152x152 "$ICONS_DIR/icon-152.png"
$CONVERT -background none "$SVG_SOURCE" -resize 192x192 "$ICONS_DIR/icon-192.png"
$CONVERT -background none "$SVG_SOURCE" -resize 384x384 "$ICONS_DIR/icon-384.png"
$CONVERT -background none "$SVG_SOURCE" -resize 512x512 "$ICONS_DIR/icon-512.png"
$CONVERT -background none "$SVG_SOURCE" -resize 1024x1024 "$ICONS_DIR/icon-1024.png"
echo "  ✅ Generated 9 PWA icons"

# Maskable Icons (with safe zone - 80% content, 20% padding)
echo ""
echo "🎭 Generating Maskable Icons (Android Adaptive)..."

# Create maskable version with padding
$CONVERT -background "#1C2536" "$SVG_SOURCE" -resize 154x154 -gravity center -extent 192x192 "$ICONS_DIR/icon-192-maskable.png"
$CONVERT -background "#1C2536" "$SVG_SOURCE" -resize 410x410 -gravity center -extent 512x512 "$ICONS_DIR/icon-512-maskable.png"
echo "  ✅ Generated 2 maskable icons"

# Apple Touch Icons
echo ""
echo "🍎 Generating Apple Touch Icons..."
$CONVERT -background none "$SVG_SOURCE" -resize 120x120 "$ICONS_DIR/apple-touch-icon-120.png"
$CONVERT -background none "$SVG_SOURCE" -resize 152x152 "$ICONS_DIR/apple-touch-icon-152.png"
$CONVERT -background none "$SVG_SOURCE" -resize 167x167 "$ICONS_DIR/apple-touch-icon-167.png"
$CONVERT -background none "$SVG_SOURCE" -resize 180x180 "$ICONS_DIR/apple-touch-icon-180.png"
$CONVERT -background none "$SVG_SOURCE" -resize 180x180 "$ICONS_DIR/apple-touch-icon.png"
echo "  ✅ Generated 5 Apple touch icons"

# Favicons
echo ""
echo "🔖 Generating Favicons..."
$CONVERT -background none "$SVG_SOURCE" -resize 16x16 "$ICONS_DIR/favicon-16.png"
$CONVERT -background none "$SVG_SOURCE" -resize 32x32 "$ICONS_DIR/favicon-32.png"
$CONVERT -background none "$SVG_SOURCE" -resize 48x48 "$ICONS_DIR/favicon-48.png"

# Create multi-size favicon.ico
$CONVERT "$ICONS_DIR/favicon-16.png" "$ICONS_DIR/favicon-32.png" "$ICONS_DIR/favicon-48.png" "$ICONS_DIR/favicon.ico"

# Also copy to root for browsers
cp "$ICONS_DIR/favicon.ico" "public/favicon.ico"
echo "  ✅ Generated 4 favicons (including .ico)"

# Microsoft Tiles
echo ""
echo "🪟 Generating Microsoft Tiles..."
$CONVERT -background "#C4A962" "$SVG_SOURCE" -resize 144x144 "$ICONS_DIR/ms-icon-144.png"
$CONVERT -background "#C4A962" "$SVG_SOURCE" -resize 150x150 "$ICONS_DIR/ms-icon-150.png"
$CONVERT -background "#C4A962" "$SVG_SOURCE" -resize 310x310 "$ICONS_DIR/ms-icon-310.png"
echo "  ✅ Generated 3 Microsoft tiles"

# OG Image (for social sharing)
echo ""
echo "📱 Generating Social Media OG Image..."
$CONVERT -background "#1C2536" "$SVG_SOURCE" -resize 1200x630! "$ICONS_DIR/og-image.png"
cp "$ICONS_DIR/og-image.png" "public/og-image.png"
echo "  ✅ Generated OG image (1200x630)"

# Apple Splash Screens (most common sizes)
echo ""
echo "🌊 Generating Apple Splash Screens..."
mkdir -p "$ICONS_DIR/splash"

# iPhone X/XS/11 Pro (375x812)
$CONVERT -background "#1C2536" "$SVG_SOURCE" -resize 300x300 -gravity center -extent 750x1624 "$ICONS_DIR/splash/iphone-x.png"

# iPhone XR/11 (414x896)
$CONVERT -background "#1C2536" "$SVG_SOURCE" -resize 320x320 -gravity center -extent 828x1792 "$ICONS_DIR/splash/iphone-xr.png"

# iPhone 12/13/14 (390x844)
$CONVERT -background "#1C2536" "$SVG_SOURCE" -resize 310x310 -gravity center -extent 780x1688 "$ICONS_DIR/splash/iphone-12.png"

# iPad (810x1080)
$CONVERT -background "#1C2536" "$SVG_SOURCE" -resize 500x500 -gravity center -extent 1620x2160 "$ICONS_DIR/splash/ipad.png"

# iPad Pro 11" (834x1194)
$CONVERT -background "#1C2536" "$SVG_SOURCE" -resize 520x520 -gravity center -extent 1668x2388 "$ICONS_DIR/splash/ipad-pro-11.png"

# iPad Pro 12.9" (1024x1366)
$CONVERT -background "#1C2536" "$SVG_SOURCE" -resize 620x620 -gravity center -extent 2048x2732 "$ICONS_DIR/splash/ipad-pro-12.png"

echo "  ✅ Generated 6 splash screens"

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "✅ ICON GENERATION COMPLETE"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "   PWA Standard:      9 icons (72px - 1024px)"
echo "   Maskable:          2 icons (192px, 512px)"
echo "   Apple Touch:       5 icons (120px - 180px)"
echo "   Favicons:          4 files (16px - 48px + .ico)"
echo "   Microsoft Tiles:   3 icons (144px - 310px)"
echo "   OG Image:          1 image (1200x630)"
echo "   Splash Screens:    6 images (iPhone/iPad)"
echo ""
echo "   Total Generated:   30 icon files"
echo ""
echo "📁 All icons saved to: $ICONS_DIR/"
echo ""
echo "🎨 Master SVG: $SVG_SOURCE"
echo ""
