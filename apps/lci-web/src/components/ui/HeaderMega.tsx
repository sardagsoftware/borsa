'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import useHealth from './useHealth';
import StatusDot from './StatusDot';

export default function HeaderMega() {
  const { upCount, total } = useHealth(60000);
  const [menuData, setMenuData] = useState<any>(null);

  useEffect(() => {
    fetch('/data/menu.json')
      .then(r => r.json())
      .then(setMenuData)
      .catch(console.error);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LyDian AI
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-gray-200/50">
              <StatusDot status={upCount === total ? 'up' : upCount > 0 ? 'warn' : 'down'} size="sm" />
              <span className="text-sm text-gray-700">{upCount}/{total} Services Up</span>
            </div>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
