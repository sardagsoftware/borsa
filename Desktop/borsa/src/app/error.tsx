'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-red-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30 shadow-2xl shadow-red-500/10 max-w-2xl w-full">
        <div className="text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Bir Hata Oluştu
          </h1>
          <p className="text-slate-300 mb-6">
            Sistem bir hatayla karşılaştı. Lütfen tekrar deneyin.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-red-400 text-sm font-mono">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-slate-500 text-xs mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/30"
            >
              🔄 Tekrar Dene
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold rounded-lg transition-all"
            >
              🏠 Ana Sayfa
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
