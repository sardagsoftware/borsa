# 🚀 Vercel Deploy Rehberi - LyDian Trader

**Status:** ✅ PRODUCTION READY
**Build:** ✅ SUCCESS
**TypeScript:** ✅ NO ERRORS

---

## 📋 Ön Hazırlık

### 1. Git Repository Hazırlığı

```bash
cd ~/Desktop/borsa

# Git durumunu kontrol et
git status

# Değişiklikleri ekle
git add .

# Commit yap
git commit -m "🚀 Production ready - Complete trading platform with real data integration"

# GitHub'a push (eğer remote varsa)
git push origin main
```

### 2. CoinMarketCap API Key Al

1. https://coinmarketcap.com/api/ adresine git
2. Ücretsiz hesap oluştur
3. API Key al (Temel plan: 10,000 çağrı/ay ücretsiz)
4. API Key'i kaydet

---

## 🔧 Vercel Deployment Adımları

### Yöntem 1: Vercel CLI (Önerilen)

#### A. Vercel CLI Kurulumu

```bash
# Vercel CLI kur (eğer kurulu değilse)
npm install -g vercel

# Vercel'e giriş yap
vercel login
```

#### B. Deploy Başlat

```bash
cd ~/Desktop/borsa

# İlk deployment
vercel

# Production deployment
vercel --prod
```

#### C. Environment Variables Ayarla

Deploy sırasında CLI size soracak veya manuel ekleyebilirsiniz:

```bash
# Alternatif: Manuel environment variable ekleme
vercel env add COINMARKETCAP_API_KEY
# API key'inizi girin
```

---

### Yöntem 2: Vercel Dashboard (Web Interface)

#### A. Vercel Hesabı ve Proje Oluştur

1. **Vercel'e Git:** https://vercel.com/
2. **Giriş Yap:** GitHub, GitLab veya Bitbucket hesabınızla
3. **New Project:** "Add New" → "Project"
4. **Import Git Repository:**
   - GitHub repository'nizi seçin
   - Ya da "Import Third-Party Git Repository" ile manuel URL girin

#### B. Proje Ayarları

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### C. Environment Variables Ekle

Dashboard'da:
1. **Settings** → **Environment Variables**
2. Şu değişkenleri ekle:

```env
# Required
COINMARKETCAP_API_KEY = your_actual_api_key_here
NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME = LyDian Trader

# Optional - Enhanced Features
NEXT_PUBLIC_ENABLE_2FA = true
NEXT_PUBLIC_ENABLE_WEBSOCKET = true
NEXT_PUBLIC_ENABLE_BOT_TRADING = true
```

#### D. Deploy

- **Deploy** butonuna tıkla
- Vercel otomatik olarak build ve deploy yapacak
- 2-5 dakika içinde tamamlanır

---

## ✅ Deployment Doğrulama

### 1. Build Logs Kontrol

```bash
# Vercel Dashboard'dan:
- Deployments → En son deployment
- View Logs
- Hata olup olmadığını kontrol et
```

### 2. Production URL Test

Deploy tamamlandıktan sonra:

```bash
# Vercel size production URL verecek:
https://your-project-name.vercel.app
```

**Test Checklist:**

