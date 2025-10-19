'use client';

import React from 'react';
import Link from 'next/link';
import useHealth from './useHealth';

export default function Footer2025() {
  const { upCount, total, upPct } = useHealth(60000);

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-xl font-bold text-white">LyDian AI</span>
          </div>

          <div className="flex items-center gap-6 text-gray-400 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link
              href="/status"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className={`w-2 h-2 rounded-full ${upPct >= 90 ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="text-xs text-gray-300">System Status: {upPct}%</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
