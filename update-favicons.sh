#!/bin/bash
# 🍇 Update ALL HTML files with Grape Favicon
# Created: 2025-12-21

echo "🍇 Updating all HTML files with grape favicon..."

# Define the new favicon HTML block with search engine optimization
FAVICON_BLOCK='<!-- 🍇 Grape Favicon (Siyah Arka Plan + Beyaz Üzüm Logo) -->
    <link rel="icon" type="image/svg+xml" href="/icons/grape-icon-simple.svg">
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
    <link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48.png">
    <link rel="icon" type="image/x-icon" href="/icons/favicon.ico">
    <link rel="shortcut icon" href="/icons/favicon.ico">

    <!-- Apple Touch Icons (Grape Logo) -->
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png">

    <!-- PWA Icons (Grape Logo) -->
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#000000">

    <!-- Search Engine Favicon Hints -->
    <meta property="og:image" content="https://www.ailydian.com/icons/pwa-icon-512.png">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="512">
    <meta property="og:image:height" content="512">
    <meta property="og:image:alt" content="aiLyDian - Grape Logo">
    <meta name="msapplication-TileImage" content="/icons/pwa-icon-512.png">
    <meta name="msapplication-TileColor" content="#000000">'

# Counter
count=0

# Update all HTML files in /public
for file in /Users/sardag/Desktop/ailydian-ultra-pro/ailydian-from-github/public/*.html; do
    if [ -f "$file" ]; then
        # Create backup
        cp "$file" "$file.favicon-backup"

        # Remove old favicon lines (multiple patterns)
        sed -i '' '/<link rel="icon"/d' "$file"
        sed -i '' '/<link rel="shortcut icon"/d' "$file"
        sed -i '' '/<link rel="apple-touch-icon"/d' "$file"
        sed -i '' '/<!-- Favicon/d' "$file"
        sed -i '' '/favicon-16.png/d' "$file"
        sed -i '' '/favicon-32.png/d' "$file"
        sed -i '' '/favicon-48.png/d' "$file"
        sed -i '' '/favicon.ico/d' "$file"

        # Find the </head> tag and insert new favicon block before it
        sed -i '' "s|</head>|$FAVICON_BLOCK\n</head>|" "$file"

        ((count++))
        echo "✅ Updated: $(basename "$file")"
    fi
done

echo ""
echo "✅ Total files updated: $count"
echo "🍇 Grape favicon successfully deployed to all HTML files!"
echo ""
echo "📝 Backup files created with .favicon-backup extension"
