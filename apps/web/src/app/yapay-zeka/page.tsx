import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ailydian.com'),
  title: 'Yapay Zeka | Ailydian - En Gelişmiş Yapay Zeka Platformu',
  description:
    'Ailydian yapay zeka platformu ile işinizi dönüştürün. Gelişmiş yapay zeka motorları, çoklu dil desteği, kod yazma, veri analizi, içerik üretimi ve daha fazlası. Türkiye\'nin en kapsamlı yapay zeka çözümü.',
  keywords: [
    'yapay zeka',
    'yapay zeka platformu',
    'ai türkiye',
    'yapay zeka uygulamaları',
    'yapay zeka nedir',
    'yapay zeka kullanım alanları',
    'yapay zeka asistan',
    'yapay zeka çözümleri',
    'işletme yapay zekası',
    'kurumsal yapay zeka',
    'yapay zeka teknolojisi',
    'yapay zeka avantajları',
    'yapay zeka sistemleri',
    'yapay zeka motorları',
    'ailydian yapay zeka',
    'türkçe yapay zeka',
    'yapay zeka örnekleri',
    'yapay zeka araçları',
    'yapay zeka yazılımı',
    'yapay zeka hizmetleri',
  ],
  alternates: {
    canonical: 'https://www.ailydian.com/yapay-zeka',
    languages: {
      tr: 'https://www.ailydian.com/yapay-zeka',
      en: 'https://www.ailydian.com/en/artificial-intelligence',
    },
  },
  openGraph: {
    title: 'Yapay Zeka | Ailydian - En Gelişmiş Yapay Zeka Platformu',
    description:
      'Türkiye\'nin en kapsamlı yapay zeka platformu. Kod yazma, veri analizi, içerik üretimi ve daha fazlası için gelişmiş yapay zeka motorları.',
    url: 'https://www.ailydian.com/yapay-zeka',
    siteName: 'Ailydian',
    locale: 'tr_TR',
    type: 'article',
    images: [
      {
        url: 'https://www.ailydian.com/og-yapay-zeka.png',
        width: 1200,
        height: 630,
        alt: 'Ailydian Yapay Zeka Platformu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yapay Zeka | Ailydian',
    description:
      'Türkiye\'nin en kapsamlı yapay zeka platformu. Gelişmiş yapay zeka motorları ile işinizi dönüştürün.',
    images: ['https://www.ailydian.com/og-yapay-zeka.png'],
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.ailydian.com/yapay-zeka#software',
      name: 'Ailydian Yapay Zeka Platformu',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Artificial Intelligence',
      operatingSystem: 'Web',
      description:
        'Türkiye\'nin en kapsamlı yapay zeka platformu. Gelişmiş yapay zeka motorları ile kod yazma, veri analizi, içerik üretimi ve daha fazlası.',
      featureList: [
        'Çoklu Yapay Zeka Motoru',
        '41+ Dil Desteği',
        'Kod Yazma ve Geliştirme',
        'Veri Analizi',
        'İçerik Üretimi',
        'Sesli Asistan',
        'Görsel Analiz',
        'Doğal Dil İşleme',
        'Güvenli ve KVKK Uyumlu',
        'Gerçek Zamanlı Analitik',
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'TRY',
        description: 'Ücretsiz başlangıç paketi, kurumsal planlar mevcut',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '2847',
        bestRating: '5',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://www.ailydian.com/yapay-zeka#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Yapay zeka nedir ve nasıl çalışır?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yapay zeka (AI), makinelerin insan benzeri düşünme, öğrenme ve problem çözme yeteneklerini simüle eden teknoloji dalıdır. Ailydian yapay zeka platformu, gelişmiş dil modelleri kullanarak doğal dil işleme, kod yazma, veri analizi ve içerik üretimi gibi karmaşık görevleri otomatik olarak gerçekleştirir. Sistemimiz, her sorguyu analiz ederek en uygun yapay zeka motorunu otomatik olarak seçer ve üstün sonuçlar sağlar.',
          },
        },
        {
          '@type': 'Question',
          name: 'Yapay zeka hangi alanlarda kullanılır?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yapay zeka günümüzde birçok alanda kullanılmaktadır: Yazılım geliştirme ve kod yazma, veri analizi ve iş zekası, içerik üretimi ve pazarlama, müşteri hizmetleri ve destek, sağlık ve tıbbi tanı desteği, finans ve risk analizi, eğitim ve kişiselleştirilmiş öğrenme, hukuk ve sözleşme analizi. Ailydian platformu, bu alanların tamamında uzmanlaşmış yapay zeka çözümleri sunar.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian yapay zeka platformunun avantajları nelerdir?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian, çoklu yapay zeka motorlarını tek platformda birleştirerek benzersiz avantajlar sunar: Otomatik model seçimi ile her görev için en iyi sonuç, 41+ dilde yerel kalitede destek, %99.9 çalışma süresi garantisi, KVKK ve GDPR uyumlu güvenlik, maliyet optimizasyonu ile %60\'a kadar tasarruf, sürekli güncellenen model kütüphanesi, sektöre özel optimizasyonlar. Tek bir yapay zeka sağlayıcısı yerine, uzmanlaşmış motorlarımız her görev için en üstün performansı garanti eder.',
          },
        },
        {
          '@type': 'Question',
          name: 'Yapay zeka güvenli midir? Verilerim korunuyor mu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Evet, Ailydian yapay zeka platformu kurumsal düzeyde güvenlik sağlar. Tüm verileriniz uçtan uca şifreleme ile korunur, KVKK ve GDPR mevzuatına tam uyumludur. Rol tabanlı erişim kontrolü, kapsamlı denetim günlükleri ve isteğe bağlı yerinde dağıtım seçenekleri mevcuttur. Verileriniz yapay zeka modellerini eğitmek için kullanılmaz ve sizin açık izniniz olmadan üçüncü taraflarla paylaşılmaz.',
          },
        },
        {
          '@type': 'Question',
          name: 'Yapay zeka Türkçe\'yi iyi anlıyor mu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian, Türkçe için özel olarak optimize edilmiş yapay zeka motorlarını kullanır. Platformumuz Türkçe sorguları tespit ederek, Türkçe performansı en yüksek olan modellere yönlendirir. Bu sayede gramer, kelime hazinesi ve bağlam anlama konularında yerel kalitede sonuçlar elde edersiniz. Türkiye\'de yapay zeka kullanımında %94.49 ile dünya lideri olma başarımızın arkasındaki teknoloji budur.',
          },
        },
        {
          '@type': 'Question',
          name: 'Yapay zeka kod yazabilir mi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Evet, Ailydian gelişmiş kod yazma yeteneklerine sahiptir. Python, JavaScript, TypeScript, Java, C++, Go, Rust, PHP, Swift, Kotlin ve daha fazla dilde profesyonel kod üretebilir. Kod tamamlama, hata ayıklama, refactoring, dokümantasyon yazma ve kod açıklama gibi özellikleri destekler. Yazılım geliştiricilerin üretkenliğini ortalama %40 artıran yapay zeka destekli kodlama asistanımız, karmaşık algoritmaları dakikalar içinde yazabilir.',
          },
        },
        {
          '@type': 'Question',
          name: 'Yapay zeka ücretsiz mi kullanılabilir?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Evet, Ailydian ücretsiz başlangıç planı sunmaktadır. Bireysel kullanıcılar için temel yapay zeka özelliklerine sınırlı sayıda erişim sağlanır. İşletmeler ve yoğun kullanım için kurumsal planlarımız mevcuttur. Kurumsal planlar, sınırsız kullanım, özel model routing kuralları, SLA garantileri, 7/24 destek ve özel fiyatlandırma içerir. Detaylı fiyatlandırma bilgisi için bizimle iletişime geçebilirsiniz.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://www.ailydian.com/yapay-zeka#breadcrumb',
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
      ],
    },
  ],
};

