#!/usr/bin/env python3
"""
LyDian AI - API Rate Limit Tracker
Monitors and tracks API rate limits across all external services

ITERATION 2 - Rate Limit Tracking
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional
import time


class Config:
    """Rate limit tracking configuration"""

    # API Services and their limits
    SERVICES = {
        'huggingface': {
            'name': 'HuggingFace API',
            'limits': {
                'requests_per_hour': 300,
                'requests_per_day': 5000
            },
            'warning_threshold': 0.8  # Alert at 80% usage
        },
        'google_search': {
            'name': 'Google Search Console',
            'limits': {
                'requests_per_day': 2000,
                'queries_per_day': 500
            },
            'warning_threshold': 0.8
        },
        'bing_webmaster': {
            'name': 'Bing Webmaster Tools',
            'limits': {
                'requests_per_day': 1000
            },
            'warning_threshold': 0.8
        },
        'yandex_webmaster': {
            'name': 'Yandex Webmaster',
            'limits': {
                'requests_per_day': 500
            },
            'warning_threshold': 0.8
        },
        'openai': {
            'name': 'OpenAI API',
            'limits': {
                'requests_per_minute': 60,
                'tokens_per_minute': 90000
            },
            'warning_threshold': 0.9
        },
        'anthropic': {
            'name': 'Anthropic API',
            'limits': {
                'requests_per_minute': 50,
                'tokens_per_minute': 100000
            },
            'warning_threshold': 0.9
        },
        'google_ai': {
            'name': 'Google AI API',
            'limits': {
                'requests_per_minute': 60,
                'requests_per_day': 15000
            },
            'warning_threshold': 0.8
        },
        'upstash_redis': {
            'name': 'Upstash Redis',
            'limits': {
                'commands_per_day': 10000,
                'bandwidth_mb_per_day': 1024
            },
            'warning_threshold': 0.8
        },
        'vercel': {
            'name': 'Vercel Platform',
            'limits': {
                'serverless_executions_per_day': 100000,
                'bandwidth_gb_per_month': 100,
                'edge_requests_per_day': 1000000
            },
            'warning_threshold': 0.8
        }
    }

    # Storage
    USAGE_FILE = 'ops/artifacts/rate_limit_usage.json'
    HISTORY_FILE = 'ops/artifacts/rate_limit_history.json'
    ARTIFACTS_DIR = 'ops/artifacts'


class RateLimitTracker:
    """Track and monitor API rate limits"""

    def __init__(self):
        self.usage_data = self._load_usage_data()
        self.alerts = []
        self.stats = {
            'services_tracked': len(Config.SERVICES),
            'alerts_generated': 0,
            'services_at_risk': 0,
            'services_ok': 0
        }

    def _load_usage_data(self) -> Dict:
        """Load existing usage data"""
        try:
            if os.path.exists(Config.USAGE_FILE):
                with open(Config.USAGE_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                return {'services': {}, 'last_reset': {}}
        except Exception as e:
            print(f"Error loading usage data: {e}")
            return {'services': {}, 'last_reset': {}}

    def _save_usage_data(self):
        """Save usage data to file"""
        os.makedirs(Config.ARTIFACTS_DIR, exist_ok=True)

        try:
            with open(Config.USAGE_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.usage_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving usage data: {e}")

    def log(self, level: str, message: str):
        """Log message with timestamp"""
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        print(f"[{timestamp}] [{level}] {message}")

    def record_usage(self, service: str, metric: str, count: int = 1):
        """Record API usage for a service"""
        if service not in Config.SERVICES:
            self.log("WARN", f"Unknown service: {service}")
            return

        # Initialize service data if not exists
        if service not in self.usage_data['services']:
            self.usage_data['services'][service] = {}

        # Initialize metric if not exists
        if metric not in self.usage_data['services'][service]:
            self.usage_data['services'][service][metric] = {
                'count': 0,
                'first_recorded': datetime.now(timezone.utc).isoformat(),
                'last_recorded': datetime.now(timezone.utc).isoformat()
            }

        # Update usage
        self.usage_data['services'][service][metric]['count'] += count
        self.usage_data['services'][service][metric]['last_recorded'] = datetime.now(timezone.utc).isoformat()

        # Save updated data
        self._save_usage_data()

        # Check if approaching limit
        self._check_threshold(service, metric)

    def _check_threshold(self, service: str, metric: str):
        """Check if usage is approaching threshold"""
        service_config = Config.SERVICES.get(service, {})
        limits = service_config.get('limits', {})
        warning_threshold = service_config.get('warning_threshold', 0.8)

        if metric not in limits:
            return

        current_usage = self.usage_data['services'][service][metric]['count']
        limit = limits[metric]
        usage_percentage = current_usage / limit

        if usage_percentage >= warning_threshold:
            alert = {
                'service': service,
                'metric': metric,
                'current_usage': current_usage,
                'limit': limit,
                'usage_percentage': usage_percentage * 100,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }

            self.alerts.append(alert)
            self.stats['alerts_generated'] += 1

            self.log("WARN", f"⚠️  {service_config['name']} - {metric}: {usage_percentage * 100:.1f}% used")

    def reset_period(self, service: str, period: str):
        """Reset usage for a time period (minute, hour, day)"""
        if service not in self.usage_data['services']:
            return

        # Determine which metrics to reset based on period
        service_config = Config.SERVICES.get(service, {})
        limits = service_config.get('limits', {})

        for metric, limit in limits.items():
            if period in metric:  # e.g., 'requests_per_minute' contains 'minute'
                if metric in self.usage_data['services'][service]:
                    self.usage_data['services'][service][metric]['count'] = 0
                    self.log("INFO", f"Reset {service} - {metric}")

        # Record reset time
        if 'last_reset' not in self.usage_data:
            self.usage_data['last_reset'] = {}

        self.usage_data['last_reset'][f"{service}_{period}"] = datetime.now(timezone.utc).isoformat()
        self._save_usage_data()

    def check_all_services(self) -> List[Dict]:
        """Check all services against their limits"""
        self.log("INFO", "=" * 60)
        self.log("INFO", "LyDian AI - Rate Limit Check")
        self.log("INFO", "=" * 60)

        service_reports = []

        for service_key, service_config in Config.SERVICES.items():
            service_name = service_config['name']
            limits = service_config['limits']
            warning_threshold = service_config['warning_threshold']

            # Get current usage
            usage = self.usage_data.get('services', {}).get(service_key, {})

            service_report = {
                'service': service_key,
                'name': service_name,
                'limits': limits,
                'usage': {},
                'status': 'ok',
                'at_risk_metrics': []
            }

            # Check each limit
            for metric, limit in limits.items():
                current_usage = usage.get(metric, {}).get('count', 0)
                usage_percentage = (current_usage / limit) * 100 if limit > 0 else 0

                service_report['usage'][metric] = {
                    'current': current_usage,
                    'limit': limit,
                    'percentage': usage_percentage,
                    'remaining': limit - current_usage
                }

                # Determine status
                if usage_percentage >= warning_threshold * 100:
                    service_report['status'] = 'warning'
                    service_report['at_risk_metrics'].append(metric)
                    self.stats['services_at_risk'] += 1

            if service_report['status'] == 'ok':
                self.stats['services_ok'] += 1

            service_reports.append(service_report)

            # Log status
            status_icon = '✅' if service_report['status'] == 'ok' else '⚠️'
            self.log("INFO", f"{status_icon} {service_name}: {service_report['status'].upper()}")

            for metric, data in service_report['usage'].items():
                self.log("INFO", f"  - {metric}: {data['current']}/{data['limit']} ({data['percentage']:.1f}%)")

        self.log("INFO", "=" * 60)

        return service_reports

    def generate_report(self) -> Dict:
        """Generate comprehensive rate limit report"""
        service_reports = self.check_all_services()

        report = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'stats': self.stats,
            'services': service_reports,
            'alerts': self.alerts,
            'recommendations': self._generate_recommendations(service_reports)
        }

        # Save report
        report_file = 'ops/artifacts/rate_limit_report.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        self.log("INFO", f"Report saved to {report_file}")

        # Update history
        self._update_history(report)

        return report

    def _generate_recommendations(self, service_reports: List[Dict]) -> List[str]:
        """Generate recommendations based on usage patterns"""
        recommendations = []

        for report in service_reports:
            if report['status'] == 'warning':
                for metric in report['at_risk_metrics']:
                    usage_data = report['usage'][metric]

                    if usage_data['percentage'] >= 90:
                        recommendations.append(
                            f"URGENT: {report['name']} - {metric} is at {usage_data['percentage']:.1f}%. "
                            f"Consider upgrading plan or reducing usage immediately."
                        )
                    elif usage_data['percentage'] >= 80:
                        recommendations.append(
                            f"WARNING: {report['name']} - {metric} is at {usage_data['percentage']:.1f}%. "
                            f"Monitor closely and plan for increased capacity."
                        )

        if not recommendations:
            recommendations.append("All services are operating within safe limits. No action needed.")

        return recommendations

    def _update_history(self, report: Dict):
        """Update historical tracking data"""
        try:
            if os.path.exists(Config.HISTORY_FILE):
                with open(Config.HISTORY_FILE, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            else:
                history = {'entries': []}

            # Add summary to history
            history['entries'].append({
                'timestamp': report['timestamp'],
                'services_ok': report['stats']['services_ok'],
                'services_at_risk': report['stats']['services_at_risk'],
                'alerts': len(report['alerts'])
            })

            # Keep only last 100 entries
            history['entries'] = history['entries'][-100:]

            with open(Config.HISTORY_FILE, 'w', encoding='utf-8') as f:
                json.dump(history, f, indent=2, ensure_ascii=False)

        except Exception as e:
            self.log("ERROR", f"Failed to update history: {e}")

    def send_alerts(self):
        """Send notifications for rate limit alerts"""
        if not self.alerts:
            return

        try:
            from notification_system import NotificationSystem

            notifier = NotificationSystem()

            # Send alert for services at risk
            title = f"Rate Limit Alert: {len(self.alerts)} Services at Risk"
            message = "The following services are approaching their rate limits:\n\n"

            for alert in self.alerts:
                message += f"- {Config.SERVICES[alert['service']]['name']}: "
                message += f"{alert['metric']} at {alert['usage_percentage']:.1f}%\n"

            notifier.send_all(title, message, 'warning')

            self.log("INFO", "📧 Rate limit alerts sent")

        except ImportError:
            self.log("WARN", "Notification system not available")
        except Exception as e:
            self.log("ERROR", f"Failed to send alerts: {e}")

    def print_summary(self):
        """Print summary report"""
        self.log("INFO", "SUMMARY")
        self.log("INFO", "=" * 60)
        self.log("INFO", f"Services Tracked: {self.stats['services_tracked']}")
        self.log("INFO", f"✅ Services OK: {self.stats['services_ok']}")
        self.log("INFO", f"⚠️  Services at Risk: {self.stats['services_at_risk']}")
        self.log("INFO", f"🚨 Alerts Generated: {self.stats['alerts_generated']}")
        self.log("INFO", "=" * 60)

    def run(self, send_notifications: bool = False):
        """Run rate limit check"""
        report = self.generate_report()
        self.print_summary()

        if send_notifications and self.alerts:
            self.send_alerts()

        return len(self.alerts) == 0


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='LyDian AI Rate Limit Tracker')
    parser.add_argument('--record', nargs=3, metavar=('SERVICE', 'METRIC', 'COUNT'),
                       help='Record usage: --record huggingface requests_per_hour 10')
    parser.add_argument('--reset', nargs=2, metavar=('SERVICE', 'PERIOD'),
                       help='Reset period: --reset huggingface hour')
    parser.add_argument('--check', action='store_true', help='Check all services')
    parser.add_argument('--alerts', action='store_true', help='Send alerts for at-risk services')

    args = parser.parse_args()

    tracker = RateLimitTracker()

    if args.record:
        service, metric, count = args.record
        tracker.record_usage(service, metric, int(count))
        tracker.log("INFO", f"✅ Recorded {count} {metric} for {service}")

    elif args.reset:
        service, period = args.reset
        tracker.reset_period(service, period)
        tracker.log("INFO", f"✅ Reset {period} period for {service}")

    elif args.check:
        success = tracker.run(send_notifications=args.alerts)
        sys.exit(0 if success else 1)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
