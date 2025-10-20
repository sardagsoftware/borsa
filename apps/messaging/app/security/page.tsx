/**
 * SHARD_11.5 - Security Page
 * Transparent security information
 *
 * Security: Technical details, white hat disclosure
 * White Hat: Open about security practices
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Güvenlik - Ailydian Messaging',
  description: 'Ailydian Messaging güvenlik özellikleri. E2EE, Signal protokolü, Zero-knowledge mimarisi.',
  robots: 'index, follow'
};

export default function SecurityPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">🛡️ Güvenlik</h1>
        <p className="text-[#9CA3AF]">
          Mesajlarınız, dosyalarınız ve aramalarınız nasıl korunur
        </p>
      </div>

      <div className="space-y-8">
        <Section title="1. Uçtan Uca Şifreleme (E2EE)">
          <div className="bg-[#10A37F]/10 border border-[#10A37F] rounded-lg p-4 mb-4">
            <p className="font-bold text-[#10A37F] text-lg">
              ✓ Mesajlarınızı sadece SİZ okuyabilirsiniz
            </p>
            <p className="text-sm text-[#9CA3AF] mt-2">
              Sunucular şifreli veriyi taşır, asla çözemez (Zero-Knowledge)
            </p>
          </div>

          <SubSection title="Signal Protokolü">
            <ul>
              <li>🔐 <strong>Double Ratchet:</strong> Her mesaj farklı anahtar</li>
              <li>🔑 <strong>X3DH Key Exchange:</strong> Güvenli anahtar değişimi</li>
              <li>⏩ <strong>Perfect Forward Secrecy:</strong> Geçmiş mesajlar korunur</li>
              <li>🔒 <strong>Post-Compromise Security:</strong> Gelecek mesajlar korunur</li>
            </ul>
          </SubSection>

          <SubSection title="Şifreleme Standartları">
            <ul>
              <li>💬 Mesajlar: <code>AES-256-GCM</code></li>
              <li>📁 Dosyalar: <code>AES-256-GCM</code> (client-side)</li>
              <li>🎥 Video/Audio: <code>SFrame</code> (per-frame E2EE)</li>
              <li>📍 Konum: <code>AES-256-GCM</code> (ephemeral keys)</li>
              <li>🔑 Anahtar türetme: <code>HKDF-SHA256</code></li>
              <li>📝 İmzalar: <code>ECDSA (P-256)</code></li>
            </ul>
          </SubSection>
        </Section>

        <Section title="2. Anahtar Yönetimi">
          <ul>
            <li>🔑 <strong>Identity Keys:</strong> Cihaz başına ECDH P-256 anahtar çifti</li>
            <li>📝 <strong>Signed Pre-Keys:</strong> Sunucuda saklanır, offline mesajlar için</li>
            <li>⚡ <strong>One-Time Pre-Keys:</strong> 100 adet, kullan-at (Perfect Forward Secrecy)</li>
            <li>🔄 <strong>Key Rotation:</strong> Her 7 günde otomatik yenileme</li>
            <li>💾 <strong>Saklama:</strong> IndexedDB (encrypted at-rest)</li>
          </ul>

          <div className="bg-[#1F2937] p-4 rounded-lg mt-4">
            <p className="text-sm text-[#9CA3AF]">
              <strong>Önemli:</strong> Anahtarlarınızı kaybederseniz geçmiş mesajlarınıza erişemezsiniz.
              Düzenli yedekleme yapmanızı öneririz.
            </p>
          </div>
        </Section>

        <Section title="3. Transport Security">
          <ul>
            <li>🔐 <strong>TLS 1.3:</strong> Minimum transport security</li>
            <li>🚫 <strong>TLS 1.2 ve altı:</strong> Desteklenmez</li>
            <li>📜 <strong>Certificate Pinning:</strong> MITM saldırılarına karşı</li>
            <li>🔒 <strong>HSTS:</strong> HTTPS zorunlu</li>
            <li>🛡️ <strong>CSP:</strong> XSS koruması</li>
          </ul>
        </Section>

        <Section title="4. Authentication & Authorization">
          <ul>
            <li>🔐 <strong>Bcrypt:</strong> Şifre hash'leme (cost: 12)</li>
            <li>🎫 <strong>JWT:</strong> Stateless session management</li>
            <li>📱 <strong>2FA:</strong> TOTP bazlı (RFC 6238)</li>
            <li>🖥️ <strong>Device Trust:</strong> Cihaz bazlı yetkilendirme</li>
            <li>🔄 <strong>Session Management:</strong> 30 gün expiry, revocation support</li>
          </ul>
        </Section>

        <Section title="5. File Security">
          <ul>
            <li>🔐 <strong>Client-side Encryption:</strong> Yüklemeden önce şifrelenir</li>
            <li>🔑 <strong>AES-256-GCM:</strong> Authenticated encryption</li>
            <li>🎟️ <strong>Sealed URLs:</strong> Tek kullanımlık download links</li>
            <li>⏱️ <strong>Time-limited:</strong> 15 dakika TTL</li>
            <li>🗑️ <strong>Auto-deletion:</strong> Tier bazlı (7-90 gün)</li>
          </ul>
        </Section>

        <Section title="6. WebRTC Security">
          <ul>
            <li>🎥 <strong>SFrame E2EE:</strong> Frame bazlı şifreleme</li>
            <li>🔐 <strong>AES-256-GCM:</strong> Her frame ayrı şifreleme</li>
            <li>🔄 <strong>Key Rotation:</strong> Counter bazlı forward secrecy</li>
            <li>📡 <strong>DTLS-SRTP:</strong> Transport encryption</li>
            <li>🔒 <strong>ICE/STUN/TURN:</strong> Güvenli peer discovery</li>
          </ul>

          <div className="bg-[#F59E0B]/10 border border-[#F59E0B] rounded-lg p-4 mt-4">
            <p className="text-sm">
              <strong>⚠️ Not:</strong> TURN sunucuları trafik görür ama SFrame sayesinde içeriği göremez.
            </p>
          </div>
        </Section>

        <Section title="7. Infrastructure Security">
          <ul>
            <li>☁️ <strong>Azure Cloud:</strong> SOC 2 Type II certified</li>
            <li>🔐 <strong>At-Rest Encryption:</strong> AES-256 (Azure Storage)</li>
            <li>🌍 <strong>Multi-region:</strong> Coğrafi yedeklilik</li>
            <li>🔄 <strong>Backup:</strong> Günlük, 30 gün retention</li>
            <li>🚨 <strong>Monitoring:</strong> 24/7 SOC</li>
            <li>🛡️ <strong>DDoS Protection:</strong> Azure DDoS Standard</li>
            <li>🔥 <strong>WAF:</strong> Web Application Firewall</li>
          </ul>
        </Section>

        <Section title="8. Rate Limiting & Abuse Prevention">
          <ul>
            <li>⏱️ <strong>Per-User Limits:</strong> Tier bazlı quotalar</li>
            <li>🚫 <strong>Brute-Force Protection:</strong> 5 başarısız giriş = 15dk ban</li>
            <li>📧 <strong>Email Verification:</strong> Spam önleme</li>
            <li>🤖 <strong>CAPTCHA:</strong> Bot koruması</li>
            <li>🔍 <strong>Anomaly Detection:</strong> Şüpheli aktivite tespiti</li>
          </ul>
        </Section>

        <Section title="9. Privacy Features">
          <ul>
            <li>🙈 <strong>Zero-Knowledge:</strong> Sunucu içeriği görmez</li>
            <li>🗑️ <strong>Auto-Delete:</strong> Mesajlar otomatik silinir</li>
            <li>⏲️ <strong>Ephemeral Keys:</strong> Geçici şifreleme anahtarları</li>
            <li>📍 <strong>Location Privacy:</strong> Konum şifreli paylaşılır</li>
            <li>🚫 <strong>No Metadata Mining:</strong> İstatistik için dahi içerik görülmez</li>
          </ul>
        </Section>

        <Section title="10. Audit & Compliance">
          <ul>
            <li>🇪🇺 <strong>GDPR Compliant:</strong> EU veri koruma yasaları</li>
            <li>🇺🇸 <strong>COPPA Compliant:</strong> Çocuk gizliliği</li>
            <li>💳 <strong>PCI DSS:</strong> Ödeme kartı güvenliği (Stripe)</li>
            <li>📜 <strong>SOC 2 Type II:</strong> Altyapı güvenliği</li>
            <li>🔐 <strong>ISO 27001:</strong> Bilgi güvenliği yönetimi (hedef)</li>
          </ul>
        </Section>

        <Section title="11. Bug Bounty Program">
          <div className="bg-[#10A37F]/10 border border-[#10A37F] rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">🏆 Responsible Disclosure</h3>
            <p className="mb-3">Güvenlik açığı bulduysanız:</p>
            <ul className="space-y-2">
              <li>📧 <strong>E-posta:</strong> <a href="mailto:security@ailydian.com" className="text-[#10A37F]">security@ailydian.com</a></li>
              <li>🔐 <strong>PGP Key:</strong> <a href="/.well-known/pgp-key.txt" className="text-[#10A37F]">Download</a></li>
              <li>⏱️ <strong>Response Time:</strong> 24 saat içinde</li>
              <li>💰 <strong>Rewards:</strong> Kritikalliğe göre $100-$5000</li>
            </ul>
          </div>

          <SubSection title="Scope">
            <ul>
              <li>✓ E2EE bypass</li>
              <li>✓ Authentication bypass</li>
              <li>✓ Remote Code Execution</li>
              <li>✓ SQL Injection</li>
              <li>✓ XSS (stored)</li>
            </ul>
          </SubSection>

          <SubSection title="Out of Scope">
            <ul className="text-[#9CA3AF]">
              <li>✗ DoS/DDoS</li>
              <li>✗ Social engineering</li>
              <li>✗ Physical attacks</li>
              <li>✗ Third-party vulnerabilities</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="12. Hall of Fame">
          <p className="text-[#9CA3AF] text-sm mb-4">
            Responsible disclosure yapan güvenlik araştırmacıları:
          </p>
          <div className="bg-[#1F2937] p-4 rounded-lg">
            <p className="text-center text-[#6B7280]">
              Henüz listemiz yok. İlk siz olun! 🏆
            </p>
          </div>
        </Section>

        <div className="bg-[#111827] border border-[#374151] rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">📧 İletişim</h2>
          <div className="space-y-2">
            <p>🔐 Güvenlik: <a href="mailto:security@ailydian.com" className="text-[#10A37F]">security@ailydian.com</a></p>
            <p>📜 Compliance: <a href="mailto:compliance@ailydian.com" className="text-[#10A37F]">compliance@ailydian.com</a></p>
            <p>🔍 Audit: <a href="mailto:audit@ailydian.com" className="text-[#10A37F]">audit@ailydian.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-[#111827] border border-[#374151] rounded-xl p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="space-y-3 text-[#E5E7EB]">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ml-4 mt-3">
      <h3 className="text-lg font-semibold mb-2 text-[#10A37F]">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
