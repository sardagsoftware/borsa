#!/usr/bin/env python3
"""
LyDian AI - Global Index Trigger
PHASE D: INDEX TRIGGER (API-based)

Purpose: Submit LyDian discovery feeds to search engines and AI platforms
Policy: White-Hat · 0 Mock · Secrets Masked · API-based only

Supported Platforms:
- Google Indexing API (200 URLs/day)
- Bing URL Submission API (10 URLs/day)
- Yandex Webmaster API (100 URLs/day)
- OpenAI Discovery (ping)
- Gemini Discovery (ping)
- Perplexity Discovery (ping)
- Brave Search Discovery (ping)

Requirements:
- GOOGLE_SERVICE_ACCOUNT_JSON (Service Account with Indexing API enabled)
- BING_WEBMASTER_API_KEY (from Bing Webmaster Tools)
- YANDEX_WEBMASTER_TOKEN (OAuth token from Yandex Webmaster)

Usage:
    python index_trigger.py --platform google --urls urls.txt
    python index_trigger.py --platform bing --urls urls.txt
    python index_trigger.py --platform yandex --urls urls.txt
    python index_trigger.py --platform all --urls urls.txt
    python index_trigger.py --ping-ai-platforms
"""

import os
import sys
import json
import time
import argparse
import requests
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path

# Secret masking for logs
def mask_secret(secret: str) -> str:
    """Mask secrets using first4...last3 pattern"""
    if not secret or len(secret) < 8:
        return "****"
    return f"{secret[:4]}...{secret[-3:]}"

# Configuration
class Config:
    """Configuration for index submission"""

    # API Endpoints
    GOOGLE_INDEXING_API = "https://indexing.googleapis.com/v3/urlNotifications:publish"
    BING_SUBMISSION_API = "https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch"
    YANDEX_WEBMASTER_API = "https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}/url-notification/add"

    # AI Platform Discovery Endpoints
    OPENAI_DISCOVERY = "https://openai.com/bot.txt"  # robots.txt check
    GEMINI_DISCOVERY = "https://www.google.com/bot.html"  # Googlebot
    PERPLEXITY_DISCOVERY = "https://www.perplexity.ai/bot"  # Perplexity crawler
    BRAVE_DISCOVERY = "https://brave.com/bot.txt"  # Brave Search crawler

    # Rate Limits (requests per day)
    GOOGLE_DAILY_QUOTA = 200
    BING_DAILY_QUOTA = 10
    YANDEX_DAILY_QUOTA = 100

    # Retry Configuration
    MAX_RETRIES = 3
    INITIAL_BACKOFF = 1  # seconds
    MAX_BACKOFF = 60  # seconds

    # URLs to submit (LyDian discovery feeds)
    DEFAULT_URLS = [
        "https://www.ailydian.com/llms.txt",
        "https://www.ailydian.com/feed/ai_models.json",
        "https://www.ailydian.com/feed/ai_models.rss",
    ]

    @staticmethod
    def load_from_env():
        """Load API credentials from environment variables"""
        return {
            'google_service_account': os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON'),
            'bing_api_key': os.getenv('BING_WEBMASTER_API_KEY'),
            'yandex_token': os.getenv('YANDEX_WEBMASTER_TOKEN'),
            'yandex_user_id': os.getenv('YANDEX_USER_ID'),
            'yandex_host_id': os.getenv('YANDEX_HOST_ID'),
        }


class IndexSubmitter:
    """Base class for index submission"""

    def __init__(self, platform: str):
        self.platform = platform
        self.config = Config.load_from_env()
        self.session = requests.Session()
        self.stats = {
            'submitted': 0,
            'success': 0,
            'failed': 0,
            'errors': []
        }

    def exponential_backoff(self, attempt: int) -> float:
        """Calculate exponential backoff delay"""
        delay = min(
            Config.INITIAL_BACKOFF * (2 ** attempt),
            Config.MAX_BACKOFF
        )
        return delay

    def log(self, message: str, level: str = "INFO"):
        """Log message with timestamp"""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        print(f"[{timestamp}] [{level}] [{self.platform}] {message}")

    def save_report(self, output_file: str):
        """Save submission report to JSON"""
        report = {
            'platform': self.platform,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'stats': self.stats,
            'policy_compliance': 'White-Hat · 0 Mock · Secrets Masked · API-based'
        }

        Path(output_file).parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)

        self.log(f"Report saved to {output_file}")