- [ ] ✅ Ana sayfa yükleniyor
- [ ] ✅ Navigation çalışıyor
- [ ] ✅ Dashboard sayfası açılıyor
- [ ] ✅ Bot Management sayfası çalışıyor
- [ ] ✅ WebSocket bağlantısı aktif (Console'da kontrol)
- [ ] ✅ CoinMarketCap verisi yükleniyor
- [ ] ✅ Signal notifications çalışıyor
- [ ] ✅ 2FA setup sayfası açılıyor

---

## 🔍 Sorun Giderme

### Build Hataları

```bash
# Local'de test et
npm run build

# Eğer başarılı ise, Vercel'de de çalışmalı
```

### Environment Variable Hataları

```bash
# Vercel Dashboard → Settings → Environment Variables
# Tüm gerekli değişkenlerin eklendiğini kontrol et
# Değişiklik sonrası yeniden deploy gerekir
```

### WebSocket Bağlantı Sorunları

```bash
# Browser console'da kontrol et:
# 🟢 Binance WebSocket bağlandı - mesajını görmelisiniz
```

### CoinMarketCap API Hataları

```bash
# API key doğru girildiğinden emin olun
# Rate limit: 10,000 çağrı/ay (Basic plan)
# Eğer limit aşılırsa, fallback mock data kullanılır
```

---

## 🌍 Custom Domain Bağlama (Opsiyonel)

### 1. Domain Satın Al

- Namecheap, GoDaddy, Google Domains vb.

### 2. Vercel'de Domain Ekle

```bash
# Vercel Dashboard:
Settings → Domains → Add Domain

# Domain'inizi girin: tradingbot.com
```

### 3. DNS Ayarları

```bash
# Domain sağlayıcınızda A/CNAME kayıtları ekleyin:
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4. SSL Sertifikası

- Vercel otomatik olarak Let's Encrypt SSL sertifikası ekler
- Herhangi bir şey yapmanıza gerek yok
- 1-2 saat içinde aktif olur

---

## 📊 Production Monitoring

### Vercel Analytics (Ücretsiz)

```bash
# Vercel Dashboard'dan:
Analytics → Web Vitals
- Page Load Performance
- Core Web Vitals
- User Sessions
```

### Vercel Logs (Real-time)

```bash
# CLI ile:
vercel logs your-project-name --follow

# Dashboard'dan:
Deployments → Latest → Logs
```

---

## 🔄 Continuous Deployment

### Otomatik Deploy Ayarla

```bash
# Vercel otomatik olarak GitHub'daki her push'ta deploy yapar

# Sadece belirli branch'ler için:
Settings → Git → Production Branch: main
Settings → Git → Deploy Preview for: staging, dev
```

### Deploy Hooks

```bash
# CI/CD pipeline'dan deploy tetikle:
curl -X POST https://api.vercel.com/v1/integrations/deploy/...
```

---

## 💾 Backup ve Rollback

### Önceki Versiyona Dön

```bash
# Vercel Dashboard:
Deployments → Önceki deployment seç → "Promote to Production"
```

### Environment Variables Backup

```bash
# CLI ile export:
vercel env pull .env.production

# Backup dosyası oluştur
cp .env.production .env.production.backup
```

---

## 📈 Performance Optimization

### 1. Next.js Image Optimization

```typescript
// Already configured in next.config.ts
images: {
  domains: ['api.coinmarketcap.com'],
  formats: ['image/avif', 'image/webp']
}
```

### 2. Vercel Edge Functions

```bash
# API routes otomatik olarak Edge'de çalışır
# Dünya çapında düşük latency
```

### 3. Caching Strategy

```bash
# CoinMarketCap servisi 1 dakika cache kullanıyor
# Binance WebSocket real-time
```

---

## 🚨 Production Checklist

### Deploy Öncesi

- [x] ✅ TypeScript hataları düzeltildi
- [x] ✅ Production build başarılı
- [x] ✅ Environment variables hazır
- [x] ✅ API keys alındı
- [x] ✅ Git repository güncel

### Deploy Sonrası

- [ ] ✅ Production URL'i test et
- [ ] ✅ Tüm sayfalar yükleniyor
- [ ] ✅ WebSocket aktif
- [ ] ✅ API'ler çalışıyor
- [ ] ✅ Performance izleniyor
- [ ] ✅ Error logging aktif
- [ ] ✅ Analytics çalışıyor

---

## 🎯 Production URL Examples

```bash
# Default Vercel URL
https://lydian-trader.vercel.app

# Custom domain (opsiyonel)
https://tradingbot.com
https://www.tradingbot.com

# Preview deployments (PR başına)
https://lydian-trader-git-feature-branch.vercel.app
```

---

## 📞 Support & Resources

### Vercel Documentation

- https://vercel.com/docs
- https://nextjs.org/docs

### API Documentation

- CoinMarketCap: https://coinmarketcap.com/api/documentation/v1/
- Binance: https://binance-docs.github.io/apidocs/spot/en/

### Community

- Vercel Discord: https://vercel.com/discord
- Next.js GitHub: https://github.com/vercel/next.js

---

## 🎉 Success Metrics

Deploy başarılı olduğunda:

- ✅ **Build Time:** ~2-3 dakika
- ✅ **Deploy Time:** ~1 dakika
- ✅ **First Load:** <2 saniye
- ✅ **TTI (Time to Interactive):** <3 saniye
- ✅ **Lighthouse Score:** 90+ (Performance)
- ✅ **Core Web Vitals:** All Green

---

## 📝 Quick Deploy Commands

```bash
# Development
npm run dev

# Production build test
npm run build
npm start

# Type check
npm run type-check

# Deploy to Vercel
vercel --prod

# Check logs
vercel logs --follow

# List deployments
vercel list

# Rollback
vercel rollback [deployment-id]
```

---

**Hazırlayan:** LyDian AI Development Team
**Tarih:** 2025-09-30
**Version:** 1.0.0
**Status:** 🚀 PRODUCTION READY