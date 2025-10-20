"use client";

/**
 * GLOBAL ERROR HANDLER
 *
 * Catches errors in the root layout
 * Last resort error boundary
 */

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="tr">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a] p-4">
          <div className="max-w-md w-full bg-[#1a1f2e] border border-red-500/20 rounded-lg p-6 shadow-xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white text-center mb-2">
              Kritik Bir Hata Oluştu
            </h2>

            <p className="text-gray-400 text-center text-sm mb-4">
              Uygulama beklenmeyen bir hatayla karşılaştı. Lütfen sayfayı yenileyin.
            </p>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Tekrar Dene
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Ana Sayfa
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
