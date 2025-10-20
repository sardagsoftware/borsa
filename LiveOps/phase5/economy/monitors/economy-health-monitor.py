#!/usr/bin/env python3
"""
Economy Health Monitor
Real-time monitoring with auto-alerts and auto-balancing recommendations
"""

import sys
import json
from datetime import datetime, timezone


class EconomyHealthMonitor:
    """Monitor economy metrics and trigger alerts"""

    def __init__(self):
        self.thresholds = {
            'inflation_index': {'target': 1.00, 'warning': 1.10, 'critical': 1.15},
            'earn_spend_ratio': {'target': 1.2, 'min': 1.0, 'max': 1.5},
            'fraud_indicators': {'target': 0, 'warning': 5, 'critical': 20}
        }

    def check_inflation(self, current_index: float) -> dict:
        """Check inflation index against thresholds"""
        status = 'ok'
        if current_index >= self.thresholds['inflation_index']['critical']:
            status = 'critical'
        elif current_index >= self.thresholds['inflation_index']['warning']:
            status = 'warning'

        return {
            'metric': 'inflation_index',
            'current': current_index,
            'target': self.thresholds['inflation_index']['target'],
            'status': status,
            'recommendation': self._get_inflation_recommendation(current_index, status)
        }

    def _get_inflation_recommendation(self, index: float, status: str) -> str:
        if status == 'critical':
            return "IMMEDIATE ACTION: Reduce daily earn limits by 20%, increase vendor prices by 10%"
        elif status == 'warning':
            return "MONITOR CLOSELY: Consider reducing drop rates for common items"
        return "Economy stable"

    def check_earn_spend_ratio(self, ratio: float) -> dict:
        """Check earn/spend ratio"""
        status = 'ok'
        if ratio < self.thresholds['earn_spend_ratio']['min'] or ratio > self.thresholds['earn_spend_ratio']['max']:
            status = 'warning'

        return {
            'metric': 'earn_spend_ratio',
            'current': ratio,
            'target': self.thresholds['earn_spend_ratio']['target'],
            'status': status,
            'recommendation': self._get_ratio_recommendation(ratio, status)
        }

    def _get_ratio_recommendation(self, ratio: float, status: str) -> str:
        if ratio > self.thresholds['earn_spend_ratio']['max']:
            return "Players earning too much - reduce drop rates or increase vendor prices"
        elif ratio < self.thresholds['earn_spend_ratio']['min']:
            return "Players earning too little - increase drop rates or reduce vendor prices"
        return "Earn/spend ratio healthy"

    def check_fraud_indicators(self, count: int) -> dict:
        """Check fraud indicators"""
        status = 'ok'
        if count >= self.thresholds['fraud_indicators']['critical']:
            status = 'critical'
        elif count >= self.thresholds['fraud_indicators']['warning']:
            status = 'warning'

        return {
            'metric': 'fraud_indicators',
            'current': count,
            'status': status,
            'recommendation': self._get_fraud_recommendation(count, status)
        }

    def _get_fraud_recommendation(self, count: int, status: str) -> str:
        if status == 'critical':
            return "SECURITY ALERT: Investigate suspicious accounts immediately"
        elif status == 'warning':
            return "Monitor suspicious patterns, prepare ban list"
        return "No fraud detected"

    def generate_report(self, metrics: dict) -> str:
        """Generate monitoring report"""
        report = f"""# Economy Health Monitor Report
**Timestamp**: {datetime.now(timezone.utc).isoformat()}

## Metrics Status

"""
        for metric_name, metric_data in metrics.items():
            status_emoji = {'ok': '✅', 'warning': '⚠️', 'critical': '🚨'}
            report += f"""### {metric_name.replace('_', ' ').title()}
- **Status**: {status_emoji.get(metric_data['status'], '❓')} {metric_data['status'].upper()}
- **Current**: {metric_data['current']}
- **Target**: {metric_data.get('target', 'N/A')}
- **Recommendation**: {metric_data['recommendation']}

"""
        return report


def main():
    monitor = EconomyHealthMonitor()

    # Example usage
    inflation_check = monitor.check_inflation(1.12)
    ratio_check = monitor.check_earn_spend_ratio(1.8)
    fraud_check = monitor.check_fraud_indicators(3)

    metrics = {
        'inflation_index': inflation_check,
        'earn_spend_ratio': ratio_check,
        'fraud_indicators': fraud_check
    }

    report = monitor.generate_report(metrics)
    print(report)


if __name__ == '__main__':
    main()
