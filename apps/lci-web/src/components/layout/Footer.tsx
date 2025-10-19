'use client';

// 🎨 AWARD-LEVEL FOOTER - Clean, organized, premium design

import Link from 'next/link';
import StatusDot from '@/components/status/StatusDot';
import type { HealthSnapshot, HealthStatus } from '@/types/health';

interface FooterProps {
  healthSnapshot?: HealthSnapshot | null;
}

const FOOTER_SECTIONS = {
  products: [
    { name: 'Chat', href: '/chat' },
    { name: 'Lydian IQ', href: '/lydian-iq' },
    { name: 'Medical Expert', href: '/medical' },
    { name: 'Legal AI', href: '/legal' },
    { name: 'AI Advisor Hub', href: '/advisor' },
  ],
  developers: [
    { name: 'API Reference', href: '/api' },
    { name: 'Documentation', href: '/docs' },
    { name: 'Console', href: '/console' },
    { name: 'GitHub', href: 'https://github.com/lydian', external: true },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'KVKK Compliance', href: '/kvkk' },
  ],
};

export default function Footer({ healthSnapshot }: FooterProps) {
  const getOverallStatus = (): HealthStatus => {
    if (!healthSnapshot) return 'warn';
    const downCount = healthSnapshot.items.filter(i => i.status === 'down').length;
    const warnCount = healthSnapshot.items.filter(i => i.status === 'warn').length;
    if (downCount > 0) return 'down';
    if (warnCount > 0) return 'warn';
    return 'up';
  };

  const overallStatus = getOverallStatus();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xl px-4 py-2 rounded-lg">
                LCI
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              KVKK/GDPR compliant complaint management platform. Transparent,
              secure, and user-focused.
            </p>

            {/* System Status */}
            <Link
              href="/status"
              className="inline-flex items-center gap-2 text-sm hover:text-white transition-colors"
            >
              <StatusDot status={overallStatus} size="sm" />
              <span>
                {overallStatus === 'up'
                  ? 'All Systems Operational'
                  : 'View System Status'}
              </span>
            </Link>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              {FOOTER_SECTIONS.products.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="text-white font-semibold mb-4">Developers</h3>
            <ul className="space-y-2">
              {FOOTER_SECTIONS.developers.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-white transition-colors"
                    {...(item.external && {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    })}
                  >
                    {item.name}
                    {item.external && ' ↗'}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {FOOTER_SECTIONS.company.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {FOOTER_SECTIONS.legal.map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-400">
              © {currentYear} Lydian AI. All rights reserved.
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="https://twitter.com/lydian"
                className="text-slate-400 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>

              <Link
                href="https://github.com/lydian"
                className="text-slate-400 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>

              <Link
                href="https://linkedin.com/company/lydian"
                className="text-slate-400 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
