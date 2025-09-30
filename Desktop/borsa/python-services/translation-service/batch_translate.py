#!/usr/bin/env python3
"""
Batch Translation Script for LyDian Trader
Translates Turkish base file to all supported languages
"""

import os
import sys
from translator import batch_translate, SUPPORTED_LANGS

def main():
    # Source file (Turkish base)
    source_file = "../../src/i18n/messages/tr.json"
    source_lang = "tr"
    output_dir = "../../src/i18n/messages"

    # All target languages
    target_langs = list(SUPPORTED_LANGS.keys())

    print("🚀 Starting batch translation...")
    print(f"📁 Source: {source_file}")
    print(f"🌍 Target languages: {', '.join(target_langs)}")
    print("=" * 60)

    results = batch_translate(source_file, source_lang, target_langs, output_dir)

    print("=" * 60)
    print("📊 Translation Results:")
    for lang, success in results.items():
        status = "✅" if success else "❌"
        print(f"  {status} {lang.upper()}: {SUPPORTED_LANGS[lang]}")

    total = len(results)
    successful = sum(1 for s in results.values() if s)
    print(f"\n✨ Completed: {successful}/{total} languages")

    return 0 if successful == total else 1

if __name__ == '__main__':
    sys.exit(main())