'use client';
import React from 'react';
import Link from 'next/link';
import useHealth from './useHealth';
import StatusDot from './StatusDot';

export default function Footer2025() {
  const { upCount, downCount, warnCount, total, upPct } = useHealth(60000);
  const overallStatus = downCount > 0 ? 'down' : warnCount > 0 ? 'warn' : 'up';

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black border-t border-white/10">
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <span className="text-xl font-bold text-white">LyDian AI</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Enterprise-grade AI infrastructure for modern applications.
            </p>
            <div className="flex items-center gap-2">
              <StatusDot status={overallStatus} size="sm" showPulse={true} />
              <span className="text-sm text-gray-400">
                {upPct}% Uptime • {upCount}/{total} Services
              </span>
            </div>
          </div>

          {/* Products Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Ürünler</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/chat" className="text-gray-400 hover:text-white text-sm transition-colors">
                  AI Studio
                </Link>
              </li>
              <li>
                <Link href="/lydian-iq" className="text-gray-400 hover:text-white text-sm transition-colors">
                  IQ Analytics
                </Link>
              </li>
              <li>
                <Link href="/enterprise" className="text-gray-400 hover:text-white text-sm transition-colors">
                  AI Ops Center
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-gray-400 hover:text-white text-sm transition-colors">
                  System Status
                </Link>
              </li>
            </ul>
          </div>

          {/* Developers Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Geliştiriciler</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/developers" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Dokümantasyon
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="text-gray-400 hover:text-white text-sm transition-colors">
                  API Referansı
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Sürüm Notları
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Şirket</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Kariyer
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-400 text-sm">
              © 2025 LyDian AI. All rights reserved.
            </div>

            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Gizlilik
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Şartlar
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors">
                Çerezler
              </Link>
              <Link
                href="/status"
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all"
              >
                <StatusDot status={overallStatus} size="sm" showPulse={false} />
                <span className="text-xs text-gray-300">System Status</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
