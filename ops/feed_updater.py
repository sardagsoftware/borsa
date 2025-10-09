#!/usr/bin/env python3
"""
LyDian AI - Feed Updater
Automatically fetches new AI models from HuggingFace and updates feeds

ITERATION 2 - Feed Update Automation
"""

import json
import sys
import os
import requests
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set
import re


class Config:
    """Configuration for feed updater"""

    # Feed paths
    JSON_FEED = "public/feed/ai_models.json"
    RSS_FEED = "public/feed/ai_models.rss"
    LLMS_TXT = "public/llms.txt"

    # HuggingFace API
    HUGGINGFACE_API = "https://huggingface.co/api/models"
    HUGGINGFACE_MODEL_URL = "https://huggingface.co/{model_id}"

    # Update settings
    MAX_NEW_MODELS = 10  # Limit new models per run
    MIN_DOWNLOADS = 1000  # Minimum downloads to consider
    MIN_LIKES = 10  # Minimum likes to consider

    # Model type mapping
    MODEL_TYPE_MAP = {
        'text-generation': 'llm',
        'text2text-generation': 'llm',
        'conversational': 'llm',
        'image-to-text': 'multimodal',
        'visual-question-answering': 'multimodal',
        'image-text-to-text': 'multimodal',
        'text-to-image': 'image',
        'image-to-image': 'image',
        'text-to-speech': 'audio',
        'automatic-speech-recognition': 'audio',
        'text-to-video': 'video'
    }

    # Known organizations (priority list)
    PRIORITY_ORGS = [
        'openai', 'anthropic', 'google', 'meta-llama', 'mistralai',
        'stabilityai', 'black-forest-labs', 'cohere', 'deepseek-ai',
        'Qwen', '01-ai', 'microsoft', 'nvidia', 'tiiuae', 'upstage'
    ]


