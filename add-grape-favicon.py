#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🍇 Add Grape Favicon to All HTML Files
Created: 2025-12-21
"""

import os
import glob

# Define the new favicon HTML block
FAVICON_BLOCK = '''<!-- 🍇 Grape Favicon (Siyah Arka Plan + Beyaz Üzüm Logo) -->
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
    <meta name="msapplication-TileColor" content="#000000">
'''

def process_html_file(filepath):
    """Add grape favicon to HTML file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if grape favicon is already added
        if '🍇 Grape Favicon' in content:
            return False, "Already has grape favicon"

        # Find </head> tag and insert before it
        if '</head>' in content:
            content = content.replace('</head>', FAVICON_BLOCK + '\n</head>')

            # Write back
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

            return True, "Favicon added successfully"
        else:
            return False, "No </head> tag found"

    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    print("🍇 Adding Grape Favicon to all HTML files...\n")

    # Get all HTML files in public folder
    html_files = glob.glob('/Users/sardag/Desktop/ailydian-ultra-pro/ailydian-from-github/public/*.html')

    success_count = 0
    skip_count = 0
    error_count = 0

    for filepath in sorted(html_files):
        filename = os.path.basename(filepath)
        success, message = process_html_file(filepath)

        if success:
            print(f"✅ {filename}")
            success_count += 1
        elif "Already" in message:
            skip_count += 1
        else:
            print(f"❌ {filename}: {message}")
            error_count += 1

    print(f"\n📊 Summary:")
    print(f"   ✅ Added: {success_count}")
    print(f"   ⏭️  Skipped: {skip_count}")
    print(f"   ❌ Errors: {error_count}")
    print(f"   📝 Total: {len(html_files)}")
    print(f"\n🍇 Grape favicon deployment complete!")

if __name__ == "__main__":
    main()
