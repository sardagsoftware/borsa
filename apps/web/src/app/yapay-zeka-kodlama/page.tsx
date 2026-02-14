import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ailydian.com'),
  title: 'Yapay Zeka ile Kodlama | Ailydian - AI Kod Asistani',
  description:
    'Yapay zeka ile kodlama: Ailydian AI kod asistani ile 50+ programlama dilinde kod yazin, bug duzeltme, kod inceleme, refactoring, test yazimi ve API gelistirme. Python, JavaScript, TypeScript, Java, C#, Go, Rust, React, Vue, Angular destegi. Turkce AI kod motoru ile yazilim gelistirmeyi donusturun.',
  keywords: [
    'yapay zeka kodlama',
    'ai kod yazma',
    'yapay zeka ile programlama',
    'ai developer',
    'kod asistani',
    'otomatik kod uretimi',
    'yapay zeka gelistirici',
    'ai programci',
    'kod tamamlama ai',
    'python yapay zeka',
    'javascript ai',
    'react ai',
    'typescript ai kodlama',
    'java ai kod yazma',
    'ai bug duzeltme',
    'yapay zeka refactoring',
    'ai test yazimi',
    'ai api gelistirme',
    'yapay zeka kod inceleme',
    'ai kod optimizasyonu',
    'turkce kod asistani',
    'ai ile web gelistirme',
    'yapay zeka mobil uygulama',
    'ai devops otomasyon',
  ],
  alternates: {
    canonical: 'https://www.ailydian.com/yapay-zeka-kodlama',
    languages: {
      tr: 'https://www.ailydian.com/yapay-zeka-kodlama',
      en: 'https://www.ailydian.com/en/multi-ai-platform',
    },
  },
  openGraph: {
    title: 'Yapay Zeka ile Kodlama | Ailydian - AI Kod Asistani',
    description:
      'Ailydian AI kod motoru ile 50+ programlama dilinde kod yazin, hata duzeltme, refactoring ve test yazimi yapin. Turkce destekli, KVKK uyumlu yapay zeka kod asistani.',
    url: 'https://www.ailydian.com/yapay-zeka-kodlama',
    siteName: 'Ailydian',
    locale: 'tr_TR',
    type: 'article',
    images: [
      {
        url: 'https://www.ailydian.com/og-yapay-zeka-kodlama.png',
        width: 1200,
        height: 630,
        alt: 'Yapay Zeka ile Kodlama - Ailydian AI Kod Asistani',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yapay Zeka ile Kodlama | Ailydian',
    description:
      'Ailydian AI kod motoru ile 50+ dilde kod yazin, bug duzeltme, refactoring ve test yazimi yapin.',
    images: ['https://www.ailydian.com/og-yapay-zeka-kodlama.png'],
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
      '@id': 'https://www.ailydian.com/yapay-zeka-kodlama#software',
      name: 'Ailydian AI Kod Asistani',
      applicationCategory: 'DeveloperApplication',
      applicationSubCategory: 'AI Code Assistant',
      operatingSystem: 'Web',
      inLanguage: 'tr',
      description:
        'Yapay zeka destekli kod yazma, bug duzeltme, kod inceleme, refactoring, test yazimi, API gelistirme ve veritabani sorgu platformu. Python, JavaScript, TypeScript, Java, C#, C++, Go, Rust, PHP, Ruby, Swift, Kotlin ve 50+ dilde destek.',
      featureList: [
        'Kod uretimi (50+ dil)',
        'Bug duzeltme ve debugging',
        'Kod inceleme (Code Review)',
        'Kod refactoring',
        'Otomatik dokumantasyon yazimi',
        'Unit test ve integration test uretimi',
        'RESTful API gelistirme',
        'GraphQL API tasarimi',
        'Veritabani sorgu optimizasyonu',
        'HTML/CSS onizleme (sandbox iframe)',
        'Kod kalitesi ve best practice kontrolu',
        'Guvenlik acigi tespiti',
        'Performans optimizasyonu',
        'DevOps script uretimi',
        'Mobil uygulama kodu yazimi',
        'Veri bilimi ve analiz kodlari',
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'TRY',
        description: 'Ucretsiz plan mevcut',
        availability: 'https://schema.org/InStock',
      },
      softwareVersion: '2.0',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '1420',
        bestRating: '5',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://www.ailydian.com/yapay-zeka-kodlama#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Yapay zeka ile kod yazma nedir?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yapay zeka ile kod yazma, AI motorlarinin dogal dil komutlarindan veya teknik spesifikasyonlardan otomatik olarak kaynak kod uretmesidir. Gelistiriciler ne yapmak istediklerini aciklar, AI uygun kodu yazar. Ailydian kod motoru, gelismis yapay zeka altyapisi kullanarak yuksek kaliteli ve best practice uyumlu kod uretir.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian hangi programlama dillerini destekler?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian, Python, JavaScript, TypeScript, Java, C#, C++, Go, Rust, PHP, Ruby, Swift, Kotlin, SQL, HTML/CSS, React, Vue, Angular, Node.js, Django, Flask, Spring Boot ve 50+ programlama dilinde kod yazma, debugging, refactoring ve optimizasyon destegi sunar.',
          },
        },
        {
          '@type': 'Question',
          name: 'AI kod asistani bug duzeltme yapabilir mi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Evet, Ailydian AI kod motoru hatali kodu analiz eder, hata kaynagini bulur, detayli aciklama sunar ve duzeltilmis kodu uretir. Syntax hatalari, logic hatalari, runtime exceptions, bellek sizintilari, guvenlik aciklari ve performans darbogazlarini tespit edebilir.',
          },
        },
        {
          '@type': 'Question',
          name: 'Yapay zeka kod inceleme (code review) nasil yapar?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AI kod inceleme, kodunuzun kalitesini, okunabilirligini, guvenligini, performansini ve best practice uyumunu degerlendirir. Ailydian, refactoring tavsiyeleri, guvenlik uyarilari, performans iyilestirme onerileri ve SOLID prensipleri uyum raporu sunar.',
          },
        },
        {
          '@type': 'Question',
          name: 'AI ile yazilan kod guvenli midir?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'AI tarafindan uretilen kod incelenmeli ve test edilmelidir. Ailydian, OWASP Top 10 guvenlik standartlarini takip eden kod uretmeye calisir ve yaygin guvenlik aciklarini (SQL injection, XSS, CSRF vb.) otomatik tespit eder. Ancak gelistiriciler uretilen kodu dogrulamalidir.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian kod motoru test yazimi yapabilir mi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Evet, Ailydian unit test, integration test ve end-to-end test senaryolari uretir. Jest, Mocha, PyTest, JUnit, NUnit gibi populer test frameworklerini destekler. Edge case tespiti, mock/stub uretimi ve test coverage analizi ozellikleri mevcuttur.',
          },
        },
        {
          '@type': 'Question',
          name: 'HTML/CSS onizleme ozelligi nasil calisir?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ailydian, uretilen HTML/CSS kodunu sandbox iframe icinde canli olarak onizler. Guvenli sandbox ortaminda (allow-scripts, allow-modals) kodunuzu aninda gorebilir, test edebilir ve iteratif olarak iyilestirebilirsiniz. Manus tarzinda overlay goruntuleyici ile tam ekran onizleme de mumkundur.',
          },
        },
        {
          '@type': 'Question',
          name: 'Yapay zeka gelistiricilerin yerini alacak mi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Hayir, AI gelistiricilerin yerini almak yerine onlari guclendirir. Rutin ve tekrarlayan gorevleri otomatiklestirerek gelistiricilerin yaratici problem cozme, mimari tasarim, karmasik is mantigi ve stratejik kararlara odaklanmasini saglar. AI bir arac, gelistirici ise ustadir.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian API gelistirme destegi sunuyor mu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Evet, Ailydian RESTful API endpoint tasarimi, GraphQL schema olusturma, API dokumantasyonu, authentication/authorization implementasyonu, rate limiting, error handling ve API test yazimi konularinda kapsamli destek sunar. Express.js, FastAPI, Spring Boot, Django REST gibi frameworkleri destekler.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ailydian ile veritabani sorgulari yazilabilir mi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Evet, Ailydian SQL (PostgreSQL, MySQL, SQLite, MSSQL), NoSQL (MongoDB, Redis, Cassandra), ORM konfigurasyonu (Prisma, TypeORM, Sequelize, SQLAlchemy), migration scriptleri ve veritabani sema tasarimi konularinda destek sunar. Karmasik JOIN sorgulari, indeks optimizasyonu ve performans iyilestirme onerileri saglar.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://www.ailydian.com/yapay-zeka-kodlama#breadcrumb',
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
          name: 'Yapay Zeka ile Kodlama',
          item: 'https://www.ailydian.com/yapay-zeka-kodlama',
        },
      ],
    },
  ],
};

