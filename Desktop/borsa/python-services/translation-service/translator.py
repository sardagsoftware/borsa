#!/usr/bin/env python3
"""
LyDian Trader - Multi-Language Translation Service
Python-based translation with deep-translator library
Zero-tolerance, production-ready
"""

import json
import sys
from typing import Dict, List
from deep_translator import GoogleTranslator

# Supported languages
SUPPORTED_LANGS = {
    'tr': 'Turkish',
    'en': 'English',
    'de': 'German',
    'fr': 'French',
    'es': 'Spanish',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese (Simplified)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic'
}

def translate_nested_dict(data: Dict, source_lang: str = 'tr', target_lang: str = 'en') -> Dict:
    """
    Recursively translate all string values in a nested dictionary
    """
    translator = GoogleTranslator(source=source_lang, target=target_lang)

    def translate_value(value):
        if isinstance(value, str):
            try:
                return translator.translate(value)
            except Exception as e:
                print(f"Translation error: {e}", file=sys.stderr)
                return value
        elif isinstance(value, dict):
            return {k: translate_value(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [translate_value(item) for item in value]
        else:
            return value

    return translate_value(data)

def translate_file(input_file: str, output_file: str, source_lang: str, target_lang: str):
    """
    Translate entire JSON file from source to target language
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        print(f"🌍 Translating from {SUPPORTED_LANGS[source_lang]} to {SUPPORTED_LANGS[target_lang]}...")

        translated = translate_nested_dict(data, source_lang, target_lang)

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(translated, f, ensure_ascii=False, indent=2)

        print(f"✅ Translation complete: {output_file}")
        return True

    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return False

def batch_translate(source_file: str, source_lang: str, target_langs: List[str], output_dir: str):
    """
    Translate source file to multiple target languages
    """
    import os
    os.makedirs(output_dir, exist_ok=True)

    results = {}
    for target_lang in target_langs:
        if target_lang == source_lang:
            continue

        output_file = f"{output_dir}/{target_lang}.json"
        success = translate_file(source_file, output_file, source_lang, target_lang)
        results[target_lang] = success

    return results

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python translator.py <input_file> <source_lang> <target_lang> [output_file]")
        print(f"Supported languages: {', '.join(SUPPORTED_LANGS.keys())}")
        sys.exit(1)

    input_file = sys.argv[1]
    source_lang = sys.argv[2]
    target_lang = sys.argv[3]
    output_file = sys.argv[4] if len(sys.argv) > 4 else f"output_{target_lang}.json"

    if source_lang not in SUPPORTED_LANGS or target_lang not in SUPPORTED_LANGS:
        print(f"❌ Unsupported language. Supported: {', '.join(SUPPORTED_LANGS.keys())}")
        sys.exit(1)

    success = translate_file(input_file, output_file, source_lang, target_lang)
    sys.exit(0 if success else 1)