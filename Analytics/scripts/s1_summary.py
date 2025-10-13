#!/usr/bin/env python3
"""
Season 1 Summary Generator
Generates Jupyter notebook with S1 analytics
"""

import sys
import json
from datetime import datetime


def generate_notebook(kpi_file):
    """Generate Jupyter notebook from KPI data"""

    # Load KPI data
    try:
        with open(kpi_file, 'r') as f:
            kpis = json.load(f)
    except Exception as e:
        print(f"Error loading KPI file: {e}", file=sys.stderr)
        kpis = {}

    # Create notebook structure
    notebook = {
        "cells": [
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    f"# Season 1 Analytics Review\n",
                    f"\n",
                    f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
                    f"**Season**: S1 - Echo of Sardis: First Chronicle\n",
                    f"**Data Source**: {kpi_file}\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "source": [
                    "import json\n",
                    "import pandas as pd\n",
                    "import matplotlib.pyplot as plt\n",
                    "import seaborn as sns\n",
                    "\n",
                    "# Load KPI data\n",
                    f"with open('{kpi_file}', 'r') as f:\n",
                    "    kpis = json.load(f)\n",
                    "\n",
                    "print('KPIs loaded successfully')\n",
                    "print(f\"Status: {kpis.get('status', 'unknown')}\")"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## Technical Health\n",
                    "\n",
                    "Key performance indicators:\n",
                    f"- Crash-free rate: {kpis.get('technical_health', {}).get('crash_free_rate', 'N/A')}%\n",
                    f"- p95 GPU: {kpis.get('technical_health', {}).get('p95_gpu_frame_time', 'N/A')}ms\n",
                    f"- p95 Latency: {kpis.get('technical_health', {}).get('p95_server_latency', 'N/A')}ms\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "source": [
                    "# Technical health visualization\n",
                    "tech = kpis.get('technical_health', {})\n",
                    "metrics = ['crash_free_rate', 'p95_gpu_frame_time', 'p95_server_latency']\n",
                    "values = [tech.get(m, 0) for m in metrics]\n",
                    "\n",
                    "fig, ax = plt.subplots(1, 3, figsize=(15, 4))\n",
                    "ax[0].bar(['Crash-free'], [tech.get('crash_free_rate', 0)], color='green')\n",
                    "ax[0].set_ylabel('Percentage')\n",
                    "ax[0].set_ylim(95, 100)\n",
                    "ax[1].bar(['p95 GPU'], [tech.get('p95_gpu_frame_time', 0)], color='blue')\n",
                    "ax[1].set_ylabel('Milliseconds')\n",
                    "ax[2].bar(['p95 Latency'], [tech.get('p95_server_latency', 0)], color='orange')\n",
                    "ax[2].set_ylabel('Milliseconds')\n",
                    "plt.tight_layout()\n",
                    "plt.show()"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## Product Engagement\n",
                    "\n",
                    f"- DAU: {kpis.get('product_engagement', {}).get('dau', 'N/A')}\n",
                    f"- Retention D1: {kpis.get('product_engagement', {}).get('retention_d1', 'N/A')}%\n",
                    f"- Retention D7: {kpis.get('product_engagement', {}).get('retention_d7', 'N/A')}%\n",
                    f"- NPS: {kpis.get('product_engagement', {}).get('nps', 'N/A')}\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "source": [
                    "# Retention funnel\n",
                    "engagement = kpis.get('product_engagement', {})\n",
                    "retention = [\n",
                    "    engagement.get('retention_d1', 0),\n",
                    "    engagement.get('retention_d7', 0),\n",
                    "    engagement.get('retention_d30', 0)\n",
                    "]\n",
                    "labels = ['D1', 'D7', 'D30']\n",
                    "\n",
                    "plt.figure(figsize=(8, 5))\n",
                    "plt.plot(labels, retention, marker='o', linewidth=2, markersize=10)\n",
                    "plt.title('Retention Funnel')\n",
                    "plt.ylabel('Retention %')\n",
                    "plt.xlabel('Day')\n",
                    "plt.grid(True, alpha=0.3)\n",
                    "plt.show()"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## Economy Health\n",
                    "\n",
                    f"- Inflation Index: {kpis.get('economy_health', {}).get('inflation_index', 'N/A')}\n",
                    f"- Earn/Spend Ratio: {kpis.get('economy_health', {}).get('earn_spend_ratio', 'N/A')}\n",
                    f"- ARPPU: ${kpis.get('economy_health', {}).get('arppu', 'N/A')}\n",
                    f"- Fraud Indicators: {kpis.get('economy_health', {}).get('fraud_indicators', 'N/A')}\n"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## A/B Experiments\n",
                    "\n",
                    "Active experiments:\n"
                ]
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "source": [
                    "# Show experiment results\n",
                    "experiments = kpis.get('experiments', {})\n",
                    "for exp_id, exp_data in experiments.items():\n",
                    "    print(f\"\\n{exp_id}:\")\n",
                    "    print(f\"  Status: {exp_data.get('status')}\")\n",
                    "    print(f\"  Control: {exp_data.get('control_rate', 0):.2%}\")\n",
                    "    print(f\"  Variant: {exp_data.get('variant_rate', 0):.2%}\")\n",
                    "    print(f\"  P-value: {exp_data.get('p_value', 0):.4f}\")\n",
                    "    print(f\"  Significant: {exp_data.get('significant')}\")"
                ]
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## Recommendations\n",
                    "\n",
                    "Based on the analysis:\n",
                    "1. Monitor crash-free rate closely\n",
                    "2. Continue A/B experiments with significant results\n",
                    "3. Watch economy inflation indicators\n",
                    "4. Optimize for D7 retention improvement\n"
                ]
            }
        ],
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "codemirror_mode": {"name": "ipython", "version": 3},
                "file_extension": ".py",
                "mimetype": "text/x-python",
                "name": "python",
                "version": "3.9.0"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 4
    }

    return json.dumps(notebook, indent=2)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: s1_summary.py <kpi_file.json>", file=sys.stderr)
        sys.exit(1)

    kpi_file = sys.argv[1]
    notebook_json = generate_notebook(kpi_file)
    print(notebook_json)
