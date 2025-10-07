# ⚡ REDIS CACHE - SETUP GUIDE

**LyDian IQ - Upstash Redis Integration**
**Versiyon:** 1.0.0
**Tarih:** 2025-10-07

---

## 🎯 OVERVIEW

Redis cache sistemi, aynı soruların tekrar tekrar AI provider'lara gönderilmesini önleyerek:
- **Performance:** 10-100x daha hızlı yanıt
- **Cost:** AI API maliyetlerinde %60-80 azalma
- **Reliability:** AI provider'lar down olsa bile cached yanıtlar çalışır

---

## 📦 KURULUM ADIMlARI

### 1. Upstash Redis Hesabı Oluşturma

1. **https://upstash.com** adresine git
2. GitHub ile sign in yap
3. "Create Database" butonuna tıkla
4. **Database Name:** lydian-iq-cache
5. **Region:** EU-Central (Frankfurt) veya en yakın region
6. **TLS:** Enabled (default)
7. **Eviction:** LRU (Least Recently Used)
8. "Create" butonuna tıkla

### 2. Credentials Alma

Database oluştuktan sonra:

1. **REST API** sekmesine git
2. **UPSTASH_REDIS_REST_URL** kopyala
   - Örnek: `https://eu2-lydian-iq-cache-xxxxx.upstash.io`

3. **UPSTASH_REDIS_REST_TOKEN** kopyala
   - Örnek: `AXdxAAIjcDExxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Environment Variables Ekleme

#### Vercel (Production):

```bash
# Vercel Dashboard'a git
# Project Settings → Environment Variables

# Şu 2 değişkeni ekle:
UPSTASH_REDIS_REST_URL=https://eu2-lydian-iq-cache-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXdxAAIjcDExxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Local Development:

```bash
# .env dosyasına ekle
UPSTASH_REDIS_REST_URL=https://eu2-lydian-iq-cache-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXdxAAIjcDExxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Deployment

```bash
# Vercel'e deploy et
vercel --prod

# Veya otomatik deploy için git push
git add .
git commit -m "feat: Add Redis cache integration"
git push
```

---

## 🔧 NASIL ÇALIŞIR?

### Cache Flow:

```
┌─────────────────────────────────────────────┐
│  1. User sends question to /api/lydian-iq  │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  2. Generate cache key (MD5 hash)          │
│     Key: lydian-iq:abc123:mathematics:tr   │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  3. Check Redis cache                       │
└─────────────┬───────────────────────────────┘
              │
       ┌──────┴──────┐
       │             │
     FOUND        NOT FOUND
       │             │
       ▼             ▼
┌─────────────┐ ┌─────────────────────┐
│ Return      │ │ Call AI Provider    │
│ cached      │ │ (Groq/OpenAI/Claude)│
│ response    │ └──────────┬──────────┘
│ (~10ms)     │            │
└─────────────┘            ▼
                 ┌──────────────────────┐
                 │ Cache result (1h TTL)│
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Return fresh response│
                 └──────────────────────┘
```

### Cache Key Format:

```
lydian-iq:{hash}:{domain}:{language}

Örnekler:
- lydian-iq:a3f5b2c:mathematics:tr-TR
- lydian-iq:7d9e4f1:coding:en-US
- lydian-iq:c2b8a6d:science:de-DE
```

### Cache TTL:

- **Default:** 1 saat (3600 saniye)
- **Ayarlanabilir:** `redis-cache.js` içinde `defaultTTL` değiştir

---

## 📊 MONİTORING

### Cache Statistics Endpoint:

```bash
GET /api/cache-stats

# Response:
{
  "success": true,
  "enabled": true,
  "totalKeys": 247,
  "keyPrefix": "lydian-iq:",
  "defaultTTL": 3600,
  "provider": "Upstash Redis"
}
```

### Upstash Dashboard:

1. **https://console.upstash.com** → Databases
2. **lydian-iq-cache** veritabanını seç
3. **Metrics** sekmesine git

**Görebileceğin metrikler:**
- Total commands/second
- Hit rate (%)
- Memory usage
- Key count
- Network I/O

### Log Monitoring:

```bash
# Vercel logs'u kontrol et
vercel logs --prod

# Cache logs:
[Redis Cache] ✅ HIT - lydian-iq:abc123... (15ms)
[Redis Cache] ❌ MISS - lydian-iq:xyz789...
[Redis Cache] ✅ SET - lydian-iq:xyz789... (TTL: 3600s)
```

---

## 🧪 TESTING

### 1. Test Cache Hit:

```bash
# İlk istek (MISS - yavaş)
time curl -X POST https://www.ailydian.com/api/lydian-iq/solve \
  -H "Content-Type: application/json" \
  -d '{"problem":"2+2 kaç eder?","domain":"mathematics"}'

