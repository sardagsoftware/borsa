import dynamic from 'next/dynamic';

// Force dynamic rendering to avoid SSR issues with useRegime
const DynamicAutoTrader = dynamic(() => import('./client-component'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-bg flex items-center justify-center">
    <div className="text-brand1">🤖 Loading Auto Trader...</div>
  </div>
});

export default function AutoTraderPage() {
  return <DynamicAutoTrader />;
}
