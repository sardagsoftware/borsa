#!/usr/bin/env python3
"""
LyDian AI - Performance Monitoring System
Tracks feed performance, API response times, and system health

ITERATION 2 - Performance Monitoring
"""

import json
import os
import sys
import time
import requests
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import statistics


class Config:
    """Performance monitoring configuration"""

    # Endpoints to monitor
    ENDPOINTS = [
        {
            'name': 'JSON Feed',
            'url': 'https://www.ailydian.com/feed/ai_models.json',
            'type': 'json',
            'max_response_time': 2000  # ms
        },
        {
            'name': 'RSS Feed',
            'url': 'https://www.ailydian.com/feed/ai_models.rss',
            'type': 'xml',
            'max_response_time': 2000  # ms
        },
        {
            'name': 'llms.txt',
            'url': 'https://www.ailydian.com/llms.txt',
            'type': 'text',
            'max_response_time': 1000  # ms
        },
        {
            'name': 'Homepage',
            'url': 'https://www.ailydian.com/',
            'type': 'html',
            'max_response_time': 3000  # ms
        },
        {
            'name': 'API Health',
            'url': 'https://www.ailydian.com/api/health',
            'type': 'json',
            'max_response_time': 1000  # ms
        }
    ]

    # Performance thresholds
    THRESHOLDS = {
        'response_time_p50': 1000,    # ms
        'response_time_p95': 2000,    # ms
        'response_time_p99': 3000,    # ms
        'error_rate': 0.01,           # 1%
        'availability': 0.99,         # 99%
        'ttfb': 500,                  # Time to first byte (ms)
    }

    # Monitoring settings
    SAMPLES_PER_ENDPOINT = 5
    TIMEOUT = 10  # seconds
    ARTIFACTS_DIR = 'ops/artifacts'
    REPORT_FILE = 'ops/artifacts/performance_report.json'
    HISTORY_FILE = 'ops/artifacts/performance_history.json'


