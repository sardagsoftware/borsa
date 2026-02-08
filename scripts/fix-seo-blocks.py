#!/usr/bin/env python3
"""
Fix duplicate SEO blocks in all HTML files.
- Removes auto-generated AILYDIAN SEO META TAGS blocks
- Preserves original curated title/meta tags if they exist
- If file only has title in SEO block, keeps it at the top
"""

import os
import re
import sys

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public')

# Pattern to match the entire auto-generated SEO block
SEO_BLOCK_PATTERN = re.compile(
    r'\s*<!-- ={10,} -->\s*\n'
    r'\s*<!-- AILYDIAN SEO META TAGS \(TR\) -->\s*\n'
    r'\s*<!-- Auto-generated for multi-language SEO -->\s*\n'
    r'\s*<!-- ={10,} -->\s*\n'
    r'(.*?)'
    r'\s*<!-- ={10,} -->\s*\n'
    r'\s*<!-- END AILYDIAN SEO META TAGS -->\s*\n'
    r'\s*<!-- ={10,} -->\s*\n?',
    re.DOTALL
)

TITLE_PATTERN = re.compile(r'<title>(.*?)</title>', re.DOTALL)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    # Find SEO block
    match = SEO_BLOCK_PATTERN.search(content)
    if not match:
        return False, "No SEO block found"

    seo_block_content = match.group(1)
    before_block = content[:match.start()]
    after_block = content[match.end():]

    # Check if there's a title tag BEFORE the SEO block
    has_title_before = bool(TITLE_PATTERN.search(before_block))

    # Extract title from SEO block in case we need it
    seo_title_match = TITLE_PATTERN.search(seo_block_content)
    seo_title = seo_title_match.group(0) if seo_title_match else None

    # Remove the SEO block
    new_content = before_block + after_block

    # If no title before block, add the SEO block's title after <meta charset>
    if not has_title_before and seo_title:
        # Try to insert after meta charset or meta viewport
        charset_match = re.search(r'(<meta\s+charset=[^>]+>)', new_content)
        viewport_match = re.search(r'(<meta\s+name="viewport"[^>]+>)', new_content)

        insert_after = viewport_match or charset_match
        if insert_after:
            pos = insert_after.end()
            new_content = new_content[:pos] + '\n    ' + seo_title + new_content[pos:]

        status = "REMOVED block, PRESERVED title"
    else:
        status = "REMOVED block (original title kept)"

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return True, status

def main():
    if not os.path.isdir(PUBLIC_DIR):
        print(f"ERROR: {PUBLIC_DIR} not found")
        sys.exit(1)

    total = 0
    fixed = 0
    skipped = 0

    for filename in sorted(os.listdir(PUBLIC_DIR)):
        if not filename.endswith('.html'):
            continue

        filepath = os.path.join(PUBLIC_DIR, filename)
        total += 1

        try:
            changed, status = process_file(filepath)
            if changed:
                fixed += 1
                print(f"  FIXED: {filename} - {status}")
            else:
                skipped += 1
        except Exception as e:
            print(f"  ERROR: {filename} - {e}")

    print(f"\nSummary: {fixed} fixed, {skipped} skipped, {total} total")

if __name__ == '__main__':
    main()
