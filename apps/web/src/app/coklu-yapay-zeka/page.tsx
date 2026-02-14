import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ailydian.com'),
  title: 'Çoklu Yapay Zeka Platformu | Ailydian - Türkiye\'nin Çoklu AI Platformu',
  description:
    'Ailydian çoklu yapay zeka platformu ile birden fazla AI motorunu tek arayüzde kullanın. Otomatik model seçimi, 41+ dil desteği, kurumsal güvenlik. Türkiye\'nin ileri düzey çoklu AI çözümü; sağlık, finans, hukuk ve eğitim sektörlerine özel optimizasyonlar.',
  keywords: [
    'çoklu yapay zeka',
    'çoklu ai platformu',
    'multi ai türkiye',
    'yapay zeka platformu',
    'kurumsal ai çözümleri',
    'ailydian yapay zeka',
    'ai motor orkestrasyon',
    'akıllı model seçimi',
    'yapay zeka karşılaştırma',
    'sağlık ai',
    'finans yapay zeka',
    'hukuk ai',
    'eğitim yapay zeka',
    'çok dilli ai',
    'türkçe yapay zeka',
    'enterprise ai turkey',
    'ai entegrasyonu',
    'yapay zeka güvenlik',
    'kvkk uyumlu ai',
    'gdpr yapay zeka',
    'ai platformu fiyat',
    'best ai platform turkey',
    'yapay zeka motorları',
    'ai orchestration türkiye',
  ],
  alternates: {
    canonical: 'https://www.ailydian.com/coklu-yapay-zeka',
    languages: {
      tr: 'https://www.ailydian.com/coklu-yapay-zeka',
      en: 'https://www.ailydian.com/en/multi-ai-platform',
    },
  },
  openGraph: {
    title: 'Çoklu Yapay Zeka Platformu | Ailydian - Türkiye\'nin Çoklu AI Platformu',
    description:
      'Türkiye\'nin ilk çoklu AI platformu. Birden fazla yapay zeka motorunu tek arayüzde kullanın. Otomatik model seçimi, 41+ dil desteği, kurumsal güvenlik.',
    url: 'https://www.ailydian.com/coklu-yapay-zeka',
    siteName: 'Ailydian',
    locale: 'tr_TR',
    type: 'article',
    images: [
      {
        url: 'https://www.ailydian.com/og-coklu-ai.png',
        width: 1200,
        height: 630,
        alt: 'Ailydian Çoklu Yapay Zeka Platformu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Çoklu Yapay Zeka Platformu | Ailydian',
    description:
      'Türkiye\'nin ilk çoklu AI platformu. Otomatik model seçimi ve 41+ dil desteği.',
    images: ['https://www.ailydian.com/og-coklu-ai.png'],
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
      '@id': 'https://www.ailydian.com/coklu-yapay-zeka#software',
      name: 'Ailydian Çoklu Yapay Zeka Platformu',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Yapay Zeka',
      operatingSystem: 'Web',
      inLanguage: 'tr',
      description:
        'Birden fazla yapay zeka motorunu tek platformda birleştiren kurumsal çoklu AI çözümü. Her sorgu için en uygun modeli otomatik seçer.',
      featureList: [
        'Çoklu Model Orkestrasyon',
        'Otomatik Model Seçimi',
        '41+ Dil Desteği',
        'Kurumsal Güvenlik ve Uyumluluk',
        'Sektöre Özel Optimizasyon',
        'Gerçek Zamanlı Analitik',
        'GDPR ve KVKK Uyumlu',
        'Gelişmiş AI Yönlendirme',
        'Maliyet Optimizasyonu',
        'Performans İzleme',
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'TRY',
        description: 'Ücretsiz plan ve kurumsal paketler mevcut',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '1250',
        bestRating: '5',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://www.ailydian.com/coklu-yapay-zeka#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Çoklu yapay zeka platformu nedir?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Çoklu yapay zeka platformu, birden fazla AI motorunu ve modelini tek bir arayüzde birleştiren ileri düzey bir altyapıdır. Tek bir yapay zeka sağlayıcısıyla sınırlı kalmak yerine, Ailydian gibi çoklu AI platformları her görev için en uygun motoru otomatik olarak seçer. Kodlama soruları kodlama uzmanı AI motorlarına, tıbbi sorgular sağlık odaklı modellere, hukuki araştırmalar hukuk eğitimli sistemlere yönlendirilir.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian hangi AI modelini kullanacağını nasıl seçer?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian, sorgunuzu analiz eden akıllı yönlendirme algoritmaları kullanır. Sorgu türü, dil, karmaşıklık düzeyi ve bağlam incelenir. Sistem, performans kıyaslamaları, maliyet verimliliği, yanıt süresi ve göreve özel yeteneklere göre en uygun AI motorunu otomatik seçer. Bu sayede her zaman en iyi sonucu alırsınız.',
          },
        },
        {
          '@type': 'Question',
          name: 'Çoklu AI tek model platformlardan neden daha avantajlıdır?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Çoklu AI platformları üstün çok yönlülük, güvenilirlik ve performans sunar. Avantajlar arasında: tek hata noktası olmaması, farklı görevler için uzman modellere erişim, daha iyi maliyet optimizasyonu, daha yüksek kaliteli sonuçlar, kesintisiz kullanılabilirlik ve birden fazla AI sağlayıcısının güçlü yönlerinden eşzamanlı yararlanma imkanı bulunur.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian kurumsal kullanım için uygun mudur?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Evet, Ailydian kurumsal dağıtım için tasarlanmıştır. GDPR ve KVKK uyumluluğu, kurumsal düzey güvenlik, rol tabanlı erişim kontrolü, denetim kayıtları, yerinde kurulum seçenekleri, SLA garantileri, özel destek ve sağlık, finans, hukuk, eğitim sektörlerine özel optimizasyonlar içerir.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian kaç AI modeli entegre eder?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian birden fazla önde gelen yapay zeka motorunu entegre eder ve model kapsamını sürekli genişletir. Platform, son teknoloji dil modelleri, özel kodlama asistanları, görüntü oluşturma motorları ve sektöre özel AI çözümlerine tek bir birleşik arayüzden erişim sağlar.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian\'ı özel sektörel görevler için kullanabilir miyim?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Kesinlikle. Ailydian sağlık (tıbbi tanı desteği, hasta veri analizi), finans (risk değerlendirme, piyasa analizi), hukuk (sözleşme analizi, hukuki araştırma), eğitim (kişiselleştirilmiş öğrenme, otomatik değerlendirme) ve diğer sektörler için özel optimizasyonlar sunar. Çoklu AI yaklaşımı uzman düzeyinde performans garanti eder.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian hangi dilleri destekler?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Arapça, Rusça, Çince, Japonca, Korece dahil 41+ dili destekler. Çoklu AI mimarisi, sorguları dil için optimize edilmiş modellere otomatik yönlendirir ve üstün çok dilli performans sağlar.',
          },
        },
        {
          '@type': 'Question',
          name: 'Çoklu AI platformları için fiyatlandırma nasıl çalışır?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian bireysel kullanıcılar için ücretsiz plan ve esnek kurumsal paketler sunar. Çoklu AI yaklaşımı, kalite gereksinimlerini karşılayan en maliyet etkin modele yönlendirerek aslında maliyetleri optimize eder. Kurumsal müşteriler, kullanım desenlerine göre hacim indirimleri ve özel fiyatlandırmadan yararlanır.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian Türkçe sorular için nasıl çalışır?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian Türkçe sorgular için özel optimize edilmiştir. Platform, Türkçe dilbilgisi ve bağlam anlayışında üstün performans gösteren modelleri otomatik seçer. Bu sayede Türkçe içerik üretimi, çeviri, analiz ve diğer görevlerde yerel konuşmacı kalitesinde sonuçlar elde edersiniz.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian güvenli midir ve verilerim korunuyor mu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Evet, Ailydian kurumsal düzey güvenlik önlemleri kullanır. Tüm veriler aktarım sırasında ve depolamada uçtan uca şifrelenir. Platform GDPR ve KVKK uyumludur, kapsamlı denetim kayıtları tutar ve hassas veriler için yerinde kurulum seçeneği sunar. Verileriniz asla eğitim amaçlı kullanılmaz.',
          },
        },
        {
          '@type': 'Question',
          name: 'Çoklu AI platformu tek bir AI\'dan ne kadar daha hızlıdır?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Çoklu AI platformları, yük dengeleme ve gerçek zamanlı performans izleme sayesinde genellikle daha hızlı yanıt süreleri sunar. Bir motor yavaşladığında, trafik otomatik olarak daha hızlı alternatiflere kayar. Ailydian ortalama yanıt süresini %40\'a kadar iyileştirir ve kesintisiz kullanılabilirlik garanti eder.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian API erişimi sunuyor mu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Evet, Ailydian kurumsal kullanıcılara kapsamlı RESTful API erişimi sunar. Kendi uygulamalarınıza, iş akışlarınıza ve sistemlerinize Ailydian çoklu AI yeteneklerini entegre edebilirsiniz. API, özel hız limitleri, webhook entegrasyonları ve detaylı kullanım analitiği içerir.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://www.ailydian.com/coklu-yapay-zeka#breadcrumb',
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
          name: 'Çoklu Yapay Zeka',
          item: 'https://www.ailydian.com/coklu-yapay-zeka',
        },
      ],
    },
  ],
};

