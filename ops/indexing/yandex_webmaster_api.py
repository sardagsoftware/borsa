#!/usr/bin/env python3
"""
Yandex Webmaster API Integration
LyDian AI - Search Index Synchronization
Mode: White-Hat · Ethical · API-based

Documentation: https://yandex.com/dev/webmaster/doc/dg/concepts/about.html
"""

import os
import json
import time
import requests
from datetime import datetime
from typing import List, Dict

# Configuration
BASE_URL = 'https://api.webmaster.yandex.net/v4'
YANDEX_API_TOKEN = os.getenv('YANDEX_WEBMASTER_TOKEN', 'YOUR_YANDEX_TOKEN_HERE')
HOST_ID = os.getenv('YANDEX_HOST_ID', 'https:www.ailydian.com:443')  # Format: https:domain:443
DAILY_QUOTA = 100  # Yandex allows more URLs than Google/Bing

class YandexWebmasterAPI:
    """
    Yandex Webmaster API Client

    Features:
    - OAuth token authentication
    - Recrawl queue submission
    - Host verification
    - Indexing status check
    """

    def __init__(self, api_token: str = None, host_id: str = None):
        self.api_token = api_token or YANDEX_API_TOKEN
        self.host_id = host_id or HOST_ID
        self.headers = {
            'Authorization': f'OAuth {self.api_token}',
            'Content-Type': 'application/json'
        }
        self.submitted_count = 0

    def validate_token(self) -> bool:
        """Validate API token"""
        if not self.api_token or self.api_token == 'YOUR_YANDEX_TOKEN_HERE':
            print("❌ Yandex API token not configured")
            print("\nHow to get token:")
            print("1. Go to: https://oauth.yandex.com/")
            print("2. Create application with Webmaster API access")
            print("3. Get OAuth token")
            print("4. Set environment variable: YANDEX_WEBMASTER_TOKEN")
            return False

        # Test token validity
        try:
            response = requests.get(
                f"{BASE_URL}/user",
                headers=self.headers,
                timeout=10
            )
            if response.status_code == 200:
                user_data = response.json()
                print(f"✅ Authenticated as: {user_data.get('user_id', 'Unknown')}")
                return True
            else:
                print(f"❌ Token validation failed: HTTP {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Token validation error: {str(e)}")
            return False

    def get_hosts(self) -> List[Dict]:
        """Get list of verified hosts"""
        try:
            response = requests.get(
                f"{BASE_URL}/user/hosts",
                headers=self.headers,
                timeout=10
            )
            if response.status_code == 200:
                return response.json().get('hosts', [])
            else:
                return []
        except Exception as e:
            print(f"❌ Error fetching hosts: {str(e)}")
            return []

    def add_to_recrawl_queue(self, url: str) -> Dict:
        """
        Add URL to recrawl queue

        Args:
            url: Full URL to recrawl

        Returns:
            dict: Result of operation
        """
        endpoint = f"{BASE_URL}/user/hosts/{self.host_id}/recrawl/queue"

        payload = {
            "url": url
        }

        try:
            response = requests.post(
                endpoint,
                headers=self.headers,
                json=payload,
                timeout=10
            )

            if response.status_code == 200 or response.status_code == 201:
                self.submitted_count += 1
                print(f"✅ [{self.submitted_count}] Added to queue: {url}")
                return {'success': True, 'url': url}

            elif response.status_code == 400:
                error_data = response.json()
                print(f"❌ Bad request for {url}: {error_data.get('error_message', 'Unknown')}")
                return {'error': 'Bad request', 'url': url, 'details': error_data}

            elif response.status_code == 403:
                print(f"❌ Forbidden (403). Host {self.host_id} may not be verified")
                return {'error': '403 Forbidden', 'url': url}

            elif response.status_code == 429:
                print(f"⚠️  Rate limit (429) for {url}")
                return {'error': '429 Rate Limit', 'url': url}

            else:
                print(f"❌ HTTP {response.status_code}: {response.text}")
                return {'error': f'HTTP {response.status_code}', 'url': url}

        except Exception as e:
            print(f"❌ Error submitting {url}: {str(e)}")
            return {'error': str(e), 'url': url}

    def submit_batch(self, urls: List[str], delay: float = 0.5) -> Dict:
        """
        Submit batch of URLs to recrawl queue

        Args:
            urls: List of URLs
            delay: Delay between requests (seconds)

        Returns:
            dict: Summary results
        """
        results = {
            'total': len(urls),
            'successful': 0,
            'failed': 0,
            'failed_urls': [],
            'start_time': datetime.utcnow().isoformat()
        }

        for url in urls:
            result = self.add_to_recrawl_queue(url)

            if result.get('success'):
                results['successful'] += 1
            else:
                results['failed'] += 1
                results['failed_urls'].append(result)

            time.sleep(delay)

        results['end_time'] = datetime.utcnow().isoformat()
        return results

    def get_indexing_stats(self) -> Dict:
        """Get indexing statistics for host"""
        endpoint = f"{BASE_URL}/user/hosts/{self.host_id}/summary"

        try:
            response = requests.get(
                endpoint,
                headers=self.headers,
                timeout=10
            )

            if response.status_code == 200:
                return response.json()
            else:
                return {'error': f'HTTP {response.status_code}'}
        except Exception as e:
            return {'error': str(e)}

def main():
    """Main execution"""
    import sys

    # Load URL inventory
    inventory_path = '/Users/sardag/Desktop/ailydian-ultra-pro/ops/artifacts/url_inventory.json'

    try:
        with open(inventory_path, 'r') as f:
            inventory = json.load(f)
            urls = inventory['urls']
    except FileNotFoundError:
        print(f"❌ URL inventory not found: {inventory_path}")
        sys.exit(1)

    print(f"📋 Loaded {len(urls)} URLs from inventory")

    # Initialize API client
    client = YandexWebmasterAPI()

    if not client.validate_token():
        sys.exit(1)

    # Get hosts
    print(f"\n📊 Fetching verified hosts...")
    hosts = client.get_hosts()
    if hosts:
        print(f"   Found {len(hosts)} verified host(s):")
        for host in hosts:
            print(f"   - {host.get('host_id', 'Unknown')}")

    # Get current stats
    print(f"\n📊 Fetching indexing stats for {client.host_id}...")
    stats = client.get_indexing_stats()
    if 'error' not in stats:
        print(f"   Indexed pages: {stats.get('indexed_pages', 'N/A')}")
        print(f"   Sitemap pages: {stats.get('sitemap_pages', 'N/A')}")

    # Submit URLs
    print(f"\n🚀 Starting URL submission to recrawl queue...")
    urls_to_submit = urls[:DAILY_QUOTA]
    results = client.submit_batch(urls_to_submit, delay=0.5)

    # Save results
    output_path = f'/Users/sardag/Desktop/ailydian-ultra-pro/ops/artifacts/yandex_submission_results_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json'
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    # Print summary
    print(f"\n{'='*60}")
    print(f"📊 YANDEX WEBMASTER API - SUMMARY")
    print(f"{'='*60}")
    print(f"Total URLs: {results['total']}")
    print(f"✅ Successful: {results['successful']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"📄 Results saved: {output_path}")
    print(f"{'='*60}\n")

    if results['failed'] > 0:
        print(f"⚠️  Failed URLs:")
        for failed in results['failed_urls'][:10]:  # Show first 10
            print(f"   - {failed.get('url', 'Unknown')}: {failed.get('error', 'Unknown')}")

if __name__ == '__main__':
    main()
