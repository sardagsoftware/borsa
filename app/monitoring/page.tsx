/**
 * AILYDIAN System Monitoring Page
 * Comprehensive system monitoring dashboard
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

import dynamic from 'next/dynamic';
import { Metadata } from 'next';

// Dynamically import the dashboard to avoid SSR issues
const SystemMonitoringDashboard = dynamic(
  () => import('@/components/monitoring/SystemMonitoringDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading System Monitor...</p>
        </div>
      </div>
    )
  }
);

export const metadata: Metadata = {
  title: 'System Monitoring | AILYDIAN Global Trader',
  description: 'Comprehensive system monitoring dashboard for AILYDIAN trading platform services and infrastructure',
};

export default function MonitoringPage() {
  return (
    <div className="w-full">
      <SystemMonitoringDashboard />
    </div>
  );
}
