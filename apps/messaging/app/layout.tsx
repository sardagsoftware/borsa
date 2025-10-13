'use client';

import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <title>Ailydian Messaging - E2EE Secure Chat</title>
        <meta name="description" content="Uçtan uca şifrelenmiş güvenli mesajlaşma platformu" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0B0F19" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-[#0B0F19] text-[#E5E7EB] antialiased">
        <header className="sticky top-0 z-50 border-b border-[#1F2937] bg-[#0B0F19]/80 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10A37F] to-[#0D8F6E] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <strong className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-[#E5E7EB] bg-clip-text text-transparent">
                Ailydian Messaging
              </strong>
            </a>
            <nav className="flex items-center gap-1 text-sm">
              {/* Navigation icons removed - clean header */}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </main>
        <footer className="mt-auto border-t border-[#1F2937] py-6 text-center text-sm text-[#6B7280]">
          © {new Date().getFullYear()} Ailydian • E2EE • Güvenli Mesajlaşma
        </footer>
      </body>
    </html>
  )
}
