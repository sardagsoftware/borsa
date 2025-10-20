// LCI Web - FAQ Schema.org Structured Data
// White-hat: Improves SEO visibility with FAQ rich snippets

import Script from 'next/script';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSchemaProps {
  faqs: FAQItem[];
}

/**
 * FAQSchema Component
 *
 * Generates Schema.org structured data for FAQ pages using:
 * - FAQPage schema
 *
 * Benefits:
 * - Rich snippets in "People also ask" boxes
 * - Increased visibility in Google search
 * - Better user engagement
 * - Featured snippet opportunities
 *
 * Best Practices:
 * - Keep questions concise (< 100 chars)
 * - Provide detailed answers (100-300 words)
 * - Use natural language
 * - Focus on common user queries
 */
export function FAQSchema({ faqs }: FAQSchemaProps) {
  // Schema.org FAQPage structure
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      strategy="afterInteractive"
    />
  );
}

/**
 * Pre-defined FAQs for LCI Platform
 */
export const LCI_FAQS: FAQItem[] = [
  {
    question: 'LCI nedir ve nasıl çalışır?',
    answer:
      'Lydian Complaint Intelligence (LCI), Türkiye\'deki tüketicilerin markalarla ilgili şikayetlerini şeffaf bir şekilde yönetebilecekleri bir platformdur. Kullanıcılar şikayetlerini gönderir, markalar bu şikayetlere yanıt verir ve süreç tam şeffaflıkla takip edilir. Platform KVKK ve GDPR uyumlu olarak çalışır.',
  },
  {
    question: 'Şikayetim ne kadar sürede markaya ulaşır?',
    answer:
      'Şikayetiniz onaylandıktan sonra anında markaya iletilir. Normal şikayetler için markalar 24 saat içinde ilk yanıtı vermekle yükümlüdür. Kritik şikayetler için bu süre 4 saattir. Tüm şikayetlerin 72 saat içinde çözüme kavuşturulması hedeflenir.',
  },
  {
    question: 'LCI platformu ücretsiz mi?',
    answer:
      'Evet, LCI platformu tüketiciler için tamamen ücretsizdir. Şikayet gönderme, takip etme ve çözüm sürecinin tamamı için herhangi bir ücret alınmaz. Markalar için farklı abonelik seçenekleri mevcuttur.',
  },
  {
    question: 'Verilerim güvende mi? KVKK uyumlu musunuz?',
    answer:
      'LCI platformu KVKK (Kişisel Verilerin Korunması Kanunu) ve GDPR uyumlu olarak çalışır. Tüm kişisel verileriniz şifrelenir, PII (Personally Identifiable Information) otomatik olarak maskelenir. Verilerinizi dilediğiniz zaman indirebilir veya silebilirsiniz. Platforma gönderilen tüm şikayetler otomatik moderasyondan geçer.',
  },
  {
    question: 'Şikayetimi nasıl takip edebilirim?',
    answer:
      'Dashboard\'unuzdan tüm şikayetlerinizi görebilir ve durumlarını takip edebilirsiniz. Şikayetler 6 farklı durumda olabilir: Taslak, Açık, İşlemde, Çözüldü, Yükseltildi ve Reddedildi. Her durum değişikliğinde ve marka yanıtında bildirim alırsınız.',
  },
  {
    question: 'Markam kaç sürede şikayete yanıt vermeli?',
    answer:
      'SLA (Service Level Agreement) kurallarımıza göre, markalar normal şikayetlere 24 saat içinde ilk yanıtı vermelidir. Kritik şikayetler için bu süre 4 saattir. Tüm şikayetlerin 72 saat içinde çözülmesi beklenir. SLA ihlalleri otomatik olarak takip edilir.',
  },
  {
    question: 'Delil dosyası yükleyebilir miyim?',
    answer:
      'Evet, her şikayete en fazla 10 adet delil dosyası yükleyebilirsiniz. Desteklenen formatlar: PDF, JPG, PNG, HEIC. Maksimum dosya boyutu 10 MB\'dir. Tüm dosyalar güvenlik taramasından geçer ve KVKK uyumlu olarak saklanır.',
  },
  {
    question: 'Hesabımı ve verilerimi nasıl silebilirim?',
    answer:
      'KVKK haklarınız kapsamında verilerinizi dilediğiniz zaman silebilirsiniz. Dashboard > Ayarlar > Veri İşlemleri bölümünden "Verilerimi Sil" seçeneğini kullanabilirsiniz. Aktif şikayetiniz yoksa silme talebi hemen işleme alınır. 30 gün içinde verileriniz anonimleştirilir.',
  },
];

/**
 * Brand-specific FAQs
 */
export const BRAND_FAQS: FAQItem[] = [
  {
    question: 'Markamla ilgili şikayetlere nasıl erişebilirim?',
    answer:
      'Brand Agent veya üst yetkili hesabınızla giriş yaparak dashboard\'dan markamızla ilgili tüm şikayetleri görebilirsiniz. Şikayetler aciliyet durumuna göre sıralanır ve SLA takibi yapılır.',
  },
  {
    question: 'SLA nedir ve nasıl hesaplanır?',
    answer:
      'SLA (Service Level Agreement), şikayetlere yanıt verme ve çözme sürelerini belirleyen anlaşmadır. İlk yanıt SLA\'sı normal şikayetler için 24 saat, kritik şikayetler için 4 saattir. Çözüm SLA\'sı tüm şikayetler için 72 saattir. SLA uyumluluk oranınız dashboard\'da görüntülenir.',
  },
  {
    question: 'Şikayete nasıl yanıt veririm?',
    answer:
      'Şikayet detay sayfasından "Yanıt Ver" butonunu kullanarak doğrudan yanıt verebilirsiniz. İlk yanıt verildiğinde şikayet otomatik olarak "İşlemde" durumuna geçer. Her yanıt audit log\'da kaydedilir.',
  },
];
