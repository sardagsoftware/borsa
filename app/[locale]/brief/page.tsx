import React from 'react';
import Link from 'next/link';
import { Brain, Sparkles, Shield, Globe, Zap, TrendingUp, BarChart3, Lock, Bot, Target, Layers, Cpu, AlertTriangle, CheckCircle, Star, Award, Users, BookOpen, Headphones, Smartphone } from 'lucide-react';

export default function BriefPage({ params }: { params: { locale: string } }) {
  const currentLocale = params.locale;

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-blue-400" />,
      title: "Ailydian Yapay Zeka + 8 Dev AI",
      description: "Gelişmiş yapay zeka modelleri ile kripto analizi, risk yönetimi ve trading stratejileri oluşturma",
      details: ["Gerçek zamanlı piyasa analizi", "Akıllı risk değerlendirmesi", "Otomatik strateji önerileri", "Doğal dil ile trading komutları"]
    },
    {
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      title: "Premium UI/UX",
      description: "Lucide React ikonu sistemi ile modern, profesyonel arayüz tasarımı",
      details: ["Gradient arka planlar", "Smooth animasyonlar", "Responsive tasarım", "Dark/Light tema desteği"]
    },
    {
      icon: <Globe className="w-8 h-8 text-green-400" />,
      title: "14 Dil Desteği",
      description: "Z.AI destekli çeviri sistemi ile global kullanıcı erişimi",
      details: ["Türkçe, İngilizce, Çince, Japonca", "Arapça, Farsça RTL desteği", "Kripto terim koruması", "SEO optimized routing"]
    },
    {
      icon: <Shield className="w-8 h-8 text-red-400" />,
      title: "Kurumsal Güvenlik",
      description: "A+ sınıfı güvenlik sistemleri ve şifreleme teknolojileri",
      details: ["AES-256-GCM şifreleme", "Kill-switch API sistemi", "Multi-factor authentication", "Zero-trust architecture"]
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-yellow-400" />,
      title: "Gelişmiş Analytics",
      description: "50+ teknik indicator ve makine öğrenmesi destekli piyasa analizi",
      details: ["TradingView entegrasyonu", "Social sentiment analizi", "News impact scoring", "Backtesting sistemleri"]
    },
    {
      icon: <Bot className="w-8 h-8 text-indigo-400" />,
      title: "Otomatik Trading",
      description: "AI-powered trading botları ile 7/24 otomatik işlem yapma",
      details: ["DCA stratejileri", "Grid trading", "Arbitraj fırsatları", "Risk management"]
    }
  ];

  const exchanges = [
    { name: "Binance", logo: "🟡", features: ["Spot", "Futures", "Options"] },
    { name: "Coinbase", logo: "🔵", features: ["Spot", "Pro Trading"] },
    { name: "Kraken", logo: "🟣", features: ["Spot", "Futures", "Margin"] },
    { name: "KuCoin", logo: "🟢", features: ["Spot", "Futures", "P2P"] },
    { name: "Bybit", logo: "🟠", features: ["Derivatives", "Spot"] },
    { name: "OKX", logo: "⚫", features: ["Spot", "Derivatives", "DEX"] }
  ];

  const languages = [
    { name: "Türkçe", flag: "🇹🇷", status: "Native" },
    { name: "English", flag: "🇺🇸", status: "Complete" },
    { name: "中文", flag: "🇨🇳", status: "Complete" },
    { name: "日本語", flag: "🇯🇵", status: "Complete" },
    { name: "한국어", flag: "🇰🇷", status: "Complete" },
    { name: "العربية", flag: "🇸🇦", status: "RTL Support" },
    { name: "فارسی", flag: "🇮🇷", status: "RTL Support" },
    { name: "Español", flag: "🇪🇸", status: "Complete" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <header className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30">
            <Brain className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Ailydian Yapay Zeka + 8 Dev Yapay Zeka Desteği</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6 font-heading">
            AILYDIAN AI LENS PRO
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-4 max-w-4xl mx-auto leading-relaxed font-body">
            Gelişmiş AI teknolojisi ile desteklenmiş, kurumsal düzeyde güvenlik ve 14 dil desteği sunan 
            <span className="text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-semibold"> yeni nesil kripto trading platformu</span>
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8 text-slate-400 font-body text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>A+ Security Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>14 Language Support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>6 Major Exchanges</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={`/${currentLocale}/auth/signin`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-2xl shadow-blue-500/25"
            >
              <Zap className="w-5 h-5" />
              Trading'e Başla
            </Link>
            <Link 
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-white font-semibold rounded-xl transition-all border border-slate-700 hover:border-slate-600"
            >
              <BookOpen className="w-5 h-5" />
              Özellikleri İncele
            </Link>
          </div>
        </header>

        {/* Main Features Section */}
        <section id="features" className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 font-heading">
              Platform <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Özellikleri</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto font-body">
              AILYDIAN AI Lens Pro, kripto trading deneyiminizi bir sonraki seviyeye taşıyacak 
              gelişmiş özellikler ve yetenekler sunar
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-slate-700/50 rounded-xl group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 font-heading">{feature.title}</h3>
                    <p className="text-slate-300 mb-4 font-body text-sm">{feature.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Assistant Showcase */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl p-8 md:p-12 border border-blue-500/20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-4 px-4 py-2 bg-blue-500/20 rounded-full">
                <Brain className="w-5 h-5 text-blue-400" />
                <span className="text-blue-300 font-medium">AI Assistant</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-heading">
                Ailydian Yapay Zeka ile <span className="text-blue-400">Akıllı Trading</span>
              </h2>
              <p className="text-base text-slate-300 max-w-2xl mx-auto font-body">
                8 farklı gelişmiş yapay zeka modeli ile kripto piyasalarında uzman düzeyinde analiz ve tavsiyeler
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/30">
                <Target className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Piyasa Analizi</h3>
                <p className="text-slate-300 text-sm">Gerçek zamanlı teknik ve fundamental analiz ile doğru trading kararları</p>
              </div>
              <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/30">
                <AlertTriangle className="w-8 h-8 text-yellow-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Risk Yönetimi</h3>
                <p className="text-slate-300 text-sm">Akıllı risk değerlendirmesi ve otomatik stop-loss önerileri</p>
              </div>
              <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700/30">
                <Layers className="w-8 h-8 text-green-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Strateji Geliştirme</h3>
                <p className="text-slate-300 text-sm">Kişiselleştirilmiş trading stratejileri ve backtesting desteği</p>
              </div>
            </div>
          </div>
        </section>

        {/* Exchange Integration */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-green-400">6 Büyük Borsa</span> Entegrasyonu
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Dünyanın en büyük kripto borsalarında tek platformdan trading yapın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exchanges.map((exchange, index) => (
              <div key={index} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">{exchange.logo}</div>
                  <h3 className="text-xl font-bold text-white">{exchange.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {exchange.features.map((feature, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-700/50 text-slate-300 text-sm rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Multi-Language Support */}
        <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                <span className="text-purple-400">14 Dil</span> Desteği
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Ailydian yapay zeka destekli çeviri sistemi ile global kullanıcı deneyimi
              </p>
            </div>          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {languages.map((lang, index) => (
              <div key={index} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-center hover:border-purple-500/50 transition-colors">
                <div className="text-2xl mb-2">{lang.flag}</div>
                <div className="text-white font-medium text-sm mb-1">{lang.name}</div>
                <div className="text-xs text-purple-400">{lang.status}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Performance Stats */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-yellow-400">Performans</span> Metrikleri
            </h2>
            <p className="text-lg text-slate-300">
              Production ortamında kanıtlanmış güvenilirlik ve performans
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-yellow-400 mb-1">99.9%</div>
              <div className="text-sm text-slate-400">Uptime</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
              <Cpu className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-blue-400 mb-1">&lt; 1ms</div>
              <div className="text-sm text-slate-400">API Gecikme</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
              <Lock className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-400 mb-1">A+</div>
              <div className="text-sm text-slate-400">Security Rating</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
              <Headphones className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-purple-400 mb-1">24/7</div>
              <div className="text-sm text-slate-400">Destek</div>
            </div>
          </div>
        </section>

        {/* Advanced Capabilities */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-red-400">Gelişmiş</span> Yetenekler
            </h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">
              Profesyonel traderlar için tasarlanmış gelişmiş araçlar ve özellikler
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                Analytics & Intelligence
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold">50+ Teknik İndikatör</h4>
                    <p className="text-slate-400 text-sm">RSI, MACD, Bollinger Bands, Ichimoku ve daha fazlası</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold">Social Sentiment Analizi</h4>
                    <p className="text-slate-400 text-sm">Twitter, Reddit, Discord'dan gerçek zamanlı duygu analizi</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold">News Impact Scoring</h4>
                    <p className="text-slate-400 text-sm">Haberlerin piyasa etkisini AI ile analiz etme</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold">Backtesting Engine</h4>
                    <p className="text-slate-400 text-sm">Stratejilerinizi geçmiş verilerle test edin</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-red-400" />
                Security & Risk Management
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold">AES-256-GCM Şifreleme</h4>
                    <p className="text-slate-400 text-sm">Askeri düzeyde şifreleme ile API key koruması</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold">Kill-Switch API</h4>
                    <p className="text-slate-400 text-sm">Acil durumlarda anında trading durdurma</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold">Multi-Factor Authentication</h4>
                    <p className="text-slate-400 text-sm">TOTP, SMS ve Email doğrulama sistemleri</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold">Zero-Trust Architecture</h4>
                    <p className="text-slate-400 text-sm">Her işlem güvenlik katmanlarından geçer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Architecture */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-slate-800/30 to-slate-900/30 rounded-3xl p-8 md:p-12 border border-slate-700/30">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                <span className="text-indigo-400">Teknik</span> Altyapı
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Modern teknolojiler ve best practice'ler ile geliştirilmiş sağlam mimari
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/30 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-400 font-bold">N.js</span>
                </div>
                <h3 className="text-white font-bold mb-2">Next.js 14.2.32</h3>
                <p className="text-slate-400 text-sm">App Router ile modern React framework</p>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/30 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-400 font-bold">AI</span>
                </div>
                <h3 className="text-white font-bold mb-2">Ailydian Yapay Zeka</h3>
                <p className="text-slate-400 text-sm">8 farklı yapay zeka modeli entegrasyonu</p>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/30 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-400 font-bold">PG</span>
                </div>
                <h3 className="text-white font-bold mb-2">PostgreSQL</h3>
                <p className="text-slate-400 text-sm">Güvenilir veri tabanı sistemi</p>
              </div>

              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/30 text-center">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-yellow-400 font-bold">V</span>
                </div>
                <h3 className="text-white font-bold mb-2">Vercel Edge</h3>
                <p className="text-slate-400 text-sm">Global CDN ve edge computing</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile App Preview */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="text-pink-400">Mobil</span> Uygulama
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              iOS ve Android için native mobile uygulama yakında
            </p>
          </div>

          <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-3xl p-8 md:p-12 border border-pink-500/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Smartphone className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Native Performance</h3>
                <p className="text-slate-300">React Native ile geliştirilmiş yüksek performanslı mobil deneyim</p>
              </div>
              <div className="text-center">
                <Lock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Biometric Security</h3>
                <p className="text-slate-300">Face ID, Touch ID ve PIN ile güvenli giriş sistemleri</p>
              </div>
              <div className="text-center">
                <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Real-time Alerts</h3>
                <p className="text-slate-300">Anında push notification ile piyasa uyarıları</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl p-8 md:p-12 border border-blue-500/30">
            <Star className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Trading Geleceğinizi <span className="text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Bugün Başlatın</span>
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              AILYDIAN AI Lens Pro ile kripto trading deneyiminizi bir sonraki seviyeye taşıyın. 
              Gelişmiş AI teknolojisi, kurumsal güvenlik ve global erişim bir arada.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link 
                href={`/${currentLocale}/auth/signin`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-2xl shadow-blue-500/25"
              >
                <Zap className="w-5 h-5" />
                Ücretsiz Hesap Aç
              </Link>
              <Link 
                href={`/${currentLocale}/docs`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-white font-semibold rounded-xl transition-all border border-slate-700 hover:border-slate-600"
              >
                <BookOpen className="w-5 h-5" />
                Dokümantasyon
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Kredi kartı gerekmez</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Anında aktivasyon</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>24/7 destek</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Paper trading dahil</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
