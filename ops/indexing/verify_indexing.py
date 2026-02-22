#!/usr/bin/env python3
"""
PHASE E - Verification System
LyDian AI - Search Engine Indexing Verification
White-Hat · API-based · 0 Error Policy

Purpose: Verify URLs are indexed in major search engines
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from typing import Dict, List
from pathlib import Path

# Configuration
ARTIFACTS_DIR = Path('/home/lydian/Masaüstü/PROJELER/ailydian-ultra-pro/ops/artifacts')
VERIFICATION_RESULTS = ARTIFACTS_DIR / f'verification_results_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json'

class IndexingVerification:
    """
    Verify indexing status across search engines

    Methods:
    - Google Search Console API (coverage status)
    - Bing Webmaster Tools API (quota check)
    - Manual search queries (fallback)
    """

    def __init__(self):
        self.results = {
            'timestamp': datetime.utcnow().isoformat(),
            'domain': 'www.ailydian.com',
            'verification': {}
        }

    def verify_google_coverage(self) -> Dict:
        """
        Verify Google Search Console coverage

        Note: Requires Search Console API credentials
        Documentation: https://developers.google.com/webmaster-tools/v1/searchanalytics
        """
        print("\n🔵 Google Search Console Verification")

        # Placeholder - requires OAuth 2.0 setup
        # For manual verification: https://search.google.com/search-console

        return {
            'status': 'manual_verification_required',
            'url': 'https://search.google.com/search-console',
            'note': 'Check Coverage report in Search Console'
        }

    def verify_bing_quota(self) -> Dict:
        """Verify Bing Webmaster quota status"""
        print("\n🟦 Bing Webmaster Tools Verification")

        api_key = os.getenv('BING_WEBMASTER_API_KEY', 'YOUR_BING_API_KEY_HERE')

        if api_key == 'YOUR_BING_API_KEY_HERE':
            return {
                'status': 'api_key_not_configured',
                'note': 'Set BING_WEBMASTER_API_KEY environment variable'
            }

        site_url = 'https://www.ailydian.com'
        endpoint = f"https://ssl.bing.com/webmaster/api.svc/json/GetUrlSubmissionQuota?siteUrl={site_url}&apikey={api_key}"

        try:
            response = requests.get(endpoint, timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"   Daily Quota: {data.get('DailyQuota', 'N/A')}")
                print(f"   Monthly Quota: {data.get('MonthlyQuota', 'N/A')}")
                return {
                    'status': 'success',
                    'daily_quota': data.get('DailyQuota'),
                    'monthly_quota': data.get('MonthlyQuota')
                }
            else:
                return {
                    'status': 'error',
                    'http_status': response.status_code
                }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }

    def verify_yandex_indexing(self) -> Dict:
        """Verify Yandex Webmaster indexing status"""
        print("\n🟥 Yandex Webmaster Verification")

        # Manual verification via search:
        # https://yandex.com/search/?text=site:www.ailydian.com

        return {
            'status': 'manual_verification_required',
            'search_url': 'https://yandex.com/search/?text=site:www.ailydian.com',
            'console_url': 'https://webmaster.yandex.com/'
        }

    def verify_ai_crawler_activity(self) -> Dict:
        """
        Check if AI crawlers are accessing the site

        Note: Requires server log access
        """
        print("\n🤖 AI Crawler Activity Check")

        # User-agents to look for
        ai_crawlers = [
            'GPTBot',
            'ChatGPT-User',
            'anthropic-ai',
            'Claude-Web',
            'ClaudeBot',
            'PerplexityBot',
            'YouBot',
            'GroqBot',
            'Google-Extended',
            'Applebot-Extended'
        ]

        return {
            'status': 'manual_log_analysis_required',
            'crawlers_to_check': ai_crawlers,
            'note': 'Check server access logs for these User-Agents'
        }

    def test_search_visibility(self) -> Dict:
        """
        Test if site appears in search results
        Uses public search APIs where available
        """
        print("\n🔍 Search Visibility Test")

        tests = {}

        # Test 1: Google site: search
        google_query = "site:www.ailydian.com"
        tests['google'] = {
            'query': google_query,
            'manual_url': f"https://www.google.com/search?q={google_query}",
            'note': 'Manual verification required'
        }

        # Test 2: Bing site: search
        bing_query = "site:www.ailydian.com"
        tests['bing'] = {
            'query': bing_query,
            'manual_url': f"https://www.bing.com/search?q={bing_query}",
            'note': 'Manual verification required'
        }

        # Test 3: DuckDuckGo
        tests['duckduckgo'] = {
            'query': 'site:www.ailydian.com',
            'manual_url': 'https://duckduckgo.com/?q=site:www.ailydian.com',
            'note': 'Manual verification required'
        }

        return tests

    def verify_rss_feed(self) -> Dict:
        """Verify RSS feed is accessible"""
        print("\n📡 RSS Feed Verification")

        rss_url = 'https://www.ailydian.com/feed/updates.xml'

        try:
            response = requests.get(rss_url, timeout=10)

            if response.status_code == 200:
                # Check if valid XML
                import xml.etree.ElementTree as ET
                root = ET.fromstring(response.text)

                # Count items
                items = root.findall('.//item')

                print(f"   ✅ RSS feed accessible")
                print(f"   📄 Items: {len(items)}")

                return {
                    'status': 'success',
                    'url': rss_url,
                    'items_count': len(items),
                    'accessible': True
                }
            else:
                return {
                    'status': 'error',
                    'http_status': response.status_code,
                    'accessible': False
                }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'accessible': False
            }

    def verify_robots_txt(self) -> Dict:
        """Verify robots.txt is accessible and allows crawlers"""
        print("\n🤖 robots.txt Verification")

        robots_url = 'https://www.ailydian.com/robots.txt'

        try:
            response = requests.get(robots_url, timeout=10)

            if response.status_code == 200:
                content = response.text

                # Check for AI crawler directives
                ai_crawlers_allowed = []
                for crawler in ['GPTBot', 'anthropic-ai', 'ClaudeBot', 'PerplexityBot']:
                    if f"User-agent: {crawler}" in content:
                        ai_crawlers_allowed.append(crawler)

                print(f"   ✅ robots.txt accessible")
                print(f"   🤖 AI crawlers allowed: {len(ai_crawlers_allowed)}")

                return {
                    'status': 'success',
                    'url': robots_url,
                    'accessible': True,
                    'ai_crawlers_allowed': ai_crawlers_allowed,
                    'sitemap_declared': 'Sitemap:' in content
                }
            else:
                return {
                    'status': 'error',
                    'http_status': response.status_code,
                    'accessible': False
                }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'accessible': False
            }

    def run(self):
        """Execute all verification checks"""
        print("=" * 70)
        print("🔍 LYDIAN AI - INDEXING VERIFICATION")
        print("=" * 70)
        print(f"⏰ Verification time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
        print(f"🌐 Domain: www.ailydian.com")

        # Run all checks
        self.results['verification']['google'] = self.verify_google_coverage()
        self.results['verification']['bing'] = self.verify_bing_quota()
        self.results['verification']['yandex'] = self.verify_yandex_indexing()
        self.results['verification']['ai_crawlers'] = self.verify_ai_crawler_activity()
        self.results['verification']['search_visibility'] = self.test_search_visibility()
        self.results['verification']['rss_feed'] = self.verify_rss_feed()
        self.results['verification']['robots_txt'] = self.verify_robots_txt()

        # Save results
        with open(VERIFICATION_RESULTS, 'w') as f:
            json.dump(self.results, f, indent=2)

        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print verification summary"""
        print("\n" + "=" * 70)
        print("📊 VERIFICATION SUMMARY")
        print("=" * 70)

        # Count successes
        success_count = 0
        manual_count = 0

        for check, result in self.results['verification'].items():
            if isinstance(result, dict):
                if result.get('status') == 'success':
                    success_count += 1
                elif 'manual' in result.get('status', ''):
                    manual_count += 1

        print(f"✅ Automated checks passed: {success_count}")
        print(f"⏳ Manual verification required: {manual_count}")
        print(f"\n📄 Results saved: {VERIFICATION_RESULTS}")
        print("=" * 70)

def main():
    """CLI entry point"""
    verifier = IndexingVerification()
    verifier.run()

if __name__ == '__main__':
    main()
