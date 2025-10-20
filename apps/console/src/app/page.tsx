import React from "react";

export const metadata = {
  title: "Ailydian — Ana Uygulama",
  description: "Ailydian ana yüzü (oyun konsolu /console altında).",
};

export default function Home() {
  return (
    <main className="container max-w-5xl py-16">
      <h1 className="text-3xl font-bold mb-4">Ailydian • Ana Uygulama</h1>
      <p className="text-lg opacity-80 mb-8">
        Hoş geldiniz. Bu Ailydian platformunun ana sayfasıdır. Echo of Sardis
        oyun yönetim panelleri <strong>/console</strong> altında izole edilmiştir.
      </p>

      {/* Console Links */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-lydian-gold">
          Oyun Konsolu Panelleri
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <a
            href="/console/characters"
            className="block p-4 rounded-lg border border-white/10 hover:border-lydian-gold/50 transition-colors"
          >
            <h3 className="font-semibold text-lydian-gold mb-2">
              Characters & Storyflow
            </h3>
            <p className="text-sm opacity-70">
              Karakter kartları, ilişkiler ve öykü akış haritası
            </p>
          </a>

          <a
            href="/console/story"
            className="block p-4 rounded-lg border border-white/10 hover:border-lydian-gold/50 transition-colors"
          >
            <h3 className="font-semibold text-lydian-gold mb-2">Story Bible</h3>
            <p className="text-sm opacity-70">
              Anlatı İncili, zaman çizelgesi ve temalar
            </p>
          </a>

          <a
            href="/console/kpis"
            className="block p-4 rounded-lg border border-white/10 hover:border-lydian-gold/50 transition-colors"
          >
            <h3 className="font-semibold text-lydian-gold mb-2">
              KPIs & Telemetry
            </h3>
            <p className="text-sm opacity-70">
              Sezon 2 metrik takibi ve canlı veri akışı
            </p>
          </a>

          <a
            href="/console/liveops/s2"
            className="block p-4 rounded-lg border border-white/10 hover:border-lydian-gold/50 transition-colors"
          >
            <h3 className="font-semibold text-lydian-gold mb-2">
              LiveOps • Season 2
            </h3>
            <p className="text-sm opacity-70">
              Canlı etkinlikler, ekonomi ve A/B testleri
            </p>
          </a>
        </div>
      </section>

      {/* Info */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-lydian-gold">Mimari</h2>
        <ul className="list-disc list-inside space-y-2 text-sm opacity-80">
          <li>
            <strong>/</strong> — Ailydian ana platform sayfası (bu sayfa)
          </li>
          <li>
            <strong>/console/*</strong> — Echo of Sardis oyun yönetim panelleri
          </li>
          <li>
            Realtime sistem: WebSocket + SSE ile canlı veri akışı
          </li>
          <li>
            Veri normalizasyon katmanı: Object ↔ Array dönüşümleri
          </li>
          <li>
            Güvenlik: HMAC-SHA256, RBAC, KVKV/GDPR uyumlu
          </li>
        </ul>
      </section>
    </main>
  );
}
