/**
 * SHARD_11.4 - Terms of Service Page
 * Clear and fair terms
 *
 * Security: Legal protection, user rights
 * White Hat: Fair usage, no hidden clauses
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kullanım Koşulları - Ailydian Messaging',
  description: 'Ailydian Messaging kullanım koşulları ve hizmet şartları.',
  robots: 'index, follow'
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">📜 Kullanım Koşulları</h1>
        <p className="text-[#9CA3AF]">Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
        <p className="text-[#9CA3AF] mt-2">Yürürlük tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
      </div>

      <div className="space-y-8">
        <Section title="1. Hizmet Tanımı">
          <p>
            Ailydian Messaging ("Hizmet"), uçtan uca şifrelenmiş (E2EE) güvenli mesajlaşma platformudur.
            Signal Protokolü kullanarak mesajlarınızı, dosyalarınızı ve aramalarınızı korur.
          </p>
          <p className="font-semibold text-[#10A37F]">
            Bu Hizmeti kullanarak, bu koşulları kabul etmiş sayılırsınız.
          </p>
        </Section>

        <Section title="2. Hesap Oluşturma">
          <ul>
            <li>✓ 13 yaş ve üzeri olmalısınız</li>
            <li>✓ Doğru ve güncel bilgi sağlamalısınız</li>
            <li>✓ Hesap güvenliğinden siz sorumlusunuz</li>
            <li>✓ Şifrenizi kimseyle paylaşmamalısınız</li>
            <li>✓ Bir kişi bir hesap oluşturabilir</li>
          </ul>
          <p className="text-sm text-[#9CA3AF]">
            Sahte bilgi sağlamak veya başkası adına hesap oluşturmak yasaktır.
          </p>
        </Section>

        <Section title="3. Kabul Edilebilir Kullanım">
          <SubSection title="3.1. İZİN VERİLEN Kullanım">
            <ul>
              <li>✓ Kişisel iletişim</li>
              <li>✓ İş görüşmeleri</li>
              <li>✓ Dosya paylaşımı (yasal içerik)</li>
              <li>✓ Video/audio aramalar</li>
              <li>✓ Grup mesajlaşma</li>
            </ul>
          </SubSection>

          <SubSection title="3.2. YASAK Kullanım">
            <ul className="text-[#EF4444]">
              <li>✗ Spam veya unsolicited mesajlar</li>
              <li>✗ Zararlı yazılım dağıtımı</li>
              <li>✗ Telif hakkı ihlali</li>
              <li>✗ Taciz veya tehdit</li>
              <li>✗ Yasa dışı içerik paylaşımı</li>
              <li>✗ Kimlik avı (phishing)</li>
              <li>✗ Botlar veya otomasyonlar (izinsiz)</li>
              <li>✗ Sistemi manipüle etme girişimleri</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="4. Abonelik ve Ödemeler">
          <SubSection title="4.1. Planlar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <PlanCard title="Free" price="$0/ay" features={[
                '100 mesaj/gün',
                '10 MB dosya',
                '30dk arama/gün',
                'Temel özellikler'
              ]} />
              <PlanCard title="Pro" price="$9.99/ay" features={[
                '1000 mesaj/gün',
                '100 MB dosya',
                '10 GB depolama',
                'Gelişmiş özellikler'
              ]} />
              <PlanCard title="Enterprise" price="$49.99/ay" features={[
                'Sınırsız mesaj',
                '1 GB dosya',
                '1 TB depolama',
                'Tüm özellikler'
              ]} />
            </div>
          </SubSection>

          <SubSection title="4.2. Ödeme Koşulları">
            <ul>
              <li>💳 Ödemeler Stripe üzerinden işlenir (PCI DSS uyumlu)</li>
              <li>🔄 Otomatik yenileme (iptal edilene kadar)</li>
              <li>💰 İade: İlk 7 gün içinde tam iade</li>
              <li>📧 Fatura e-posta ile gönderilir</li>
            </ul>
          </SubSection>

          <SubSection title="4.3. İptal ve İade">
            <ul>
              <li>✓ İstediğiniz zaman iptal edebilirsiniz</li>
              <li>✓ İptal: Dönem sonuna kadar erişim devam eder</li>
              <li>✓ İade: İlk 7 gün tam iade, sonrası pro-rata</li>
              <li>✓ Downgrade: Dönem sonunda geçerli olur</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="5. İçerik ve Sorumluluk">
          <p className="font-semibold">
            E2EE sayesinde içeriğinizi göremeyiz, bu yüzden:
          </p>
          <ul>
            <li>✓ Paylaştığınız içerikten SİZ sorumlusunuz</li>
            <li>✓ Yasal sorunlar sizinle ilgilidir</li>
            <li>✓ Telif hakkı ihlalleri size aittir</li>
          </ul>
          <p className="text-sm text-[#9CA3AF] mt-3">
            Metadata bazlı (içeriksiz) şikayetlerde hesap askıya alınabilir.
          </p>
        </Section>

        <Section title="6. Fikri Mülkiyet">
          <ul>
            <li>© Ailydian Messaging marka ve logoları Ailydian'a aittir</li>
            <li>© Yazılım kaynak kodu telif hakkı ile korunmaktadır</li>
            <li>✓ Kullanıcı içeriği kullanıcıya aittir</li>
            <li>✓ Lisans: Kişisel kullanım için sınırlı lisans</li>
          </ul>
        </Section>

        <Section title="7. Hizmet Garantisi ve Sorumluluk">
          <ul>
            <li>🎯 Uptime hedefi: %99.5 (Enterprise için SLA)</li>
            <li>⚠️ "OLDUĞU GİBİ" sunulur, garanti verilmez</li>
            <li>🚫 Dolaylı zararlardan sorumluluk kabul edilmez</li>
            <li>💰 Maksimum sorumluluk: Son 12 ay ödeme toplamı</li>
          </ul>
        </Section>

        <Section title="8. Hesap Askıya Alma ve Sonlandırma">
          <SubSection title="8.1. Biz tarafından">
            <p>Hesabınızı askıya alabilir veya sonlandırabiliriz:</p>
            <ul>
              <li>• Koşulların ihlali durumunda</li>
              <li>• Yasadışı faaliyet şüphesinde</li>
              <li>• Spam veya kötüye kullanım tespitinde</li>
              <li>• Ödeme başarısızlığında (30 gün sonra)</li>
            </ul>
            <p className="text-sm text-[#F59E0B]">
              ⚠️ Ciddi ihlallerde anında sonlandırma yapılabilir.
            </p>
          </SubSection>

          <SubSection title="8.2. Sizin tarafınızdan">
            <p>Hesabınızı istediğiniz zaman silebilirsiniz:</p>
            <ul>
              <li>✓ Dashboard → Ayarlar → Hesabı Sil</li>
              <li>✓ Tüm verileriniz 30 gün içinde silinir</li>
              <li>✓ E2EE verileri hemen silinir</li>
              <li>✓ Backup'lar 90 gün içinde imha edilir</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="9. Yasal Yükümlülükler">
          <ul>
            <li>⚖️ Türk yasalarına tabidir</li>
            <li>🇪🇺 GDPR uyumludur</li>
            <li>🇺🇸 COPPA uyumludur (13 yaş sınırı)</li>
            <li>📜 Mahkeme kararıyla metadata (sadece) paylaşılabilir</li>
          </ul>
          <p className="text-sm text-[#10A37F] mt-3">
            ✓ E2EE içeriği mahkeme kararıyla bile paylaşılamaz (zero-knowledge)
          </p>
        </Section>

        <Section title="10. Değişiklikler">
          <ul>
            <li>📧 Önemli değişiklikler 30 gün önceden bildirilir</li>
            <li>✓ Devam eden kullanım = Kabul</li>
            <li>🚫 Kabul etmiyorsanız hesabınızı silin</li>
          </ul>
        </Section>

        <Section title="11. Uyuşmazlık Çözümü">
          <ul>
            <li>🤝 İlk olarak iletişim yoluyla çözüm aranır</li>
            <li>⚖️ Arabuluculuk (6 ay içinde)</li>
            <li>🏛️ İstanbul mahkemeleri yetkilidir</li>
            <li>📜 Türk hukuku uygulanır</li>
          </ul>
        </Section>

        <Section title="12. İletişim">
          <div className="bg-[#1F2937] p-4 rounded-lg">
            <p className="font-semibold mb-2">Sorularınız için:</p>
            <p>📧 Genel: <a href="mailto:support@ailydian.com" className="text-[#10A37F]">support@ailydian.com</a></p>
            <p>⚖️ Hukuk: <a href="mailto:legal@ailydian.com" className="text-[#10A37F]">legal@ailydian.com</a></p>
            <p>🔐 Güvenlik: <a href="mailto:security@ailydian.com" className="text-[#10A37F]">security@ailydian.com</a></p>
          </div>
        </Section>

        <div className="bg-[#10A37F]/10 border border-[#10A37F] rounded-xl p-6 mt-8">
          <p className="text-center font-semibold">
            ✓ Bu koşulları okuyarak hizmeti kullanmaya başlayabilirsiniz.
          </p>
          <p className="text-center text-sm text-[#9CA3AF] mt-2">
            Sorularınız varsa support@ailydian.com adresinden bize ulaşın.
          </p>
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

function PlanCard({ title, price, features }: { title: string; price: string; features: string[] }) {
  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-lg p-4">
      <h4 className="font-bold text-lg mb-1">{title}</h4>
      <p className="text-[#10A37F] font-bold text-xl mb-3">{price}</p>
      <ul className="text-sm space-y-1">
        {features.map((feature, i) => (
          <li key={i} className="text-[#9CA3AF]">• {feature}</li>
        ))}
      </ul>
    </div>
  );
}
