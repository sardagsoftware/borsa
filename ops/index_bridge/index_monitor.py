#!/usr/bin/env python3
"""
LyDian AI - Index Monitoring & Verification
PHASE E: MONITOR & VERIFY

Purpose: Monitor indexing status and verify search engine coverage
Policy: White-Hat · 0 Mock · Secrets Masked · API-based only

Monitored Platforms:
- Google Search Console API (coverage, indexing status)
- Bing Webmaster API (quota, indexing status)
- Yandex Webmaster API (indexing status)

Requirements:
- GOOGLE_SERVICE_ACCOUNT_JSON (Service Account with Search Console API)
- BING_WEBMASTER_API_KEY (from Bing Webmaster Tools)
- YANDEX_WEBMASTER_TOKEN (OAuth token from Yandex Webmaster)

Usage:
    python index_monitor.py --platform google
    python index_monitor.py --platform bing
    python index_monitor.py --platform yandex
    python index_monitor.py --platform all
    python index_monitor.py --generate-report
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime, timedelta
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
    """Configuration for index monitoring"""

    # API Endpoints
    GOOGLE_SEARCH_CONSOLE_API = "https://searchconsole.googleapis.com/v1"
    BING_WEBMASTER_API = "https://ssl.bing.com/webmaster/api.svc/json"
    YANDEX_WEBMASTER_API = "https://api.webmaster.yandex.net/v4"

    # URLs to monitor (LyDian discovery feeds)
    MONITORED_URLS = [
        "https://www.ailydian.com/",
        "https://www.ailydian.com/llms.txt",
        "https://www.ailydian.com/feed/ai_models.json",
        "https://www.ailydian.com/feed/ai_models.rss",
        "https://www.ailydian.com/lydian-iq.html",
        "https://www.ailydian.com/api-docs.html",
    ]

    # Report configuration
    REPORT_PATH = "ops/artifacts/INDEX_BRIDGE_REPORT.json"
    HISTORY_PATH = "ops/artifacts/index_history/"

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


class BaseMonitor:
    """Base class for index monitoring"""

    def __init__(self, platform: str):
        self.platform = platform
        self.config = Config.load_from_env()
        self.results = {
            'platform': platform,
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'urls_checked': 0,
            'indexed_count': 0,
            'not_indexed_count': 0,
            'error_count': 0,
            'details': [],
            'quota_info': {},
            'policy_compliance': 'White-Hat · 0 Mock · Secrets Masked · API-based'
        }

    def log(self, message: str, level: str = "INFO"):
        """Log message with timestamp"""
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        print(f"[{timestamp}] [{level}] [{self.platform}] {message}")

    def save_results(self, output_file: str):
        """Save monitoring results to JSON"""
        Path(output_file).parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)

        self.log(f"Results saved to {output_file}")

    def save_history(self):
        """Save results to history directory for trend analysis"""
        history_dir = Path(Config.HISTORY_PATH)
        history_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        history_file = history_dir / f"{self.platform}_{timestamp}.json"

        with open(history_file, 'w') as f:
            json.dump(self.results, f, indent=2)

        self.log(f"History saved to {history_file}")


class GoogleSearchConsoleMonitor(BaseMonitor):
    """Google Search Console monitoring"""

    def __init__(self):
        super().__init__('Google Search Console')
        self.service_account_json = self.config['google_service_account']
        self.site_url = "https://www.ailydian.com/"

    def authenticate(self):
        """Authenticate with Google Service Account"""
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
                scopes=['https://www.googleapis.com/auth/webmasters.readonly']
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

    def check_url_inspection(self, url: str, access_token: str) -> Dict:
        """Check URL inspection status via Search Console API"""
        import requests

        endpoint = f"{Config.GOOGLE_SEARCH_CONSOLE_API}/urlInspection/index:inspect"

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        payload = {
            'inspectionUrl': url,
            'siteUrl': self.site_url
        }

        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=30)

            if response.status_code == 200:
                data = response.json()
                inspection_result = data.get('inspectionResult', {})
                index_status = inspection_result.get('indexStatusResult', {})

                verdict = index_status.get('verdict', 'UNKNOWN')
                coverage_state = index_status.get('coverageState', 'UNKNOWN')
                last_crawl = index_status.get('lastCrawlTime', 'Never')

                is_indexed = verdict == 'PASS' and coverage_state == 'Submitted and indexed'

                return {
                    'url': url,
                    'indexed': is_indexed,
                    'verdict': verdict,
                    'coverage_state': coverage_state,
                    'last_crawl': last_crawl,
                    'status': 'success'
                }

            else:
                error_msg = response.text[:200]
                self.log(f"Failed to inspect {url}: {response.status_code}", "WARN")
                return {
                    'url': url,
                    'indexed': False,
                    'error': f"HTTP {response.status_code}: {error_msg}",
                    'status': 'error'
                }

        except Exception as e:
            self.log(f"Exception checking {url}: {str(e)}", "ERROR")
            return {
                'url': url,
                'indexed': False,
                'error': str(e),
                'status': 'error'
            }

    def get_site_statistics(self, access_token: str) -> Dict:
        """Get site-level statistics from Search Console"""
        import requests

        endpoint = f"{Config.GOOGLE_SEARCH_CONSOLE_API}/sites/{self.site_url}"

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        try:
            response = requests.get(endpoint, headers=headers, timeout=30)

            if response.status_code == 200:
                data = response.json()
                return {
                    'site_url': data.get('siteUrl'),
                    'permission_level': data.get('permissionLevel'),
                    'status': 'success'
                }
            else:
                return {'status': 'error', 'message': response.text[:200]}

        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def monitor(self):
        """Monitor all URLs in Google Search Console"""
        self.log("Starting Google Search Console monitoring")

        # Authenticate
        access_token = self.authenticate()
        if not access_token:
            self.log("Authentication failed, cannot monitor", "ERROR")
            return

        # Get site statistics
        site_stats = self.get_site_statistics(access_token)
        self.results['site_info'] = site_stats
        self.log(f"Site: {site_stats.get('site_url')}, Permission: {site_stats.get('permission_level')}")

        # Check each URL
        for url in Config.MONITORED_URLS:
            self.results['urls_checked'] += 1
            result = self.check_url_inspection(url, access_token)

            if result['status'] == 'success':
                if result['indexed']:
                    self.log(f"✅ Indexed: {url}")
                    self.results['indexed_count'] += 1
                else:
                    self.log(f"⚠️  Not indexed: {url} (Verdict: {result.get('verdict')})", "WARN")
                    self.results['not_indexed_count'] += 1
            else:
                self.log(f"❌ Error: {url}", "ERROR")
                self.results['error_count'] += 1

            self.results['details'].append(result)
            time.sleep(1)  # Rate limiting

        # Summary
        self.log(f"Monitoring complete: {self.results['indexed_count']}/{self.results['urls_checked']} indexed")


class BingWebmasterMonitor(BaseMonitor):
    """Bing Webmaster monitoring"""

    def __init__(self):
        super().__init__('Bing Webmaster')
        self.api_key = self.config['bing_api_key']
        self.site_url = "https://www.ailydian.com"

    def get_url_info(self, url: str) -> Dict:
        """Get URL indexing info from Bing Webmaster API"""
        import requests

        if not self.api_key:
            return {'url': url, 'status': 'error', 'error': 'API key not set'}

        endpoint = f"{Config.BING_WEBMASTER_API}/GetUrlInfo"
        params = {
            'apikey': self.api_key,
            'siteUrl': self.site_url,
            'url': url
        }

        try:
            response = requests.get(endpoint, params=params, timeout=30)

            if response.status_code == 200:
                data = response.json()

                # Bing API returns indexing status
                is_indexed = data.get('d', {}).get('IsIndexed', False)
                last_crawl = data.get('d', {}).get('LastCrawledDateTime', 'Never')

                return {
                    'url': url,
                    'indexed': is_indexed,
                    'last_crawl': last_crawl,
                    'status': 'success'
                }

            else:
                error_msg = response.text[:200]
                return {
                    'url': url,
                    'indexed': False,
                    'error': f"HTTP {response.status_code}: {error_msg}",
                    'status': 'error'
                }

        except Exception as e:
            return {
                'url': url,
                'indexed': False,
                'error': str(e),
                'status': 'error'
            }

    def get_quota_info(self) -> Dict:
        """Get API quota information from Bing Webmaster"""
        import requests

        if not self.api_key:
            return {'status': 'error', 'error': 'API key not set'}

        endpoint = f"{Config.BING_WEBMASTER_API}/GetApiQuota"
        params = {
            'apikey': self.api_key,
            'siteUrl': self.site_url
        }

        try:
            response = requests.get(endpoint, params=params, timeout=30)

            if response.status_code == 200:
                data = response.json()
                quota = data.get('d', {})

                return {
                    'daily_quota': quota.get('DailyQuota', 0),
                    'used_today': quota.get('UsedToday', 0),
                    'remaining': quota.get('DailyQuota', 0) - quota.get('UsedToday', 0),
                    'status': 'success'
                }

            else:
                return {'status': 'error', 'message': response.text[:200]}

        except Exception as e:
            return {'status': 'error', 'message': str(e)}

    def monitor(self):
        """Monitor all URLs in Bing Webmaster"""
        self.log("Starting Bing Webmaster monitoring")

        if not self.api_key:
            self.log("BING_WEBMASTER_API_KEY not set", "ERROR")
            return

        # Get quota info
        quota_info = self.get_quota_info()
        self.results['quota_info'] = quota_info

        if quota_info['status'] == 'success':
            self.log(f"Quota: {quota_info['remaining']}/{quota_info['daily_quota']} remaining")

        # Check each URL
        for url in Config.MONITORED_URLS:
            self.results['urls_checked'] += 1
            result = self.get_url_info(url)

            if result['status'] == 'success':
                if result['indexed']:
                    self.log(f"✅ Indexed: {url}")
                    self.results['indexed_count'] += 1
                else:
                    self.log(f"⚠️  Not indexed: {url}", "WARN")
                    self.results['not_indexed_count'] += 1
            else:
                self.log(f"❌ Error: {url}", "ERROR")
                self.results['error_count'] += 1

            self.results['details'].append(result)
            time.sleep(1)  # Rate limiting

        # Summary
        self.log(f"Monitoring complete: {self.results['indexed_count']}/{self.results['urls_checked']} indexed")


class YandexWebmasterMonitor(BaseMonitor):
    """Yandex Webmaster monitoring"""

    def __init__(self):
        super().__init__('Yandex Webmaster')
        self.token = self.config['yandex_token']
        self.user_id = self.config['yandex_user_id']
        self.host_id = self.config['yandex_host_id']

    def check_url_status(self, url: str) -> Dict:
        """Check URL indexing status in Yandex"""
        import requests

        if not all([self.token, self.user_id, self.host_id]):
            return {'url': url, 'status': 'error', 'error': 'Credentials incomplete'}

        endpoint = f"{Config.YANDEX_WEBMASTER_API}/user/{self.user_id}/hosts/{self.host_id}/search-urls/history"

        headers = {
            'Authorization': f'OAuth {self.token}',
            'Content-Type': 'application/json'
        }

        params = {
            'url': url
        }

        try:
            response = requests.get(endpoint, headers=headers, params=params, timeout=30)

            if response.status_code == 200:
                data = response.json()
                indicators = data.get('indicators', [])

                # Check if URL is in search results
                is_indexed = len(indicators) > 0

                return {
                    'url': url,
                    'indexed': is_indexed,
                    'indicators': indicators,
                    'status': 'success'
                }

            else:
                error_msg = response.text[:200]
                return {
                    'url': url,
                    'indexed': False,
                    'error': f"HTTP {response.status_code}: {error_msg}",
                    'status': 'error'
                }

        except Exception as e:
            return {
                'url': url,
                'indexed': False,
                'error': str(e),
                'status': 'error'
            }

    def monitor(self):
        """Monitor all URLs in Yandex Webmaster"""
        self.log("Starting Yandex Webmaster monitoring")

        if not all([self.token, self.user_id, self.host_id]):
            self.log("Yandex credentials incomplete (token, user_id, host_id)", "ERROR")
            return

        # Check each URL
        for url in Config.MONITORED_URLS:
            self.results['urls_checked'] += 1
            result = self.check_url_status(url)

            if result['status'] == 'success':
                if result['indexed']:
                    self.log(f"✅ Indexed: {url}")
                    self.results['indexed_count'] += 1
                else:
                    self.log(f"⚠️  Not indexed: {url}", "WARN")
                    self.results['not_indexed_count'] += 1
            else:
                self.log(f"❌ Error: {url}", "ERROR")
                self.results['error_count'] += 1

            self.results['details'].append(result)
            time.sleep(1)  # Rate limiting

        # Summary
        self.log(f"Monitoring complete: {self.results['indexed_count']}/{self.results['urls_checked']} indexed")


class ReportGenerator:
    """Generate comprehensive indexing report"""

    def __init__(self):
        self.report = {
            'generated_at': datetime.utcnow().isoformat() + 'Z',
            'policy_compliance': 'White-Hat · 0 Mock · Secrets Masked · API-based',
            'platforms': {},
            'summary': {
                'total_urls_monitored': len(Config.MONITORED_URLS),
                'urls': Config.MONITORED_URLS
            }
        }

    def load_platform_results(self, platform: str, filename: str):
        """Load results from a platform monitoring run"""
        try:
            with open(filename) as f:
                data = json.load(f)
                self.report['platforms'][platform] = data
        except FileNotFoundError:
            print(f"[WARN] Results not found for {platform}: {filename}")
        except Exception as e:
            print(f"[ERROR] Failed to load {platform} results: {str(e)}")

    def calculate_summary(self):
        """Calculate overall summary statistics"""
        total_indexed = 0
        total_not_indexed = 0
        total_errors = 0

        for platform, data in self.report['platforms'].items():
            total_indexed += data.get('indexed_count', 0)
            total_not_indexed += data.get('not_indexed_count', 0)
            total_errors += data.get('error_count', 0)

        num_platforms = len(self.report['platforms'])

        self.report['summary'].update({
            'total_platforms': num_platforms,
            'total_indexed': total_indexed,
            'total_not_indexed': total_not_indexed,
            'total_errors': total_errors,
            'average_indexed_rate': (total_indexed / (total_indexed + total_not_indexed) * 100) if (total_indexed + total_not_indexed) > 0 else 0
        })

    def generate_url_matrix(self):
        """Generate URL-by-platform indexing matrix"""
        matrix = {}

        for url in Config.MONITORED_URLS:
            matrix[url] = {}

            for platform, data in self.report['platforms'].items():
                # Find URL in details
                url_detail = next(
                    (d for d in data.get('details', []) if d.get('url') == url),
                    None
                )

                if url_detail:
                    matrix[url][platform] = url_detail.get('indexed', False)
                else:
                    matrix[url][platform] = None

        self.report['url_matrix'] = matrix

    def save_report(self, output_file: str):
        """Save comprehensive report to JSON"""
        self.calculate_summary()
        self.generate_url_matrix()

        Path(output_file).parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w') as f:
            json.dump(self.report, f, indent=2)

        print(f"\n{'='*60}")
        print(f"INDEX BRIDGE REPORT")
        print(f"{'='*60}")
        print(f"Generated: {self.report['generated_at']}")
        print(f"Platforms: {self.report['summary']['total_platforms']}")
        print(f"URLs Monitored: {self.report['summary']['total_urls_monitored']}")
        print(f"Total Indexed: {self.report['summary']['total_indexed']}")
        print(f"Total Not Indexed: {self.report['summary']['total_not_indexed']}")
        print(f"Total Errors: {self.report['summary']['total_errors']}")
        print(f"Average Index Rate: {self.report['summary']['average_indexed_rate']:.1f}%")
        print(f"{'='*60}")
        print(f"Report saved to: {output_file}\n")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='LyDian AI - Index Monitoring & Verification (PHASE E)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Monitor Google Search Console
  python index_monitor.py --platform google

  # Monitor all platforms
  python index_monitor.py --platform all

  # Generate comprehensive report
  python index_monitor.py --generate-report
        """
    )

    parser.add_argument(
        '--platform',
        choices=['google', 'bing', 'yandex', 'all'],
        help='Platform to monitor'
    )

    parser.add_argument(
        '--generate-report',
        action='store_true',
        help='Generate comprehensive INDEX_BRIDGE_REPORT.json'
    )

    parser.add_argument(
        '--output-dir',
        type=str,
        default='ops/artifacts',
        help='Output directory for results'
    )

    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"LyDian AI - Index Monitoring & Verification (PHASE E)")
    print(f"Policy: White-Hat · 0 Mock · Secrets Masked · API-based")
    print(f"{'='*60}\n")

    # Generate report from existing results
    if args.generate_report:
        generator = ReportGenerator()

        # Load results from each platform
        generator.load_platform_results('google', f'{args.output_dir}/monitor_google.json')
        generator.load_platform_results('bing', f'{args.output_dir}/monitor_bing.json')
        generator.load_platform_results('yandex', f'{args.output_dir}/monitor_yandex.json')

        # Save comprehensive report
        generator.save_report(Config.REPORT_PATH)
        return

    # Monitor platforms
    if not args.platform:
        parser.print_help()
        return

    platforms = []
    if args.platform == 'all':
        platforms = ['google', 'bing', 'yandex']
    else:
        platforms = [args.platform]

    # Execute monitoring
    for platform in platforms:
        print(f"\n{'─'*60}")

        if platform == 'google':
            monitor = GoogleSearchConsoleMonitor()
        elif platform == 'bing':
            monitor = BingWebmasterMonitor()
        elif platform == 'yandex':
            monitor = YandexWebmasterMonitor()

        monitor.monitor()
        monitor.save_results(f'{args.output_dir}/monitor_{platform}.json')
        monitor.save_history()

    print(f"\n{'='*60}")
    print(f"Monitoring complete!")
    print(f"Run with --generate-report to create comprehensive report")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
