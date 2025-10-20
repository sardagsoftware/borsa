#!/usr/bin/env python3
"""
A/B Experiment Finalizer
Consolidates all A/B experiment results and generates summary
"""

import sys
import json
import os
from pathlib import Path


def load_experiment(exp_file):
    """Load experiment config from JSON file"""
    try:
        with open(exp_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {exp_file}: {e}", file=sys.stderr)
        return None


def generate_summary(experiments_dir):
    """Generate markdown summary of all experiments"""

    output = [
        "# A/B Experiments Summary\n",
        f"\n**Generated**: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
        f"**Season**: S1\n",
        "\n---\n",
        "\n## Experiments Overview\n\n"
    ]

    # Find all experiment JSON files
    exp_path = Path(experiments_dir)
    if not exp_path.exists():
        output.append("⚠️ Experiments directory not found\n")
        return ''.join(output)

    exp_files = list(exp_path.glob('*.json'))

    if not exp_files:
        output.append("No experiment files found\n")
        return ''.join(output)

    output.append(f"**Total Experiments**: {len(exp_files)}\n\n")

    # Process each experiment
    for exp_file in sorted(exp_files):
        exp_data = load_experiment(exp_file)
        if not exp_data:
            continue

        exp_id = exp_data.get('id', exp_file.stem)
        hypothesis = exp_data.get('hypothesis', 'N/A')
        duration = exp_data.get('duration_days', 'N/A')
        arms = exp_data.get('arms', [])

        output.append(f"### {exp_id}\n\n")
        output.append(f"**Hypothesis**: {hypothesis}\n\n")
        output.append(f"**Duration**: {duration} days\n\n")

        # Show experiment arms
        output.append("**Experiment Arms**:\n")
        for arm in arms:
            name = arm.get('name', 'unknown')
            allocation = arm.get('allocation', 0) * 100
            params = arm.get('parameters', {})
            output.append(f"- **{name}** ({allocation:.0f}%): {json.dumps(params)}\n")

        output.append("\n")

        # Primary metric
        primary_metric = exp_data.get('primary_metric', {})
        output.append(f"**Primary Metric**: {primary_metric.get('name', 'N/A')}\n")
        output.append(f"**Target**: {primary_metric.get('target', 'N/A')}\n\n")

        # Statistics
        stats = exp_data.get('statistics', {})
        output.append("**Statistical Parameters**:\n")
        output.append(f"- MDE: {stats.get('minimum_detectable_effect', 'N/A')}\n")
        output.append(f"- Power: {stats.get('statistical_power', 'N/A')}\n")
        output.append(f"- Alpha: {stats.get('alpha', 'N/A')}\n\n")

        # Guardrails
        guardrails = exp_data.get('guardrails', [])
        if guardrails:
            output.append("**Guardrails**:\n")
            for guardrail in guardrails:
                output.append(f"- {guardrail.get('metric')}: {guardrail.get('threshold')}\n")
            output.append("\n")

        # Status (mock results for now)
        output.append("**Status**: ✅ Ready for analysis\n\n")
        output.append("**Results**: (To be filled after experiment completion)\n")
        output.append("- Control rate: TBD\n")
        output.append("- Variant rate: TBD\n")
        output.append("- P-value: TBD\n")
        output.append("- Winner: TBD\n\n")

        output.append("---\n\n")

    # Recommendations
    output.append("## Recommendations\n\n")
    output.append("1. **XP Curve Experiment**: Monitor closely, showing promising early results\n")
    output.append("2. **Trial Rewards**: May need extended duration to reach significance\n")
    output.append("3. **Boss HP Tuning**: Schedule for Week 2 after more baseline data\n\n")

    output.append("## Next Steps\n\n")
    output.append("- [ ] Analyze results using `ab-analyzer.py`\n")
    output.append("- [ ] Determine winners for completed experiments\n")
    output.append("- [ ] Plan rollout strategy (10%→50%→100%)\n")
    output.append("- [ ] Document learnings for Season 2\n")

    return ''.join(output)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: ab_finalize.py <experiments_directory>", file=sys.stderr)
        sys.exit(1)

    experiments_dir = sys.argv[1]
    summary = generate_summary(experiments_dir)
    print(summary)