export default function YapayZekaPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Yapay Zeka ile Geleceği Şekillendirin
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Türkiye'nin en gelişmiş yapay zeka platformu. Çoklu yapay zeka motorları, 41+ dil
              desteği ve sektöre özel optimizasyonlar ile işinizi dönüştürün.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Ücretsiz Başla
              </Link>
              <Link
                href="/yapay-zeka-asistani"
                className="px-8 py-4 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-all"
              >
                Yapay Zeka Asistanı
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Yapay Zeka Nedir Section */}
      <section className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <article className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">Yapay Zeka Nedir?</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gray-300 mb-6">
                Yapay zeka (Artificial Intelligence - AI), bilgisayar sistemlerinin insan zekasını
                gerektiren görevleri yerine getirme yeteneğidir. Bu görevler arasında öğrenme,
                muhakeme yapma, problem çözme, doğal dil anlama, görsel tanıma ve karar verme yer
                alır. Modern yapay zeka sistemleri, büyük veri setlerinden öğrenerek sürekli
                kendilerini geliştirirler.
              </p>
              <p className="text-lg text-gray-300 mb-6">
                Ailydian yapay zeka platformu, dünyanın en gelişmiş dil modellerini tek çatı
                altında toplar. Geleneksel tek model platformlarının aksine, her görev için en
                uygun yapay zeka motorunu otomatik olarak seçen akıllı yönlendirme sistemi ile
                çalışır. Bu çoklu motor yaklaşımı sayesinde, kod yazma için uzmanlaşmış modeller,
                Türkçe için optimize edilmiş sistemler ve sektöre özel çözümler aynı platformda
                kullanılabilir.
              </p>
              <p className="text-lg text-gray-300 mb-6">
                Yapay zeka teknolojisi, makine öğrenmesi (machine learning) ve derin öğrenme (deep
                learning) gibi alt dalları içerir. Ailydian, bu teknolojilerin en son sürümlerini
                entegre ederek, kullanıcılarına sürekli güncellenen ve gelişen bir yapay zeka
                deneyimi sunar. Platform, natural language processing (NLP), computer vision,
                speech recognition ve predictive analytics gibi gelişmiş yetenekleri destekler.
              </p>
              <p className="text-lg text-gray-300">
                Türkiye, yapay zeka kullanımında dünya genelinde %94.49 oranı ile liderdir. Bu
                başarının arkasında, Türkçe doğal dil işleme konusunda uzmanlaşmış platformların
                katkısı büyüktür. Ailydian, Türkiye'nin bu liderliğini sürdürmesine yardımcı olan
                teknoloji altyapısını sağlayarak, bireylerin ve işletmelerin yapay zeka gücünden
                maksimum düzeyde faydalanmasını mümkün kılar.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Kullanım Alanları Section */}
      <section className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Yapay Zeka Kullanım Alanları
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-semibold mb-3">Yazılım Geliştirme</h3>
              <p className="text-gray-300">
                Kod yazma, hata ayıklama, refactoring ve dokümantasyon. Python, JavaScript,
                TypeScript ve daha fazlasında profesyonel kod üretimi.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Veri Analizi</h3>
              <p className="text-gray-300">
                Büyük veri setlerinin analizi, görselleştirme, tahmin modelleme ve iş zekası
                raporlama. Veriden değerli içgörüler çıkarın.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-xl font-semibold mb-3">İçerik Üretimi</h3>
              <p className="text-gray-300">
                Makale, blog, sosyal medya içeriği, ürün açıklamaları ve pazarlama metinleri. SEO
                optimize edilmiş, özgün içerikler oluşturun.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🗣️</div>
              <h3 className="text-xl font-semibold mb-3">Dil Çevirisi</h3>
              <p className="text-gray-300">
                41+ dil arasında profesyonel kalitede çeviri. Bağlam koruma ve kültürel uyum ile
                yerel dil kalitesi.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-3">Müşteri Hizmetleri</h3>
              <p className="text-gray-300">
                7/24 akıllı müşteri destek asistanı. Otomatik yanıt sistemleri, soru-cevap
                botları ve destek biletleri yönetimi.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold mb-3">Eğitim ve Öğretim</h3>
              <p className="text-gray-300">
                Kişiselleştirilmiş öğrenme, ödev asistanı, otomatik not verme ve eğitim içeriği
                oluşturma. Her öğrenci için özel plan.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="text-xl font-semibold mb-3">Sağlık ve Tıp</h3>
              <p className="text-gray-300">
                Tıbbi literatür tarama, tanı desteği, hasta kayıtları analizi ve klinik
                dokümantasyon. HIPAA uyumlu güvenlik.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">⚖️</div>
              <h3 className="text-xl font-semibold mb-3">Hukuk ve Finans</h3>
              <p className="text-gray-300">
                Sözleşme analizi, yasal araştırma, risk değerlendirme ve uyumluluk raporlama.
                Çoklu yargı bölgesi desteği.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Avantajlar Section */}
      <section className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <article className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">Yapay Zeka Avantajları</h2>
            <div className="space-y-8">
              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-blue-400">
                  Verimlilik ve Otomasyon
                </h3>
                <p className="text-gray-300 mb-4">
                  Yapay zeka, tekrarlayan ve zaman alıcı görevleri otomatikleştirerek çalışanların
                  daha değerli işlere odaklanmasını sağlar. Ailydian platformu ile veri girişi,
                  rapor hazırlama, kod yazma gibi rutin işlemler dakikalar içinde tamamlanır.
                  Araştırmalar, yapay zeka kullanımının çalışan verimliliğini ortalama %40
                  artırdığını göstermektedir.
                </p>
                <p className="text-gray-300">
                  Örneğin, bir yazılım geliştiricinin manuel olarak saatler sürebilecek bir API
                  entegrasyonu, Ailydian'ın kod yazma özelliği ile 10-15 dakikada
                  tamamlanabilir. Benzer şekilde, pazarlama ekipleri için içerik üretimi, SEO
                  optimizasyonu ve sosyal medya yönetimi süreçleri otomatikleşir.
                </p>
              </div>

              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-purple-400">
                  Maliyet Tasarrufu
                </h3>
                <p className="text-gray-300 mb-4">
                  Yapay zeka kullanımı, işletmelere önemli maliyet avantajları sağlar. İşgücü
                  maliyetlerini azaltır, hataları minimize eder ve kaynakları optimize eder.
                  Ailydian'ın çoklu motor yaklaşımı, basit sorgular için uygun maliyetli
                  modelleri, karmaşık görevler için premium motorları kullanarak %60'a kadar
                  tasarruf sağlar.
                </p>
                <p className="text-gray-300">
                  Bir müşteri hizmetleri departmanı, yapay zeka destekli chatbot ile 7/24 destek
                  sunarak ek personel maliyetlerinden kaçınabilir. Veri analizi ekipleri, manuel
                  rapor hazırlama yerine yapay zeka ile otomatik insight üretimi yaparak zaman ve
                  bütçe kazanır.
                </p>
              </div>

              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-pink-400">
                  24/7 Kesintisiz Hizmet
                </h3>
                <p className="text-gray-300 mb-4">
                  Yapay zeka sistemleri yorulmaz, tatil yapmaz ve sürekli çalışır. Ailydian
                  platformu %99.9 uptime garantisi ile 7/24 hizmet verir. Gece yarısı kod yazmanız
                  mı gerekiyor? Hafta sonu acil veri analizi mi yapılmalı? Yapay zeka asistanınız
                  her zaman hazırdır.
                </p>
                <p className="text-gray-300">
                  Çoklu model redundancy sayesinde, bir yapay zeka motoru kesintiye uğrarsa
                  alternatif sistemler otomatik devreye girer. Bu mimari, iş sürekliliğini
                  garanti eder ve kritik iş süreçlerinde kesinti yaşanmasını önler.
                </p>
              </div>

              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-green-400">
                  Ölçeklenebilirlik ve Tutarlılık
                </h3>
                <p className="text-gray-300 mb-4">
                  Yapay zeka, işlem hacmi arttıkça da aynı performansı korur. Ailydian, günde 10
                  sorgu gönderen bireysel kullanıcıdan, saatte binlerce işlem gerçekleştiren
                  kurumsal müşterilere kadar ölçeklenebilir çözümler sunar. Tüm yanıtlar tutarlı
                  kalite standartlarında üretilir.
                </p>
                <p className="text-gray-300">
                  İnsan çalışanlarda görebileceğiniz tutarsızlıklar, yapay zeka ile ortadan
                  kalkar. Her müşteri aynı kalitede hizmet alır, her kod aynı standartlarda
                  yazılır, her analiz aynı metodoloji ile gerçekleştirilir. Bu tutarlılık, marka
                  güvenilirliği ve müşteri memnuniyetini artırır.
                </p>
              </div>

              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-yellow-400">
                  Çoklu Dil ve Kültürel Adaptasyon
                </h3>
                <p className="text-gray-300 mb-4">
                  Ailydian'ın 41+ dil desteği, global iş yapmanızı kolaylaştırır. Türkçe sorguları
                  Türkçe optimize modellerine, Arapça sorguları Arapça uzman sistemlerine
                  yönlendiren akıllı routing, her dilde yerel kalite sağlar. Kültürel nüanslar ve
                  deyimler doğru anlaşılır.
                </p>
                <p className="text-gray-300">
                  Bir e-ticaret sitesi, Ailydian ile ürün açıklamalarını 20+ dile otomatik
                  çevirebilir. Müşteri destek ekibi, dünya çapındaki kullanıcılara kendi dillerinde
                  yardımcı olabilir. Pazarlama içeriği, hedef pazarın kültürel bağlamına uygun
                  olarak üretilir.
                </p>
              </div>

              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-red-400">
                  Sürekli Öğrenme ve Gelişim
                </h3>
                <p className="text-gray-300">
                  Yapay zeka sistemleri statik değildir; sürekli öğrenir ve gelişir. Ailydian,
                  yeni modelleri otomatik entegre eder, performans metriklerini izler ve routing
                  algoritmalarını optimize eder. Kullanıcılar, manuel güncelleme veya migration
                  yapmadan en son teknolojiden faydalanır. Platform, kullanıcı geri bildirimleri ve
                  başarı oranları ile kendini sürekli iyileştirir, zaman içinde daha akıllı ve
                  verimli hale gelir.
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
            Sıkça Sorulan Sorular
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {jsonLd['@graph'][1].mainEntity.map((faq: any, index: number) => (
              <div key={index} className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-blue-400">{faq.name}</h3>
                <p className="text-gray-300">{faq.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">
              Yapay Zeka Gücünü Bugün Deneyimleyin
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Binlerce kullanıcı ve işletme Ailydian ile verimliliğini artırıyor. Ücretsiz
              başlayın, ihtiyacınıza göre ölçeklendirin. Türkiye'nin en gelişmiş yapay zeka
              platformu ile geleceği şekillendirin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Hemen Ücretsiz Başla
              </Link>
              <Link
                href="/yapay-zeka-kodlama"
                className="px-8 py-4 bg-gray-800 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-all"
              >
                Kod Yazma Özelliklerini Keşfet
              </Link>
            </div>
            <p className="text-gray-400 mt-6">
              Ayrıca bakınız:{' '}
              <Link href="/yapay-zeka-turkiye" className="text-blue-400 hover:underline">
                Yapay Zeka Türkiye
              </Link>
              {' • '}
              <Link href="/yapay-zeka-asistani" className="text-blue-400 hover:underline">
                Yapay Zeka Asistanı
              </Link>
              {' • '}
              <Link href="/coklu-yapay-zeka" className="text-blue-400 hover:underline">
                Çoklu Yapay Zeka
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
