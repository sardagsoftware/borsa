#!/usr/bin/env python3
"""
Bing URL Submission API Integration
LyDian AI - Search Index Synchronization
Mode: White-Hat · Ethical · API-based

Documentation: https://www.bing.com/webmasters/help/api-reference-8f62f091
"""

import os
import json
import time
import requests
from datetime import datetime
from typing import List, Dict

# Configuration
API_ENDPOINT = 'https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch'
SITE_URL = 'https://www.ailydian.com'
BING_API_KEY = os.getenv('BING_WEBMASTER_API_KEY', 'YOUR_BING_API_KEY_HERE')
DAILY_QUOTA = 10  # Free tier: 10 URLs/day
BATCH_SIZE = 10   # Max 10 URLs per request
RETRY_LIMIT = 3

class BingURLSubmission:
    """
    Bing Webmaster Tools URL Submission API Client

    Features:
    - API key authentication
    - Batch submission (max 10 URLs)
    - Quota tracking (10 URLs/day free tier)
    - Error handling
    - Detailed logging
    """

    def __init__(self, api_key: str = None, site_url: str = None):
        self.api_key = api_key or BING_API_KEY
        self.site_url = site_url or SITE_URL
        self.submitted_count = 0
        self.failed_urls = []

    def validate_api_key(self) -> bool:
        """Validate API key"""
        if not self.api_key or self.api_key == 'YOUR_BING_API_KEY_HERE':
            print("❌ Bing API key not configured")
            print("\nHow to get API key:")
            print("1. Go to: https://www.bing.com/webmasters")
            print("2. Settings → API Access")
            print("3. Generate API Key")
            print("4. Set environment variable: BING_WEBMASTER_API_KEY")
            return False
        return True

    def submit_batch(self, urls: List[str]) -> Dict:
        """
        Submit batch of URLs to Bing

        Args:
            urls: List of URLs (max 10 per request)

        Returns:
            dict: Submission result
        """
        if not self.validate_api_key():
            return {'error': 'API key not configured'}

        if len(urls) > BATCH_SIZE:
            print(f"⚠️  Batch size {len(urls)} exceeds max {BATCH_SIZE}. Truncating...")
            urls = urls[:BATCH_SIZE]

        if self.submitted_count + len(urls) > DAILY_QUOTA:
            remaining = DAILY_QUOTA - self.submitted_count
            print(f"⚠️  Daily quota would be exceeded. Only submitting {remaining} URLs")
            urls = urls[:remaining]

        # Prepare request
        endpoint = f"{API_ENDPOINT}?apikey={self.api_key}"
        payload = {
            "siteUrl": self.site_url,
            "urlList": urls
        }

        headers = {
            'Content-Type': 'application/json; charset=utf-8'
        }

        # Submit request
        for attempt in range(RETRY_LIMIT):
            try:
                response = requests.post(
                    endpoint,
                    json=payload,
                    headers=headers,
                    timeout=30
                )

                if response.status_code == 200:
                    result = response.json()
                    self.submitted_count += len(urls)

                    print(f"✅ Successfully submitted {len(urls)} URLs to Bing")
                    print(f"   Total submitted: {self.submitted_count}/{DAILY_QUOTA}")

                    return {
                        'success': True,
                        'urls_submitted': len(urls),
                        'total_submitted': self.submitted_count,
                        'quota_remaining': DAILY_QUOTA - self.submitted_count,
                        'response': result
                    }

                elif response.status_code == 429:
                    wait_time = 2 ** attempt
                    print(f"⚠️  Rate limit (429). Waiting {wait_time}s...")
                    time.sleep(wait_time)

                elif response.status_code == 403:
                    print(f"❌ Forbidden (403). Check:")
                    print("   - API key is correct")
                    print("   - Site is verified in Bing Webmaster Tools")
                    return {'error': '403 Forbidden', 'urls': urls}

                else:
                    print(f"❌ HTTP {response.status_code}: {response.text}")
                    return {'error': f'HTTP {response.status_code}', 'response': response.text}

            except requests.exceptions.Timeout:
                print(f"⚠️  Request timeout (attempt {attempt + 1}/{RETRY_LIMIT})")
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                if attempt == RETRY_LIMIT - 1:
                    return {'error': str(e), 'urls': urls}

        return {'error': 'Max retries reached', 'urls': urls}

    def get_quota(self) -> Dict:
        """Get daily quota information"""
        endpoint = f"https://ssl.bing.com/webmaster/api.svc/json/GetUrlSubmissionQuota?siteUrl={self.site_url}&apikey={self.api_key}"

        try:
            response = requests.get(endpoint, timeout=10)
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
    client = BingURLSubmission()

    if not client.validate_api_key():
        sys.exit(1)

    # Check quota
    print(f"\n📊 Checking Bing quota...")
    quota = client.get_quota()
    if 'error' not in quota:
        print(f"   Daily quota: {quota.get('DailyQuota', DAILY_QUOTA)}")
        print(f"   Monthly quota: {quota.get('MonthlyQuota', 'N/A')}")

    # Submit URLs (max 10 per day for free tier)
    print(f"\n🚀 Starting URL submission (limit: {DAILY_QUOTA} URLs/day)...")
    urls_to_submit = urls[:DAILY_QUOTA]

    results = {
        'total_urls': len(urls),
        'submitted': 0,
        'failed': 0,
        'batches': [],
        'start_time': datetime.utcnow().isoformat()
    }

    # Submit in batches
    for i in range(0, len(urls_to_submit), BATCH_SIZE):
        batch = urls_to_submit[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1

        print(f"\n📦 Batch {batch_num}: {len(batch)} URLs")
        result = client.submit_batch(batch)

        results['batches'].append(result)

        if result.get('success'):
            results['submitted'] += result['urls_submitted']
        else:
            results['failed'] += len(batch)

        # Delay between batches
        if i + BATCH_SIZE < len(urls_to_submit):
            time.sleep(2)

    results['end_time'] = datetime.utcnow().isoformat()

    # Save results
    output_path = f'/Users/sardag/Desktop/ailydian-ultra-pro/ops/artifacts/bing_submission_results_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json'
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    # Print summary
    print(f"\n{'='*60}")
    print(f"📊 BING URL SUBMISSION - SUMMARY")
    print(f"{'='*60}")
    print(f"Total URLs: {results['total_urls']}")
    print(f"✅ Submitted: {results['submitted']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"📄 Results saved: {output_path}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    main()
