#!/usr/bin/env python3
"""
PHASE F - Security & Compliance Validation
LyDian AI - White-Hat Indexing Compliance Check
Mode: Security-First · 0 Violation Policy

Purpose: Verify all indexing operations comply with security and ethical standards
"""

import os
import sys
import json
import requests
from datetime import datetime
from typing import Dict, List, Tuple
from pathlib import Path
from urllib.parse import urlparse

# Configuration
DOMAIN = 'www.ailydian.com'
BASE_URL = f'https://{DOMAIN}'
ARTIFACTS_DIR = Path('/Users/sardag/Desktop/ailydian-ultra-pro/ops/artifacts')
COMPLIANCE_REPORT = ARTIFACTS_DIR / f'security_compliance_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json'

class SecurityComplianceCheck:
    """
    Security and compliance validator

    Checks:
    - HTTPS enforcement
    - HSTS headers
    - Canonical URLs
    - No-index violations
    - Crawl budget compliance
    - User-agent rules
    - Rate limiting
    """

    def __init__(self):
        self.results = {
            'timestamp': datetime.utcnow().isoformat(),
            'domain': DOMAIN,
            'base_url': BASE_URL,
            'checks': {},
            'violations': [],
            'warnings': [],
            'passed': 0,
            'failed': 0
        }

    def check_https_enforcement(self) -> Tuple[bool, Dict]:
        """Verify HTTPS is enforced (HTTP redirects to HTTPS)"""
        print("\n🔒 HTTPS Enforcement Check")

        try:
            # Test HTTP -> HTTPS redirect
            http_url = f'http://{DOMAIN}'
            response = requests.get(http_url, allow_redirects=True, timeout=10)

            is_https = response.url.startswith('https://')
            status = '✅ PASS' if is_https else '❌ FAIL'

            print(f"   {status}: HTTP redirects to HTTPS" if is_https else f"   {status}: HTTP does not redirect")

            result = {
                'check': 'HTTPS Enforcement',
                'passed': is_https,
                'http_url': http_url,
                'final_url': response.url,
                'status_code': response.status_code
            }

            if not is_https:
                self.results['violations'].append('HTTP does not redirect to HTTPS')

            return is_https, result

        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            return False, {'check': 'HTTPS Enforcement', 'passed': False, 'error': str(e)}

    def check_hsts_header(self) -> Tuple[bool, Dict]:
        """Verify HSTS (HTTP Strict Transport Security) header"""
        print("\n🛡️  HSTS Header Check")

        try:
            response = requests.get(BASE_URL, timeout=10)
            hsts = response.headers.get('Strict-Transport-Security', '')

            has_hsts = bool(hsts)
            status = '✅ PASS' if has_hsts else '⚠️  WARNING'

            print(f"   {status}: HSTS {'present' if has_hsts else 'not present'}")
            if hsts:
                print(f"   Value: {hsts}")

            result = {
                'check': 'HSTS Header',
                'passed': has_hsts,
                'header_value': hsts or None
            }

            if not has_hsts:
                self.results['warnings'].append('HSTS header not present (recommended for security)')

            return has_hsts, result

        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            return False, {'check': 'HSTS Header', 'passed': False, 'error': str(e)}

    def check_robots_txt_compliance(self) -> Tuple[bool, Dict]:
        """Verify robots.txt is accessible and properly formatted"""
        print("\n🤖 robots.txt Compliance Check")

        try:
            robots_url = f'{BASE_URL}/robots.txt'
            response = requests.get(robots_url, timeout=10)

            if response.status_code != 200:
                print(f"   ❌ FAIL: robots.txt not accessible (HTTP {response.status_code})")
                return False, {'check': 'robots.txt', 'passed': False, 'status_code': response.status_code}

            content = response.text

            # Validation checks
            checks = {
                'accessible': True,
                'has_user_agent': 'User-agent:' in content,
                'has_sitemap': 'Sitemap:' in content,
                'allows_crawling': 'Disallow: /' not in content or 'Allow: /' in content,
                'has_ai_crawlers': any(bot in content for bot in ['GPTBot', 'anthropic-ai', 'ClaudeBot'])
            }

            all_passed = all(checks.values())
            status = '✅ PASS' if all_passed else '⚠️  WARNING'

            print(f"   {status}: robots.txt validation")
            for check_name, passed in checks.items():
                icon = '✅' if passed else '⚠️ '
                print(f"      {icon} {check_name.replace('_', ' ').title()}")

            result = {
                'check': 'robots.txt Compliance',
                'passed': all_passed,
                'url': robots_url,
                'validations': checks
            }

            return all_passed, result

        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            return False, {'check': 'robots.txt', 'passed': False, 'error': str(e)}

    def check_sitemap_xml(self) -> Tuple[bool, Dict]:
        """Verify sitemap.xml is valid and accessible"""
        print("\n🗺️  sitemap.xml Validation")

        try:
            sitemap_url = f'{BASE_URL}/sitemap.xml'
            response = requests.get(sitemap_url, timeout=10)

            if response.status_code != 200:
                print(f"   ❌ FAIL: sitemap.xml not accessible (HTTP {response.status_code})")
                return False, {'check': 'sitemap.xml', 'passed': False, 'status_code': response.status_code}

            # Parse XML
            import xml.etree.ElementTree as ET
            root = ET.fromstring(response.text)

            # Count URLs
            namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            urls = root.findall('.//ns:loc', namespace)

            checks = {
                'accessible': True,
                'valid_xml': True,
                'url_count': len(urls),
                'has_urls': len(urls) > 0,
                'all_https': all(url.text.startswith('https://') for url in urls if url.text)
            }

            all_passed = checks['valid_xml'] and checks['has_urls'] and checks['all_https']
            status = '✅ PASS' if all_passed else '❌ FAIL'

            print(f"   {status}: sitemap.xml validation")
            print(f"      ✅ URLs: {checks['url_count']}")
            print(f"      {'✅' if checks['all_https'] else '❌'} All URLs use HTTPS")

            result = {
                'check': 'sitemap.xml Validation',
                'passed': all_passed,
                'url': sitemap_url,
                'validations': checks
            }

            if not checks['all_https']:
                self.results['violations'].append('Sitemap contains non-HTTPS URLs')

            return all_passed, result

        except ET.ParseError:
            print(f"   ❌ FAIL: Invalid XML format")
            return False, {'check': 'sitemap.xml', 'passed': False, 'error': 'Invalid XML'}
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            return False, {'check': 'sitemap.xml', 'passed': False, 'error': str(e)}

    def check_canonical_urls(self) -> Tuple[bool, Dict]:
        """Check homepage for canonical URL"""
        print("\n🔗 Canonical URL Check")

        try:
            response = requests.get(BASE_URL, timeout=10)

            # Look for canonical link in HTML
            content = response.text.lower()
            has_canonical = '<link rel="canonical"' in content

            if has_canonical:
                # Extract canonical URL
                import re
                match = re.search(r'<link rel="canonical" href="([^"]+)"', content, re.IGNORECASE)
                canonical_url = match.group(1) if match else 'unknown'

                is_https = canonical_url.startswith('https://')
                status = '✅ PASS' if is_https else '⚠️  WARNING'

                print(f"   {status}: Canonical URL present")
                print(f"      URL: {canonical_url}")

                result = {
                    'check': 'Canonical URL',
                    'passed': is_https,
                    'canonical_url': canonical_url,
                    'uses_https': is_https
                }

                if not is_https:
                    self.results['warnings'].append('Canonical URL does not use HTTPS')
            else:
                print(f"   ⚠️  WARNING: No canonical URL found")
                result = {
                    'check': 'Canonical URL',
                    'passed': True,  # Not required, just recommended
                    'canonical_url': None,
                    'note': 'Canonical URL not present (optional)'
                }
                self.results['warnings'].append('No canonical URL defined')

            return True, result

        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            return False, {'check': 'Canonical URL', 'passed': False, 'error': str(e)}

    def check_noindex_violations(self) -> Tuple[bool, Dict]:
        """Verify no unintended noindex directives"""
        print("\n🚫 No-Index Violation Check")

        try:
            response = requests.get(BASE_URL, timeout=10)
            content = response.text.lower()

            # Check for noindex in meta robots
            has_noindex_meta = 'name="robots" content="noindex' in content
            has_noindex_header = response.headers.get('X-Robots-Tag', '').lower().find('noindex') != -1

            has_violation = has_noindex_meta or has_noindex_header

            status = '❌ FAIL' if has_violation else '✅ PASS'
            print(f"   {status}: No unintended noindex directives")

            if has_violation:
                print(f"      ⚠️  Found noindex directive on homepage")
                self.results['violations'].append('Homepage has noindex directive (blocks indexing)')

            result = {
                'check': 'No-Index Violations',
                'passed': not has_violation,
                'noindex_in_meta': has_noindex_meta,
                'noindex_in_header': has_noindex_header
            }

            return not has_violation, result

        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            return False, {'check': 'No-Index Violations', 'passed': False, 'error': str(e)}

    def check_crawl_budget_optimization(self) -> Tuple[bool, Dict]:
        """Verify crawl budget optimization"""
        print("\n⚡ Crawl Budget Optimization")

        try:
            # Check for crawl-delay in robots.txt
            robots_url = f'{BASE_URL}/robots.txt'
            response = requests.get(robots_url, timeout=10)

            if response.status_code == 200:
                content = response.text
                has_crawl_delay = 'Crawl-delay:' in content

                # Extract crawl delay value
                import re
                match = re.search(r'Crawl-delay:\s*(\d+)', content, re.IGNORECASE)
                crawl_delay = int(match.group(1)) if match else None

                # Optimal: 1-2 seconds
                is_optimal = crawl_delay in [1, 2] if crawl_delay else False

                status = '✅ PASS' if has_crawl_delay else '⚠️  INFO'
                print(f"   {status}: Crawl-delay {'present' if has_crawl_delay else 'not present'}")
                if crawl_delay:
                    print(f"      Value: {crawl_delay} second(s)")

                result = {
                    'check': 'Crawl Budget Optimization',
                    'passed': True,  # Not a failure if missing
                    'has_crawl_delay': has_crawl_delay,
                    'crawl_delay_value': crawl_delay,
                    'is_optimal': is_optimal
                }

                return True, result

        except Exception as e:
            print(f"   ⚠️  WARNING: {str(e)}")
            return True, {'check': 'Crawl Budget', 'passed': True, 'error': str(e)}

    def check_security_headers(self) -> Tuple[bool, Dict]:
        """Check for security headers"""
        print("\n🔐 Security Headers Check")

        try:
            response = requests.get(BASE_URL, timeout=10)
            headers = response.headers

            security_headers = {
                'X-Content-Type-Options': headers.get('X-Content-Type-Options'),
                'X-Frame-Options': headers.get('X-Frame-Options'),
                'X-XSS-Protection': headers.get('X-XSS-Protection'),
                'Content-Security-Policy': headers.get('Content-Security-Policy'),
                'Strict-Transport-Security': headers.get('Strict-Transport-Security')
            }

            present_count = sum(1 for v in security_headers.values() if v)
            total_count = len(security_headers)

            status = '✅ PASS' if present_count >= 3 else '⚠️  WARNING'
            print(f"   {status}: {present_count}/{total_count} security headers present")

            for header, value in security_headers.items():
                icon = '✅' if value else '⚠️ '
                print(f"      {icon} {header}")

            result = {
                'check': 'Security Headers',
                'passed': present_count >= 3,
                'headers': security_headers,
                'present_count': present_count,
                'total_count': total_count
            }

            if present_count < 3:
                self.results['warnings'].append(f'Only {present_count}/{total_count} security headers present')

            return present_count >= 3, result

        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            return False, {'check': 'Security Headers', 'passed': False, 'error': str(e)}

    def run(self):
        """Execute all compliance checks"""
        print("=" * 70)
        print("🛡️  LYDIAN AI - SECURITY & COMPLIANCE CHECK")
        print("=" * 70)
        print(f"⏰ Check time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
        print(f"🌐 Domain: {DOMAIN}")
        print(f"📍 Policy: White-Hat · 0 Violation · HTTPS Enforced")

        # Run all checks
        checks = [
            self.check_https_enforcement,
            self.check_hsts_header,
            self.check_robots_txt_compliance,
            self.check_sitemap_xml,
            self.check_canonical_urls,
            self.check_noindex_violations,
            self.check_crawl_budget_optimization,
            self.check_security_headers
        ]

        for check_func in checks:
            passed, result = check_func()
            check_name = result['check']
            self.results['checks'][check_name] = result

            if passed:
                self.results['passed'] += 1
            else:
                self.results['failed'] += 1

        # Save results
        with open(COMPLIANCE_REPORT, 'w') as f:
            json.dump(self.results, f, indent=2)

        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print compliance summary"""
        print("\n" + "=" * 70)
        print("📊 COMPLIANCE SUMMARY")
        print("=" * 70)

        total_checks = self.results['passed'] + self.results['failed']
        pass_rate = (self.results['passed'] / total_checks * 100) if total_checks > 0 else 0

        print(f"✅ Passed: {self.results['passed']}/{total_checks} ({pass_rate:.1f}%)")
        print(f"❌ Failed: {self.results['failed']}/{total_checks}")
        print(f"⚠️  Warnings: {len(self.results['warnings'])}")
        print(f"🚨 Violations: {len(self.results['violations'])}")

        if self.results['violations']:
            print(f"\n🚨 CRITICAL VIOLATIONS:")
            for i, violation in enumerate(self.results['violations'], 1):
                print(f"   {i}. {violation}")

        if self.results['warnings']:
            print(f"\n⚠️  WARNINGS:")
            for i, warning in enumerate(self.results['warnings'], 1):
                print(f"   {i}. {warning}")

        # Overall status
        if self.results['failed'] == 0 and len(self.results['violations']) == 0:
            print(f"\n✅ COMPLIANCE STATUS: PASSED")
            print(f"   All critical checks passed. Site is white-hat compliant.")
        else:
            print(f"\n⚠️  COMPLIANCE STATUS: NEEDS ATTENTION")
            print(f"   {self.results['failed']} check(s) failed, {len(self.results['violations'])} violation(s) found")

        print(f"\n📄 Report saved: {COMPLIANCE_REPORT}")
        print("=" * 70)

def main():
    """CLI entry point"""
    checker = SecurityComplianceCheck()
    checker.run()

    # Exit with error code if violations found
    if checker.results['violations']:
        sys.exit(1)

if __name__ == '__main__':
    main()
