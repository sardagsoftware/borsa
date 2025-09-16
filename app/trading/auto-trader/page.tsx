/**
 * AILYDIAN Auto-Trader AI Page
 * Advanced AI-powered trading system interface
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

import dynamic from 'next/dynamic';
import { Metadata } from 'next';

// Dynamically import the dashboard to avoid SSR issues
const AutoTraderDashboard = dynamic(
  () => import('@/components/trading/AutoTraderDashboard'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading AI Trading System...</p>
        </div>
      </div>
    )
  }
);

export const metadata: Metadata = {
  title: 'Auto-Trader AI | AILYDIAN Global Trader',
  description: 'Advanced AI-powered trading system with machine learning signals and risk management',
};

export default function AutoTraderPage() {
  return (
    <div className="w-full">
      <AutoTraderDashboard />
    </div>
  );
}