class FeedUpdater:
    """Automatically updates AI model feeds"""

    def __init__(self):
        self.stats = {
            'models_checked': 0,
            'models_added': 0,
            'models_updated': 0,
            'models_skipped': 0,
            'api_calls': 0,
            'errors': 0
        }
        self.existing_ids: Set[str] = set()
        self.new_models: List[Dict] = []

    def log(self, level: str, message: str):
        """Log message with timestamp"""
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        print(f"[{timestamp}] [{level}] {message}")

    def load_existing_feed(self) -> List[Dict]:
        """Load existing JSON feed"""
        try:
            with open(Config.JSON_FEED, 'r', encoding='utf-8') as f:
                data = json.load(f)
                models = data.get('models', [])
                self.existing_ids = {m['id'] for m in models}
                self.log("INFO", f"Loaded {len(models)} existing models")
                return models
        except FileNotFoundError:
            self.log("ERROR", f"Feed not found: {Config.JSON_FEED}")
            return []
        except json.JSONDecodeError as e:
            self.log("ERROR", f"Invalid JSON in feed: {e}")
            return []

    def fetch_huggingface_models(self, limit: int = 100) -> List[Dict]:
        """Fetch trending models from HuggingFace"""
        self.log("INFO", "Fetching models from HuggingFace API...")

        models = []
        try:
            # Fetch trending models (sorted by downloads)
            # Note: HuggingFace API uses different parameters
            params = {
                'sort': 'downloads',
                'direction': '-1',
                'limit': limit
            }

            response = requests.get(Config.HUGGINGFACE_API, params=params, timeout=30)
            self.stats['api_calls'] += 1
            response.raise_for_status()

            models = response.json()
            self.log("INFO", f"Fetched {len(models)} models from HuggingFace")

            # Filter by pipeline tags (client-side)
            valid_pipelines = ['text-generation', 'text2text-generation', 'image-to-text',
                             'text-to-image', 'conversational', 'visual-question-answering']

            filtered_models = [
                m for m in models
                if m.get('pipeline_tag') in valid_pipelines
            ]

            self.log("INFO", f"Filtered to {len(filtered_models)} relevant models")
            return filtered_models

        except requests.exceptions.RequestException as e:
            self.log("ERROR", f"Failed to fetch from HuggingFace: {e}")
            self.stats['errors'] += 1

        return models

    def parse_huggingface_model(self, hf_model: Dict) -> Optional[Dict]:
        """Parse HuggingFace model to our format"""
        try:
            model_id = hf_model.get('id', '')

            # Skip if already exists
            if model_id in self.existing_ids:
                self.stats['models_skipped'] += 1
                return None

            # Skip if not enough downloads/likes
            downloads = hf_model.get('downloads', 0)
            likes = hf_model.get('likes', 0)

            if downloads < Config.MIN_DOWNLOADS or likes < Config.MIN_LIKES:
                self.stats['models_skipped'] += 1
                return None

            # Extract organization and model name
            parts = model_id.split('/')
            org = parts[0] if len(parts) > 1 else 'community'
            name = parts[-1]

            # Get model type
            pipeline_tag = hf_model.get('pipeline_tag', 'text-generation')
            model_type = Config.MODEL_TYPE_MAP.get(pipeline_tag, 'llm')

            # Get release date (created_at or last_modified)
            created_at = hf_model.get('created_at', hf_model.get('lastModified', ''))
            if created_at:
                # Parse and format to ISO8601
                try:
                    dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    released_at = dt.strftime('%Y-%m-%d')
                except:
                    released_at = datetime.now(timezone.utc).strftime('%Y-%m-%d')
            else:
                released_at = datetime.now(timezone.utc).strftime('%Y-%m-%d')

            # Build model entry
            model_entry = {
                'id': model_id,
                'name': name,
                'org': org,
                'source': 'huggingface',
                'model_type': model_type,
                'released_at': released_at,
                'link': Config.HUGGINGFACE_MODEL_URL.format(model_id=model_id),
                'description': hf_model.get('description', f"{name} - AI model from {org}") or f"{name} - AI model from {org}",
                'license': self.extract_license(hf_model),
                'benchmarks': self.extract_benchmarks(hf_model),
                'metadata': {
                    'downloads': downloads,
                    'likes': likes,
                    'tags': hf_model.get('tags', [])[:10]  # Limit tags
                }
            }

            self.stats['models_checked'] += 1
            return model_entry

        except Exception as e:
            self.log("ERROR", f"Failed to parse model {hf_model.get('id')}: {e}")
            self.stats['errors'] += 1
            return None

    def extract_license(self, hf_model: Dict) -> str:
        """Extract and normalize license"""
        license_info = hf_model.get('license', 'unknown')

        # Normalize common licenses
        license_map = {
            'apache-2.0': 'apache-2.0',
            'mit': 'mit',
            'gpl-3.0': 'gpl-3.0',
            'cc-by-4.0': 'cc-by-4.0',
            'cc-by-nc-4.0': 'cc-by-nc-4.0',
            'openrail': 'openrail',
            'llama2': 'llama-2-community',
            'llama3': 'llama-3-community'
        }

        return license_map.get(license_info.lower(), license_info)

    def extract_benchmarks(self, hf_model: Dict) -> Dict[str, float]:
        """Extract benchmark scores from model metadata"""
        benchmarks = {}

        # Try to extract from model card or metadata
        # This is simplified - in production, you'd parse the model card README
        model_card = hf_model.get('cardData', {})

        # Example: Look for common benchmark names in metadata
        for key in ['mmlu', 'humaneval', 'gsm8k', 'math', 'arc', 'hellaswag']:
            if key in model_card:
                try:
                    score = float(model_card[key])
                    if 0 <= score <= 100:
                        benchmarks[key] = score
                except:
                    pass

        return benchmarks

    def prioritize_models(self, models: List[Dict]) -> List[Dict]:
        """Prioritize models from known organizations"""
        priority = []
        others = []

        for model in models:
            org = model.get('org', '').lower()
            if org in [o.lower() for o in Config.PRIORITY_ORGS]:
                priority.append(model)
            else:
                others.append(model)

        # Sort priority by downloads, others by likes
        priority.sort(key=lambda m: m.get('metadata', {}).get('downloads', 0), reverse=True)
        others.sort(key=lambda m: m.get('metadata', {}).get('likes', 0), reverse=True)

        return priority + others

    def update_json_feed(self, existing_models: List[Dict], new_models: List[Dict]) -> bool:
        """Update JSON feed with new models"""
        try:
            # Combine and sort by release date (newest first)
            all_models = existing_models + new_models
            all_models.sort(key=lambda m: m.get('released_at', ''), reverse=True)

            # Build updated feed
            feed_data = {
                'metadata': {
                    'title': 'LyDian AI - Global AI Models Feed',
                    'description': 'Comprehensive feed of AI models from leading providers',
                    'version': '1.1',
                    'updated_at': datetime.now(timezone.utc).isoformat(),
                    'total_models': len(all_models),
                    'sources': ['openai', 'anthropic', 'google', 'meta', 'huggingface', 'replicate', 'stability']
                },
                'models': all_models
            }

            # Write to file
            with open(Config.JSON_FEED, 'w', encoding='utf-8') as f:
                json.dump(feed_data, f, indent=2, ensure_ascii=False)

            self.log("INFO", f"Updated JSON feed with {len(new_models)} new models")
            return True

        except Exception as e:
            self.log("ERROR", f"Failed to update JSON feed: {e}")
            self.stats['errors'] += 1
            return False

    def update_rss_feed(self, new_models: List[Dict]) -> bool:
        """Update RSS feed with new models"""
        try:
            from xml.etree import ElementTree as ET

            # Read existing RSS
            tree = ET.parse(Config.RSS_FEED)
            root = tree.getroot()
            channel = root.find('channel')

            # Update metadata
            last_build = channel.find('lastBuildDate')
            if last_build is not None:
                last_build.text = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')

            # Add new items (limit to 20 most recent)
            for model in new_models[:20]:
                item = ET.SubElement(channel, 'item')

                title = ET.SubElement(item, 'title')
                title.text = f"{model['name']} ({model['org']})"

                link = ET.SubElement(item, 'link')
                link.text = model['link']

                description = ET.SubElement(item, 'description')
                description.text = model['description']

                guid = ET.SubElement(item, 'guid', isPermaLink='false')
                guid.text = model['id']

                pub_date = ET.SubElement(item, 'pubDate')
                try:
                    dt = datetime.fromisoformat(model['released_at'])
                    pub_date.text = dt.strftime('%a, %d %b %Y %H:%M:%S GMT')
                except:
                    pub_date.text = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')

            # Write RSS
            tree.write(Config.RSS_FEED, encoding='utf-8', xml_declaration=True)
            self.log("INFO", f"Updated RSS feed with {min(len(new_models), 20)} new items")
            return True

        except Exception as e:
            self.log("ERROR", f"Failed to update RSS feed: {e}")
            self.stats['errors'] += 1
            return False

    def update_llms_txt(self, new_models: List[Dict]) -> bool:
        """Update llms.txt with new models"""
        try:
            # Read existing content
            with open(Config.LLMS_TXT, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            # Find insertion point (after header, before first model)
            insert_idx = 0
            for i, line in enumerate(lines):
                if line.strip().startswith('# '):
                    insert_idx = i + 2  # After header and blank line
                    break

            # Add new models (LLMs only)
            new_lines = []
            for model in new_models:
                if model['model_type'] == 'llm':
                    new_lines.append(f"\n# {model['name']} ({model['org']})\n")
                    new_lines.append(f"{model['link']}\n")

            # Insert new lines
            lines = lines[:insert_idx] + new_lines + lines[insert_idx:]

            # Write back
            with open(Config.LLMS_TXT, 'w', encoding='utf-8') as f:
                f.writelines(lines)

            self.log("INFO", f"Updated llms.txt with {len(new_lines)//2} new LLMs")
            return True

        except Exception as e:
            self.log("ERROR", f"Failed to update llms.txt: {e}")
            self.stats['errors'] += 1
            return False

    def validate_feeds(self) -> bool:
        """Run feed validator on updated feeds"""
        self.log("INFO", "Validating updated feeds...")

        try:
            import subprocess
            result = subprocess.run(
                ['python3', 'ops/feed_validator.py', '--feed', 'all'],
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode == 0:
                self.log("INFO", "✅ Feed validation passed!")
                return True
            else:
                self.log("ERROR", "❌ Feed validation failed!")
                self.log("ERROR", result.stderr)
                return False

        except Exception as e:
            self.log("ERROR", f"Failed to run validator: {e}")
            self.stats['errors'] += 1
            return False

    def generate_report(self) -> Dict:
        """Generate update report"""
        report = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'stats': self.stats,
            'new_models': [
                {
                    'id': m['id'],
                    'name': m['name'],
                    'org': m['org'],
                    'model_type': m['model_type'],
                    'downloads': m['metadata'].get('downloads', 0),
                    'likes': m['metadata'].get('likes', 0)
                }
                for m in self.new_models
            ]
        }

        # Save report
        os.makedirs('ops/artifacts', exist_ok=True)
        report_path = 'ops/artifacts/feed_update_report.json'

        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        self.log("INFO", f"Report saved to {report_path}")
        return report

    def run(self, dry_run: bool = False) -> bool:
        """Run feed update process"""
        self.log("INFO", "=" * 60)
        self.log("INFO", "LyDian AI - Feed Updater")
        self.log("INFO", "=" * 60)

        # Load existing feed
        existing_models = self.load_existing_feed()
        if not existing_models:
            self.log("ERROR", "Cannot proceed without existing feed")
            return False

        # Fetch new models from HuggingFace
        hf_models = self.fetch_huggingface_models(limit=100)

        # Parse and filter models
        candidate_models = []
        for hf_model in hf_models:
            parsed = self.parse_huggingface_model(hf_model)
            if parsed:
                candidate_models.append(parsed)

        # Prioritize models
        prioritized = self.prioritize_models(candidate_models)

        # Limit to MAX_NEW_MODELS
        self.new_models = prioritized[:Config.MAX_NEW_MODELS]
        self.stats['models_added'] = len(self.new_models)

        self.log("INFO", f"Found {len(self.new_models)} new models to add")

        if not self.new_models:
            self.log("INFO", "No new models to add")
            self.generate_report()
            return True

        # Show new models
        for model in self.new_models:
            self.log("INFO", f"  + {model['id']} ({model['model_type']}) - {model['metadata']['downloads']} downloads")

        if dry_run:
            self.log("INFO", "DRY RUN - No files updated")
            self.generate_report()
            return True

        # Update feeds
        success = True

        if not self.update_json_feed(existing_models, self.new_models):
            success = False

        if not self.update_rss_feed(self.new_models):
            success = False

        if not self.update_llms_txt(self.new_models):
            success = False

        # Validate updated feeds
        if not self.validate_feeds():
            self.log("ERROR", "Validation failed - feeds may be corrupted")
            success = False

        # Generate report
        self.generate_report()

        # Print summary
        self.log("INFO", "=" * 60)
        self.log("INFO", "UPDATE SUMMARY")
        self.log("INFO", "=" * 60)
        self.log("INFO", f"Models Checked: {self.stats['models_checked']}")
        self.log("INFO", f"Models Added: {self.stats['models_added']}")
        self.log("INFO", f"Models Skipped: {self.stats['models_skipped']}")
        self.log("INFO", f"API Calls: {self.stats['api_calls']}")
        self.log("INFO", f"Errors: {self.stats['errors']}")
        self.log("INFO", "=" * 60)

        if success:
            self.log("INFO", "🎉 Feed update completed successfully!")
        else:
            self.log("ERROR", "❌ Feed update completed with errors")

        return success


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Update AI model feeds from HuggingFace')
    parser.add_argument('--dry-run', action='store_true', help='Run without updating files')
    parser.add_argument('--max-models', type=int, default=10, help='Maximum new models to add')

    args = parser.parse_args()

    # Update config with args
    if args.max_models:
        Config.MAX_NEW_MODELS = args.max_models

    # Run updater
    updater = FeedUpdater()
    success = updater.run(dry_run=args.dry_run)

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
