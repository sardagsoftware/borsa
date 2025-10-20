#!/usr/bin/env python3
"""
LyDian AI - Live Indexer & Monitoring Bot
White-Hat Search Index Synchronization
Mode: Automated · Cron-based · 0 Error Policy

Schedule: Daily at 03:00 UTC
Purpose: Monitor sitemap, submit new URLs, track indexing status
"""

import os
import sys
import json
import time
import hashlib
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Set
from pathlib import Path

# Import our API clients
sys.path.insert(0, os.path.dirname(__file__))
from google_indexing_api import GoogleIndexingAPI
from bing_url_submission import BingURLSubmission
from yandex_webmaster_api import YandexWebmasterAPI

# Configuration
SITEMAP_URL = 'https://www.ailydian.com/sitemap.xml'
ROBOTS_URL = 'https://www.ailydian.com/robots.txt'
RSS_FEED_URL = 'https://www.ailydian.com/feed/updates.xml'

# Paths
ARTIFACTS_DIR = Path('/Users/sardag/Desktop/ailydian-ultra-pro/ops/artifacts')
STATE_FILE = ARTIFACTS_DIR / 'indexer_state.json'
LOG_FILE = ARTIFACTS_DIR / 'indexer_log.jsonl'

# Quotas (daily limits)
GOOGLE_DAILY_QUOTA = 200
BING_DAILY_QUOTA = 10
YANDEX_DAILY_QUOTA = 100

