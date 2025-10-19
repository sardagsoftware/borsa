'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import useHealth from './useHealth';
import StatusDot from './StatusDot';

type MenuItem = {
  title: string;
  desc: string;
  href: string;
};

type MenuData = {
  modules: { col1: MenuItem[]; col2: MenuItem[]; col3: MenuItem[] };
  solutions: { col1: MenuItem[]; col2: MenuItem[]; col3: MenuItem[] };
  developers: { col1: MenuItem[]; col2: MenuItem[]; col3: MenuItem[] };
  company: { col1: MenuItem[]; col2: MenuItem[]; col3: MenuItem[] };
};

export default function HeaderMega() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const { upCount, downCount, warnCount, total } = useHealth(60000);

  React.useEffect(() => {
    fetch('/data/menu.json')
      .then(res => res.json())
      .then(data => setMenuData(data))
      .catch(err => console.error('Failed to load menu:', err));
  }, []);

  const overallStatus = downCount > 0 ? 'down' : warnCount > 0 ? 'warn' : 'up';

  const renderDropdown = (section: 'modules' | 'solutions' | 'developers' | 'company') => {
    if (!menuData || activeDropdown !== section) return null;

    const sectionData = menuData[section];

    return (
      <div className="absolute top-full left-0 w-full mt-1 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid grid-cols-3 gap-12">
            {/* Column 1 */}
            <div className="space-y-4">
              {sectionData.col1.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className="group block p-4 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </div>
                  {item.desc && (
                    <div className="text-sm text-gray-500 mt-1">{item.desc}</div>
                  )}
                </Link>
              ))}
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              {sectionData.col2.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className="group block p-4 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </div>
                  {item.desc && (
                    <div className="text-sm text-gray-500 mt-1">{item.desc}</div>
                  )}
                </Link>
              ))}
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              {sectionData.col3.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className="group block p-4 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                  onClick={() => setActiveDropdown(null)}
                >
                  <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </div>
                  {item.desc && (
                    <div className="text-sm text-gray-500 mt-1">{item.desc}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">L</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LyDian AI
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            <button
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative"
              onMouseEnter={() => setActiveDropdown('modules')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              Modüller
              {activeDropdown === 'modules' && renderDropdown('modules')}
            </button>

            <button
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative"
              onMouseEnter={() => setActiveDropdown('solutions')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              Çözümler
              {activeDropdown === 'solutions' && renderDropdown('solutions')}
            </button>

            <button
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative"
              onMouseEnter={() => setActiveDropdown('developers')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              Geliştiriciler
              {activeDropdown === 'developers' && renderDropdown('developers')}
            </button>

            <button
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors relative"
              onMouseEnter={() => setActiveDropdown('company')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              Şirket
              {activeDropdown === 'company' && renderDropdown('company')}
            </button>
          </nav>

          {/* Health Status + CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/status"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 hover:bg-white/80 border border-gray-200/50 hover:border-gray-300/50 transition-all"
            >
              <StatusDot status={overallStatus} size="sm" showPulse={true} />
              <span className="text-sm text-gray-700">
                {upCount}/{total}
              </span>
            </Link>

            <Link
              href="/auth"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:shadow-lg hover:scale-105 transition-all"
            >
              Başlat
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
