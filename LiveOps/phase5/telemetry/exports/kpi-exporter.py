#!/usr/bin/env python3
"""
KPI Exporter - Extract and export telemetry KPIs
Supports PostgreSQL and SQLite
"""

import os
import sys
import json
import csv
from datetime import datetime, timezone
from pathlib import Path
import argparse

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False
    print("Warning: psycopg2 not available. PostgreSQL support disabled.")

try:
    import sqlite3
    SQLITE_AVAILABLE = True
except ImportError:
    SQLITE_AVAILABLE = False
    print("Warning: sqlite3 not available. SQLite support disabled.")


class KPIExporter:
    """Export KPI metrics from database"""

    def __init__(self, db_type='sqlite', db_path=None, pg_conn_string=None):
        self.db_type = db_type
        self.db_path = db_path
        self.pg_conn_string = pg_conn_string
        self.conn = None

        # KPI targets from dashboard.json
        self.kpi_targets = {
            # Technical Health
            'crash_free_rate': {'target': 98.5, 'warning': 98.0, 'critical': 97.0, 'direction': 'higher'},
            'p95_gpu_frame_time': {'target': 16.6, 'warning': 18.0, 'critical': 20.0, 'direction': 'lower'},
            'hitch_rate': {'target': 2.0, 'warning': 3.0, 'critical': 5.0, 'direction': 'lower'},
            'p95_server_latency': {'target': 150, 'warning': 200, 'critical': 300, 'direction': 'lower'},

            # Product Engagement
            'retention_d1': {'target': 40, 'warning': 35, 'critical': 30, 'direction': 'higher'},
            'retention_d7': {'target': 20, 'warning': 15, 'critical': 10, 'direction': 'higher'},
            'retention_d30': {'target': 10, 'warning': 7, 'critical': 5, 'direction': 'higher'},
            'ftue_completion': {'target': 75, 'warning': 70, 'critical': 65, 'direction': 'higher'},
            'season_task_completion': {'target': 60, 'warning': 50, 'critical': 40, 'direction': 'higher'},
            'boss_success_rate': {'target': 45, 'warning': 30, 'critical': 20, 'direction': 'higher'},
            'nps': {'target': 50, 'warning': 40, 'critical': 30, 'direction': 'higher'},

            # Economy Health
            'earn_spend_ratio': {'target': 1.2, 'warning_min': 1.0, 'warning_max': 1.5, 'critical_min': 0.8, 'critical_max': 2.0},
            'inflation_index': {'target': 1.00, 'warning': 1.10, 'critical': 1.15, 'direction': 'lower'},
            'vendor_usage': {'target': 50, 'warning': 40, 'critical': 30, 'direction': 'higher'},
            'fraud_indicators': {'target': 0, 'warning': 5, 'critical': 20, 'direction': 'lower'},
            'attach_rate': {'target': 15, 'warning': 10, 'direction': 'higher'},
        }

    def connect(self):
        """Connect to database"""
        if self.db_type == 'postgres':
            if not POSTGRES_AVAILABLE:
                raise Exception("psycopg2 not installed. Run: pip install psycopg2-binary")
            self.conn = psycopg2.connect(self.pg_conn_string)
        elif self.db_type == 'sqlite':
            if not SQLITE_AVAILABLE:
                raise Exception("sqlite3 not available")
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
        else:
            raise ValueError(f"Unsupported database type: {self.db_type}")

    def disconnect(self):
        """Disconnect from database"""
        if self.conn:
            self.conn.close()

    def execute_query(self, query):
        """Execute SQL query and return results"""
        if self.db_type == 'postgres':
            cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        else:
            cursor = self.conn.cursor()

        cursor.execute(query)

        if self.db_type == 'postgres':
            results = cursor.fetchall()
        else:
            # Convert sqlite3.Row to dict
            results = [dict(row) for row in cursor.fetchall()]

        cursor.close()
        return results

    def load_query_file(self, query_file):
        """Load SQL query from file"""
        query_path = Path(__file__).parent.parent / 'queries' / query_file

        if not query_path.exists():
            raise FileNotFoundError(f"Query file not found: {query_path}")

        with open(query_path, 'r') as f:
            content = f.read()

        # Extract first complete query (before next comment block)
        queries = content.split('-- =============================================================================')

        # Find the query we want (usually the first non-comment query)
        for section in queries:
            if 'SELECT' in section.upper():
                # Extract just the SELECT statement
                lines = section.split('\n')
                query_lines = []
                in_query = False
                for line in lines:
                    if 'SELECT' in line.upper():
                        in_query = True
                    if in_query and not line.strip().startswith('--'):
                        query_lines.append(line)
                    if in_query and line.strip().endswith(';'):
                        break

                if query_lines:
                    return '\n'.join(query_lines)

        return None

    def calculate_status(self, metric_name, current_value):
        """Calculate metric status (ok/warning/critical)"""
        if metric_name not in self.kpi_targets:
            return 'unknown'

        target = self.kpi_targets[metric_name]

        # Handle earn/spend ratio (has min/max thresholds)
        if 'warning_min' in target:
            if current_value < target['critical_min'] or current_value > target['critical_max']:
                return 'critical'
            elif current_value < target['warning_min'] or current_value > target['warning_max']:
                return 'warning'
            else:
                return 'ok'

        # Handle other metrics
        direction = target.get('direction', 'higher')

        if direction == 'higher':
            if current_value < target['critical']:
                return 'critical'
            elif current_value < target['warning']:
                return 'warning'
            else:
                return 'ok'
        else:  # lower
            if current_value > target['critical']:
                return 'critical'
            elif current_value > target['warning']:
                return 'warning'
            else:
                return 'ok'

    def export_technical_health(self):
        """Export technical health KPIs"""
        print("📊 Exporting Technical Health KPIs...")

        # Simple aggregated query for demo
        query = """
        SELECT
            COUNT(*) as total_sessions,
            COUNT(*) FILTER (WHERE crashed = FALSE) as crash_free_sessions,
            ROUND((COUNT(*) FILTER (WHERE crashed = FALSE)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2) as crash_free_rate
        FROM telemetry_sessions
        WHERE session_start >= NOW() - INTERVAL '24 hours'
        """

        try:
            results = self.execute_query(query)
            if results and len(results) > 0:
                result = results[0]
                crash_free_rate = float(result.get('crash_free_rate', 0))

                return {
                    'metric': 'crash_free_rate',
                    'value': crash_free_rate,
                    'unit': 'percentage',
                    'target': self.kpi_targets['crash_free_rate']['target'],
                    'status': self.calculate_status('crash_free_rate', crash_free_rate),
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'raw_data': dict(result)
                }
        except Exception as e:
            print(f"  ⚠️  Error: {e}")
            return None

    def export_all_kpis(self):
        """Export all KPIs to JSON"""
        print("🚀 Starting KPI Export...")
        print(f"   Database: {self.db_type}")
        print(f"   Time: {datetime.now(timezone.utc).isoformat()}\n")

        kpis = {
            'export_timestamp': datetime.now(timezone.utc).isoformat(),
            'season': 'S1',
            'database_type': self.db_type,
            'categories': {}
        }

        # Technical Health
        tech_health = self.export_technical_health()
        if tech_health:
            kpis['categories']['technical_health'] = [tech_health]

        # Add more categories here...
        # product_engagement = self.export_product_engagement()
        # economy_health = self.export_economy_health()

        return kpis

    def save_json(self, data, output_path):
        """Save KPIs to JSON file"""
        with open(output_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"\n✅ KPIs exported to: {output_path}")

    def save_csv(self, data, output_path):
        """Save KPIs to CSV file"""
        # Flatten nested structure for CSV
        rows = []
        for category, metrics in data.get('categories', {}).items():
            for metric in metrics:
                rows.append({
                    'timestamp': data['export_timestamp'],
                    'season': data['season'],
                    'category': category,
                    'metric': metric['metric'],
                    'value': metric['value'],
                    'unit': metric['unit'],
                    'target': metric['target'],
                    'status': metric['status']
                })

        if rows:
            with open(output_path, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=rows[0].keys())
                writer.writeheader()
                writer.writerows(rows)
            print(f"✅ KPIs exported to CSV: {output_path}")

    def run(self, output_format='json'):
        """Run KPI export"""
        try:
            self.connect()
            kpis = self.export_all_kpis()

            # Generate output filename
            timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
            output_dir = Path(__file__).parent
            output_dir.mkdir(parents=True, exist_ok=True)

            if output_format == 'json':
                output_path = output_dir / f'kpis-{timestamp}.json'
                self.save_json(kpis, output_path)
            elif output_format == 'csv':
                output_path = output_dir / f'kpis-{timestamp}.csv'
                self.save_csv(kpis, output_path)
            else:
                raise ValueError(f"Unsupported output format: {output_format}")

            self.disconnect()
            return output_path

        except Exception as e:
            print(f"\n❌ Export failed: {e}")
            self.disconnect()
            raise


def main():
    parser = argparse.ArgumentParser(description='Export KPI telemetry data')
    parser.add_argument('--db-type', choices=['postgres', 'sqlite'], default='sqlite',
                      help='Database type')
    parser.add_argument('--db-path', default='database/ailydian.db',
                      help='SQLite database path')
    parser.add_argument('--pg-conn', help='PostgreSQL connection string')
    parser.add_argument('--format', choices=['json', 'csv'], default='json',
                      help='Output format')

    args = parser.parse_args()

    if args.db_type == 'postgres' and not args.pg_conn:
        # Try environment variable
        args.pg_conn = os.environ.get('DATABASE_URL')
        if not args.pg_conn:
            print("Error: PostgreSQL connection string required (--pg-conn or DATABASE_URL)")
            sys.exit(1)

    exporter = KPIExporter(
        db_type=args.db_type,
        db_path=args.db_path,
        pg_conn_string=args.pg_conn
    )

    output_path = exporter.run(output_format=args.format)
    print(f"\n🎉 Export complete: {output_path}")


if __name__ == '__main__':
    main()