class LiveIndexer:
    """
    Automated indexing and monitoring bot

    Features:
    - Daily sitemap scanning
    - New URL detection via hash comparison
    - Multi-engine submission (Google, Bing, Yandex)
    - Quota tracking and rate limiting
    - Error logging with retry logic
    - Crawler activity monitoring
    """

    def __init__(self):
        self.state = self.load_state()
        self.new_urls: Set[str] = set()
        self.results = {
            'timestamp': datetime.utcnow().isoformat(),
            'sitemap_check': {},
            'submissions': {},
            'errors': [],
            'crawler_activity': {}
        }

        # API clients
        self.google_client = None
        self.bing_client = None
        self.yandex_client = None

    def load_state(self) -> Dict:
        """Load previous indexer state"""
        if STATE_FILE.exists():
            with open(STATE_FILE, 'r') as f:
                return json.load(f)

        return {
            'last_run': None,
            'sitemap_hash': None,
            'known_urls': [],
            'quotas': {
                'google': {'used': 0, 'reset_date': None},
                'bing': {'used': 0, 'reset_date': None},
                'yandex': {'used': 0, 'reset_date': None}
            }
        }

    def save_state(self):
        """Save current state to disk"""
        self.state['last_run'] = datetime.utcnow().isoformat()
        with open(STATE_FILE, 'w') as f:
            json.dump(self.state, f, indent=2)

    def log_event(self, event_type: str, data: Dict):
        """Append event to log file"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'type': event_type,
            'data': data
        }

        with open(LOG_FILE, 'a') as f:
            f.write(json.dumps(log_entry) + '\n')

    def check_quota_reset(self):
        """Reset daily quotas if needed"""
        today = datetime.utcnow().date().isoformat()

        for engine in ['google', 'bing', 'yandex']:
            quota = self.state['quotas'][engine]

            if quota['reset_date'] != today:
                quota['used'] = 0
                quota['reset_date'] = today
                print(f"🔄 {engine.title()} quota reset: 0 used")

    def fetch_sitemap(self) -> List[str]:
        """Fetch and parse sitemap.xml"""
        print(f"\n📥 Fetching sitemap: {SITEMAP_URL}")

        try:
            response = requests.get(SITEMAP_URL, timeout=10)
            response.raise_for_status()

            # Calculate hash for change detection
            sitemap_content = response.text
            current_hash = hashlib.sha256(sitemap_content.encode()).hexdigest()

            self.results['sitemap_check'] = {
                'status': 'success',
                'hash': current_hash,
                'changed': current_hash != self.state.get('sitemap_hash')
            }

            # Extract URLs
            import xml.etree.ElementTree as ET
            root = ET.fromstring(sitemap_content)

            # Handle namespace
            namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            urls = [loc.text for loc in root.findall('.//ns:loc', namespace)]

            print(f"✅ Sitemap fetched: {len(urls)} URLs")
            print(f"   Hash: {current_hash[:16]}...")
            print(f"   Changed: {self.results['sitemap_check']['changed']}")

            self.state['sitemap_hash'] = current_hash
            return urls

        except Exception as e:
            error = f"Sitemap fetch error: {str(e)}"
            print(f"❌ {error}")
            self.results['sitemap_check'] = {'status': 'error', 'error': error}
            self.results['errors'].append(error)
            return []

    def detect_new_urls(self, current_urls: List[str]) -> Set[str]:
        """Detect new URLs not in previous state"""
        known_urls = set(self.state.get('known_urls', []))
        current_set = set(current_urls)

        new_urls = current_set - known_urls

        if new_urls:
            print(f"\n🆕 New URLs detected: {len(new_urls)}")
            for url in sorted(new_urls):
                print(f"   - {url}")
        else:
            print(f"\n✅ No new URLs (all {len(current_urls)} URLs already known)")

        # Update known URLs
        self.state['known_urls'] = list(current_set)
        return new_urls

    def submit_to_google(self, urls: List[str]) -> Dict:
        """Submit URLs to Google Indexing API"""
        quota = self.state['quotas']['google']
        remaining = GOOGLE_DAILY_QUOTA - quota['used']

        if remaining <= 0:
            return {
                'status': 'quota_exceeded',
                'submitted': 0,
                'remaining': 0
            }

        # Limit to remaining quota
        urls_to_submit = urls[:remaining]

        print(f"\n🔵 Google Indexing API")
        print(f"   Quota: {quota['used']}/{GOOGLE_DAILY_QUOTA} used")
        print(f"   Submitting: {len(urls_to_submit)} URLs")

        if not self.google_client:
            self.google_client = GoogleIndexingAPI()
            if not self.google_client.authenticate():
                return {'status': 'auth_failed', 'submitted': 0}

        results = self.google_client.submit_batch(urls_to_submit, delay=1.5)

        # Update quota
        quota['used'] += results.get('successful', 0)

        return {
            'status': 'success',
            'submitted': results.get('successful', 0),
            'failed': results.get('failed', 0),
            'remaining': GOOGLE_DAILY_QUOTA - quota['used']
        }

    def submit_to_bing(self, urls: List[str]) -> Dict:
        """Submit URLs to Bing URL Submission API"""
        quota = self.state['quotas']['bing']
        remaining = BING_DAILY_QUOTA - quota['used']

        if remaining <= 0:
            return {
                'status': 'quota_exceeded',
                'submitted': 0,
                'remaining': 0
            }

        urls_to_submit = urls[:remaining]

        print(f"\n🟦 Bing URL Submission API")
        print(f"   Quota: {quota['used']}/{BING_DAILY_QUOTA} used")
        print(f"   Submitting: {len(urls_to_submit)} URLs")

        if not self.bing_client:
            self.bing_client = BingURLSubmission()

        result = self.bing_client.submit_batch(urls_to_submit)

        if result.get('success'):
            quota['used'] += result['urls_submitted']
            return {
                'status': 'success',
                'submitted': result['urls_submitted'],
                'remaining': BING_DAILY_QUOTA - quota['used']
            }
        else:
            return {
                'status': 'error',
                'error': result.get('error', 'Unknown error'),
                'submitted': 0
            }

    def submit_to_yandex(self, urls: List[str]) -> Dict:
        """Submit URLs to Yandex Webmaster API"""
        quota = self.state['quotas']['yandex']
        remaining = YANDEX_DAILY_QUOTA - quota['used']

        if remaining <= 0:
            return {
                'status': 'quota_exceeded',
                'submitted': 0,
                'remaining': 0
            }

        urls_to_submit = urls[:remaining]

        print(f"\n🟥 Yandex Webmaster API")
        print(f"   Quota: {quota['used']}/{YANDEX_DAILY_QUOTA} used")
        print(f"   Submitting: {len(urls_to_submit)} URLs")

        if not self.yandex_client:
            self.yandex_client = YandexWebmasterAPI()
            if not self.yandex_client.validate_token():
                return {'status': 'auth_failed', 'submitted': 0}

        results = self.yandex_client.submit_batch(urls_to_submit, delay=0.5)

        # Update quota
        quota['used'] += results.get('successful', 0)

        return {
            'status': 'success',
            'submitted': results.get('successful', 0),
            'failed': results.get('failed', 0),
            'remaining': YANDEX_DAILY_QUOTA - quota['used']
        }

    def check_endpoint_health(self, url: str, name: str) -> Dict:
        """Check if endpoint is accessible"""
        try:
            response = requests.head(url, timeout=5, allow_redirects=True)
            return {
                'endpoint': name,
                'url': url,
                'status_code': response.status_code,
                'accessible': response.status_code == 200
            }
        except Exception as e:
            return {
                'endpoint': name,
                'url': url,
                'status_code': None,
                'accessible': False,
                'error': str(e)
            }

    def health_check(self):
        """Verify all critical endpoints are accessible"""
        print(f"\n🏥 Health Check")

        endpoints = [
            (SITEMAP_URL, 'sitemap.xml'),
            (ROBOTS_URL, 'robots.txt'),
            (RSS_FEED_URL, 'RSS feed'),
            ('https://www.ailydian.com/', 'Homepage')
        ]

        health_results = []
        all_healthy = True

        for url, name in endpoints:
            result = self.check_endpoint_health(url, name)
            health_results.append(result)

            status_icon = "✅" if result['accessible'] else "❌"
            print(f"   {status_icon} {name}: {result.get('status_code', 'ERROR')}")

            if not result['accessible']:
                all_healthy = False
                self.results['errors'].append(f"{name} not accessible: {result.get('error', 'HTTP error')}")

        self.results['health_check'] = {
            'all_healthy': all_healthy,
            'endpoints': health_results
        }

        return all_healthy

    def run(self):
        """Main execution loop"""
        print("=" * 70)
        print("🚀 LYDIAN AI - LIVE INDEXER")
        print("=" * 70)
        print(f"⏰ Run time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
        print(f"📍 Mode: Automated · White-Hat · 0 Error Policy")

        # Step 1: Health check
        if not self.health_check():
            print("\n❌ Health check failed. Aborting indexer run.")
            self.save_state()
            self.log_event('health_check_failed', self.results['health_check'])
            return

        # Step 2: Reset quotas if needed
        self.check_quota_reset()

        # Step 3: Fetch sitemap
        current_urls = self.fetch_sitemap()
        if not current_urls:
            print("\n❌ No URLs found in sitemap. Aborting.")
            self.save_state()
            return

        # Step 4: Detect new URLs
        self.new_urls = self.detect_new_urls(current_urls)

        # Step 5: Submit to search engines (if new URLs exist)
        if self.new_urls:
            urls_list = list(self.new_urls)

            self.results['submissions']['google'] = self.submit_to_google(urls_list)
            time.sleep(2)

            self.results['submissions']['bing'] = self.submit_to_bing(urls_list)
            time.sleep(2)

            self.results['submissions']['yandex'] = self.submit_to_yandex(urls_list)
        else:
            print("\n✅ No new URLs to submit")
            self.results['submissions'] = {'status': 'no_new_urls'}

        # Step 6: Save state and results
        self.save_state()

        # Save results to timestamped file
        results_file = ARTIFACTS_DIR / f"indexer_results_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(results_file, 'w') as f:
            json.dump(self.results, f, indent=2)

        # Log event
        self.log_event('indexer_run', self.results)

        # Step 7: Print summary
        self.print_summary(results_file)

    def print_summary(self, results_file: Path):
        """Print execution summary"""
        print("\n" + "=" * 70)
        print("📊 SUMMARY")
        print("=" * 70)

        print(f"Sitemap Status: {self.results['sitemap_check'].get('status', 'unknown').upper()}")
        print(f"New URLs: {len(self.new_urls)}")

        if self.results.get('submissions'):
            print("\nSubmissions:")
            for engine, result in self.results['submissions'].items():
                if engine == 'status':
                    continue
                submitted = result.get('submitted', 0)
                remaining = result.get('remaining', 'N/A')
                print(f"  {engine.title()}: {submitted} submitted, {remaining} quota remaining")

        if self.results.get('errors'):
            print(f"\n⚠️  Errors: {len(self.results['errors'])}")
            for error in self.results['errors']:
                print(f"  - {error}")
        else:
            print("\n✅ 0 errors")

        print(f"\n📄 Results saved: {results_file}")
        print("=" * 70)

def main():
    """CLI entry point"""
    indexer = LiveIndexer()

    try:
        indexer.run()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        indexer.save_state()
    except Exception as e:
        print(f"\n\n❌ Fatal error: {str(e)}")
        indexer.results['errors'].append(f"Fatal error: {str(e)}")
        indexer.save_state()
        indexer.log_event('fatal_error', {'error': str(e)})
        raise

if __name__ == '__main__':
    main()