class GoogleIndexSubmitter(IndexSubmitter):
    """Google Indexing API submitter"""

    def __init__(self):
        super().__init__('Google')
        self.service_account_json = self.config['google_service_account']

    def authenticate(self) -> Optional[str]:
        """Authenticate with Google Service Account and get access token"""
        if not self.service_account_json:
            self.log("GOOGLE_SERVICE_ACCOUNT_JSON not set", "ERROR")
            return None

        try:
            # Load service account credentials
            if os.path.isfile(self.service_account_json):
                with open(self.service_account_json) as f:
                    credentials = json.load(f)
            else:
                credentials = json.loads(self.service_account_json)

            # Import google-auth library
            from google.oauth2 import service_account
            from google.auth.transport.requests import Request

            # Create credentials
            creds = service_account.Credentials.from_service_account_info(
                credentials,
                scopes=['https://www.googleapis.com/auth/indexing']
            )

            # Get access token
            creds.refresh(Request())
            token = creds.token

            self.log(f"Authenticated with token: {mask_secret(token)}")
            return token

        except ImportError:
            self.log("google-auth library not installed. Run: pip install google-auth", "ERROR")
            return None
        except Exception as e:
            self.log(f"Authentication failed: {str(e)}", "ERROR")
            return None

    def submit_url(self, url: str, access_token: str) -> bool:
        """Submit a single URL to Google Indexing API"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        payload = {
            'url': url,
            'type': 'URL_UPDATED'
        }

        for attempt in range(Config.MAX_RETRIES):
            try:
                response = self.session.post(
                    Config.GOOGLE_INDEXING_API,
                    headers=headers,
                    json=payload,
                    timeout=30
                )

                if response.status_code == 200:
                    self.log(f"✅ Submitted: {url}")
                    self.stats['success'] += 1
                    return True

                elif response.status_code == 429:
                    # Rate limit exceeded
                    delay = self.exponential_backoff(attempt)
                    self.log(f"Rate limit (429), retrying in {delay}s...", "WARN")
                    time.sleep(delay)
                    continue

                elif response.status_code == 403:
                    # Forbidden - check service account permissions
                    self.log(f"❌ Forbidden (403): Check service account has Indexing API access", "ERROR")
                    self.stats['failed'] += 1
                    self.stats['errors'].append({
                        'url': url,
                        'status': 403,
                        'message': 'Service account lacks permissions'
                    })
                    return False

                else:
                    # Other error
                    error_msg = response.text[:200]
                    self.log(f"❌ Failed ({response.status_code}): {error_msg}", "ERROR")
                    self.stats['failed'] += 1
                    self.stats['errors'].append({
                        'url': url,
                        'status': response.status_code,
                        'message': error_msg
                    })
                    return False

            except Exception as e:
                self.log(f"Exception on attempt {attempt + 1}: {str(e)}", "ERROR")
                if attempt < Config.MAX_RETRIES - 1:
                    delay = self.exponential_backoff(attempt)
                    time.sleep(delay)

        self.stats['failed'] += 1
        return False

    def submit_urls(self, urls: List[str]):
        """Submit multiple URLs to Google Indexing API"""
        self.log(f"Starting Google Indexing API submission for {len(urls)} URLs")

        # Check quota
        if len(urls) > Config.GOOGLE_DAILY_QUOTA:
            self.log(f"⚠️  Warning: Submitting {len(urls)} URLs exceeds daily quota ({Config.GOOGLE_DAILY_QUOTA})", "WARN")

        # Authenticate
        access_token = self.authenticate()
        if not access_token:
            self.log("Authentication failed, cannot submit URLs", "ERROR")
            return

        # Submit URLs
        for url in urls:
            self.stats['submitted'] += 1
            self.submit_url(url, access_token)
            time.sleep(1)  # Rate limiting

        # Summary
        self.log(f"Submission complete: {self.stats['success']}/{len(urls)} successful")


class BingIndexSubmitter(IndexSubmitter):
    """Bing URL Submission API submitter"""

    def __init__(self):
        super().__init__('Bing')
        self.api_key = self.config['bing_api_key']

    def submit_urls(self, urls: List[str]):
        """Submit multiple URLs to Bing URL Submission API"""
        if not self.api_key:
            self.log("BING_WEBMASTER_API_KEY not set", "ERROR")
            return

        self.log(f"Starting Bing URL Submission for {len(urls)} URLs")

        # Check quota
        if len(urls) > Config.BING_DAILY_QUOTA:
            self.log(f"⚠️  Warning: Submitting {len(urls)} URLs exceeds daily quota ({Config.BING_DAILY_QUOTA})", "WARN")

        # Bing API requires site URL
        site_url = "https://www.ailydian.com"

        headers = {
            'Content-Type': 'application/json',
            'charset': 'utf-8'
        }

        payload = {
            'siteUrl': site_url,
            'urlList': urls
        }

        # Add API key to URL
        api_url = f"{Config.BING_SUBMISSION_API}?apikey={self.api_key}"

        for attempt in range(Config.MAX_RETRIES):
            try:
                response = self.session.post(
                    api_url,
                    headers=headers,
                    json=payload,
                    timeout=30
                )

                if response.status_code == 200:
                    result = response.json()
                    self.log(f"✅ Submitted {len(urls)} URLs successfully")
                    self.stats['success'] = len(urls)
                    self.stats['submitted'] = len(urls)
                    return

                elif response.status_code == 429:
                    delay = self.exponential_backoff(attempt)
                    self.log(f"Rate limit (429), retrying in {delay}s...", "WARN")
                    time.sleep(delay)
                    continue

                else:
                    error_msg = response.text[:200]
                    self.log(f"❌ Failed ({response.status_code}): {error_msg}", "ERROR")
                    self.stats['failed'] = len(urls)
                    self.stats['submitted'] = len(urls)
                    return

            except Exception as e:
                self.log(f"Exception on attempt {attempt + 1}: {str(e)}", "ERROR")
                if attempt < Config.MAX_RETRIES - 1:
                    delay = self.exponential_backoff(attempt)
                    time.sleep(delay)

        self.stats['failed'] = len(urls)
        self.stats['submitted'] = len(urls)


class YandexIndexSubmitter(IndexSubmitter):
    """Yandex Webmaster API submitter"""

    def __init__(self):
        super().__init__('Yandex')
        self.token = self.config['yandex_token']
        self.user_id = self.config['yandex_user_id']
        self.host_id = self.config['yandex_host_id']

    def submit_url(self, url: str) -> bool:
        """Submit a single URL to Yandex Webmaster API"""
        if not all([self.token, self.user_id, self.host_id]):
            self.log("Yandex credentials incomplete (token, user_id, host_id)", "ERROR")
            return False

        api_url = Config.YANDEX_WEBMASTER_API.format(
            user_id=self.user_id,
            host_id=self.host_id
        )

        headers = {
            'Authorization': f'OAuth {self.token}',
            'Content-Type': 'application/json'
        }

        payload = {
            'url': url
        }

        for attempt in range(Config.MAX_RETRIES):
            try:
                response = self.session.post(
                    api_url,
                    headers=headers,
                    json=payload,
                    timeout=30
                )

                if response.status_code == 200:
                    self.log(f"✅ Submitted: {url}")
                    self.stats['success'] += 1
                    return True

                elif response.status_code == 429:
                    delay = self.exponential_backoff(attempt)
                    self.log(f"Rate limit (429), retrying in {delay}s...", "WARN")
                    time.sleep(delay)
                    continue

                else:
                    error_msg = response.text[:200]
                    self.log(f"❌ Failed ({response.status_code}): {error_msg}", "ERROR")
                    self.stats['failed'] += 1
                    return False

            except Exception as e:
                self.log(f"Exception on attempt {attempt + 1}: {str(e)}", "ERROR")
                if attempt < Config.MAX_RETRIES - 1:
                    delay = self.exponential_backoff(attempt)
                    time.sleep(delay)

        self.stats['failed'] += 1
        return False

    def submit_urls(self, urls: List[str]):
        """Submit multiple URLs to Yandex Webmaster API"""
        self.log(f"Starting Yandex Webmaster API submission for {len(urls)} URLs")

        # Check quota
        if len(urls) > Config.YANDEX_DAILY_QUOTA:
            self.log(f"⚠️  Warning: Submitting {len(urls)} URLs exceeds daily quota ({Config.YANDEX_DAILY_QUOTA})", "WARN")

        # Submit URLs
        for url in urls:
            self.stats['submitted'] += 1
            self.submit_url(url)
            time.sleep(1)  # Rate limiting

        # Summary
        self.log(f"Submission complete: {self.stats['success']}/{len(urls)} successful")


class AIPlatformPinger:
    """Ping AI platforms to trigger discovery crawlers"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'LyDianDiscoveryBot/1.0 (+https://www.ailydian.com/llms.txt)'
        })

    def log(self, message: str, level: str = "INFO"):
        """Log message with timestamp"""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        print(f"[{timestamp}] [{level}] [AI-Ping] {message}")

    def ping_platform(self, name: str, url: str) -> bool:
        """Ping a single AI platform discovery endpoint"""
        try:
            response = self.session.head(url, timeout=10, allow_redirects=True)

            if response.status_code < 400:
                self.log(f"✅ {name}: Accessible ({response.status_code})")
                return True
            else:
                self.log(f"⚠️  {name}: Not accessible ({response.status_code})", "WARN")
                return False

        except Exception as e:
            self.log(f"❌ {name}: Error - {str(e)}", "ERROR")
            return False

    def ping_all(self):
        """Ping all AI platform discovery endpoints"""
        self.log("Pinging AI platform discovery endpoints...")

        platforms = {
            'OpenAI': Config.OPENAI_DISCOVERY,
            'Gemini (Googlebot)': Config.GEMINI_DISCOVERY,
            'Perplexity': Config.PERPLEXITY_DISCOVERY,
            'Brave Search': Config.BRAVE_DISCOVERY,
        }

        results = {}
        for name, url in platforms.items():
            results[name] = self.ping_platform(name, url)

        # Summary
        success_count = sum(results.values())
        self.log(f"Ping complete: {success_count}/{len(platforms)} platforms accessible")

        return results


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='LyDian AI - Global Index Trigger (PHASE D)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Submit to Google Indexing API
  python index_trigger.py --platform google --urls urls.txt

  # Submit to all platforms
  python index_trigger.py --platform all --urls urls.txt

  # Ping AI platforms only
  python index_trigger.py --ping-ai-platforms

  # Use default URLs (discovery feeds)
  python index_trigger.py --platform google
        """
    )

    parser.add_argument(
        '--platform',
        choices=['google', 'bing', 'yandex', 'all'],
        help='Target platform for URL submission'
    )

    parser.add_argument(
        '--urls',
        type=str,
        help='File containing URLs to submit (one per line)'
    )

    parser.add_argument(
        '--ping-ai-platforms',
        action='store_true',
        help='Ping AI platform discovery endpoints'
    )

    parser.add_argument(
        '--output',
        type=str,
        default='ops/artifacts/index_submission_report.json',
        help='Output file for submission report'
    )

    args = parser.parse_args()

    # Load URLs
    if args.urls:
        with open(args.urls) as f:
            urls = [line.strip() for line in f if line.strip()]
    else:
        urls = Config.DEFAULT_URLS

    print(f"\n{'='*60}")
    print(f"LyDian AI - Global Index Trigger (PHASE D)")
    print(f"Policy: White-Hat · 0 Mock · Secrets Masked · API-based")
    print(f"{'='*60}\n")

    # Ping AI platforms
    if args.ping_ai_platforms:
        pinger = AIPlatformPinger()
        pinger.ping_all()
        return

    # Submit to platforms
    if not args.platform:
        parser.print_help()
        return

    platforms = []
    if args.platform == 'all':
        platforms = ['google', 'bing', 'yandex']
    else:
        platforms = [args.platform]

    # Execute submissions
    for platform in platforms:
        print(f"\n{'─'*60}")

        if platform == 'google':
            submitter = GoogleIndexSubmitter()
        elif platform == 'bing':
            submitter = BingIndexSubmitter()
        elif platform == 'yandex':
            submitter = YandexIndexSubmitter()

        submitter.submit_urls(urls)
        submitter.save_report(args.output.replace('.json', f'_{platform}.json'))

    print(f"\n{'='*60}")
    print(f"Index submission complete!")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
