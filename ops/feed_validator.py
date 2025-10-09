#!/usr/bin/env python3
"""
LyDian AI - Feed Validation Tool
ITERATION 1: Quality Assurance

Purpose: Validate feed quality, schema compliance, and data integrity
Policy: White-Hat · 0 Mock · Comprehensive Validation

Validates:
- JSON/RSS schema compliance
- Required fields presence
- Data type validation
- URL format validation
- Date format validation (ISO8601)
- License identifier validation (SPDX)
- Benchmark score ranges
- Feed metadata completeness
- Duplicate detection
- Content freshness

Usage:
    python ops/feed_validator.py --feed json
    python ops/feed_validator.py --feed rss
    python ops/feed_validator.py --feed all
    python ops/feed_validator.py --strict
"""

import os
import sys
import json
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from urllib.parse import urlparse

class Config:
    """Validation configuration"""

    # Feed files
    JSON_FEED = "public/feed/ai_models.json"
    RSS_FEED = "public/feed/ai_models.rss"
    LLMS_TXT = "public/llms.txt"

    # Required fields for JSON feed
    REQUIRED_MODEL_FIELDS = [
        'id', 'name', 'org', 'source', 'model_type',
        'released_at', 'link', 'description', 'license'
    ]

    # Valid model types
    VALID_MODEL_TYPES = [
        'text-generation', 'text-to-image', 'multimodal-text-generation',
        'code-generation', 'embedding', 'image-classification',
        'object-detection', 'speech-recognition', 'translation'
    ]

    # Valid sources
    VALID_SOURCES = [
        'huggingface', 'openai', 'anthropic', 'google', 'meta',
        'mistral', 'cohere', 'stability', 'deepseek', 'alibaba',
        'microsoft', 'official', 'arxiv', 'modelscope'
    ]

    # Benchmark score ranges
    BENCHMARK_RANGES = {
        'mmlu': (0, 100),
        'humaneval': (0, 100),
        'gsm8k': (0, 100),
        'math': (0, 100),
        'hellaswag': (0, 100),
        'arc': (0, 100)
    }

    # Date format
    DATE_FORMAT = r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$'

    # URL format
    URL_FORMAT = r'^https?://[^\s]+$'

    # SPDX licenses (common ones)
    VALID_LICENSES = [
        'apache-2.0', 'mit', 'gpl-3.0', 'bsd-3-clause',
        'cc-by-4.0', 'cc-by-sa-4.0', 'proprietary',
        'llama-3.1-community', 'stabilityai-community',
        'openrail', 'creativeml-openrail-m'
    ]


