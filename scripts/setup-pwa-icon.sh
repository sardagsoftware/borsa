#!/bin/bash

echo "🍇 PWA Icon Setup Script"
echo "======================="
echo ""
echo "Please drag and drop the grape logo image here and press Enter:"
read -r IMAGE_PATH

# Remove quotes if present
IMAGE_PATH="${IMAGE_PATH//\'/}"
IMAGE_PATH="${IMAGE_PATH//\"/}"

if [ ! -f "$IMAGE_PATH" ]; then
  echo "❌ File not found: $IMAGE_PATH"
  exit 1
fi

echo "✅ Found image: $IMAGE_PATH"
echo ""
echo "📐 Processing PWA icons..."

# Create icons directory
mkdir -p public/icons

# Copy source
cp "$IMAGE_PATH" public/icons/pwa-source.png

# Generate PWA icon sizes with high quality
magick public/icons/pwa-source.png -resize 512x512 -quality 100 public/icons/pwa-512.png
magick public/icons/pwa-source.png -resize 192x192 -quality 100 public/icons/pwa-192.png
magick public/icons/pwa-source.png -resize 180x180 -quality 100 public/icons/apple-touch-icon.png

echo "✅ Generated PWA icons:"
echo "   - pwa-512.png (512x512)"
echo "   - pwa-192.png (192x192)"
echo "   - apple-touch-icon.png (180x180)"
echo ""
echo "🎉 Done! Icons are ready in public/icons/"
