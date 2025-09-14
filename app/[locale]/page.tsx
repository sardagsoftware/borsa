'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to login page immediately
    router.push('/auth/signin');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-1 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-text mb-2">🚀 AiLydian Trader</h1>
        <p className="text-muted">Redirecting to login...</p>
      </div>
    </div>
  );
}
