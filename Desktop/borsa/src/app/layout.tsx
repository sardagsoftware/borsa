import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import CryptoTicker from "@/components/CryptoTicker";
import GlobalMap from "@/components/GlobalMap";
import GlobalNotifications from "@/components/GlobalNotifications";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export const metadata: Metadata = {
  title: "LyDian Trader - AI-Powered Trading Platform | Yapay Zeka Destekli Ticaret Platformu",
  description: "Ultra-fast, white-hat compliant AI trading platform - Real-time signals and quantum-level accuracy | Ultra hızlı, beyaz şapka uyumlu yapay zeka ticaret platformu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" style={{ background: '#1a1a1a' }}>
      <body className="antialiased" style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)', minHeight: '100vh' }}>
        <NotificationProvider>
          <LanguageProvider>
            <GlobalMap />
            <Navigation />
            <div className="relative z-20">
              {children}
            </div>
            <CryptoTicker />
            <GlobalNotifications />
          </LanguageProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}