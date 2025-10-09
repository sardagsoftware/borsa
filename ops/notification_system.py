#!/usr/bin/env python3
"""
LyDian AI - Notification System
Sends alerts via Slack, Email, and Discord for system events

ITERATION 2 - Notification & Alerting
"""

import json
import os
import sys
import requests
from datetime import datetime, timezone
from typing import Dict, List, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


class Config:
    """Notification configuration"""

    # Slack
    SLACK_WEBHOOK_URL = os.getenv('SLACK_WEBHOOK_URL', '')
    SLACK_CHANNEL = os.getenv('SLACK_CHANNEL', '#lydian-alerts')

    # Discord
    DISCORD_WEBHOOK_URL = os.getenv('DISCORD_WEBHOOK_URL', '')

    # Email (SMTP)
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USER = os.getenv('SMTP_USER', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    EMAIL_FROM = os.getenv('EMAIL_FROM', 'noreply@ailydian.com')
    EMAIL_TO = os.getenv('EMAIL_TO', '').split(',')

    # Notification levels
    LEVEL_INFO = 'info'
    LEVEL_WARNING = 'warning'
    LEVEL_ERROR = 'error'
    LEVEL_CRITICAL = 'critical'

    # Icons
    ICONS = {
        'info': 'ℹ️',
        'warning': '⚠️',
        'error': '❌',
        'critical': '🚨'
    }

    # Colors (for Slack/Discord)
    COLORS = {
        'info': '#36a64f',      # Green
        'warning': '#ff9800',   # Orange
        'error': '#f44336',     # Red
        'critical': '#9c27b0'   # Purple
    }


class NotificationSystem:
    """Send notifications to multiple channels"""

    def __init__(self):
        self.stats = {
            'slack_sent': 0,
            'discord_sent': 0,
            'email_sent': 0,
            'failures': 0
        }
        self.enabled_channels = self._check_enabled_channels()

    def _check_enabled_channels(self) -> Dict[str, bool]:
        """Check which notification channels are configured"""
        return {
            'slack': bool(Config.SLACK_WEBHOOK_URL),
            'discord': bool(Config.DISCORD_WEBHOOK_URL),
            'email': bool(Config.SMTP_USER and Config.SMTP_PASSWORD and Config.EMAIL_TO)
        }

    def log(self, message: str):
        """Log message"""
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        print(f"[{timestamp}] {message}")

    def send_slack(self, title: str, message: str, level: str = Config.LEVEL_INFO, fields: Optional[List[Dict]] = None) -> bool:
        """Send notification to Slack"""
        if not self.enabled_channels['slack']:
            return False

        try:
            # Build Slack attachment
            attachment = {
                'color': Config.COLORS.get(level, Config.COLORS['info']),
                'title': f"{Config.ICONS.get(level, '')} {title}",
                'text': message,
                'footer': 'LyDian AI',
                'footer_icon': 'https://www.ailydian.com/icon-192.png',
                'ts': int(datetime.now(timezone.utc).timestamp())
            }

            if fields:
                attachment['fields'] = fields

            payload = {
                'channel': Config.SLACK_CHANNEL,
                'username': 'LyDian AI Bot',
                'icon_url': 'https://www.ailydian.com/icon-192.png',
                'attachments': [attachment]
            }

            response = requests.post(
                Config.SLACK_WEBHOOK_URL,
                json=payload,
                timeout=10
            )

            if response.status_code == 200:
                self.stats['slack_sent'] += 1
                self.log(f"✅ Slack notification sent: {title}")
                return True
            else:
                self.log(f"❌ Slack failed: HTTP {response.status_code}")
                self.stats['failures'] += 1
                return False

        except Exception as e:
            self.log(f"❌ Slack error: {e}")
            self.stats['failures'] += 1
            return False

    def send_discord(self, title: str, message: str, level: str = Config.LEVEL_INFO, fields: Optional[List[Dict]] = None) -> bool:
        """Send notification to Discord"""
        if not self.enabled_channels['discord']:
            return False

        try:
            # Build Discord embed
            embed = {
                'title': f"{Config.ICONS.get(level, '')} {title}",
                'description': message,
                'color': int(Config.COLORS.get(level, Config.COLORS['info']).replace('#', ''), 16),
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'footer': {
                    'text': 'LyDian AI',
                    'icon_url': 'https://www.ailydian.com/icon-192.png'
                }
            }

            if fields:
                embed['fields'] = [
                    {'name': f['title'], 'value': f['value'], 'inline': f.get('short', False)}
                    for f in fields
                ]

            payload = {
                'username': 'LyDian AI Bot',
                'avatar_url': 'https://www.ailydian.com/icon-192.png',
                'embeds': [embed]
            }

            response = requests.post(
                Config.DISCORD_WEBHOOK_URL,
                json=payload,
                timeout=10
            )

            if response.status_code in [200, 204]:
                self.stats['discord_sent'] += 1
                self.log(f"✅ Discord notification sent: {title}")
                return True
            else:
                self.log(f"❌ Discord failed: HTTP {response.status_code}")
                self.stats['failures'] += 1
                return False

        except Exception as e:
            self.log(f"❌ Discord error: {e}")
            self.stats['failures'] += 1
            return False

    def send_email(self, subject: str, message: str, level: str = Config.LEVEL_INFO) -> bool:
        """Send email notification via SMTP"""
        if not self.enabled_channels['email']:
            return False

        try:
            # Build email
            msg = MIMEMultipart('alternative')
            msg['From'] = Config.EMAIL_FROM
            msg['To'] = ', '.join(Config.EMAIL_TO)
            msg['Subject'] = f"{Config.ICONS.get(level, '')} {subject}"

            # Create HTML version
            html_content = f"""
            <html>
              <head>
                <style>
                  body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                  .header {{ background-color: {Config.COLORS.get(level, '#36a64f')}; color: white; padding: 20px; }}
                  .content {{ padding: 20px; }}
                  .footer {{ background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }}
                </style>
              </head>
              <body>
                <div class="header">
                  <h2>{Config.ICONS.get(level, '')} {subject}</h2>
                </div>
                <div class="content">
                  <p>{message.replace(chr(10), '<br>')}</p>
                </div>
                <div class="footer">
                  <p>LyDian AI - Global AI Platform<br>
                  <a href="https://www.ailydian.com">www.ailydian.com</a></p>
                </div>
              </body>
            </html>
            """

            # Attach HTML
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)

            # Send via SMTP
            with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(Config.SMTP_USER, Config.SMTP_PASSWORD)
                server.send_message(msg)

            self.stats['email_sent'] += 1
            self.log(f"✅ Email sent to {len(Config.EMAIL_TO)} recipients: {subject}")
            return True

        except Exception as e:
            self.log(f"❌ Email error: {e}")
            self.stats['failures'] += 1
            return False

    def send_all(self, title: str, message: str, level: str = Config.LEVEL_INFO, fields: Optional[List[Dict]] = None) -> Dict[str, bool]:
        """Send notification to all enabled channels"""
        results = {
            'slack': self.send_slack(title, message, level, fields),
            'discord': self.send_discord(title, message, level, fields),
            'email': self.send_email(title, message, level)
        }

        return results

    def notify_validation_failed(self, feed_type: str, error_count: int, errors: List[str]) -> bool:
        """Send notification when feed validation fails"""
        title = f"Feed Validation Failed: {feed_type}"
        message = f"Feed validation for {feed_type} failed with {error_count} errors.\n\n"
        message += "Top errors:\n" + "\n".join(f"- {e}" for e in errors[:5])

        fields = [
            {'title': 'Feed Type', 'value': feed_type, 'short': True},
            {'title': 'Error Count', 'value': str(error_count), 'short': True},
            {'title': 'Status', 'value': '❌ FAILED', 'short': True}
        ]

        results = self.send_all(title, message, Config.LEVEL_ERROR, fields)
        return any(results.values())

    def notify_deployment_failed(self, reason: str, details: str = '') -> bool:
        """Send notification when deployment fails"""
        title = "Deployment Failed"
        message = f"Deployment to production failed.\n\nReason: {reason}"

        if details:
            message += f"\n\nDetails:\n{details}"

        fields = [
            {'title': 'Environment', 'value': 'Production', 'short': True},
            {'title': 'Status', 'value': '❌ FAILED', 'short': True}
        ]

        results = self.send_all(title, message, Config.LEVEL_CRITICAL, fields)
        return any(results.values())

    def notify_feed_updated(self, new_model_count: int, models: List[Dict]) -> bool:
        """Send notification when feeds are updated with new models"""
        title = f"Feed Updated: {new_model_count} New Models Added"
        message = f"Successfully added {new_model_count} new AI models to the feed.\n\n"
        message += "New models:\n" + "\n".join(
            f"- {m['name']} ({m['org']}) - {m.get('model_type', 'unknown')}"
            for m in models[:10]
        )

        if len(models) > 10:
            message += f"\n... and {len(models) - 10} more"

        fields = [
            {'title': 'New Models', 'value': str(new_model_count), 'short': True},
            {'title': 'Total Models', 'value': str(new_model_count + 30), 'short': True},
            {'title': 'Status', 'value': '✅ SUCCESS', 'short': True}
        ]

        results = self.send_all(title, message, Config.LEVEL_INFO, fields)
        return any(results.values())

    def notify_security_audit_failed(self, check_count: int, failed_checks: List[str]) -> bool:
        """Send notification when security audit fails"""
        title = f"Security Audit Failed: {len(failed_checks)} Issues"
        message = f"Security audit detected {len(failed_checks)} issues.\n\n"
        message += "Failed checks:\n" + "\n".join(f"- {c}" for c in failed_checks[:5])

        fields = [
            {'title': 'Total Checks', 'value': str(check_count), 'short': True},
            {'title': 'Failed', 'value': str(len(failed_checks)), 'short': True},
            {'title': 'Status', 'value': '❌ FAILED', 'short': True}
        ]

        results = self.send_all(title, message, Config.LEVEL_CRITICAL, fields)
        return any(results.values())

    def notify_performance_degraded(self, metric: str, current_value: float, threshold: float) -> bool:
        """Send notification when performance degrades"""
        title = f"Performance Alert: {metric}"
        message = f"Performance metric '{metric}' has degraded.\n\n"
        message += f"Current: {current_value}\n"
        message += f"Threshold: {threshold}\n"
        message += f"Exceeded by: {((current_value / threshold) - 1) * 100:.1f}%"

        fields = [
            {'title': 'Metric', 'value': metric, 'short': True},
            {'title': 'Current', 'value': f"{current_value:.2f}", 'short': True},
            {'title': 'Threshold', 'value': f"{threshold:.2f}", 'short': True}
        ]

        results = self.send_all(title, message, Config.LEVEL_WARNING, fields)
        return any(results.values())

    def test_all_channels(self) -> Dict[str, bool]:
        """Test all notification channels"""
        self.log("🧪 Testing all notification channels...")

        title = "LyDian AI - Notification System Test"
        message = "This is a test notification from the LyDian AI notification system.\n\n"
        message += f"Timestamp: {datetime.now(timezone.utc).isoformat()}\n"
        message += "If you received this, the notification system is working correctly!"

        fields = [
            {'title': 'Test Type', 'value': 'System Check', 'short': True},
            {'title': 'Status', 'value': '✅ OPERATIONAL', 'short': True}
        ]

        results = self.send_all(title, message, Config.LEVEL_INFO, fields)

        self.log("\nTest Results:")
        self.log(f"  Slack: {'✅ Sent' if results['slack'] else '❌ Failed or Not Configured'}")
        self.log(f"  Discord: {'✅ Sent' if results['discord'] else '❌ Failed or Not Configured'}")
        self.log(f"  Email: {'✅ Sent' if results['email'] else '❌ Failed or Not Configured'}")

        return results

    def get_stats(self) -> Dict:
        """Get notification statistics"""
        return {
            'enabled_channels': self.enabled_channels,
            'stats': self.stats
        }


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='LyDian AI Notification System')
    parser.add_argument('--test', action='store_true', help='Test all notification channels')
    parser.add_argument('--channel', choices=['slack', 'discord', 'email', 'all'], default='all', help='Channel to test')
    parser.add_argument('--title', type=str, help='Custom notification title')
    parser.add_argument('--message', type=str, help='Custom notification message')
    parser.add_argument('--level', choices=['info', 'warning', 'error', 'critical'], default='info', help='Notification level')

    args = parser.parse_args()

    notifier = NotificationSystem()

    if args.test:
        # Test all channels
        results = notifier.test_all_channels()
        success = any(results.values())
        sys.exit(0 if success else 1)

    elif args.title and args.message:
        # Send custom notification
        if args.channel == 'all':
            results = notifier.send_all(args.title, args.message, args.level)
        elif args.channel == 'slack':
            results = {'slack': notifier.send_slack(args.title, args.message, args.level)}
        elif args.channel == 'discord':
            results = {'discord': notifier.send_discord(args.title, args.message, args.level)}
        elif args.channel == 'email':
            results = {'email': notifier.send_email(args.title, args.message, args.level)}

        success = any(results.values())
        sys.exit(0 if success else 1)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