# İkinci istek (HIT - hızlı)
time curl -X POST https://www.ailydian.com/api/lydian-iq/solve \
  -H "Content-Type: application/json" \
  -d '{"problem":"2+2 kaç eder?","domain":"mathematics"}'

# İkinci istek ~10-50ms, ilki ~2000-5000ms olmalı
```

### 2. Test Cache Stats:

```bash
curl https://www.ailydian.com/api/cache-stats
```

### 3. Upstash CLI:

```bash
# Upstash CLI yükle
npm install -g @upstash/cli

# Login
upstash auth login

# Keys listele
upstash redis cli
> KEYS lydian-iq:*

# Specific key kontrol et
> GET lydian-iq:abc123:mathematics:tr-TR

# TTL kontrol et
> TTL lydian-iq:abc123:mathematics:tr-TR
```

---

## 🔒 SECURITY

### Best Practices:

1. **Never commit credentials:**
   - ✅ `.env` gitignore'da
   - ✅ Vercel environment variables kullan
   - ❌ Hardcode API keys

2. **TLS enabled:**
   - Upstash default TLS kullanır
   - REST API HTTPS üzerinden

3. **Access control:**
   - Upstash credentials'ları sadece backend'de kullan
   - Frontend'e expose etme

4. **Rate limiting:**
   - Zaten mevcut (10 req/min)
   - Cache bypass girişimlerini engeller

---

## 📈 PERFORMANCE METRICS

### Expected Improvements:

| Metric | Without Cache | With Cache | Improvement |
|--------|--------------|------------|-------------|
| **Response Time** | 2000-5000ms | 10-50ms | **40-500x faster** |
| **AI API Calls** | 100% | 20-40% | **60-80% reduction** |
| **Cost** | $X | $0.2X-$0.4X | **60-80% savings** |
| **Availability** | 99.5% | 99.9% | **+0.4% uptime** |

### Cache Hit Rate Expectations:

- **Week 1:** 20-30% (cache building)
- **Week 2:** 40-60% (common questions cached)
- **Week 3+:** 60-80% (stable cache)

---

## 🛠️ TROUBLESHOOTING

### Issue 1: "Redis Cache: Disabled"

**Sebep:** Environment variables eksik

**Çözüm:**
```bash
# Vercel'de environment variables kontrol et
vercel env ls

# Yoksa ekle:
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN

# Redeploy
vercel --prod
```

### Issue 2: High Memory Usage

**Sebep:** Çok fazla key cached

**Çözüm:**
```bash
# TTL azalt (redis-cache.js)
this.defaultTTL = 1800; // 30 dakika

# Veya eviction policy kontrol et (Upstash Dashboard)
# LRU enabled olmalı
```

### Issue 3: Cache Stale Data

**Sebep:** TTL çok uzun

**Çözüm:**
```bash
# Manuel clear
curl https://www.ailydian.com/api/cache-clear

# Veya Upstash dashboard'dan FLUSHDB
```

---

## 🚀 NEXT STEPS (Phase 2 Improvements)

1. **Advanced TTL Strategy:**
   - Popular questions: 24 hours
   - Rare questions: 1 hour
   - Error responses: 5 minutes

2. **Cache Warming:**
   - Pre-cache popular questions at deploy time
   - Background job to refresh before expiry

3. **Analytics:**
   - Track cache hit rate per domain
   - Cost savings calculator
   - Performance dashboard

4. **Smart Invalidation:**
   - Clear cache when AI model updated
   - Version-based cache keys

---

## 📚 RESOURCES

- **Upstash Docs:** https://docs.upstash.com/redis
- **@upstash/redis NPM:** https://www.npmjs.com/package/@upstash/redis
- **Redis Best Practices:** https://redis.io/docs/manual/patterns/

---

## ✅ CHECKLIST

- [ ] Upstash Redis database oluşturuldu
- [ ] Credentials alındı (URL + Token)
- [ ] Vercel environment variables eklendi
- [ ] Local .env dosyası güncellendi
- [ ] Production'a deploy edildi
- [ ] Cache stats endpoint test edildi
- [ ] Cache hit/miss logs kontrol edildi
- [ ] Performance improvement doğrulandı

---

**Generated:** 2025-10-07
**Status:** 🚀 Ready for Production
**Next Review:** 2025-10-14 (1 week performance analysis)