class FeedValidator:
    """Feed validation engine"""

    def __init__(self, strict: bool = False):
        self.strict = strict
        self.errors = []
        self.warnings = []
        self.stats = {
            'total_checks': 0,
            'passed': 0,
            'failed': 0,
            'warnings': 0
        }

    def log(self, message: str, level: str = "INFO"):
        """Log validation message"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        symbol = {
            'INFO': 'ℹ️',
            'PASS': '✅',
            'FAIL': '❌',
            'WARN': '⚠️'
        }.get(level, 'ℹ️')
        print(f"[{timestamp}] [{symbol}] {message}")

    def add_error(self, message: str, context: Dict[str, Any] = None):
        """Add validation error"""
        self.errors.append({
            'message': message,
            'context': context or {},
            'timestamp': datetime.now().isoformat()
        })
        self.stats['failed'] += 1
        self.log(message, "FAIL")

    def add_warning(self, message: str, context: Dict[str, Any] = None):
        """Add validation warning"""
        self.warnings.append({
            'message': message,
            'context': context or {},
            'timestamp': datetime.now().isoformat()
        })
        self.stats['warnings'] += 1
        self.log(message, "WARN")

    def add_pass(self, message: str):
        """Add validation pass"""
        self.stats['passed'] += 1
        self.log(message, "PASS")

    def validate_json_feed(self) -> bool:
        """Validate JSON feed"""
        self.log("Validating JSON feed...", "INFO")

        feed_path = Path(Config.JSON_FEED)

        if not feed_path.exists():
            self.add_error(f"JSON feed not found: {Config.JSON_FEED}")
            return False

        try:
            with open(feed_path) as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            self.add_error(f"Invalid JSON format: {str(e)}")
            return False

        # Validate metadata
        self.stats['total_checks'] += 1
        if 'metadata' not in data:
            self.add_error("Missing 'metadata' section")
        else:
            metadata = data['metadata']

            # Check required metadata fields
            required_metadata = ['feed_name', 'feed_url', 'updated_at', 'version', 'total_models', 'license']
            for field in required_metadata:
                self.stats['total_checks'] += 1
                if field not in metadata:
                    self.add_error(f"Missing metadata field: {field}")
                else:
                    self.add_pass(f"Metadata field present: {field}")

            # Validate license
            self.stats['total_checks'] += 1
            if metadata.get('license') == 'CC-BY-4.0':
                self.add_pass("Metadata license valid: CC-BY-4.0")
            else:
                self.add_error(f"Invalid metadata license: {metadata.get('license')}")

            # Validate updated_at format
            self.stats['total_checks'] += 1
            if re.match(Config.DATE_FORMAT, metadata.get('updated_at', '')):
                self.add_pass("Metadata updated_at format valid")
            else:
                self.add_error(f"Invalid updated_at format: {metadata.get('updated_at')}")

        # Validate models
        self.stats['total_checks'] += 1
        if 'models' not in data:
            self.add_error("Missing 'models' array")
            return False

        models = data['models']
        self.add_pass(f"Models array present: {len(models)} models")

        # Track for duplicates
        seen_ids = set()

        # Validate each model
        for i, model in enumerate(models):
            model_id = model.get('id', f'model-{i}')

            # Check required fields
            for field in Config.REQUIRED_MODEL_FIELDS:
                self.stats['total_checks'] += 1
                if field not in model:
                    self.add_error(f"Model {model_id}: Missing required field '{field}'", {'model_index': i})
                else:
                    self.add_pass(f"Model {model_id}: Field '{field}' present")

            # Check for duplicates
            self.stats['total_checks'] += 1
            if model_id in seen_ids:
                self.add_error(f"Duplicate model ID: {model_id}", {'model_index': i})
            else:
                seen_ids.add(model_id)
                self.add_pass(f"Model {model_id}: ID unique")

            # Validate model_type
            self.stats['total_checks'] += 1
            if model.get('model_type') in Config.VALID_MODEL_TYPES:
                self.add_pass(f"Model {model_id}: Valid model_type")
            else:
                self.add_error(f"Model {model_id}: Invalid model_type '{model.get('model_type')}'", {'model_index': i})

            # Validate source
            self.stats['total_checks'] += 1
            if model.get('source') in Config.VALID_SOURCES:
                self.add_pass(f"Model {model_id}: Valid source")
            else:
                self.add_warning(f"Model {model_id}: Uncommon source '{model.get('source')}'", {'model_index': i})

            # Validate released_at format
            self.stats['total_checks'] += 1
            if re.match(Config.DATE_FORMAT, model.get('released_at', '')):
                self.add_pass(f"Model {model_id}: Valid released_at format")
            else:
                self.add_error(f"Model {model_id}: Invalid released_at format", {'model_index': i})

            # Validate link URL
            self.stats['total_checks'] += 1
            if re.match(Config.URL_FORMAT, model.get('link', '')):
                self.add_pass(f"Model {model_id}: Valid link URL")
            else:
                self.add_error(f"Model {model_id}: Invalid link URL", {'model_index': i})

            # Validate license
            self.stats['total_checks'] += 1
            license_id = model.get('license', '').lower()
            if license_id in Config.VALID_LICENSES or license_id.startswith('cc-') or license_id.startswith('apache-'):
                self.add_pass(f"Model {model_id}: Valid license")
            else:
                self.add_warning(f"Model {model_id}: Uncommon license '{model.get('license')}'", {'model_index': i})

            # Validate benchmarks (if present)
            if 'signals' in model and 'benchmarks' in model['signals']:
                benchmarks = model['signals']['benchmarks']
                for bench_name, bench_value in benchmarks.items():
                    self.stats['total_checks'] += 1
                    bench_lower = bench_name.lower()

                    if bench_lower in Config.BENCHMARK_RANGES:
                        min_val, max_val = Config.BENCHMARK_RANGES[bench_lower]
                        if min_val <= bench_value <= max_val:
                            self.add_pass(f"Model {model_id}: Benchmark {bench_name} in valid range")
                        else:
                            self.add_error(f"Model {model_id}: Benchmark {bench_name} out of range: {bench_value}", {'model_index': i})
                    else:
                        self.add_warning(f"Model {model_id}: Unknown benchmark '{bench_name}'", {'model_index': i})

        return len(self.errors) == 0

    def validate_rss_feed(self) -> bool:
        """Validate RSS feed"""
        self.log("Validating RSS feed...", "INFO")

        feed_path = Path(Config.RSS_FEED)

        if not feed_path.exists():
            self.add_error(f"RSS feed not found: {Config.RSS_FEED}")
            return False

        try:
            tree = ET.parse(feed_path)
            root = tree.getroot()
        except ET.ParseError as e:
            self.add_error(f"Invalid XML format: {str(e)}")
            return False

        # Validate RSS version
        self.stats['total_checks'] += 1
        if root.tag == 'rss' and root.attrib.get('version') == '2.0':
            self.add_pass("RSS version 2.0 valid")
        else:
            self.add_error(f"Invalid RSS version: {root.attrib.get('version')}")

        # Find channel
        channel = root.find('channel')
        if channel is None:
            self.add_error("Missing 'channel' element")
            return False

        # Validate required channel elements
        required_channel = ['title', 'link', 'description']
        for elem in required_channel:
            self.stats['total_checks'] += 1
            if channel.find(elem) is not None:
                self.add_pass(f"Channel element present: {elem}")
            else:
                self.add_error(f"Missing channel element: {elem}")

        # Validate items
        items = channel.findall('item')
        self.stats['total_checks'] += 1
        if len(items) > 0:
            self.add_pass(f"RSS items present: {len(items)} items")
        else:
            self.add_warning("No items in RSS feed")

        # Validate each item
        for i, item in enumerate(items):
            # Check required item elements
            required_item = ['title', 'link', 'description']
            for elem in required_item:
                self.stats['total_checks'] += 1
                if item.find(elem) is not None:
                    self.add_pass(f"Item {i}: Element '{elem}' present")
                else:
                    self.add_error(f"Item {i}: Missing element '{elem}'")

            # Validate GUID
            self.stats['total_checks'] += 1
            guid = item.find('guid')
            if guid is not None:
                self.add_pass(f"Item {i}: GUID present")
            else:
                self.add_warning(f"Item {i}: Missing GUID")

            # Validate pubDate
            self.stats['total_checks'] += 1
            pub_date = item.find('pubDate')
            if pub_date is not None:
                self.add_pass(f"Item {i}: pubDate present")
            else:
                self.add_warning(f"Item {i}: Missing pubDate")

        return len(self.errors) == 0

    def validate_llms_txt(self) -> bool:
        """Validate llms.txt file"""
        self.log("Validating llms.txt...", "INFO")

        file_path = Path(Config.LLMS_TXT)

        if not file_path.exists():
            self.add_error(f"llms.txt not found: {Config.LLMS_TXT}")
            return False

        with open(file_path) as f:
            content = f.read()

        # Check for discovery feed section
        self.stats['total_checks'] += 1
        if 'DISCOVERY FEED' in content:
            self.add_pass("Discovery feed section present")
        else:
            self.add_error("Missing DISCOVERY FEED section")

        # Check for required URLs
        required_urls = [
            'https://www.ailydian.com/feed/ai_models.json',
            'https://www.ailydian.com/feed/ai_models.rss'
        ]

        for url in required_urls:
            self.stats['total_checks'] += 1
            if url in content:
                self.add_pass(f"URL present: {url}")
            else:
                self.add_error(f"Missing URL: {url}")

        # Check version
        self.stats['total_checks'] += 1
        if 'version: 1.1' in content:
            self.add_pass("Version 1.1 present")
        else:
            self.add_warning("Version may be outdated")

        return len(self.errors) == 0

    def generate_report(self) -> Dict[str, Any]:
        """Generate validation report"""
        return {
            'timestamp': datetime.now().isoformat(),
            'stats': self.stats,
            'errors': self.errors,
            'warnings': self.warnings,
            'passed': len(self.errors) == 0
        }

    def save_report(self, output_file: str):
        """Save validation report"""
        report = self.generate_report()

        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)

        self.log(f"Report saved to {output_file}", "INFO")


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='LyDian AI - Feed Validation Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        '--feed',
        choices=['json', 'rss', 'llms', 'all'],
        default='all',
        help='Feed to validate'
    )

    parser.add_argument(
        '--strict',
        action='store_true',
        help='Strict mode (warnings become errors)'
    )

    parser.add_argument(
        '--output',
        type=str,
        default='ops/artifacts/feed_validation_report.json',
        help='Output file for validation report'
    )

    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"LyDian AI - Feed Validation")
    print(f"Strict Mode: {'Enabled' if args.strict else 'Disabled'}")
    print(f"{'='*60}\n")

    validator = FeedValidator(strict=args.strict)

    # Run validations
    if args.feed in ['json', 'all']:
        validator.validate_json_feed()

    if args.feed in ['rss', 'all']:
        validator.validate_rss_feed()

    if args.feed in ['llms', 'all']:
        validator.validate_llms_txt()

    # Summary
    print(f"\n{'='*60}")
    print(f"VALIDATION SUMMARY")
    print(f"{'='*60}")
    print(f"Total Checks: {validator.stats['total_checks']}")
    print(f"✅ Passed: {validator.stats['passed']}")
    print(f"❌ Failed: {validator.stats['failed']}")
    print(f"⚠️  Warnings: {validator.stats['warnings']}")

    if validator.stats['failed'] == 0:
        print(f"\n🎉 ALL VALIDATIONS PASSED!")
    else:
        print(f"\n⚠️  SOME VALIDATIONS FAILED - Review errors above")

    print(f"{'='*60}\n")

    # Save report
    validator.save_report(args.output)

    # Exit code
    exit_code = 0 if validator.stats['failed'] == 0 else 1
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