class PerformanceMonitor:
    """Monitor system performance and health"""

    def __init__(self):
        self.results = []
        self.summary = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'total_checks': 0,
            'passed': 0,
            'failed': 0,
            'warnings': 0
        }
        self.metrics = {}

    def log(self, level: str, message: str):
        """Log message with timestamp"""
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        print(f"[{timestamp}] [{level}] {message}")

    def measure_endpoint(self, endpoint: Dict) -> Dict:
        """Measure single endpoint performance"""
        self.log("INFO", f"Measuring {endpoint['name']}...")

        measurements = []
        errors = 0

        for i in range(Config.SAMPLES_PER_ENDPOINT):
            try:
                start_time = time.time()
                start_perf = time.perf_counter()

                response = requests.get(
                    endpoint['url'],
                    timeout=Config.TIMEOUT,
                    allow_redirects=True,
                    headers={'User-Agent': 'LyDian-Performance-Monitor/1.0'}
                )

                end_time = time.time()
                end_perf = time.perf_counter()

                # Calculate metrics
                response_time = (end_perf - start_perf) * 1000  # Convert to ms
                status_code = response.status_code
                content_length = len(response.content)

                # Calculate TTFB (time to first byte)
                # This is an approximation - real TTFB requires lower-level access
                ttfb = response.elapsed.total_seconds() * 1000

                measurement = {
                    'sample': i + 1,
                    'response_time': response_time,
                    'ttfb': ttfb,
                    'status_code': status_code,
                    'content_length': content_length,
                    'success': 200 <= status_code < 300
                }

                measurements.append(measurement)

                if not measurement['success']:
                    errors += 1

                # Small delay between samples
                time.sleep(0.5)

            except requests.exceptions.Timeout:
                errors += 1
                measurements.append({
                    'sample': i + 1,
                    'error': 'Timeout',
                    'success': False
                })

            except requests.exceptions.RequestException as e:
                errors += 1
                measurements.append({
                    'sample': i + 1,
                    'error': str(e),
                    'success': False
                })

        # Calculate statistics
        successful_measurements = [m for m in measurements if m.get('success', False)]

        if successful_measurements:
            response_times = [m['response_time'] for m in successful_measurements]
            ttfbs = [m['ttfb'] for m in successful_measurements]

            stats = {
                'min': min(response_times),
                'max': max(response_times),
                'mean': statistics.mean(response_times),
                'median': statistics.median(response_times),
                'p95': self._percentile(response_times, 95),
                'p99': self._percentile(response_times, 99),
                'ttfb_mean': statistics.mean(ttfbs),
                'ttfb_median': statistics.median(ttfbs),
                'error_rate': errors / Config.SAMPLES_PER_ENDPOINT,
                'availability': len(successful_measurements) / Config.SAMPLES_PER_ENDPOINT
            }
        else:
            stats = {
                'error_rate': 1.0,
                'availability': 0.0
            }

        # Evaluate thresholds
        status = self._evaluate_thresholds(endpoint, stats)

        result = {
            'name': endpoint['name'],
            'url': endpoint['url'],
            'type': endpoint['type'],
            'measurements': measurements,
            'stats': stats,
            'status': status,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

        self.results.append(result)
        self.summary['total_checks'] += 1

        if status == 'passed':
            self.summary['passed'] += 1
            self.log("INFO", f"✅ {endpoint['name']}: {stats.get('median', 0):.0f}ms (median)")
        elif status == 'warning':
            self.summary['warnings'] += 1
            self.log("WARN", f"⚠️  {endpoint['name']}: {stats.get('median', 0):.0f}ms (warning)")
        else:
            self.summary['failed'] += 1
            self.log("ERROR", f"❌ {endpoint['name']}: FAILED")

        return result

    def _percentile(self, data: List[float], percentile: int) -> float:
        """Calculate percentile"""
        if not data:
            return 0.0

        sorted_data = sorted(data)
        index = (percentile / 100) * (len(sorted_data) - 1)

        if index.is_integer():
            return sorted_data[int(index)]
        else:
            lower = sorted_data[int(index)]
            upper = sorted_data[int(index) + 1]
            return lower + (upper - lower) * (index - int(index))

    def _evaluate_thresholds(self, endpoint: Dict, stats: Dict) -> str:
        """Evaluate if metrics are within thresholds"""
        if stats.get('availability', 0) < Config.THRESHOLDS['availability']:
            return 'failed'

        if stats.get('error_rate', 1) > Config.THRESHOLDS['error_rate']:
            return 'failed'

        median_response = stats.get('median', 0)
        p95_response = stats.get('p95', 0)

        # Check against endpoint-specific threshold
        max_response_time = endpoint.get('max_response_time', 3000)

        if median_response > max_response_time:
            return 'failed'

        if p95_response > max_response_time * 1.5:
            return 'warning'

        # Check TTFB
        if stats.get('ttfb_median', 0) > Config.THRESHOLDS['ttfb']:
            return 'warning'

        return 'passed'

    def measure_all_endpoints(self):
        """Measure all configured endpoints"""
        self.log("INFO", "=" * 60)
        self.log("INFO", "LyDian AI - Performance Monitoring")
        self.log("INFO", "=" * 60)

        for endpoint in Config.ENDPOINTS:
            self.measure_endpoint(endpoint)

        self.log("INFO", "=" * 60)

    def calculate_metrics(self):
        """Calculate aggregate metrics"""
        all_response_times = []
        all_ttfbs = []

        for result in self.results:
            if result['stats'].get('median'):
                all_response_times.append(result['stats']['median'])
            if result['stats'].get('ttfb_median'):
                all_ttfbs.append(result['stats']['ttfb_median'])

        if all_response_times:
            self.metrics = {
                'overall_median_response': statistics.median(all_response_times),
                'overall_mean_response': statistics.mean(all_response_times),
                'overall_p95_response': self._percentile(all_response_times, 95),
                'overall_p99_response': self._percentile(all_response_times, 99),
                'overall_ttfb': statistics.median(all_ttfbs) if all_ttfbs else 0,
                'overall_availability': self.summary['passed'] / self.summary['total_checks'],
                'health_score': self._calculate_health_score()
            }

    def _calculate_health_score(self) -> float:
        """Calculate overall health score (0-100)"""
        if self.summary['total_checks'] == 0:
            return 0.0

        # Base score on passed tests
        base_score = (self.summary['passed'] / self.summary['total_checks']) * 100

        # Penalty for warnings
        warning_penalty = (self.summary['warnings'] / self.summary['total_checks']) * 10

        # Penalty for failures
        failure_penalty = (self.summary['failed'] / self.summary['total_checks']) * 30

        health_score = max(0, base_score - warning_penalty - failure_penalty)
        return round(health_score, 2)

    def save_report(self):
        """Save performance report"""
        os.makedirs(Config.ARTIFACTS_DIR, exist_ok=True)

        report = {
            'summary': self.summary,
            'metrics': self.metrics,
            'results': self.results,
            'thresholds': Config.THRESHOLDS
        }

        with open(Config.REPORT_FILE, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        self.log("INFO", f"Report saved to {Config.REPORT_FILE}")

        # Update history
        self._update_history()

    def _update_history(self):
        """Update performance history"""
        try:
            if os.path.exists(Config.HISTORY_FILE):
                with open(Config.HISTORY_FILE, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            else:
                history = {'entries': []}

            # Add current metrics to history
            history['entries'].append({
                'timestamp': self.summary['timestamp'],
                'health_score': self.metrics.get('health_score', 0),
                'overall_median_response': self.metrics.get('overall_median_response', 0),
                'overall_availability': self.metrics.get('overall_availability', 0),
                'passed': self.summary['passed'],
                'failed': self.summary['failed'],
                'warnings': self.summary['warnings']
            })

            # Keep only last 100 entries
            history['entries'] = history['entries'][-100:]

            with open(Config.HISTORY_FILE, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False)

        except Exception as e:
            self.log("ERROR", f"Failed to update history: {e}")

    def print_summary(self):
        """Print summary report"""
        self.log("INFO", "PERFORMANCE SUMMARY")
        self.log("INFO", "=" * 60)
        self.log("INFO", f"Total Checks: {self.summary['total_checks']}")
        self.log("INFO", f"✅ Passed: {self.summary['passed']}")
        self.log("INFO", f"⚠️  Warnings: {self.summary['warnings']}")
        self.log("INFO", f"❌ Failed: {self.summary['failed']}")
        self.log("INFO", "")
        self.log("INFO", "METRICS")
        self.log("INFO", "=" * 60)

        if self.metrics:
            self.log("INFO", f"Overall Median Response: {self.metrics.get('overall_median_response', 0):.0f}ms")
            self.log("INFO", f"Overall P95 Response: {self.metrics.get('overall_p95_response', 0):.0f}ms")
            self.log("INFO", f"Overall P99 Response: {self.metrics.get('overall_p99_response', 0):.0f}ms")
            self.log("INFO", f"Overall TTFB: {self.metrics.get('overall_ttfb', 0):.0f}ms")
            self.log("INFO", f"Overall Availability: {self.metrics.get('overall_availability', 0) * 100:.1f}%")
            self.log("INFO", f"Health Score: {self.metrics.get('health_score', 0):.1f}/100")

        self.log("INFO", "=" * 60)

        # Check if needs notification
        health_score = self.metrics.get('health_score', 100)
        if health_score < 70:
            self.log("WARN", "⚠️  Health score below 70 - consider investigating")

    def check_and_alert(self):
        """Check metrics and send alerts if needed"""
        try:
            # Import notification system
            from notification_system import NotificationSystem, Config as NotifConfig

            notifier = NotificationSystem()

            # Check health score
            health_score = self.metrics.get('health_score', 100)

            if health_score < 70:
                # Alert on degraded performance
                median_response = self.metrics.get('overall_median_response', 0)

                notifier.notify_performance_degraded(
                    metric='Health Score',
                    current_value=health_score,
                    threshold=70
                )

                self.log("INFO", "📧 Performance alert sent")

        except ImportError:
            self.log("WARN", "Notification system not available")
        except Exception as e:
            self.log("ERROR", f"Failed to send alert: {e}")

    def run(self, send_alerts: bool = False):
        """Run performance monitoring"""
        self.measure_all_endpoints()
        self.calculate_metrics()
        self.save_report()
        self.print_summary()

        if send_alerts:
            self.check_and_alert()

        return self.summary['failed'] == 0


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='LyDian AI Performance Monitor')
    parser.add_argument('--alerts', action='store_true', help='Send alerts on performance issues')
    parser.add_argument('--samples', type=int, default=5, help='Samples per endpoint')

    args = parser.parse_args()

    # Update config with args
    if args.samples:
        Config.SAMPLES_PER_ENDPOINT = args.samples

    # Run monitor
    monitor = PerformanceMonitor()
    success = monitor.run(send_alerts=args.alerts)

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
