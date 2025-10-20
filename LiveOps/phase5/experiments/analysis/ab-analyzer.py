#!/usr/bin/env python3
"""
A/B Experiment Analysis Framework
Statistical analysis and winner determination for LiveOps experiments
"""

import os
import sys
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse

try:
    import numpy as np
    from scipy import stats
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    print("Warning: scipy not available. Statistical tests will be limited.")
    print("Install with: pip install numpy scipy")


class ABExperimentAnalyzer:
    """Analyze A/B experiment results with statistical rigor"""

    def __init__(self, experiment_id: str, data: Dict):
        self.experiment_id = experiment_id
        self.data = data
        self.results = {}

    def calculate_sample_size(self, baseline_rate: float, mde: float, alpha: float = 0.05, power: float = 0.8) -> int:
        """
        Calculate required sample size for A/B test

        Args:
            baseline_rate: Current conversion rate (e.g., 0.40 for 40%)
            mde: Minimum detectable effect (e.g., 0.05 for 5% relative change)
            alpha: Significance level (typically 0.05)
            power: Statistical power (typically 0.8)

        Returns:
            Required sample size per variant
        """
        if not SCIPY_AVAILABLE:
            # Rough approximation without scipy
            return int((16 * (baseline_rate * (1 - baseline_rate))) / (mde ** 2))

        # Standard normal quantiles
        z_alpha = stats.norm.ppf(1 - alpha / 2)
        z_beta = stats.norm.ppf(power)

        p1 = baseline_rate
        p2 = baseline_rate * (1 + mde)

        # Pooled proportion
        p_pooled = (p1 + p2) / 2

        # Sample size calculation
        n = (
            (z_alpha * math.sqrt(2 * p_pooled * (1 - p_pooled)) +
             z_beta * math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
        ) / ((p1 - p2) ** 2)

        return int(math.ceil(n))

    def two_proportion_ztest(self, control_successes: int, control_total: int,
                            variant_successes: int, variant_total: int) -> Tuple[float, float]:
        """
        Two-proportion Z-test

        Returns:
            (z_score, p_value)
        """
        if not SCIPY_AVAILABLE:
            return None, None

        p1 = control_successes / control_total
        p2 = variant_successes / variant_total

        # Pooled proportion
        p_pooled = (control_successes + variant_successes) / (control_total + variant_total)

        # Standard error
        se = math.sqrt(p_pooled * (1 - p_pooled) * (1/control_total + 1/variant_total))

        # Z-score
        z_score = (p2 - p1) / se if se > 0 else 0

        # Two-tailed p-value
        p_value = 2 * (1 - stats.norm.cdf(abs(z_score)))

        return z_score, p_value

    def welch_ttest(self, control_values: List[float], variant_values: List[float]) -> Tuple[float, float]:
        """
        Welch's t-test (unequal variances)

        Returns:
            (t_statistic, p_value)
        """
        if not SCIPY_AVAILABLE:
            return None, None

        t_stat, p_value = stats.ttest_ind(control_values, variant_values, equal_var=False)
        return t_stat, p_value

    def calculate_effect_size(self, control_rate: float, variant_rate: float) -> Dict[str, float]:
        """
        Calculate effect size metrics

        Returns:
            Dictionary with absolute_lift, relative_lift, and cohen_h
        """
        absolute_lift = variant_rate - control_rate
        relative_lift = (absolute_lift / control_rate) * 100 if control_rate > 0 else 0

        # Cohen's h for proportions
        if SCIPY_AVAILABLE:
            cohen_h = 2 * (math.asin(math.sqrt(variant_rate)) - math.asin(math.sqrt(control_rate)))
        else:
            cohen_h = None

        return {
            'absolute_lift': absolute_lift,
            'relative_lift': relative_lift,
            'cohen_h': cohen_h
        }

    def confidence_interval(self, successes: int, total: int, confidence: float = 0.95) -> Tuple[float, float]:
        """
        Calculate confidence interval for proportion

        Returns:
            (lower_bound, upper_bound)
        """
        if total == 0:
            return (0.0, 0.0)

        p = successes / total

        if not SCIPY_AVAILABLE:
            # Simple normal approximation
            z = 1.96  # 95% CI
            se = math.sqrt(p * (1 - p) / total)
            return (max(0, p - z * se), min(1, p + z * se))

        # Wilson score interval (better for small samples)
        z = stats.norm.ppf(1 - (1 - confidence) / 2)
        denominator = 1 + z**2 / total
        center = (p + z**2 / (2 * total)) / denominator
        margin = z * math.sqrt(p * (1 - p) / total + z**2 / (4 * total**2)) / denominator

        return (max(0, center - margin), min(1, center + margin))

    def analyze_experiment(self, control_data: Dict, variant_data: Dict,
                          metric_type: str = 'proportion') -> Dict:
        """
        Analyze A/B experiment results

        Args:
            control_data: {'successes': int, 'total': int} or {'values': List[float]}
            variant_data: {'successes': int, 'total': int} or {'values': List[float]}
            metric_type: 'proportion' or 'continuous'

        Returns:
            Analysis results dictionary
        """
        results = {
            'experiment_id': self.experiment_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'metric_type': metric_type
        }

        if metric_type == 'proportion':
            # Proportion-based metrics (conversion rate, retention, etc.)
            control_successes = control_data['successes']
            control_total = control_data['total']
            variant_successes = variant_data['successes']
            variant_total = variant_data['total']

            control_rate = control_successes / control_total if control_total > 0 else 0
            variant_rate = variant_successes / variant_total if variant_total > 0 else 0

            # Statistical test
            z_score, p_value = self.two_proportion_ztest(
                control_successes, control_total,
                variant_successes, variant_total
            )

            # Effect size
            effect_size = self.calculate_effect_size(control_rate, variant_rate)

            # Confidence intervals
            control_ci = self.confidence_interval(control_successes, control_total)
            variant_ci = self.confidence_interval(variant_successes, variant_total)

            results.update({
                'control': {
                    'rate': control_rate,
                    'successes': control_successes,
                    'total': control_total,
                    'confidence_interval': control_ci
                },
                'variant': {
                    'rate': variant_rate,
                    'successes': variant_successes,
                    'total': variant_total,
                    'confidence_interval': variant_ci
                },
                'statistics': {
                    'z_score': z_score,
                    'p_value': p_value,
                    'significant': p_value < 0.05 if p_value else None,
                    'effect_size': effect_size
                }
            })

        elif metric_type == 'continuous':
            # Continuous metrics (session duration, revenue, etc.)
            control_values = control_data['values']
            variant_values = variant_data['values']

            control_mean = np.mean(control_values) if SCIPY_AVAILABLE else sum(control_values) / len(control_values)
            variant_mean = np.mean(variant_values) if SCIPY_AVAILABLE else sum(variant_values) / len(variant_values)

            # Statistical test
            t_stat, p_value = self.welch_ttest(control_values, variant_values)

            results.update({
                'control': {
                    'mean': control_mean,
                    'n': len(control_values)
                },
                'variant': {
                    'mean': variant_mean,
                    'n': len(variant_values)
                },
                'statistics': {
                    't_statistic': t_stat,
                    'p_value': p_value,
                    'significant': p_value < 0.05 if p_value else None,
                    'absolute_lift': variant_mean - control_mean,
                    'relative_lift': ((variant_mean - control_mean) / control_mean * 100) if control_mean > 0 else 0
                }
            })

        return results

    def determine_winner(self, analysis_results: Dict, guardrails: Optional[Dict] = None) -> Dict:
        """
        Determine experiment winner with guardrails

        Args:
            analysis_results: Results from analyze_experiment()
            guardrails: Optional guardrail metrics (e.g., {'inflation_index': 1.15})

        Returns:
            Winner determination with recommendation
        """
        p_value = analysis_results['statistics']['p_value']
        significant = analysis_results['statistics']['significant']

        decision = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'experiment_id': self.experiment_id,
            'winner': None,
            'confidence': None,
            'recommendation': None,
            'guardrails_violated': False,
            'reasons': []
        }

        # Check guardrails first
        if guardrails:
            for metric, threshold in guardrails.items():
                if metric in analysis_results and analysis_results[metric] > threshold:
                    decision['guardrails_violated'] = True
                    decision['reasons'].append(f"Guardrail violation: {metric} exceeds {threshold}")

        if decision['guardrails_violated']:
            decision['winner'] = 'control'
            decision['recommendation'] = 'ROLLBACK'
            decision['reasons'].append("Revert to control due to guardrail violations")
            return decision

        # Statistical significance check
        if not significant:
            decision['winner'] = 'inconclusive'
            decision['confidence'] = 'low'
            decision['recommendation'] = 'CONTINUE_MONITORING'
            decision['reasons'].append(f"Not statistically significant (p={p_value:.4f})")
            return decision

        # Determine winner based on metric improvement
        if analysis_results['metric_type'] == 'proportion':
            variant_rate = analysis_results['variant']['rate']
            control_rate = analysis_results['control']['rate']

            if variant_rate > control_rate:
                decision['winner'] = 'variant'
                decision['confidence'] = 'high' if p_value < 0.01 else 'medium'
                decision['recommendation'] = 'ROLLOUT'
                decision['reasons'].append(f"Variant shows significant improvement ({analysis_results['statistics']['effect_size']['relative_lift']:.2f}% lift)")
            else:
                decision['winner'] = 'control'
                decision['confidence'] = 'high' if p_value < 0.01 else 'medium'
                decision['recommendation'] = 'KEEP_CONTROL'
                decision['reasons'].append("Control performs better")

        elif analysis_results['metric_type'] == 'continuous':
            variant_mean = analysis_results['variant']['mean']
            control_mean = analysis_results['control']['mean']

            if variant_mean > control_mean:
                decision['winner'] = 'variant'
                decision['confidence'] = 'high' if p_value < 0.01 else 'medium'
                decision['recommendation'] = 'ROLLOUT'
                decision['reasons'].append(f"Variant shows significant improvement ({analysis_results['statistics']['relative_lift']:.2f}% lift)")
            else:
                decision['winner'] = 'control'
                decision['confidence'] = 'high' if p_value < 0.01 else 'medium'
                decision['recommendation'] = 'KEEP_CONTROL'
                decision['reasons'].append("Control performs better")

        return decision

    def generate_report(self, analysis_results: Dict, winner_decision: Dict) -> str:
        """Generate markdown report"""
        report = f"""# A/B Experiment Analysis Report

**Experiment ID**: {self.experiment_id}
**Analysis Date**: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
**Metric Type**: {analysis_results['metric_type']}

---

## Results Summary

### Control Group
- Rate/Mean: {analysis_results['control'].get('rate', analysis_results['control'].get('mean')):.4f}
- Sample Size: {analysis_results['control'].get('total', analysis_results['control'].get('n'))}
{f"- 95% CI: [{analysis_results['control'].get('confidence_interval', ['N/A', 'N/A'])[0]:.4f}, {analysis_results['control'].get('confidence_interval', ['N/A', 'N/A'])[1]:.4f}]" if 'confidence_interval' in analysis_results['control'] else ""}

### Variant Group
- Rate/Mean: {analysis_results['variant'].get('rate', analysis_results['variant'].get('mean')):.4f}
- Sample Size: {analysis_results['variant'].get('total', analysis_results['variant'].get('n'))}
{f"- 95% CI: [{analysis_results['variant'].get('confidence_interval', ['N/A', 'N/A'])[0]:.4f}, {analysis_results['variant'].get('confidence_interval', ['N/A', 'N/A'])[1]:.4f}]" if 'confidence_interval' in analysis_results['variant'] else ""}

---

## Statistical Analysis

- **P-value**: {analysis_results['statistics']['p_value']:.6f}
- **Significant**: {'✅ Yes' if analysis_results['statistics']['significant'] else '❌ No'} (α = 0.05)
- **Effect Size**:
  - Absolute Lift: {analysis_results['statistics'].get('effect_size', {}).get('absolute_lift', analysis_results['statistics'].get('absolute_lift')):.4f}
  - Relative Lift: {analysis_results['statistics'].get('effect_size', {}).get('relative_lift', analysis_results['statistics'].get('relative_lift')):.2f}%

---

## Winner Determination

**Winner**: {winner_decision['winner'].upper()}
**Confidence**: {winner_decision['confidence'] or 'N/A'}
**Recommendation**: {winner_decision['recommendation']}

### Reasoning
{chr(10).join(f"- {reason}" for reason in winner_decision['reasons'])}

{f"**⚠️ GUARDRAILS VIOLATED**: {', '.join(winner_decision['reasons'])}" if winner_decision['guardrails_violated'] else ""}

---

## Next Steps

"""
        if winner_decision['recommendation'] == 'ROLLOUT':
            report += """
1. **Prepare Rollout Plan**
   - Phase 1: 10% for 24 hours
   - Phase 2: 50% for 48 hours
   - Phase 3: 100% full rollout

2. **Monitor Post-Rollout**
   - Track all primary and secondary metrics
   - Watch for regression or unexpected behavior
   - Prepare rollback plan

3. **Document Learnings**
   - Update experiment knowledge base
   - Share results with team
   - Apply learnings to future experiments
"""
        elif winner_decision['recommendation'] == 'ROLLBACK':
            report += """
1. **Immediate Rollback to Control**
   - Execute rollback.sh script
   - Verify all users on control variant
   - Monitor for stability

2. **Root Cause Analysis**
   - Investigate guardrail violations
   - Review implementation bugs
   - Check for data quality issues

3. **Iteration Planning**
   - Redesign experiment parameters
   - Adjust guardrail thresholds if needed
   - Plan follow-up experiment
"""
        else:
            report += """
1. **Continue Monitoring**
   - Collect more data to reach significance
   - Check sample size calculations
   - Review for data quality issues

2. **Consider Adjustments**
   - Increase sample size if needed
   - Extend experiment duration
   - Check for segment-specific effects

3. **Re-analyze After 7 Days**
   - Repeat statistical analysis
   - Check for trends over time
   - Make final decision at that time
"""

        return report


