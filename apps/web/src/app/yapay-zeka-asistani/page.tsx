import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ailydian.com'),
  title: 'Yapay Zeka Asistanı | Ailydian - Kişisel AI Asistan',
  description:
    'Ailydian yapay zeka asistanı ile kişisel verimlilik, iş, eğitim, kodlama, içerik yazma, veri analizi ve çeviri işlerinizi kolaylaştırın. Çoklu AI motorlu, 41+ dil destekli, sesli etkileşimli, KVKK ve GDPR uyumlu akıllı dijital asistan.',
  keywords: [
    'yapay zeka asistanı',
    'ai asistan',
    'kişisel yapay zeka',
    'akıllı asistan',
    'sanal asistan',
    'dijital asistan',
    'yapay zeka sohbet',
    'ai chat türkçe',
    'sesli yapay zeka',
    'yapay zeka chatbot',
    'ai yardımcı',
    'kişisel ai asistan',
    'türkçe ai asistan',
    'yapay zeka destekli asistan',
    'çoklu ai asistan',
    'iş asistanı ai',
    'eğitim asistanı ai',
    'kod yazma asistanı',
    'yapay zeka ile verimlilik',
    'akıllı dijital yardımcı',
    'sesli ai asistan',
    'yapay zeka danışman',
    'ai powered assistant türkiye',
    'online yapay zeka asistanı',
  ],
  alternates: {
    canonical: 'https://www.ailydian.com/yapay-zeka-asistani',
    languages: {
      tr: 'https://www.ailydian.com/yapay-zeka-asistani',
      en: 'https://www.ailydian.com/en/ai-assistant',
    },
  },
  openGraph: {
    title: 'Yapay Zeka Asistanı | Ailydian - Kişisel AI Asistan',
    description:
      'Çoklu AI motorlu, 41+ dil destekli, sesli etkileşimli yapay zeka asistanı. Kişisel verimlilik, iş, eğitim ve kodlama için akıllı dijital yardımcınız.',
    url: 'https://www.ailydian.com/yapay-zeka-asistani',
    siteName: 'Ailydian',
    locale: 'tr_TR',
    type: 'article',
    images: [
      {
        url: 'https://www.ailydian.com/og-yapay-zeka-asistani.png',
        width: 1200,
        height: 630,
        alt: 'Ailydian Yapay Zeka Asistanı - Kişisel AI Asistan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yapay Zeka Asistanı | Ailydian',
    description:
      'Çoklu AI motorlu, sesli etkileşimli yapay zeka asistanı. Kişisel verimlilik, iş, eğitim ve kodlama için akıllı dijital yardımcınız.',
    images: ['https://www.ailydian.com/og-yapay-zeka-asistani.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export default function YapayZekaAsistaniPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://www.ailydian.com/yapay-zeka-asistani#software',
        name: 'Ailydian Yapay Zeka Asistanı',
        applicationCategory: 'ProductivityApplication',
        applicationSubCategory: 'Artificial Intelligence Assistant',
        operatingSystem: 'Web',
        description:
          'Ailydian yapay zeka asistanı, çoklu AI motorları ile kişisel verimlilik, iş süreçleri, eğitim, kodlama, içerik üretimi, veri analizi ve çeviri alanlarında akıllı dijital yardım sunar. 41+ dil desteği, sesli etkileşim, KVKK ve GDPR uyumlu güvenlik altyapısı ile Türkiye\'nin en kapsamlı AI asistanıdır.',
        featureList: [
          'Çoklu AI Motoru ile Akıllı Yönlendirme',
          '41+ Dilde Doğal Dil Desteği',
          'Sesli Etkileşim ve Konuşma Tanıma',
          'Kod Yazma, Debugging ve Optimizasyon',
          'Veri Analizi ve Raporlama',
          'İçerik Üretimi ve SEO Optimizasyonu',
          'Profesyonel Çeviri ve Yerelleştirme',
          'Doküman Analizi ve Özetleme',
          'KVKK ve GDPR Uyumlu Veri Güvenliği',
          'Kişiselleştirilebilir Asistan Profili',
          'Sektörel Uzmanlık Modları',
          '7/24 Kesintisiz Hizmet',
        ],
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'TRY',
          description: 'Ücretsiz başlangıç planı, kurumsal planlar mevcut',
          availability: 'https://schema.org/InStock',
        },
        softwareVersion: '2.0',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '3150',
          bestRating: '5',
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://www.ailydian.com/yapay-zeka-asistani#faq',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Yapay zeka asistanı nedir ve nasıl çalışır?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yapay zeka asistanı, doğal dil işleme (NLP) ve makine öğrenmesi teknolojilerini kullanarak kullanıcılarla metin veya ses yoluyla iletişim kuran akıllı yazılımlardır. Ailydian AI asistanı, çoklu yapay zeka motorları sayesinde her sorguyu analiz eder, en uygun AI motorunu otomatik seçer ve doğal bir dilde yüksek kaliteli yanıt üretir. Kullanıcı girdisini anlama, bağlam yönetimi, model seçimi ve yanıt üretimi aşamalarıyla çalışır.',
            },
          },
          {
            '@type': 'Question',
            name: 'Ailydian AI asistanının diğer asistanlardan farkı nedir?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Ailydian, tek bir yapay zeka motoru yerine çoklu AI motoru yaklaşımını benimser. Her görev için en uygun yapay zeka motorunu otomatik seçerek optimal sonuçlar sağlar. Kod yazma, analiz, çeviri ve genel sohbet gibi farklı görevler için farklı uzman modeller kullanılır. 41+ dil desteği, sesli etkileşim, KVKK/GDPR uyumlu güvenlik ve Türkçe optimize performans ile fark yaratır.',
            },
          },
          {
            '@type': 'Question',
            name: 'AI asistan hangi görevleri yerine getirebilir?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Ailydian AI asistanı geniş bir görev yelpazesini destekler: metin yazma ve düzenleme, kod yazma ve hata ayıklama, veri analizi ve raporlama, profesyonel çeviri, doküman özetleme, e-posta yazımı, pazar araştırması, eğitim desteği, sağlık sorguları rehberliği, içerik üretimi, proje planlama ve daha fazlası.',
            },
          },
          {
            '@type': 'Question',
            name: 'Sesli yapay zeka asistanı nasıl kullanılır?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Ailydian sesli asistan özelliği, konuşma tanıma teknolojisi ile sözlü komutlarınızı anlayarak işler ve ses sentezi ile sesli yanıt verir. Mikrofon simgesine tıklayarak sesli modu etkinleştirebilirsiniz. Eller serbest kullanım, daha doğal etkileşim ve erişilebilirlik avantajları sunar. Türkçe dahil desteklenen tüm dillerde sesli iletişim mümkündür.',
            },
          },
          {
            '@type': 'Question',
            name: 'AI asistanı iş hayatında nasıl verimlilik sağlar?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'AI asistan iş hayatında e-posta yazımı, rapor hazırlama, toplantı özetleme, pazar araştırması, müşteri hizmetleri otomasyonu, veri analizi, sunum hazırlama ve proje yönetimi gibi alanlarda kullanılır. Araştırmalar, yapay zeka asistanı kullanımının çalışan verimliliğini ortalama %40 artırdığını göstermektedir. Ailydian, kurumsal ihtiyaçlar için özel optimizasyonlar sunar.',
            },
          },
          {
            '@type': 'Question',
            name: 'Yapay zeka asistanı verilerimi güvende tutuyor mu?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Evet, Ailydian yapay zeka asistanı kurumsal düzeyde veri güvenliği sağlar. Tüm veriler uçtan uca şifreleme ile korunur, KVKK ve GDPR mevzuatına tam uyumludur. Verileriniz yapay zeka motorlarını eğitmek için kullanılmaz ve açık izniniz olmadan üçüncü taraflarla paylaşılmaz. Rol tabanlı erişim kontrolü ve kapsamlı denetim günlükleri mevcuttur.',
            },
          },
          {
            '@type': 'Question',
            name: 'AI asistan geleneksel arama motorlarından nasıl farklıdır?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Geleneksel arama motorları sizi web sayfalarına yönlendirir ve bilgiyi siz süzmeniz gerekir. Ailydian AI asistanı ise sorularınızı doğrudan yanıtlar, bağlamı anlar, takip sorularınıza uyum sağlar ve kişiselleştirilmiş çözümler sunar. Arama motoru onlarca sonuç listelerken, AI asistan doğrudan uygulanabilir cevaplar, kod örnekleri, analizler ve yaratıcı içerikler üretir.',
            },
          },
          {
            '@type': 'Question',
            name: 'Ailydian AI asistanı ücretsiz mi kullanılabilir?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Evet, Ailydian ücretsiz başlangıç planı sunmaktadır. Bireysel kullanıcılar temel AI asistan özelliklerine günlük sınırlı sayıda erişim sağlayabilir. İşletmeler ve yoğun kullanım için kurumsal planlar mevcuttur. Kurumsal planlar sınırsız kullanım, özel model yönlendirme kuralları, SLA garantileri ve 7/24 destek içerir.',
            },
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://www.ailydian.com/yapay-zeka-asistani#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Ana Sayfa',
            item: 'https://www.ailydian.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Yapay Zeka',
            item: 'https://www.ailydian.com/yapay-zeka',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Yapay Zeka Asistanı',
            item: 'https://www.ailydian.com/yapay-zeka-asistani',
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gray-800">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Yapay Zeka Asistanı: Kişisel AI Yardımcınız
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4">
                Ailydian yapay zeka asistanı ile hayatınızı kolaylaştırın. Çoklu AI motorları,
                41+ dil desteği, sesli etkileşim ve KVKK uyumlu güvenlik altyapısı ile
                Türkiye&apos;nin en kapsamlı kişisel AI asistanı.
              </p>
              <p className="text-lg text-gray-400 mb-8">
                İş, eğitim, kodlama, içerik üretimi, veri analizi ve çeviri gibi
                onlarca alanda yapay zeka destekli akıllı dijital yardımcınız her an yanınızda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/chat"
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Hemen Deneyin - Ücretsiz
                </Link>
                <Link
                  href="/coklu-yapay-zeka"
                  className="px-8 py-4 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-all border border-gray-700"
                >
                  Çoklu AI Motorunu Keşfedin
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* AI Asistan Nedir Section */}
        <section className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-16">
            <article className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-8 text-center">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  AI Asistan Nedir?
                </span>
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-gray-300 mb-6">
                  Yapay zeka asistanı (AI assistant), doğal dil işleme (NLP) ve makine öğrenmesi
                  teknolojilerini kullanarak insanlarla metin veya ses yoluyla iletişim kuran,
                  geniş bir görev yelpazesini yerine getirebilen akıllı yazılım sistemleridir.
                  Geleneksel yazılımların aksine, AI asistanlar kullanıcının niyetini anlayabilir,
                  bağlamı koruyabilir, yaratıcı çözümler üretebilir ve zamanla daha iyi
                  performans gösterebilir. Günümüzde yapay zeka asistanları, kişisel
                  verimlilikten kurumsal iş süreçlerine kadar hayatın her alanında vazgeçilmez
                  dijital yardımcılara dönüşmüştür.
                </p>
                <p className="text-lg text-gray-300 mb-6">
                  Modern yapay zeka asistanları, basit soru-cevap sistemlerinin çok ötesine
                  geçmiştir. Karmaşık soruları anlayabilir, uzun sohbetlerde bağlamı
                  koruyabilir, birden fazla adımlık görevleri planlayabilir, kod yazabilir,
                  veri analizi yapabilir, içerik üretebilir ve hatta yaratıcı projeler
                  geliştirebilirler. Ailydian AI asistanı, bu yeteneklerin tamamını çoklu
                  yapay zeka motoru mimarisi ile bir üst seviyeye taşır.
                </p>
                <p className="text-lg text-gray-300 mb-6">
                  Ailydian yapay zeka asistanı, geleneksel tek motorlu platformlardan temel
                  bir farkla ayrılır: çoklu AI motoru yaklaşımı. Her sorgunun türünü ve
                  dilini otomatik analiz ederek, o görev için en yüksek performansı sağlayacak
                  yapay zeka motorunu seçer. Kod yazma görevi için uzman kod motoru, Türkçe
                  sohbet için Türkçe optimize sistemi, analiz görevi için analitik motor
                  devreye girer. Bu akıllı yönlendirme sistemi sayesinde her alanda üstün
                  sonuçlar elde edersiniz.
                </p>
                <p className="text-lg text-gray-300">
                  Türkiye, yapay zeka kullanımında dünya genelinde %94.49 oranı ile lider
                  konumdadır. Bu yüksek benimsenme oranı, Türk kullanıcıların dijital
                  dönüşüme ve yapay zeka teknolojilerine olan güçlü ilgisini yansıtır.
                  Ailydian yapay zeka asistanı, Türkçe doğal dil işleme konusunda özel olarak
                  optimize edilmiş motorları ile bu liderliği destekler ve her Türk
                  kullanıcıya ana dilinde üstün AI deneyimi sunar.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Features Grid Section - 8 Cards */}
        <section className="border-b border-gray-800 bg-gray-900/30">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold mb-4 text-center">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Ailydian AI Asistanının Özellikleri
              </span>
            </h2>
            <p className="text-lg text-gray-400 mb-12 text-center max-w-3xl mx-auto">
              Gelişmiş yapay zeka motorları ile donatılmış kapsamlı özellik seti. Her ihtiyacınız
              için optimize edilmiş akıllı dijital yardımcı.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 hover:border-purple-600 transition-all">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-xl font-semibold mb-3">Çoklu AI Motoru</h3>
                <p className="text-gray-300 text-sm">
                  Her görev için en uygun yapay zeka motorunu otomatik seçen akıllı yönlendirme
                  sistemi. Tek motorlu asistanlardan üstün performans garantisi.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 hover:border-purple-600 transition-all">
                <div className="text-4xl mb-4">🎙️</div>
                <h3 className="text-xl font-semibold mb-3">Sesli Etkileşim</h3>
                <p className="text-gray-300 text-sm">
                  Konuşma tanıma ve ses sentezi ile doğal sesli iletişim. Eller serbest
                  kullanım, erişilebilirlik ve daha insan benzeri etkileşim deneyimi.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 hover:border-purple-600 transition-all">
                <div className="text-4xl mb-4">💻</div>
                <h3 className="text-xl font-semibold mb-3">Kod Yazma Asistanı</h3>
                <p className="text-gray-300 text-sm">
                  Python, JavaScript, TypeScript, Java, C++ ve daha fazlasında profesyonel
                  kod üretimi, hata ayıklama, refactoring ve kod inceleme desteği.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 hover:border-purple-600 transition-all">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold mb-3">41+ Dil Desteği</h3>
                <p className="text-gray-300 text-sm">
                  Türkçe dahil 41&apos;den fazla dilde yerel kalitede destek. Akıllı dil
                  algılama ve her dil için optimize edilmiş AI motor yönlendirmesi.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 hover:border-purple-600 transition-all">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-3">Veri Analizi</h3>
                <p className="text-gray-300 text-sm">
                  Büyük veri setlerinin analizi, görselleştirme, tahmin modelleme ve iş
                  zekası raporlama. Ham veriden uygulanabilir içgörüler çıkarın.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 hover:border-purple-600 transition-all">
                <div className="text-4xl mb-4">✍️</div>
                <h3 className="text-xl font-semibold mb-3">İçerik Üretimi</h3>
                <p className="text-gray-300 text-sm">
                  Makale, blog, sosyal medya, ürün açıklamaları ve pazarlama metinleri.
                  SEO optimize edilmiş, özgün ve profesyonel içerikler oluşturun.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 hover:border-purple-600 transition-all">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold mb-3">Güvenlik ve Gizlilik</h3>
                <p className="text-gray-300 text-sm">
                  KVKK ve GDPR uyumlu veri koruma. Uçtan uca şifreleme, rol tabanlı erişim
                  kontrolü ve denetim günlükleri ile kurumsal düzeyde güvenlik.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 hover:border-purple-600 transition-all">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-3">Kişiselleştirme</h3>
                <p className="text-gray-300 text-sm">
                  Kullanım alışkanlıklarınıza göre adapte olan asistan. Tercihlerinizi
                  öğrenir, yanıt stilini uyarlar ve giderek daha kişisel hizmet sunar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Nasıl Kullanılır - 4 Steps */}
        <section className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold mb-4 text-center">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Nasıl Kullanılır?
              </span>
            </h2>
            <p className="text-lg text-gray-400 mb-12 text-center max-w-3xl mx-auto">
              Ailydian yapay zeka asistanını kullanmaya başlamak sadece birkaç dakikanızı alır.
              Kayıt olun, ihtiyacınızı belirleyin ve hemen AI gücünden yararlanmaya başlayın.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur p-8 rounded-xl border border-gray-700 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3 mt-4">Hesap Oluşturun</h3>
                <p className="text-gray-300 text-sm">
                  E-posta adresi veya Google hesabınız ile saniyeler içinde ücretsiz
                  kaydolun. Kredi kartı gerekmez, hemen kullanmaya başlayın.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-8 rounded-xl border border-gray-700 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3 mt-4">Modunuzu Seçin</h3>
                <p className="text-gray-300 text-sm">
                  Genel sohbet, kod yazma, analiz, çeviri veya sektörel uzmanlık modlarından
                  ihtiyacınıza uygun olanı seçin. Otomatik mod da kullanabilirsiniz.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-8 rounded-xl border border-gray-700 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3 mt-4">Sorunuzu Sorun</h3>
                <p className="text-gray-300 text-sm">
                  Metin yazarak veya sesli komut vererek doğal dilde sorunuzu sorun.
                  AI asistanınız sorgunuzu anlayacak ve en uygun motoru devreye alacaktır.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-8 rounded-xl border border-gray-700 text-center relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <h3 className="text-xl font-semibold mb-3 mt-4">Sonuç Alın</h3>
                <p className="text-gray-300 text-sm">
                  Anında yüksek kaliteli AI yanıtları alın. Takip soruları sorun, sonuçları
                  düzenleyin, kopyalayın veya dışa aktarın. Sohbet geçmişiniz güvende saklanır.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="border-b border-gray-800 bg-gray-900/30">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold mb-4 text-center">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Kullanım Alanları
              </span>
            </h2>
            <p className="text-lg text-gray-400 mb-12 text-center max-w-3xl mx-auto">
              Ailydian yapay zeka asistanı, kişisel verimlilikten kurumsal iş süreçlerine,
              eğitimden yazılım geliştirmeye kadar onlarca farklı alanda kullanılabilir.
            </p>
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-purple-400">
                  Kişisel Verimlilik
                </h3>
                <p className="text-gray-300 mb-4">
                  Günlük hayatınızda yapay zeka asistanı, zamanınızı daha verimli kullanmanızı
                  sağlar. E-posta yazımı, taslak hazırlama, bilgi araştırma, plan oluşturma
                  ve organizasyon gibi rutin görevleri dakikalar içinde tamamlayabilirsiniz.
                  Ailydian AI asistanı, kişisel tercihlerinizi öğrenerek zaman içinde daha
                  verimli yardım sunar. Sabah brifinginizi hazırlamaktan, günlük yapılacaklar
                  listesi oluşturmaya, karmaşık hesaplamalardan yaratıcı projelere kadar
                  dijital yardımcınız her an yanınızdadır.
                </p>
              </div>

              <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-blue-400">
                  İş Dünyası ve Kurumsal Kullanım
                </h3>
                <p className="text-gray-300 mb-4">
                  İş hayatında yapay zeka asistanı, profesyonel e-posta ve iletişim yazımı,
                  rapor hazırlama, toplantı özetleri çıkarma, pazar araştırması, müşteri
                  hizmetleri otomasyonu ve stratejik planlama gibi alanlarda kritik değer
                  sağlar. Ailydian&apos;ın çoklu AI motoru yaklaşımı, finansal analiz için
                  analitik motorları, iletişim yazımı için dil uzmanı motorları ve stratejik
                  görevler için gelişmiş muhakeme motorlarını otomatik devreye alarak her
                  iş sürecinde optimal sonuç verir. Araştırmalar, AI asistan kullanımının
                  iş verimliliğini ortalama %40 artırdığını ortaya koymaktadır.
                </p>
              </div>

              <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-green-400">
                  Eğitim ve Akademik Destek
                </h3>
                <p className="text-gray-300 mb-4">
                  Öğrenciler ve akademisyenler için yapay zeka asistanı, kişiselleştirilmiş
                  öğrenme deneyimi sunar. Konu açıklamaları, soru çözümleri, ödev yardımı,
                  dil öğrenimi pratiği, sınav hazırlığı ve araştırma desteği sağlar. Ailydian
                  AI asistanı, öğrencinin seviyesine göre açıklamaları uyarlayarak her
                  bireye özel bir öğretmen deneyimi yaratır. Literatür tarama, kaynak bulma,
                  makale özetleme ve akademik yazım desteği ile akademisyenlerin araştırma
                  süreçlerini hızlandırır.
                </p>
              </div>

              <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  Sağlık Sorguları Rehberliği
                </h3>
                <p className="text-gray-300 mb-4">
                  Sağlık konularında genel bilgi araştırması, tıbbi terimlerin açıklanması,
                  beslenme ve egzersiz önerileri gibi alanlarda rehberlik sunar. Ailydian AI
                  asistanı, güvenilir kaynaklara dayalı bilgi sunarak kullanıcıların sağlık
                  okuryazarlığını artırır. Lütfen unutmayın: AI asistan tıbbi tanı veya
                  tedavi önerisi sağlamaz, profesyonel sağlık danışmanlığının yerini tutmaz.
                </p>
              </div>

              <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-pink-400">
                  Yazılım Geliştirme ve Kodlama
                </h3>
                <p className="text-gray-300 mb-4">
                  Geliştiriciler için yapay zeka asistanı, kod yazma sürecini köklü biçimde
                  dönüştürür. Python, JavaScript, TypeScript, Java, C++, Go, Rust ve daha
                  fazla dilde profesyonel kod üretimi, hata ayıklama, refactoring, kod
                  inceleme, test yazımı ve API dokümantasyonu desteği sağlar. Ailydian&apos;ın
                  özel{' '}
                  <Link href="/yapay-zeka-kodlama" className="text-blue-400 hover:underline">
                    yapay zeka ile kodlama
                  </Link>{' '}
                  motoru, karmaşık algoritmaları dakikalar içinde yazabilir ve yazılım
                  geliştiricilerin üretkenliğini ortalama %40 artırır.
                </p>
              </div>

              <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-red-400">
                  İçerik Yazma ve Çeviri
                </h3>
                <p className="text-gray-300 mb-4">
                  Dijital içerik üreticileri, pazarlamacılar ve yazarlar için güçlü bir
                  yardımcı. Blog yazıları, sosyal medya içerikleri, ürün açıklamaları,
                  reklam metinleri, basın bültenleri ve SEO optimize edilmiş makaleler
                  oluşturun. 41+ dil arasında profesyonel çeviri ve yerelleştirme
                  desteği ile global kitlelere ulaşın. Ailydian, hedef kitlenize ve
                  markanızın ses tonuna uygun içerikler üretir.
                </p>
              </div>

              <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
                  Veri Analizi ve Raporlama
                </h3>
                <p className="text-gray-300">
                  Ham verilerinizi anlamlı bilgiye dönüştürün. Ailydian AI asistanı, veri
                  setlerini analiz edebilir, trendleri tespit edebilir, tahmin modelleri
                  oluşturabilir ve görsel raporlar hazırlayabilir. Satış verileri, kullanıcı
                  davranışları, pazar trendleri veya finansal metrikler - hangi veri olursa
                  olsun, yapay zeka asistanınız uygulanabilir içgörüler sunar ve veri
                  odaklı karar almanızı destekler.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison with Traditional Search */}
        <section className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-16">
            <article className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-8 text-center">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  AI Asistan ile Geleneksel Arama Karşılaştırması
                </span>
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Geleneksel arama motorları bilgiye erişimde devrim yarattı, ancak yapay zeka
                asistanları bu deneyimi tamamen yeni bir boyuta taşır. İşte temel farklar:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-semibold mb-4 text-gray-400">Geleneksel Arama</h3>
                  <ul className="space-y-3 text-gray-400">
                    <li className="flex items-start">
                      <span className="mr-2 text-red-400">✕</span>
                      Web sayfalarına yönlendirir, bilgiyi siz süzersiniz
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-400">✕</span>
                      Her aramada bağlam sıfırlanır
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-400">✕</span>
                      Sonuçlar arasında dolaşarak cevap ararsınız
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-400">✕</span>
                      Kod yazma, analiz veya içerik üretme yapamaz
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-red-400">✕</span>
                      Kişiselleştirme sınırlıdır
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-800/30 p-6 rounded-xl border border-purple-700/50">
                  <h3 className="text-xl font-semibold mb-4 text-purple-400">Ailydian AI Asistan</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <span className="mr-2 text-green-400">✓</span>
                      Sorunuzu doğrudan yanıtlar, uygulanabilir çözüm sunar
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-green-400">✓</span>
                      Sohbet boyunca bağlamı korur ve takip soruları anlar
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-green-400">✓</span>
                      Tek bir yanıtta sentezlenmiş, doğrudan bilgi verir
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-green-400">✓</span>
                      Kod yazar, analiz yapar, içerik üretir, çevirir
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-green-400">✓</span>
                      Tercihlerinize göre kişiselleştirilmiş deneyim
                    </li>
                  </ul>
                </div>
              </div>
              <p className="text-lg text-gray-300 mt-8">
                Ailydian AI asistanı, bilgi aramanın ötesine geçerek bir dijital iş ortağı
                gibi çalışır. Sorunuzu sadece yanıtlamakla kalmaz, çözüm önerir, alternatifler
                sunar, uygulanabilir adımlar planlar ve sonuçları istediğiniz formatta
                hazırlar. Çoklu AI motoru yaklaşımı sayesinde her sorgu türünde uzman
                seviyesinde yanıtlar alırsınız.
              </p>
            </article>
          </div>
        </section>

        {/* Voice Interaction Section */}
        <section className="border-b border-gray-800 bg-gray-900/30">
          <div className="container mx-auto px-4 py-16">
            <article className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-8 text-center">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Sesli Yapay Zeka Asistanı
                </span>
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                Ailydian&apos;ın sesli etkileşim özelliği, yapay zeka asistanı deneyimini
                tamamen yeni bir boyuta taşır. Konuşma tanıma (Speech-to-Text) teknolojisi
                ile sözlü komutlarınızı anlayan ve ses sentezi (Text-to-Speech) ile sesli
                yanıt veren asistanımız, metin yazma gerektirmeden doğal bir iletişim
                deneyimi sunar.
              </p>
              <p className="text-lg text-gray-300 mb-6">
                Sesli yapay zeka asistanı, özellikle eller serbest kullanım gerektiren
                durumlarda büyük avantaj sağlar. Araba sürerken, yemek pişirirken veya
                spor yaparken bile AI asistanınızla iletişim kurabilirsiniz. Görme engelli
                kullanıcılar için erişilebilirlik açısından da kritik öneme sahiptir.
                Türkçe dahil desteklenen tüm dillerde sesli iletişim mümkündür ve konuşma
                tanıma doğruluk oranı Türkçe için özel olarak optimize edilmiştir.
              </p>
              <p className="text-lg text-gray-300">
                Sesli asistanı etkinleştirmek için sohbet arayüzündeki mikrofon simgesine
                dokunmanız yeterlidir. Konuşmanız otomatik olarak metne dönüştürülür,
                en uygun AI motoru tarafından işlenir ve yanıt hem metin hem de ses
                olarak size iletilir. Sesli etkileşim sırasında sohbet geçmişi ve bağlam
                yönetimi aynen metin tabanlı iletişimdeki gibi çalışır.
              </p>
            </article>
          </div>
        </section>

        {/* Security and Privacy Section */}
        <section className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-16">
            <article className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-8 text-center">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Güvenlik ve Gizlilik
                </span>
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Ailydian yapay zeka asistanı, kullanıcı verilerinin güvenliğini en üst
                düzeyde tutar. Kurumsal düzeyde güvenlik altyapısı ile verileriniz
                korunur ve gizliliğiniz garanti altındadır.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">KVKK Uyumluluğu</h3>
                  <p className="text-gray-300 text-sm">
                    Kişisel Verilerin Korunması Kanunu&apos;na (KVKK) tam uyumluluk.
                    Verileriniz Türkiye Cumhuriyeti mevzuatına uygun şekilde işlenir,
                    saklanır ve korunur. Aydınlatma metni ve açık rıza mekanizmaları
                    mevcuttur.
                  </p>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">GDPR Uyumluluğu</h3>
                  <p className="text-gray-300 text-sm">
                    Avrupa Birliği Genel Veri Koruma Yönetmeliği&apos;ne (GDPR) tam
                    uyumluluk. Veri taşınabilirliği, silme hakkı ve işleme sınırlama
                    hakları dahil tüm GDPR gereklilikleri karşılanır.
                  </p>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">Uçtan Uca Şifreleme</h3>
                  <p className="text-gray-300 text-sm">
                    Tüm verileriniz iletim ve depolama sırasında güçlü şifreleme ile
                    korunur. Sohbet geçmişiniz, dosyalarınız ve kişisel bilgileriniz
                    yetkisiz erişime karşı güvende tutulur.
                  </p>
                </div>
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-semibold mb-3 text-green-400">Veri Kullanım Politikası</h3>
                  <p className="text-gray-300 text-sm">
                    Verileriniz yapay zeka motorlarını eğitmek için kullanılmaz. Açık
                    izniniz olmadan üçüncü taraflarla paylaşılmaz. Verileriniz üzerinde
                    tam kontrol size aittir; dilediğiniz zaman silebilirsiniz.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-b border-gray-800 bg-gray-900/30">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold mb-12 text-center">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Sıkça Sorulan Sorular
              </span>
            </h2>
            <div className="max-w-4xl mx-auto space-y-6">
              {(jsonLd['@graph'][1] as { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> }).mainEntity.map(
                (faq: { name: string; acceptedAnswer: { text: string } }, index: number) => (
                  <div key={index} className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-semibold mb-3 text-purple-400">{faq.name}</h3>
                    <p className="text-gray-300">{faq.acceptedAnswer.text}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Yapay Zeka Asistanınızla Tanışın
                </span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Binlerce kullanıcı Ailydian AI asistanı ile günlük verimliliğini artırıyor.
                Çoklu yapay zeka motorları, 41+ dil desteği, sesli etkileşim ve kurumsal
                düzeyde güvenlik ile dijital hayatınızı dönüştürün. Ücretsiz başlayın,
                farkı hemen görün.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/chat"
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Hemen Ücretsiz Başla
                </Link>
                <Link
                  href="/yapay-zeka-kodlama"
                  className="px-8 py-4 bg-gray-800 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-all border border-gray-700"
                >
                  Kod Yazma Özelliklerini Keşfet
                </Link>
              </div>
              <p className="text-gray-400 mt-6">
                Ayrıca bakınız:{' '}
                <Link href="/yapay-zeka" className="text-blue-400 hover:underline">
                  Yapay Zeka
                </Link>
                {' \u2022 '}
                <Link href="/coklu-yapay-zeka" className="text-blue-400 hover:underline">
                  Çoklu Yapay Zeka
                </Link>
                {' \u2022 '}
                <Link href="/yapay-zeka-kodlama" className="text-blue-400 hover:underline">
                  Yapay Zeka ile Kodlama
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
