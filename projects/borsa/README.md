# 📈 BORSA PRO - Profesyonel Finansal Piyasa Takip Platformu

BORSA PRO, gerçek zamanlı hisse senedi ve kripto para takibi için geliştirilmiş modern, profesyonel bir web uygulamasıdır.

## 🌟 Özellikler

### 📊 Ana Dashboard
- Gerçek zamanlı piyasa özeti
- Canlı hisse senedi ve kripto para fiyatları
- Dinamik grafikler ve trend analizi
- Neon efektli modern UI

### 💰 Hisse Senetleri
- Detaylı hisse analizi sayfaları
- Fiyat grafikleri ve teknik indikatörler
- Şirket bilgileri ve finansal veriler
- Watchlist ekleme/çıkarma

### 🪙 Kripto Paralar
- Bitcoin, Ethereum ve diğer major kripto paralar
- Gerçek zamanlı fiyat güncellemeleri
- Piyasa kapitalizasyonu ve hacim bilgileri
- 24 saatlik değişim oranları

### 👁️ İzleme Listesi (Watchlist)
- Favori hisse ve kripto paraları kaydetme
- Hızlı erişim ve takip
- Özelleştirilebilir liste yönetimi

### 🔍 Gelişmiş Arama
- Canlı arama önerileri
- Filtreleme ve sıralama seçenekleri
- Kategori bazlı arama (hisse/kripto)

### 💼 Portfolio Yönetimi
- Yatırım portföyü takibi
- Kar/zarar hesaplama
- Portföy performans analizi
- Toplam değer ve getiri oranları

### 📰 Finansal Haberler
- Son dakika piyasa haberleri
- Kategori bazlı haber filtreleme
- Sentiment analizi (pozitif/negatif/nötr)
- Canlı haber güncellemeleri

### 📱 Responsive Design
- Mobil uyumlu tasarım
- Tablet ve desktop optimizasyonu
- Modern UI/UX deneyimi

## 🚀 Teknoloji Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Language**: TypeScript
- **Testing**: Jest + React Testing Library

## ⚙️ Kurulum

### Gereksinimler
- Node.js 18+ 
- npm, yarn, pnpm veya bun

### 1. Projeyi klonlayın
```bash
git clone <repository-url>
cd borsa
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
# veya
yarn install
# veya
pnpm install
# veya
bun install
```

### 3. Ortam değişkenlerini ayarlayın
`.env.example` dosyasını `.env.local` olarak kopyalayın:

```bash
cp .env.example .env.local
```

Daha sonra `.env.local` dosyasında API anahtarlarınızı güncelleyin:

```env
# API Keys for real-time data
NEXT_PUBLIC_ALPHA_VANTAGE_KEY=your_alpha_vantage_key
NEXT_PUBLIC_FINNHUB_KEY=your_finnhub_key
NEXT_PUBLIC_NEWS_API_KEY=your_newsapi_key
```

### 4. Geliştirme sunucusunu başlatın
```bash
npm run dev
# veya
yarn dev
# veya
pnpm dev
# veya
bun dev
```

[http://localhost:3000](http://localhost:3000) adresini tarayıcıda açın.

## 📋 Kullanılabilir Komutlar

```bash
# Geliştirme sunucusu
npm run dev

# Üretim build'i
npm run build

# Üretim sunucusu
npm run start

# Kod kalitesi kontrolü
npm run lint

# Testleri çalıştır
npm run test

# Test izleme modu
npm run test:watch

# Test coverage raporu
npm run test:coverage

# CI/CD testleri
npm run test:ci
```

## 🔧 API Entegrasyonu

Uygulama şu API'ları desteklemektedir:

- **Alpha Vantage**: Hisse senedi verileri
- **Finnhub**: Gerçek zamanlı finansal veriler  
- **CoinGecko**: Kripto para verileri
- **NewsAPI**: Finansal haberler

### API Anahtarları

1. **Alpha Vantage**: [ücretsiz kayıt](https://www.alphavantage.co/support/#api-key)
2. **Finnhub**: [ücretsiz kayıt](https://finnhub.io/register)
3. **NewsAPI**: [ücretsiz kayıt](https://newsapi.org/register)
4. **CoinGecko**: Temel kullanım için anahtar gerekmez

## 🎨 Tema ve Stil

Uygulama [ailydian.com](https://www.ailydian.com) temasını baz alır:

- **Ana renkler**: 
  - `--ac-1: #FF214D` (Ana vurgu)
  - `--ac-2: #FF6A45` (İkincil vurgu)  
  - `--bg-0: #0A0A0B` (Arka plan)
  - `--tx-1: #F3F4F6` (Ana metin)

- **Özellikler**:
  - Neon text efektleri
  - Animasyonlu arka planlar
  - Glassmorphism UI
  - Gradient butonlar
  - Hover efektleri

## 📁 Proje Yapısı

```
src/
├── app/              # Next.js App Router
├── components/       # React bileşenleri
│   ├── ui/          # UI primitive'leri
│   └── dashboard/   # Dashboard bileşenleri
├── hooks/           # Custom React hooks
├── lib/             # API ve utility fonksiyonları
├── services/        # Servisler (WebSocket, etc.)
├── types/           # TypeScript tip tanımları
├── utils/           # Yardımcı fonksiyonlar
└── styles/          # CSS ve stil dosyaları
```

## 🧪 Test

Proje Jest ve React Testing Library ile test edilmektedir:

```bash
# Tüm testleri çalıştır
npm run test

# Watch mode'da testler
npm run test:watch

# Coverage raporu
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Önerilen)

1. [Vercel](https://vercel.com) hesabı oluşturun
2. GitHub repository'sini bağlayın
3. Ortam değişkenlerini Vercel dashboard'dan ekleyin
4. Deploy edin!

### Manuel Deployment

```bash
# Production build
npm run build

# Start production server
npm run start
```

## 🔒 Güvenlik

- API anahtarları `.env.local` dosyasında saklanır
- Client-side API anahtarları `NEXT_PUBLIC_` prefix'i ile başlar
- Hassas veriler server-side'da işlenir
- CORS ve rate limiting koruması

## 📈 Performans Optimizasyonları

- Lazy loading
- Image optimization
- Code splitting
- Memoization
- Debounced search
- API caching
- WebSocket real-time updates

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 Destek

Herhangi bir sorun veya öneriniz için issue açabilirsiniz.

---

⭐ **Bu projeyi beğendiyseniz star vermeyi unutmayın!**
