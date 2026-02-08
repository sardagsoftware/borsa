#!/usr/bin/env python3
"""
Batch fix CORS wildcard (*) in all API files.
Replaces res.setHeader('Access-Control-Allow-Origin', '*') with getCorsOrigin(req).
Adds import of cors.js module at top of each file.
"""

import os
import re
import sys

API_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'api')
MIDDLEWARE_DIR = os.path.join(API_DIR, '_middleware')

# Patterns to replace
PATTERNS = [
    # Pattern 1: res.setHeader('Access-Control-Allow-Origin', '*')
    (
        re.compile(r"res\.setHeader\(\s*['\"]Access-Control-Allow-Origin['\"]\s*,\s*['\"]?\*['\"]?\s*\)"),
        "res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req))"
    ),
    # Pattern 2: res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
    (
        re.compile(r"res\.setHeader\(\s*['\"]Access-Control-Allow-Origin['\"]\s*,\s*req\.headers\.origin\s*\|\|\s*['\"]?\*['\"]?\s*\)"),
        "res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req))"
    ),
]

# Pattern for object literal style: 'Access-Control-Allow-Origin': '*'
OBJ_PATTERN = re.compile(r"(['\"])Access-Control-Allow-Origin\1\s*:\s*['\"]?\*['\"]?")
OBJ_REPLACEMENT = "'Access-Control-Allow-Origin': getCorsOrigin(req)"

# Import line to add
IMPORT_TEMPLATE = "const {{ getCorsOrigin }} = require('{}');\n"

# Already has import
IMPORT_CHECK = re.compile(r"require\(['\"].*?cors['\"]?\)")

def get_relative_path(filepath):
    """Calculate relative path from file to api/_middleware/cors"""
    file_dir = os.path.dirname(filepath)
    rel = os.path.relpath(MIDDLEWARE_DIR, file_dir)
    return rel.replace(os.sep, '/') + '/cors'

def process_file(filepath):
    """Process a single JS file for CORS fixes."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    original = content
    changes = 0

    # Apply pattern replacements
    for pattern, replacement in PATTERNS:
        content, n = pattern.subn(replacement, content)
        changes += n

    # Apply object literal pattern
    if OBJ_PATTERN.search(content):
        content, n = OBJ_PATTERN.subn(OBJ_REPLACEMENT, content)
        changes += n

    if changes == 0:
        return 0, "No CORS wildcards found"

    # Add import if not already present
    if not IMPORT_CHECK.search(content) and 'getCorsOrigin' not in original:
        rel_path = get_relative_path(filepath)
        import_line = IMPORT_TEMPLATE.format(rel_path)

        # Find good insertion point (after last require/import at top)
        lines = content.split('\n')
        insert_idx = 0
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith('require(') or stripped.startswith("const ") and 'require(' in stripped:
                insert_idx = i + 1
            elif stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*') or stripped == '' or stripped.startswith("'use strict"):
                if insert_idx == 0:
                    continue
            elif insert_idx > 0:
                break

        # If no requires found, insert after any initial comments/blank lines
        if insert_idx == 0:
            for i, line in enumerate(lines):
                stripped = line.strip()
                if stripped and not stripped.startswith('//') and not stripped.startswith('/*') and not stripped.startswith('*') and stripped != '':
                    insert_idx = i
                    break

        lines.insert(insert_idx, import_line.rstrip())
        content = '\n'.join(lines)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return changes, f"{changes} replacement(s)"

def main():
    if not os.path.isdir(API_DIR):
        print(f"ERROR: {API_DIR} not found")
        sys.exit(1)

    total_files = 0
    total_changes = 0
    fixed_files = 0

    # Walk all JS files in api/
    for root, dirs, files in os.walk(API_DIR):
        # Skip _middleware directory itself
        if '_middleware' in root.split(os.sep):
            continue

        for filename in sorted(files):
            if not filename.endswith('.js'):
                continue

            filepath = os.path.join(root, filename)
            total_files += 1

            try:
                changes, status = process_file(filepath)
                if changes > 0:
                    fixed_files += 1
                    total_changes += changes
                    rel = os.path.relpath(filepath, os.path.dirname(API_DIR))
                    print(f"  FIXED: {rel} - {status}")
            except Exception as e:
                rel = os.path.relpath(filepath, os.path.dirname(API_DIR))
                print(f"  ERROR: {rel} - {e}")

    print(f"\nSummary: {fixed_files} files fixed, {total_changes} total replacements, {total_files} files scanned")

if __name__ == '__main__':
    main()
