#!/usr/bin/env python3
"""
Google Indexing API Integration
LyDian AI - Search Index Synchronization
Mode: White-Hat · Ethical · API-based

Documentation: https://developers.google.com/search/apis/indexing-api/v3/quickstart
"""

import os
import json
import time
import requests
from datetime import datetime
from typing import List, Dict
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configuration
SCOPES = ['https://www.googleapis.com/auth/indexing']
ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish'
SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON', '/vault/google-indexing-sa.json')
RATE_LIMIT = 200  # URLs per day (Google limit)
BATCH_SIZE = 10   # Process 10 URLs at a time
RETRY_LIMIT = 3
BACKOFF_FACTOR = 2

class GoogleIndexingAPI:
    """
    Google Indexing API Client

    Features:
    - Service Account authentication
    - Rate limiting (200 URLs/day)
    - Exponential backoff on errors
    - URL validation
    - Detailed logging
    """

    def __init__(self, service_account_path: str = None):
        self.service_account_path = service_account_path or SERVICE_ACCOUNT_FILE
        self.credentials = None
        self.service = None
        self.submitted_count = 0
        self.failed_urls = []

    def authenticate(self) -> bool:
        """Authenticate using Service Account"""
        try:
            self.credentials = service_account.Credentials.from_service_account_file(
                self.service_account_path,
                scopes=SCOPES
            )
            self.service = build('indexing', 'v3', credentials=self.credentials)
            print(f"✅ Authenticated with Google Indexing API")
            return True
        except FileNotFoundError:
            print(f"❌ Service account file not found: {self.service_account_path}")
            print("   Please set GOOGLE_SERVICE_ACCOUNT_JSON environment variable")
            return False
        except Exception as e:
            print(f"❌ Authentication failed: {str(e)}")
            return False

    def submit_url(self, url: str, notification_type: str = 'URL_UPDATED') -> Dict:
        """
        Submit single URL to Google Indexing API

        Args:
            url: Full URL to index (must use HTTPS)
            notification_type: 'URL_UPDATED' or 'URL_DELETED'

        Returns:
            dict: Response from API
        """
        if not url.startswith('https://'):
            return {'error': 'URL must use HTTPS', 'url': url}

        if self.submitted_count >= RATE_LIMIT:
            return {'error': 'Daily rate limit reached', 'url': url, 'limit': RATE_LIMIT}

        body = {
            'url': url,
            'type': notification_type
        }

        for attempt in range(RETRY_LIMIT):
            try:
                response = self.service.urlNotifications().publish(body=body).execute()
                self.submitted_count += 1
                print(f"✅ [{self.submitted_count}/{RATE_LIMIT}] Submitted: {url}")
                return response

            except Exception as e:
                if '429' in str(e):  # Rate limit
                    wait_time = BACKOFF_FACTOR ** attempt
                    print(f"⚠️  Rate limit hit, waiting {wait_time}s...")
                    time.sleep(wait_time)
                elif '403' in str(e):  # Forbidden
                    print(f"❌ Forbidden: {url} - Check domain ownership in Search Console")
                    self.failed_urls.append({'url': url, 'error': '403 Forbidden'})
                    break
                else:
                    print(f"❌ Error submitting {url}: {str(e)}")
                    if attempt == RETRY_LIMIT - 1:
                        self.failed_urls.append({'url': url, 'error': str(e)})

        return {'error': 'Max retries reached', 'url': url}

    def submit_batch(self, urls: List[str], delay: float = 1.0) -> Dict:
        """
        Submit multiple URLs with rate limiting

        Args:
            urls: List of URLs to submit
            delay: Delay between requests (seconds)

        Returns:
            dict: Summary of submission results
        """
        results = {
            'total': len(urls),
            'successful': 0,
            'failed': 0,
            'skipped': 0,
            'start_time': datetime.utcnow().isoformat(),
        }

        for i, url in enumerate(urls):
            if self.submitted_count >= RATE_LIMIT:
                results['skipped'] = len(urls) - i
                print(f"⚠️  Rate limit reached. Skipping remaining {results['skipped']} URLs")
                break

            response = self.submit_url(url)

            if 'error' in response:
                results['failed'] += 1
            else:
                results['successful'] += 1

            # Rate limiting delay
            if i < len(urls) - 1:
                time.sleep(delay)

        results['end_time'] = datetime.utcnow().isoformat()
        results['failed_urls'] = self.failed_urls

        return results

    def get_status(self, url: str) -> Dict:
        """Get indexing status for a URL"""
        try:
            response = self.service.urlNotifications().getMetadata(url=url).execute()
            return response
        except Exception as e:
            return {'error': str(e), 'url': url}

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
    client = GoogleIndexingAPI()

    if not client.authenticate():
        print("❌ Authentication failed. Please configure service account.")
        print("\nSetup instructions:")
        print("1. Go to: https://console.cloud.google.com")
        print("2. Enable Google Indexing API")
        print("3. Create Service Account")
        print("4. Download JSON key file")
        print("5. Add service account email to Search Console as owner")
        sys.exit(1)

    # Submit URLs
    print(f"\n🚀 Starting batch submission (limit: {RATE_LIMIT} URLs/day)...")
    results = client.submit_batch(urls[:RATE_LIMIT], delay=1.5)

    # Save results
    output_path = f'/Users/sardag/Desktop/ailydian-ultra-pro/ops/artifacts/google_indexing_results_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json'
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    # Print summary
    print(f"\n{'='*60}")
    print(f"📊 GOOGLE INDEXING API - SUMMARY")
    print(f"{'='*60}")
    print(f"Total URLs: {results['total']}")
    print(f"✅ Successful: {results['successful']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"⏭️  Skipped: {results['skipped']}")
    print(f"📄 Results saved: {output_path}")
    print(f"{'='*60}\n")

    if results['failed'] > 0:
        print(f"⚠️  Failed URLs:")
        for failed in results['failed_urls']:
            print(f"   - {failed['url']}: {failed['error']}")

if __name__ == '__main__':
    main()
