/**
 * SHARD_15 - Homepage Redirect to Messaging
 * Automatically redirects to unified messaging interface
 * Makes chat-test the default landing page as requested
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat interface immediately
    router.replace('/chat-test');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B0F19] via-[#0F1419] to-[#0B0F19]">
      <div className="text-center">
        {/* Loading Animation */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#10A37F] via-[#6366F1] to-[#EC4899] animate-spin" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-1 rounded-2xl bg-[#0B0F19] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#10A37F] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-white font-bold text-lg mb-2">Ailydian Hub</p>
        <p className="text-[#6B7280] text-sm">Yükleniyor...</p>
      </div>
    </div>
  );
}
