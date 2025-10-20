"use client";

/**
 * HOME PAGE - Auto-redirect to Market (Client-side)
 *
 * Client-side redirect for Vercel compatibility
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirect to market page
    router.replace('/market');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-lg font-medium">SARDAG Başlatılıyor...</div>
        <div className="text-sm text-gray-400 mt-2">Market sayfasına yönlendiriliyorsunuz</div>
      </div>
    </div>
  );
}
