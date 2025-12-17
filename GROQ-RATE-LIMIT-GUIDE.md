# 🛡️ GROQ API RATE LIMITING GUIDE

**Tarih:** 15 Aralık 2025
**Versiyon:** 1.0.0
**Durum:** ✅ PRODUCTION READY

---

## 📋 İÇİNDEKİLER

1. [Genel Bakış](#genel-bakış)
2. [Kurulum](#kurulum)
3. [Kullanım](#kullanım)
4. [Rate Limit Seviyeleri](#rate-limit-seviyeleri)
5. [Test Senaryoları](#test-senaryoları)
6. [Troubleshooting](#troubleshooting)
7. [Gelişmiş Yapılandırma](#gelişmiş-yapılandırma)

---

## 🎯 GENEL BAKIŞ

### Ne Yaptık?

Groq API'nin aşırı kullanımını önlemek için **ngrok tabanlı rate limiting** sistemi kurduk.

### Özellikler

- ✅ **Sliding Window Algorithm**: En doğru rate limiting
- ✅ **IP-based Tracking**: Her client için ayrı limit
- ✅ **3-Tier System**: Farklı endpoint'ler için farklı limitler
- ✅ **Custom 429 Responses**: Kullanıcı dostu hata mesajları
- ✅ **Security Headers**: XSS, Frame-Options, NoSniff
- ✅ **Automated Testing**: Bash script ile test

### Dosya Yapısı

```
ailydian-from-github/
├── rate-limit.yml                        # Ana yapılandırma dosyası
├── scripts/
│   ├── start-ngrok-with-ratelimit.sh   # Ngrok başlatma scripti
│   └── test-rate-limit.sh               # Test automation scripti
└── GROQ-RATE-LIMIT-GUIDE.md            # Bu dosya
```

---

## 🚀 KURULUM

### 1. Ngrok Kurulumu

```bash
# macOS
brew install ngrok

# ngrok versiyonunu kontrol et
ngrok version
# ngrok version 3.31.0 veya üstü olmalı
```

### 2. Ngrok Hesabı ve Domain

1. [ngrok.com](https://ngrok.com) adresinden ücretsiz hesap oluştur
2. Dashboard'dan authtoken al:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN
   ```
3. Custom domain ayarla (opsiyonel ama önerilen):
   - Dashboard > Domains > "+ Create Domain"
   - Örnek: `ailydian-api.ngrok.app`

### 3. Dosyaları Kontrol Et

```bash
cd ~/Desktop/ailydian-ultra-pro/ailydian-from-github

# Dosyaların varlığını kontrol et
ls -lh rate-limit.yml
ls -lh scripts/start-ngrok-with-ratelimit.sh
ls -lh scripts/test-rate-limit.sh

# Script'lerin executable olduğunu kontrol et
chmod +x scripts/*.sh
```

---

## 💻 KULLANIM

### Adım 1: Server'ı Başlat

```bash
# Terminal 1
cd ~/Desktop/ailydian-ultra-pro/ailydian-from-github
PORT=3000 npm start
```

### Adım 2: Ngrok'u Rate Limiting ile Başlat

```bash
# Terminal 2
cd ~/Desktop/ailydian-ultra-pro/ailydian-from-github

# Otomatik script ile (önerilen)
./scripts/start-ngrok-with-ratelimit.sh ailydian-api.ngrok.app 3000

# Veya manuel komut
ngrok http 3000 \
  --domain ailydian-api.ngrok.app \
  --traffic-policy-file rate-limit.yml
```

### Adım 3: Test Et

```bash
# Terminal 3
cd ~/Desktop/ailydian-ultra-pro/ailydian-from-github

# Otomatik test suite
./scripts/test-rate-limit.sh https://ailydian-api.ngrok.app

# Veya manuel test
curl https://ailydian-api.ngrok.app/api/health
```

---

## 📊 RATE LIMIT SEVİYELERİ

### Tier 1: Genel API Endpoint'leri

**Limitler:**
- **Capacity:** 100 requests
- **Window:** 60 saniye (1 dakika)
- **Tracking:** IP-based

**Kapsam:**
- `/api/health`
- `/api/feature-flags`
- `/api/telemetry/*`
- Diğer tüm `/api/*` endpoint'leri

**Örnek Kullanım:**
```bash
# İlk 100 request başarılı
for i in {1..100}; do
  curl https://ailydian-api.ngrok.app/api/health
done

# 101. request 429 döner
curl https://ailydian-api.ngrok.app/api/health
# Response: {"error": "Rate limit exceeded", "retry_after": 60}
```

---

### Tier 2: Groq AI Endpoint'leri (Daha Sıkı)

**Limitler:**
- **Capacity:** 50 requests
- **Window:** 60 saniye
- **Tracking:** IP-based

**Kapsam:**
- `/api/lydian-iq/test-groq`
- `/api/lydian-iq/solve`
- `/api/chat-groq`
- Groq API kullanan tüm endpoint'ler

**Neden Daha Sıkı?**
- Groq API pahalı (token başı ücret)
- Model inference CPU/GPU yoğun
- Abuse riski yüksek

**Örnek Response (Rate Limited):**
```json
{
  "error": "Groq API rate limit exceeded",
  "message": "High-demand endpoint. Please reduce request frequency.",
  "limit": 50,
  "window": "60 seconds",
  "retry_after": 60
}
```

---

### Tier 3: Heavy Operations (En Sıkı)

**Limitler:**
- **Capacity:** 30 requests
- **Window:** 60 saniye
- **Tracking:** IP-based

**Kapsam:**
- `/api/medical/*`
- `/api/legal/*`
- Complex AI reasoning endpoint'leri

**Neden En Sıkı?**
- Large context windows (16K+ tokens)
- Multi-provider orchestration
- Database queries + AI inference
- Yavaş response times (3-10 saniye)

---

## 🧪 TEST SENARYOLARI

### Test 1: Genel API Limit Testi

```bash
# 105 request gönder, 100'den sonra rate limit olmalı
./scripts/test-rate-limit.sh https://ailydian-api.ngrok.app

# Beklenen sonuç:
# ✅ İlk 100 request: HTTP 200
# ❌ 101-105 arası: HTTP 429
```

### Test 2: Groq API Limit Testi

```bash
# Script otomatik test eder
./scripts/test-rate-limit.sh https://ailydian-api.ngrok.app

# Manuel test
for i in {1..55}; do
  curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"test": true}' \
    https://ailydian-api.ngrok.app/api/lydian-iq/test-groq
done
```

### Test 3: Rate Limit Headers Kontrolü

```bash
# Headers'ı incele
curl -I https://ailydian-api.ngrok.app/api/health

# Beklenen headers:
# x-ratelimit-limit: 100
# x-ratelimit-remaining: 99
# x-ratelimit-reset: 1734278400
# retry-after: 60 (sadece 429'da)
```

### Test 4: Burst Attack Simülasyonu

```bash
# 20 rapid request (delay yok)
time for i in {1..20}; do
  curl -s https://ailydian-api.ngrok.app/api/health &
done
wait

# Sliding window algorithm hepsini sayar
# Fixed window bypass edemezsiniz!
```

---

## 🔧 TROUBLESHOOTING

### Problem 1: "ngrok: command not found"

**Çözüm:**
```bash
brew install ngrok
# veya
brew upgrade ngrok
```

### Problem 2: "rate-limit.yml not found"

**Çözüm:**
```bash
# Doğru dizinde olduğunuzu kontrol edin
pwd
# Output: /Users/sardag/Desktop/ailydian-ultra-pro/ailydian-from-github

# Dosya varsa
ls -lh rate-limit.yml

# Yoksa yeniden oluşturun (bu guide'ın başındaki YAML'i kullanın)
```

### Problem 3: Rate limiting çalışmıyor

**Sebep:** Localhost'a direk bağlanıyorsunuz, ngrok kullanmıyorsunuz

**Çözüm:**
```bash
# ❌ Yanlış (rate limiting yok)
curl http://localhost:3000/api/health

# ✅ Doğru (rate limiting var)
curl https://ailydian-api.ngrok.app/api/health
```

### Problem 4: "Port 3000 is not available"

**Sebep:** Server çalışmıyor veya farklı port'ta

**Çözüm:**
```bash
# Server'ı kontrol et
lsof -i :3000

# Server başlat
PORT=3000 npm start

# Farklı port kullan
./scripts/start-ngrok-with-ratelimit.sh ailydian-api.ngrok.app 3500
```

### Problem 5: Test script hata veriyor

**Sebep:** `jq` veya `nc` kurulu değil

**Çözüm:**
```bash
# jq kur (JSON parser)
brew install jq

# netcat kontrol et (genelde macOS'de yüklü)
which nc
```

---

## ⚙️ GELİŞMİŞ YAPILANDIRMA

### Limit Değerlerini Değiştirme

`rate-limit.yml` dosyasını düzenleyin:

```yaml
# Genel API limitini 200'e çıkar
on_http_request:
  - expressions:
      - req.url.contains('/api')
    actions:
      - type: rate_limit
        config:
          capacity: 200        # 100 → 200
          rate: 60s
```

### Whitelist IP Adresleri

```yaml
on_http_request:
  # Whitelist için exception
  - expressions:
      - conn.client_ip == '203.0.113.42'  # Güvenilir IP
    actions:
      - type: deny                          # Rate limit atla
        config:
          status_code: 200

  # Normal rate limiting devam eder
  - expressions:
      - req.url.contains('/api')
    actions:
      - type: rate_limit
        # ... normal config
```

### Custom Domain Ekle

```yaml
# rate-limit.yml'e domain kontrolü ekle
on_http_request:
  - expressions:
      - req.host == 'ailydian-api.ngrok.app'
    actions:
      - type: rate_limit
        # ... config
```

### Response Mesajlarını Özelleştir

```yaml
- type: custom-response
  config:
    status_code: 429
    content: |
      {
        "error": "Çok fazla istek",
        "mesaj": "Lütfen 1 dakika bekleyin ve tekrar deneyin.",
        "limit": 100,
        "pencere": "60 saniye"
      }
    headers:
      content-type:
        - application/json; charset=utf-8
      content-language:
        - tr-TR
```

---

## 📈 MONİTORING

### Ngrok Dashboard

1. [dashboard.ngrok.com](https://dashboard.ngrok.com) adresine git
2. "Traffic Inspection" sekmesine tıkla
3. Rate limited request'leri filtrele:
   - Status Code = 429
   - Header `x-ratelimit-remaining` = 0

### Logs

```bash
# Ngrok log dosyası
tail -f ~/.ngrok2/ngrok.log

# Server logs (rate limit info)
# Terminal 1'de (npm start)
# [RATE-LIMIT] Client 203.0.113.42 hit limit: /api/health
```

### Metrics

```bash
# Script ile istatistik topla
./scripts/test-rate-limit.sh https://ailydian-api.ngrok.app | \
  grep "Results:" -A 3
```

---

## 🔒 GÜVENLİK ÖNERİLERİ

### 1. HTTPS Kullan

```bash
# ❌ Asla HTTP kullanmayın (production'da)
ngrok http 3000

# ✅ Her zaman HTTPS domain kullanın
ngrok http 3000 --domain ailydian-api.ngrok.app
```

### 2. Authtoken'ı Gizli Tutun

```bash
# ✅ Environment variable kullan
export NGROK_AUTHTOKEN="your_token_here"
ngrok config add-authtoken $NGROK_AUTHTOKEN

# ❌ Asla code'a yazmayın
# const token = "2mG..."  // YANLIŞ!
```

### 3. Rate Limit Değerlerini Dikkatli Ayarlayın

- **Çok yüksek:** Abuse riski, yüksek maliyet
- **Çok düşük:** Legitimate kullanıcılar etkilenir

**Önerilen Başlangıç Değerleri:**
- Genel API: 100 req/min
- Groq API: 50 req/min
- Heavy Ops: 30 req/min

### 4. Monitoring Yapın

```bash
# Günlük rate limit istatistikleri
crontab -e
# Her gün saat 23:00'da rapor
0 23 * * * cd ~/ailydian && ./scripts/test-rate-limit.sh >> logs/rate-limit-daily.log
```

---

## 📚 EK KAYNAKLAR

### Ngrok Dökümantasyon
- [Traffic Policy Syntax](https://ngrok.com/docs/http/traffic-policy/)
- [Rate Limiting](https://ngrok.com/docs/http/traffic-policy/actions/rate-limit/)
- [Custom Responses](https://ngrok.com/docs/http/traffic-policy/actions/custom-response/)

### Groq API
- [Official Docs](https://console.groq.com/docs)
- [Rate Limits](https://console.groq.com/docs/rate-limits)
- [Pricing](https://console.groq.com/pricing)

### Ailydian Docs
- [API Reference](/docs/api-reference.md)
- [Deployment Guide](/DEPLOYMENT-GUIDE.md)
- [Security Guide](/SECURITY-GUIDE.md)

---

## ✅ CHECKLIST

Aşağıdaki adımları tamamladığınızdan emin olun:

- [ ] Ngrok kurulu ve authtoken ayarlandı
- [ ] Custom domain oluşturuldu (opsiyonel)
- [ ] `rate-limit.yml` dosyası oluşturuldu
- [ ] Script'ler executable yapıldı (`chmod +x`)
- [ ] Server PORT 3000'de çalışıyor
- [ ] Ngrok rate limiting ile başlatıldı
- [ ] Test script'i çalıştırıldı ve geçti
- [ ] Production domain ayarlandı
- [ ] Monitoring kuruldu

---

## 🎯 SONUÇ

✅ **Rate limiting sistemi başarıyla kuruldu!**

**Şimdi yapabilecekleriniz:**
1. Production'da Groq API'yi güvenle kullan
2. Abuse ve spam'den korunun
3. Maliyet kontrolü sağlayın
4. API performansını optimize edin

**Destek için:**
- GitHub Issues: [github.com/ailydian/ultra-pro/issues](https://github.com/ailydian)
- Email: support@ailydian.com

---

**Hazırlayan:** Claude Code (Anthropic AI)
**Tarih:** 15 Aralık 2025
**Versiyon:** 1.0.0
**Durum:** ✅ PRODUCTION READY