const supportedLanguages = [
  { name: 'Python', category: 'Backend' },
  { name: 'JavaScript', category: 'Web' },
  { name: 'TypeScript', category: 'Web' },
  { name: 'Java', category: 'Backend' },
  { name: 'C#', category: 'Backend' },
  { name: 'C++', category: 'Systems' },
  { name: 'Go', category: 'Backend' },
  { name: 'Rust', category: 'Systems' },
  { name: 'PHP', category: 'Web' },
  { name: 'Ruby', category: 'Web' },
  { name: 'Swift', category: 'Mobile' },
  { name: 'Kotlin', category: 'Mobile' },
  { name: 'SQL', category: 'Data' },
  { name: 'HTML/CSS', category: 'Web' },
  { name: 'React', category: 'Framework' },
  { name: 'Vue.js', category: 'Framework' },
  { name: 'Angular', category: 'Framework' },
  { name: 'Node.js', category: 'Runtime' },
  { name: 'Django', category: 'Framework' },
  { name: 'Flask', category: 'Framework' },
  { name: 'Spring Boot', category: 'Framework' },
  { name: 'Next.js', category: 'Framework' },
  { name: 'Dart', category: 'Mobile' },
  { name: 'Scala', category: 'Backend' },
  { name: 'R', category: 'Data' },
  { name: 'Bash', category: 'DevOps' },
  { name: 'PowerShell', category: 'DevOps' },
  { name: 'Solidity', category: 'Blockchain' },
  { name: 'GraphQL', category: 'API' },
  { name: 'Terraform', category: 'DevOps' },
];