def main():
    parser = argparse.ArgumentParser(description='Analyze A/B experiment results')
    parser.add_argument('--experiment-id', required=True, help='Experiment ID')
    parser.add_argument('--control-successes', type=int, help='Control group successes')
    parser.add_argument('--control-total', type=int, help='Control group total')
    parser.add_argument('--variant-successes', type=int, help='Variant group successes')
    parser.add_argument('--variant-total', type=int, help='Variant group total')
    parser.add_argument('--output', default='report.md', help='Output report file')

    args = parser.parse_args()

    if not SCIPY_AVAILABLE:
        print("\n⚠️  Warning: scipy not installed. Install for full statistical analysis:")
        print("   pip install numpy scipy\n")

    analyzer = ABExperimentAnalyzer(args.experiment_id, {})

    control_data = {
        'successes': args.control_successes,
        'total': args.control_total
    }
    variant_data = {
        'successes': args.variant_successes,
        'total': args.variant_total
    }

    print(f"🔬 Analyzing experiment: {args.experiment_id}")
    print(f"   Control: {args.control_successes}/{args.control_total}")
    print(f"   Variant: {args.variant_successes}/{args.variant_total}\n")

    analysis_results = analyzer.analyze_experiment(control_data, variant_data, metric_type='proportion')
    winner_decision = analyzer.determine_winner(analysis_results)

    report = analyzer.generate_report(analysis_results, winner_decision)

    # Save report
    output_path = Path(args.output)
    output_path.write_text(report)

    print(f"✅ Analysis complete!")
    print(f"   Winner: {winner_decision['winner']}")
    print(f"   P-value: {analysis_results['statistics']['p_value']:.6f}")
    print(f"   Recommendation: {winner_decision['recommendation']}")
    print(f"\n📄 Full report: {output_path}")

    # Save JSON results
    json_path = output_path.with_suffix('.json')
    with open(json_path, 'w') as f:
        json.dump({
            'analysis': analysis_results,
            'winner': winner_decision
        }, f, indent=2)
    print(f"📊 JSON data: {json_path}")


if __name__ == '__main__':
    main()
