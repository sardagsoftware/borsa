/**
 * SHARD_11.3 - Privacy Policy Page
 * Comprehensive privacy policy
 *
 * Security: GDPR compliant, transparent data practices
 * White Hat: User rights, clear language
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası - Ailydian Messaging',
  description: 'Ailydian Messaging gizlilik politikası. Verileriniz nasıl korunur ve işlenir.',
  robots: 'index, follow'
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">🔒 Gizlilik Politikası</h1>
        <p className="text-[#9CA3AF]">Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
      </div>

      <div className="space-y-8 prose prose-invert max-w-none">
        <Section title="1. Giriş">
          <p>
            Ailydian Messaging, kullanıcı gizliliğini en üst düzeyde ciddiye alan bir E2EE (uçtan uca şifreli)
            mesajlaşma platformudur. Bu gizlilik politikası, verilerinizin nasıl toplandığını, kullanıldığını
            ve korunduğunu açıklar.
          </p>
        </Section>

        <Section title="2. Zero-Knowledge Mimarisi">
          <p className="font-semibold text-[#10A37F]">
            ✓ Mesajlarınızı okuyamayız
          </p>
          <p className="font-semibold text-[#10A37F]">
            ✓ Dosyalarınızı göremeyiz
          </p>
          <p className="font-semibold text-[#10A37F]">
            ✓ Aramalarınızı dinleyemeyiz
          </p>
          <p>
            Tüm içerikleriniz Signal Protokolü kullanılarak uçtan uca şifrelenir.
            Şifreleme anahtarları sadece sizin cihazlarınızda saklanır.
            Sunucularımız sadece şifrelenmiş veriyi taşır, asla çözemez.
          </p>
        </Section>

        <Section title="3. Toplanan Veriler">
          <SubSection title="3.1. Şifreli Veriler (Zero-Knowledge)">
            <ul>
              <li>💬 Mesaj içerikleri (E2EE)</li>
              <li>📁 Dosya içerikleri (AES-256-GCM)</li>
              <li>🎥 Video/audio içerikleri (SFrame E2EE)</li>
              <li>📍 Konum verileri (AES-256-GCM)</li>
            </ul>
            <p className="text-sm text-[#10A37F]">
              ✓ Bu veriler sunucuda ASLA çözülmez. Sadece siz görebilirsiniz.
            </p>
          </SubSection>

          <SubSection title="3.2. Metadata (İstatistiksel)">
            <ul>
              <li>📊 Mesaj sayısı (içerik değil)</li>
              <li>⏱️ Zaman damgaları</li>
              <li>📱 Cihaz bilgileri (OS, tarayıcı)</li>
              <li>🌐 IP adresi (geçici, 30 gün)</li>
            </ul>
            <p className="text-sm text-[#9CA3AF]">
              Bu metadata hizmetin çalışması için gereklidir ancak içerik bilgisi içermez.
            </p>
          </SubSection>

          <SubSection title="3.3. Hesap Bilgileri">
            <ul>
              <li>📧 E-posta adresi</li>
              <li>🔑 Şifrelenmiş şifre hash (bcrypt)</li>
              <li>📅 Kayıt tarihi</li>
              <li>💳 Ödeme bilgileri (3. parti işlemci, PCI DSS uyumlu)</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="4. Veri Kullanımı">
          <ul>
            <li>✓ Hizmeti sağlamak için</li>
            <li>✓ Güvenlik açıklarını tespit etmek için</li>
            <li>✓ Kullanım istatistikleri (anonim) için</li>
            <li>✓ Yasal yükümlülükler için (sadece metadata)</li>
          </ul>
          <p className="font-semibold text-[#EF4444]">
            ✗ Asla reklam için kullanılmaz
          </p>
          <p className="font-semibold text-[#EF4444]">
            ✗ Asla 3. partilere satılmaz
          </p>
        </Section>

        <Section title="5. Veri Saklama">
          <ul>
            <li>💬 Mesajlar: Tier'a göre (Free: 30 gün, Pro: 365 gün, Enterprise: sınırsız)</li>
            <li>📁 Dosyalar: Tier'a göre (Free: 7 gün, Pro: 90 gün, Enterprise: sınırsız)</li>
            <li>📊 Metadata: 90 gün</li>
            <li>🌐 IP logları: 30 gün</li>
          </ul>
        </Section>

        <Section title="6. Kullanıcı Hakları (GDPR)">
          <ul>
            <li>📥 Verilerinizi indirme hakkı</li>
            <li>🗑️ Verilerinizi silme hakkı (Right to be forgotten)</li>
            <li>✏️ Verilerinizi düzeltme hakkı</li>
            <li>🚫 İşlemeyi durdurma hakkı</li>
            <li>📤 Veri taşınabilirliği hakkı</li>
          </ul>
          <p>
            Bu haklarınızı kullanmak için: <strong>privacy@ailydian.com</strong>
          </p>
        </Section>

        <Section title="7. Çerezler">
          <p>
            Sadece teknik çerezler kullanırız:
          </p>
          <ul>
            <li>🔐 Oturum yönetimi (httpOnly, secure)</li>
            <li>⚙️ Tercihler (tema, dil)</li>
          </ul>
          <p className="text-sm text-[#10A37F]">
            ✓ Reklam çerezi YOK
          </p>
          <p className="text-sm text-[#10A37F]">
            ✓ Takip çerezi YOK
          </p>
        </Section>

        <Section title="8. Üçüncü Parti Hizmetler">
          <ul>
            <li>💳 Ödeme işlemcisi (Stripe - PCI DSS uyumlu)</li>
            <li>📧 E-posta sağlayıcı (şifrelenmiş iletişim)</li>
            <li>☁️ Hosting (Azure - SOC 2 uyumlu)</li>
          </ul>
          <p className="text-sm">
            Tüm 3. parti hizmetler GDPR uyumludur ve veri işleme sözleşmeleri imzalanmıştır.
          </p>
        </Section>

        <Section title="9. Güvenlik Önlemleri">
          <ul>
            <li>🔐 E2EE (Signal Protokolü)</li>
            <li>🔑 Zero-knowledge mimarisi</li>
            <li>🛡️ TLS 1.3 transport security</li>
            <li>🔒 At-rest encryption (AES-256)</li>
            <li>👤 2FA (Two-Factor Authentication)</li>
            <li>📱 Cihaz yönetimi ve güven sistemi</li>
            <li>🚨 Otomatik tehdit algılama</li>
          </ul>
        </Section>

        <Section title="10. Çocukların Gizliliği">
          <p>
            Hizmetimiz 13 yaş altı çocuklara yönelik değildir.
            13 yaş altı kullanıcılardan bilerek veri toplamayız.
          </p>
        </Section>

        <Section title="11. Değişiklikler">
          <p>
            Bu politika değişebilir. Önemli değişiklikler e-posta ile bildirilir.
            Son güncelleme tarihi sayfa başında belirtilir.
          </p>
        </Section>

        <Section title="12. İletişim">
          <div className="bg-[#1F2937] p-4 rounded-lg">
            <p className="font-semibold mb-2">Gizlilik soruları için:</p>
            <p>📧 E-posta: <a href="mailto:privacy@ailydian.com" className="text-[#10A37F]">privacy@ailydian.com</a></p>
            <p>🔐 DPO: <a href="mailto:dpo@ailydian.com" className="text-[#10A37F]">dpo@ailydian.com</a></p>
            <p>📍 Adres: Ailydian, İstanbul, Türkiye</p>
          </div>
        </Section>
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
