/**
 * MARKET OVERVIEW PAGE - CLIENT ONLY
 *
 * 200 coin market overview with real-time updates
 * IMPORTANT: Client-side only to avoid SSR hydration issues
 */

import dynamic from 'next/dynamic';

// Load MarketOverview ONLY on client-side (no SSR)
const MarketOverview = dynamic(
  () => import("@/components/market/MarketOverview"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium">SARDAG Başlatılıyor...</div>
          <div className="text-sm text-gray-500 mt-2">Market modülü yükleniyor</div>
        </div>
      </div>
    ),
  }
);

export default function MarketPage() {
  return <MarketOverview />;
}