const categoryColors: Record<string, string> = {
  Web: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
  Backend: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
  Systems: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
  Mobile: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400',
  Data: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400',
  Framework: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
  Runtime: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400',
  DevOps: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400',
  Blockchain: 'from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400',
  API: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-400',
};

export default function YapayZekaKodlamaPage() {
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
                Yapay Zeka ile Kodlama
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4">
                Ailydian AI Kod Motoru ile Yazilim Gelistirmenin Gelecegi
              </p>
              <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto">
                50+ programlama dilinde kod uretimi, bug duzeltme, refactoring, test yazimi ve API
                gelistirme. Turkce destekli yapay zeka kod asistani ile verimliliginizi 10 kat artirin.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/chat"
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Kod Yazmaya Baslayin
                </Link>
                <Link
                  href="#nasil-calisir"
                  className="px-8 py-4 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-all"
                >
                  Nasil Calisir?
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* AI ile Kodlama Nedir? */}
        <section className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-16">
            <article className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-8 text-center">AI ile Kodlama Nedir?</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-gray-300 mb-6">
                  Yapay zeka ile kodlama (AI-assisted coding), yapay zeka motorlarinin dogal dil
                  komutlarindan veya teknik spesifikasyonlardan otomatik olarak kaynak kod uretmesi,
                  mevcut kodu analiz etmesi, hata bulup duzeltmesi ve kod kalitesini iyilestirmesi
                  surecleridir. Bu teknoloji, yazilim gelistirme dunyasini kokunden donusturerek
                  gelistiricilerin verimliligi ile kod kalitesini es zamanli olarak artirmaktadir.
                </p>
                <p className="text-lg text-gray-300 mb-6">
                  Geleneksel yazilim gelistirmede, bir gelistirici her satir kodu manuel olarak yazar,
                  hatalari tek tek bulur ve duzeltir. Bu surecte saatlerce hatta gunlerce vakit
                  harcanabilir. Yapay zeka kod asistanlari ise bu sureyi dramatik olarak kisaltir.
                  Gelistirici ne yapmak istedigini dogal dille aciklar, AI motoru uygun kodu saniyeler
                  icinde uretir. Ustelik uretilen kod, best practice kurallarina uygun, okunabilir
                  ve test edilebilir yapidadir.
                </p>
                <p className="text-lg text-gray-300 mb-6">
                  Ailydian AI kod motoru, ozel optimize edilmis yapay zeka altyapisi kullanarak
                  Python, JavaScript, TypeScript, Java, C#, C++, Go, Rust, PHP, Ruby, Swift, Kotlin
                  ve 50&apos;den fazla programlama dilinde yuksek kaliteli kod uretir. Platform, sadece
                  kod yazmakla kalmaz; bug duzeltme, kod inceleme (code review), refactoring,
                  otomatik dokumantasyon yazimi, test uretimi, API gelistirme ve veritabani sorgu
                  optimizasyonu gibi yazilim gelistirmenin her asamasinda destek saglar.
                </p>
                <p className="text-lg text-gray-300">
                  Kod motorumuz, milyonlarca acik kaynak kod deposunda egitilmis ve surekli
                  guncellenen yapay zeka modelleri kullanir. Bu modeller, programlama dillerinin
                  sozdizimini, yaygin tasarim kaliplarini (design patterns), SOLID prensiplerini,
                  guvenlik standartlarini ve performans optimizasyonu tekniklerini derinlemesine
                  ogrenmistir. Sonuc olarak uretilen kod, deneyimli bir yazilim muhendisinin
                  yazacagi kalitede ve bazen daha da ustun olur.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* Supported Languages Grid */}
        <section className="border-b border-gray-800 bg-gray-900/30">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold mb-4 text-center">
              Desteklenen Programlama Dilleri ve Frameworkler
            </h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Ailydian AI kod motoru 50+ programlama dilinde uzman seviyesinde kod uretir.
              En populer diller ve frameworkler:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3 max-w-6xl mx-auto">
              {supportedLanguages.map((lang) => (
                <div
                  key={lang.name}
                  className={`bg-gradient-to-br ${categoryColors[lang.category]} border rounded-lg px-3 py-3 text-center`}
                >
                  <div className="font-semibold text-sm">{lang.name}</div>
                  <div className="text-xs opacity-70 mt-1">{lang.category}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid - 8 Cards */}
        <section className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold mb-12 text-center">
              AI Kod Motorunun Ozellikleri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F4BB;</div>
                <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Kod Uretimi
                </h3>
                <p className="text-gray-300 text-sm">
                  Dogal dilde aciklama yapin, AI aninda tam fonksiyonlar, siniflar, moduller
                  ve tam projeler uretsin. 50+ dilde destek. &quot;Bir REST API endpoint
                  yaz&quot; gibi komutlarla saniyeler icinde kod uretilir.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F41B;</div>
                <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Bug Duzeltme
                </h3>
                <p className="text-gray-300 text-sm">
                  Hatali kodu yapistirin veya hata mesajini paylasin. AI motoru, hatanin kaynagini
                  tespit eder, neden oldugunu aciklar ve duzeltilmis kodu uretir. Syntax, logic,
                  runtime ve guvenlik hatalari desteklenir.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F50D;</div>
                <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Kod Inceleme
                </h3>
                <p className="text-gray-300 text-sm">
                  Kodunuzu AI&apos;a gonderin, kapsamli code review alin. Kod kalitesi,
                  okunabilirlik, guvenlik aciklari, performans sorunlari, SOLID prensipleri
                  ve best practice uyumu degerlendirilir.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F504;</div>
                <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Refactoring
                </h3>
                <p className="text-gray-300 text-sm">
                  Mevcut kodu modernize edin ve iyilestirin. Fonksiyon ayristirma, sinif
                  yapisi duzenleme, naming conventions, design pattern uygulama ve teknik
                  borc azaltma onerileri alin.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F4DD;</div>
                <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Dokumantasyon
                </h3>
                <p className="text-gray-300 text-sm">
                  Kodunuz icin otomatik dokumantasyon uretin. Fonksiyon aciklamalari, JSDoc/Docstring,
                  API dokumanlari, README dosyalari ve kullanim ornekleri AI tarafindan olusturulur.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F9EA;</div>
                <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Test Yazimi
                </h3>
                <p className="text-gray-300 text-sm">
                  Otomatik unit test, integration test ve E2E test senaryolari uretin.
                  Jest, PyTest, JUnit, Mocha destegi. Edge case tespiti, mock/stub
                  uretimi ve test coverage analizi.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F310;</div>
                <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  API Gelistirme
                </h3>
                <p className="text-gray-300 text-sm">
                  RESTful ve GraphQL API tasarimi, endpoint implementasyonu, authentication,
                  rate limiting, error handling ve API dokumantasyonu. Express.js, FastAPI,
                  Spring Boot destegi.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F5C3;</div>
                <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Veritabani Sorgulari
                </h3>
                <p className="text-gray-300 text-sm">
                  SQL ve NoSQL veritabani sorgulari, sema tasarimi, ORM konfigurasyonu,
                  migration scriptleri ve sorgu optimizasyonu. PostgreSQL, MySQL, MongoDB,
                  Redis destegi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Nasil Calisir? - 4 Steps */}
        <section id="nasil-calisir" className="border-b border-gray-800 bg-gray-900/30">
          <div className="container mx-auto px-4 py-16">
            <article className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-8 text-center">
                Ailydian Kod Motoru Nasil Calisir?
              </h2>
              <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
                Dort basit adimda AI destekli kod yazma deneyimi:
              </p>

              <div className="space-y-8">
                {/* Step 1 */}
                <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
                  <h3 className="text-2xl font-semibold mb-4 text-purple-400">
                    1. Prompt Yazin
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Ne yapmak istediginizi dogal dilde aciklayin. Turkce veya Ingilizce,
                    istediginiz kadar detayli veya ozet olabilir. AI motoru sorgunuzu analiz
                    eder, programlama dilini, gorev turunu ve karmasiklik seviyesini otomatik
                    olarak belirler.
                  </p>
                  <div className="bg-black/50 rounded-lg p-4 border border-gray-700 font-mono text-sm">
                    <div className="text-gray-500 mb-2">// Ornek prompt:</div>
                    <div className="text-green-400">
                      &quot;Express.js ile JWT authentication kullanan bir login endpoint yaz.
                      bcrypt ile sifre karsilastirmasi yap, access ve refresh token uret,
                      hata durumlari icin uygun HTTP status kodlari dondur.&quot;
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
                  <h3 className="text-2xl font-semibold mb-4 text-blue-400">
                    2. AI Kod Uretir
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Ailydian kod motoru, en uygun yapay zeka altyapisini secip sorgunuzu isler.
                    Best practice kurallarina uygun, okunabilir, test edilebilir ve guvenli
                    kod uretilir. Kod, syntax highlighting ve dil etiketi ile formatli olarak
                    sunulur.
                  </p>
                  <div className="bg-black/50 rounded-lg p-4 border border-gray-700 font-mono text-sm overflow-x-auto">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">javascript</span>
                      <span className="text-xs text-gray-600">Kopyala</span>
                    </div>
                    <pre className="text-gray-300">
{`const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      error: 'Gecersiz kimlik bilgileri'
    });
  }

  const isMatch = await bcrypt.compare(
    password, user.passwordHash
  );
  if (!isMatch) {
    return res.status(401).json({
      error: 'Gecersiz kimlik bilgileri'
    });
  }

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({ accessToken, refreshToken });
};`}
                    </pre>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
                  <h3 className="text-2xl font-semibold mb-4 text-pink-400">
                    3. Onizleyin ve Test Edin
                  </h3>
                  <p className="text-gray-300 mb-4">
                    HTML/CSS kodlari icin sandbox iframe icinde canli onizleme yapin. Diger
                    dillerdeki kodlari aninda kopyalayip projenizde test edin. Uretilen kodu
                    inceleyip gerekirse AI&apos;a ek talimatlar vererek iteratif olarak
                    iyilestirin. Her kod blogunun uzerinde dil etiketi ve tek tikla kopyalama
                    butonu bulunur.
                  </p>
                  <div className="bg-black/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-500 ml-2">Onizleme - sandbox iframe</span>
                    </div>
                    <div className="bg-gray-900 rounded p-6 text-center">
                      <div className="text-gray-400 text-sm">
                        [Canli HTML/CSS onizleme alani]
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        sandbox=&quot;allow-scripts allow-modals&quot;
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-gray-800/30 p-8 rounded-xl border border-gray-700">
                  <h3 className="text-2xl font-semibold mb-4 text-green-400">
                    4. Kopyalayin ve Kullanin
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Uretilen kodu tek tikla kopyalayin ve projenize entegre edin. AI motoru,
                    urettigi kodun yaninda aciklamalar, kullanim ornekleri ve iyilestirme
                    onerileri de sunar. Ayrica kodun yaninda otomatik dokumantasyon ve test
                    senaryolari da talep edebilirsiniz.
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-3">
                      <div className="text-sm font-semibold text-purple-400">Kopyala</div>
                      <div className="text-xs text-gray-500 mt-1">Tek tik ile panoya</div>
                    </div>
                    <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
                      <div className="text-sm font-semibold text-blue-400">Onizle</div>
                      <div className="text-xs text-gray-500 mt-1">HTML/CSS canli</div>
                    </div>
                    <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-3">
                      <div className="text-sm font-semibold text-green-400">Iyilestir</div>
                      <div className="text-xs text-gray-500 mt-1">Iteratif gelistirme</div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Use Cases */}
        <section className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold mb-12 text-center">
              Gercek Dunya Kullanim Alanlari
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <article className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F310;</div>
                <h3 className="text-xl font-semibold mb-3">Web Gelistirme</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Frontend ve backend web uygulamalari gelistirin. React, Vue, Angular ile
                  kullanici arayuzu; Node.js, Django, Spring Boot ile sunucu tarafi kodlari
                  AI destekli uretin.
                </p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>- React componentleri ve hooks</li>
                  <li>- REST API endpointleri</li>
                  <li>- Authentication ve authorization</li>
                  <li>- Responsive CSS ve animasyonlar</li>
                </ul>
              </article>

              <article className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F4F1;</div>
                <h3 className="text-xl font-semibold mb-3">Mobil Uygulama</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Swift ile iOS, Kotlin ile Android veya Flutter/React Native ile cross-platform
                  mobil uygulama kodlari yazin. UI componentleri, navigation, state management
                  ve API entegrasyonu.
                </p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>- SwiftUI ve Jetpack Compose</li>
                  <li>- React Native componentleri</li>
                  <li>- Flutter widget gelistirme</li>
                  <li>- Push notification entegrasyonu</li>
                </ul>
              </article>

              <article className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F4CA;</div>
                <h3 className="text-xl font-semibold mb-3">Veri Bilimi</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Python ile veri analizi, makine ogrenmesi modelleri, istatistiksel analizler
                  ve veri gorsellestirme kodlari uretin. pandas, numpy, scikit-learn, matplotlib
                  destegi.
                </p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>- Veri temizleme ve on isleme</li>
                  <li>- ML model egitimi ve degerlendirme</li>
                  <li>- Veri gorsellestirme ve raporlama</li>
                  <li>- Jupyter notebook entegrasyonu</li>
                </ul>
              </article>

              <article className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x2699;</div>
                <h3 className="text-xl font-semibold mb-3">DevOps ve Otomasyon</h3>
                <p className="text-gray-300 text-sm mb-3">
                  CI/CD pipeline yapilandirmalari, Docker/Kubernetes konfigurasyonlari,
                  Terraform altyapi kodlari ve otomasyon scriptleri. Deployment sureclerinizi
                  AI ile hizlandirin.
                </p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>- Dockerfile ve docker-compose</li>
                  <li>- GitHub Actions / GitLab CI</li>
                  <li>- Terraform IaC sablonlari</li>
                  <li>- Bash otomasyon scriptleri</li>
                </ul>
              </article>

              <article className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F5C4;</div>
                <h3 className="text-xl font-semibold mb-3">Veritabani</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Karmasik SQL sorgulari, veritabani sema tasarimi, indeks optimizasyonu,
                  migration scriptleri ve ORM konfigurasyonlari. PostgreSQL, MySQL, MongoDB
                  ve Redis destegi.
                </p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>- Karmasik JOIN ve subquery</li>
                  <li>- Indeks ve performans optimizasyonu</li>
                  <li>- Prisma / TypeORM / SQLAlchemy</li>
                  <li>- Database migration yonetimi</li>
                </ul>
              </article>

              <article className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700">
                <div className="text-3xl mb-4">&#x1F512;</div>
                <h3 className="text-xl font-semibold mb-3">Guvenlik ve Kalite</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Guvenlik odakli kod inceleme, OWASP Top 10 uyumlu kod yazimi, penetrasyon
                  test scriptleri ve guvenli authentication implementasyonlari. Kod kalitesi
                  ve best practice kontrolu.
                </p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>- SQL injection ve XSS onleme</li>
                  <li>- Input validation ve sanitization</li>
                  <li>- Guvenli sifreleme uygulamalari</li>
                  <li>- CORS ve CSP konfigurasyonu</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* Kod Kalitesi ve Best Practices */}
        <section className="border-b border-gray-800 bg-gray-900/30">
          <div className="container mx-auto px-4 py-16">
            <article className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-8 text-center">
                Kod Kalitesi ve Best Practice Uygulamalari
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Ailydian AI kod motoru, sadece calisan kod yazmakla kalmaz; uretilen kodun
                kalitesini, surudurulebilirligini ve guvenligini en ust duzeyde tutar. Iste
                kod motorumuzun uyguladigi standartlar:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-purple-400">
                    SOLID Prensipleri
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Uretilen kod, Single Responsibility, Open/Closed, Liskov Substitution,
                    Interface Segregation ve Dependency Inversion prensiplerine uygun
                    yapilandirilir. Temiz, modular ve genisletilebilir mimari.
                  </p>
                </div>

                <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">
                    Clean Code Standartlari
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Anlamli degisken isimleri, tutarli formatlama, kucuk ve odakli fonksiyonlar,
                    minimal yorum gerektiren okunabilir kod. DRY (Don&apos;t Repeat Yourself) ve
                    KISS (Keep It Simple) prensipleri.
                  </p>
                </div>

                <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-green-400">
                    Guvenlik Standartlari
                  </h3>
                  <p className="text-gray-300 text-sm">
                    OWASP Top 10 uyumlu kod uretimi. Input validation, output encoding,
                    parameterized queries, guvenli sifreleme, proper error handling ve
                    minimum yetki prensibi.
                  </p>
                </div>

                <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-lg font-semibold mb-3 text-orange-400">
                    Performans Optimizasyonu
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Verimli algoritma secimi, uygun veri yapisi kullanimi, lazy loading,
                    memoization, connection pooling ve async/await pattern uygulamalari.
                    O(n) karmasiklik analizi.
                  </p>
                </div>
              </div>

              <p className="text-gray-300 mt-8">
                Bu standartlar sayesinde Ailydian kod motoru ile uretilen kodlar, mevcut
                projelere kolayca entegre edilebilir, diger gelistiriciler tarafindan rahatca
                anlasilabilir ve uzun vadeli bakim maliyetlerini dusurur. Otomatik kod inceleme
                ozelligi ile mevcut kodunuzun bu standartlara uyumunu da degerlendirebilirsiniz.
              </p>
            </article>
          </div>
        </section>

        {/* Verimlilik Istatistikleri */}
        <section className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold mb-12 text-center">
              Yazilim Gelistirme Verimliligi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  55%
                </div>
                <div className="text-gray-300 font-semibold">Daha Hizli Kodlama</div>
                <div className="text-sm text-gray-400 mt-2">
                  Kod yazma hizinda ortalama artis
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  40%
                </div>
                <div className="text-gray-300 font-semibold">Daha Az Bug</div>
                <div className="text-sm text-gray-400 mt-2">
                  Hata ve guvenlik acigi azalmasi
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  3x
                </div>
                <div className="text-gray-300 font-semibold">Daha Fazla Is</div>
                <div className="text-sm text-gray-400 mt-2">
                  Ayni surede tamamlanan gorev
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  50+
                </div>
                <div className="text-gray-300 font-semibold">Programlama Dili</div>
                <div className="text-sm text-gray-400 mt-2">
                  Framework ve dil destegi
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto">
              <p className="text-gray-300 text-lg">
                Arastirmalar, AI kod asistani kullanan gelistiricilerin coding verimliligi,
                kod kalitesi ve is tatmini acisindan onemli iyilesmeler yasadigini gostermektedir.
                Ailydian AI kod motoru, rutin gorevlerde harcanan zamani azaltarak gelistiricilerin
                yaratici problem cozme, mimari tasarim ve karmasik is mantigi gelistirmeye
                odaklanmasini saglar. Bu da hem bireysel gelistiriciler hem de yazilim ekipleri
                icin kayda deger verimlilik kazanimi demektir.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-b border-gray-800 bg-gray-900/30">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold mb-12 text-center">
              Sikca Sorulan Sorular
            </h2>
            <div className="max-w-4xl mx-auto space-y-6">
              {jsonLd['@graph'][1].mainEntity.map(
                (faq: { name: string; acceptedAnswer: { text: string } }, index: number) => (
                  <div
                    key={index}
                    className="bg-gray-800/30 p-6 rounded-xl border border-gray-700"
                  >
                    <h3 className="text-xl font-semibold mb-3 text-blue-400">{faq.name}</h3>
                    <p className="text-gray-300">{faq.acceptedAnswer.text}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold mb-8 text-center">Ilgili Konular</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Link
                href="/yapay-zeka"
                className="block bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all"
              >
                <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Yapay Zeka Nedir?
                </h3>
                <p className="text-gray-400 text-sm">
                  AI temellerini, tarihcesini ve teknolojisini kesfedip ogrenin.
                </p>
              </Link>

              <Link
                href="/coklu-yapay-zeka"
                className="block bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all"
              >
                <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Coklu Yapay Zeka
                </h3>
                <p className="text-gray-400 text-sm">
                  Coklu AI motoru platformunun ustunlukleri ve avantajlari.
                </p>
              </Link>

              <Link
                href="/yapay-zeka-asistani"
                className="block bg-gray-800/50 backdrop-blur p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all"
              >
                <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  AI Asistan
                </h3>
                <p className="text-gray-400 text-sm">
                  Yapay zeka asistaninin tum ozellikleri ve kullanim alanlari.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6">
                Yazilim Gelistirmenizi 10x Hizlandirin
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Ailydian AI kod motoru ile 50+ dilde kod yazin, bug duzeltun, refactoring yapin
                ve test uretin. Turkce destekli, KVKK uyumlu yapay zeka kod asistani.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/chat"
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Ucretsiz Kod Yazmaya Baslayin
                </Link>
                <Link
                  href="/yapay-zeka"
                  className="px-8 py-4 bg-gray-800 rounded-lg font-semibold text-lg hover:bg-gray-700 transition-all"
                >
                  Yapay Zeka Kesfet
                </Link>
              </div>
              <p className="text-gray-400 mt-6">
                English version:{' '}
                <Link href="/en/multi-ai-platform" className="text-blue-400 hover:underline">
                  Multi-AI Platform (English)
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
