import dynamic from 'next/dynamic';

// Force dynamic rendering to avoid SSR issues with useRegime
const DynamicSmokeTest = dynamic(() => import('./client-component'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-bg flex items-center justify-center">
    <div className="text-brand1">🧪 Loading Smoke Test...</div>
  </div>
});

export default function SmokeTestPage() {
  return <DynamicSmokeTest />;
}
