import dynamic from 'next/dynamic';

// Force dynamic rendering to avoid SSR issues with useRegime
const DynamicSecurityPage = dynamic(() => import('./client-component'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-binance-dark flex items-center justify-center">
    <div className="text-binance-yellow">🔐 Loading Security Dashboard...</div>
  </div>
});

export default function SecurityPage() {
  return <DynamicSecurityPage />;
}