export default function CokluYapayZekaPage() {
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
              Çoklu Yapay Zeka Platformu
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Birden fazla yapay zeka motorunu tek platformda birleştirin. Otomatik model seçimi,
              üstün sonuçlar, kurumsal güvenlik.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Ücretsiz Deneyin
              </Link>
              <Link
                href="#karsilastirma"
                className="px-8 py-4 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-all"
              >
                Karşılaştırmayı Görün
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What is Multi-AI Section */}
      <section className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <article className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">Çoklu Yapay Zeka Nedir?</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-gray-300 mb-6">
                Çoklu yapay zeka platformu, farklı uzmanlık alanlarına sahip birden fazla yapay
                zeka motorunu tek bir sistemde bir araya getiren yeni nesil teknoloji altyapısıdır.
                Geleneksel yapay zeka platformları sizi tek bir sağlayıcıya bağımlı kılarken,
                Ailydian gibi çoklu AI sistemleri her görev türü için en uygun motoru akıllıca
                seçer ve yönlendirir.
              </p>
              <p className="text-lg text-gray-300 mb-6">
                Bu yaklaşımı, bir şirketteki uzman ekiplere benzetebiliriz. Muhasebe sorunuzu mali
                müşavire, hukuki meselenizi avukata, tıbbi durumunuzu doktora sorarsınız. Çoklu AI
                platformları da aynı mantıkla çalışır: kodlama sorularınız programlama uzmanı
                motorlara, tıbbi sorgularınız sağlık odaklı modellere, yaratıcı içerik
                talepleriniz üretken yapay zeka sistemlerine otomatik olarak iletilir.
              </p>
              <p className="text-lg text-gray-300 mb-6">
                Ailydian platformunun öne çıkan özelliği akıllı orkestrasyon sistemdir. Her sorgunuz
                anlık olarak analiz edilir: hangi dilde yazıldığı, ne kadar karmaşık olduğu, hangi
                sektöre ait olduğu, hız gereksinimi ve maliyet kısıtları değerlendirilir. Bu
                analizin ardından, en yüksek kalitede sonuç üretecek yapay zeka motoru milisaniyeler
                içinde seçilir ve sorgunuz yönlendirilir. Tüm bu süreç arka planda gerçekleşir;
                siz sadece üstün kalitede yanıtlar alırsınız.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Neden Çoklu Yapay Zeka Daha Üstündür?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3">Uzman Seviyesinde Performans</h3>
              <p className="text-gray-300">
                Her yapay zeka modeli belirli görevlerde üstün performans gösterir. Çoklu AI
                platformları kodlama işlerini programlama uzmanlarına, tıbbi soruları sağlık
                modellerine, yaratıcı içerikleri üretken sistemlere yönlendirir. Sonuç: Her alanda
                maksimum kalite.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold mb-3">Kesintisiz Hizmet Güvencesi</h3>
              <p className="text-gray-300">
                Tek bir AI sağlayıcısı arıza yaptığında veya yavaşladığında, sistem otomatik olarak
                alternatif motorlara geçiş yapar. Bu yedekleme sistemi %99.9 çalışma süresi ve
                kesintisiz kaliteli hizmet garantisi sağlar. Hiçbir zaman tek bir hataya bağımlı
                kalmazsınız.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-3">Akıllı Maliyet Yönetimi</h3>
              <p className="text-gray-300">
                Basit sorularınız için uygun maliyetli modeller, karmaşık görevleriniz için premium
                motorlar kullanılır. Bu akıllı yönlendirme sistemi, tek premium model kullanan
                platformlara göre %60\'a varan maliyet tasarrufu sağlar. Kaliteden ödün vermeden
                bütçenizi optimize edin.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-3">Üstün Çok Dilli Destek</h3>
              <p className="text-gray-300">
                Farklı yapay zeka modelleri farklı dillerde üstün performans gösterir. Türkçe
                sorgularınız Türkçe optimize modellere, Arapça sorularınız Arapça uzmanlara
                yönlendirilir. 41+ dilde ana dil kalitesinde sonuçlar alırsınız. Çeviri değil,
                doğrudan o dilde düşünen AI motorları.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">Uyarlanabilir Hız Optimizasyonu</h3>
              <p className="text-gray-300">
                Gerçek zamanlı performans izleme sistemi, hangi motorun şu anda en hızlı olduğunu
                sürekli analiz eder. Bir model yavaşladığında trafik otomatik olarak hızlı
                alternatiflere kayar. Her zaman en düşük gecikme süresi ve en hızlı yanıt garantisi.
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold mb-3">Geleceğe Hazır Mimari</h3>
              <p className="text-gray-300">
                Yeni AI modelleri piyasaya çıktıkça Ailydian otomatik olarak bunları sisteme entegre
                eder. Hiçbir göç, yeniden eğitim veya altyapı değişikliği gerekmeden en yeni
                teknolojilerden otomatik yararlanırsınız. Daima güncel, daima en iyi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Ailydian Works Section */}
      <section className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <article className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">
              Ailydian Nasıl Çalışır?
            </h2>
            <div className="space-y-8">
              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-blue-400">
                  1. Akıllı Sorgu Analizi
                </h3>
                <p className="text-gray-300 mb-4">
                  Sorgunuzu gönderdiğinizde, Ailydian çok boyutlu bir analiz gerçekleştirir. Doğal
                  dil işleme ile görev türü belirlenir (kodlama, analiz, çeviri, içerik üretimi).
                  Dil tespiti yapılarak çok dilli yönlendirme optimize edilir. Karmaşıklık
                  değerlendirmesi ile gerekli işlem gücü tahmin edilir. Bağlam çıkarımı ile model
                  değişimlerinde konuşma tutarlılığı korunur.
                </p>
                <p className="text-gray-300">
                  Bu analiz 50 milisaniyenin altında gerçekleşir ve model seçimini yönlendirecek
                  kapsamlı bir sorgu profili oluşturur. Siz hiçbir gecikme fark etmeden en uygun
                  motora yönlendirilirsiniz.
                </p>
              </div>

              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-purple-400">
                  2. Dinamik Model Seçimi
                </h3>
                <p className="text-gray-300 mb-4">
                  Ailydian her entegre AI motoru için gerçek zamanlı performans ölçümleri tutar:
                  farklı görev türlerinde doğruluk skorları, ortalama yanıt gecikme süreleri, anlık
                  sistem yükü, token başına maliyet, dile özel performans ve uzman alan bilgisi.
                  Bu veriler sürekli güncellenir.
                </p>
                <p className="text-gray-300">
                  Yönlendirme algoritması sorgu profilinizi bu faktörlerle karşılaştırır ve kaliteyi
                  maksimize ederken gecikme ve maliyet kısıtlarını da göz önünde bulundurur.
                  Kurumsal kullanıcılar için özel yönlendirme kuralları ve uyumluluk gereksinimleri
                  önceliklendirilebilir.
                </p>
              </div>

              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-pink-400">
                  3. Sorunsuz İşleme ve İzleme
                </h3>
                <p className="text-gray-300 mb-4">
                  Model seçildikten sonra sorgunuz güvenli, yük dengeli bağlantılar üzerinden en
                  uygun AI motoruna iletilir. Ailydian işlemi gerçek zamanlı izler: yanıt süresi,
                  kalite göstergeleri ve hata oranları takip edilir. Motor başarısız olursa veya
                  düşük performans gösterirse, otomatik yük devri milisaniyeler içinde devreye girer.
                </p>
                <p className="text-gray-300">
                  Sonuçlar size ulaşmadan önce kalite doğrulamasından geçer. Platform her
                  etkileşimden öğrenir ve kullanıcı memnuniyeti, görev sonuçları ve performans
                  metriklerine göre yönlendirme algoritmalarını sürekli iyileştirir.
                </p>
              </div>

              <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                <h3 className="text-2xl font-semibold mb-4 text-green-400">
                  4. Sürekli Öğrenme ve Optimizasyon
                </h3>
                <p className="text-gray-300">
                  Ailydian makine öğrenimi kullanarak zaman içinde yönlendirme kararlarını
                  iyileştirir. Kullanıcı geri bildirimleri, görev başarı oranları ve performans
                  verileri, optimal motor seçimini giderek daha yüksek doğrulukla tahmin eden
                  pekiştirmeli öğrenme modellerini eğitir. Bu kendini geliştiren sistem, manuel
                  müdahale gerekmeden platform performansını sürekli artırır.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Industry Solutions Section */}
      <section className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Sektörel Çözümler
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <article className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">🏥</div>
                <h3 className="text-2xl font-semibold">Sağlık ve Tıp</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Ailydian sağlık AI çözümü, tıp eğitimi görmüş dil modelleri ile tanı destek
                sistemlerini birleştirir. Hasta kayıtlarını işleyin, tıbbi literatürü analiz edin,
                klinik özetler oluşturun ve ayırıcı tanıya destek alın. KVKK uyumlu mimari hasta
                verilerinin güvenliğini garanti eder.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• Tıbbi literatür tarama ve araştırma sentezi</li>
                <li>• Klinik dokümantasyon ve EHR entegrasyonu</li>
                <li>• İlaç etkileşim kontrolü ve reçete desteği</li>
                <li>• Hasta eğitim içeriği üretimi</li>
                <li>• Tıbbi görüntü analizi (görsel modellerle entegre)</li>
              </ul>
            </article>

            <article className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">💼</div>
                <h3 className="text-2xl font-semibold">Finans ve Bankacılık</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Risk değerlendirme, piyasa analizi ve düzenleyici uyumluluk için özelleştirilmiş
                finans AI çözümleri. Mali tabloları işleyin, piyasa trendlerini analiz edin,
                yatırım araştırmaları oluşturun ve uyumluluk raporlamasını otomatikleştirin. Banka
                düzeyinde güvenlik ve PCI DSS uyumluluğu.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• Mali tablo analizi ve tahminleme</li>
                <li>• Haber ve sosyal medyadan piyasa duyarlılık analizi</li>
                <li>• Dolandırıcılık tespiti ve işlem izleme</li>
                <li>• Düzenleyici uyumluluk doküman üretimi</li>
                <li>• Müşteri kredi risk değerlendirmesi</li>
              </ul>
            </article>

            <article className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">⚖️</div>
                <h3 className="text-2xl font-semibold">Hukuk ve Uyumluluk</h3>
              </div>
              <p className="text-gray-300 mb-4">
                İçtihat, mevzuat ve düzenleyici çerçeveler üzerine eğitilmiş hukuk AI. Sözleşme
                analizi, hukuki araştırma, uyumluluk kontrolü ve doküman üretimi. Uluslararası
                hukuk sistemleri için çok yargı alanı desteği.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• Sözleşme inceleme ve risk tanımlama</li>
                <li>• Hukuki araştırma ve içtihat analizi</li>
                <li>• Uyumluluk doküman hazırlığı</li>
                <li>• Mali durum tespiti otomasyonu</li>
                <li>• Patent ve fikri mülkiyet analizi</li>
              </ul>
            </article>

            <article className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">🎓</div>
                <h3 className="text-2xl font-semibold">Eğitim ve E-Öğrenme</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Kişiselleştirilmiş öğrenme, içerik oluşturma ve öğrenci değerlendirmesi için eğitim
                AI. Müfredat materyalleri üretin, özel ders desteği sağlayın, ödevleri
                değerlendirin ve içeriği bireysel öğrenme stillerine uyarlayın. 41+ dil desteği
                global eğitim dağıtımını mümkün kılar.
              </p>
              <ul className="space-y-2 text-gray-400">
                <li>• Kişiselleştirilmiş öğrenme yolu oluşturma</li>
                <li>• Otomatik kompozisyon notlandırma ve geri bildirim</li>
                <li>• Eğitim içeriği oluşturma ve yerelleştirme</li>
                <li>• Sanal öğretmenlik ve ödev yardımı</li>
                <li>• Öğrenme analitiği ve ilerleme takibi</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section id="karsilastirma" className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-4xl font-bold mb-12 text-center">
            Çoklu AI vs Tekli AI Platformları
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-5xl mx-auto bg-gray-800/30 rounded-xl border border-gray-700">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-4 text-left font-semibold">Özellik</th>
                  <th className="px-6 py-4 text-center font-semibold text-green-400">
                    Ailydian Çoklu AI
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-gray-400">
                    Tekli Model Platformları
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-700/50">
                  <td className="px-6 py-4">AI Model Seçimi</td>
                  <td className="px-6 py-4 text-center text-green-400">
                    Otomatik, göreve optimize
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">Sadece tek model</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="px-6 py-4">Güvenilirlik ve Çalışma Süresi</td>
                  <td className="px-6 py-4 text-center text-green-400">
                    %99.9 (çoklu yedekleme)
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">
                    Tek sağlayıcıya bağımlı
                  </td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="px-6 py-4">Dil Desteği</td>
                  <td className="px-6 py-4 text-center text-green-400">
                    41+ dil optimize edilmiş
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">
                    Tek modelle sınırlı
                  </td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="px-6 py-4">Maliyet Optimizasyonu</td>
                  <td className="px-6 py-4 text-center text-green-400">
                    Dinamik maliyet yönlendirme
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">Sabit fiyat modeli</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="px-6 py-4">Özel Görevler</td>
                  <td className="px-6 py-4 text-center text-green-400">
                    Her alan için uzman modeller
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">Genelci yaklaşım</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="px-6 py-4">Geleceğe Hazır</td>
                  <td className="px-6 py-4 text-center text-green-400">
                    Sürekli model entegrasyonu
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">
                    Sağlayıcı güncellemeleriyle sınırlı
                  </td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="px-6 py-4">Performans İzleme</td>
                  <td className="px-6 py-4 text-center text-green-400">
                    Gerçek zamanlı analitik
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">Temel metrikler</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Kurumsal Uyumluluk</td>
                  <td className="px-6 py-4 text-center text-green-400">
                    GDPR, KVKK, SOC 2
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400">
                    Sağlayıcıya göre değişir
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
              Çoklu Yapay Zeka Gücünü Bugün Deneyimleyin
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Binlerce kurumun tercih ettiği Ailydian çoklu AI platformu ile üstün sonuçlar, yüksek
              güvenilirlik ve optimize maliyetlerle çalışın. Ücretsiz başlayın, büyüdükçe
              ölçeklendirin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Ücretsiz Deneyin
              </Link>
              <Link
                href="/yapay-zeka-asistan"
                className="px-8 py-4 bg-gray-800 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-all"
              >
                AI Asistan Keşfedin
              </Link>
            </div>
            <p className="text-gray-400 mt-6">
              İngilizce sürüm:{' '}
              <Link href="/en/multi-ai-platform" className="text-blue-400 hover:underline">
                Multi-AI Platform (English)
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
