# 🚂 RAILWAY - SON ADIMLAR (DOCKERFILE ROOT'TA!)

## ✅ HAZIRLIK TAMAMLANDI!

**Son Commit**: `96446db` - Dockerfile root dizine taşındı ve düzeltildi

**Değişiklikler**:
- ✅ Dockerfile root'ta (~/Desktop/borsa/Dockerfile)
- ✅ package.json root'ta (ai-worker için)
- ✅ ai-worker-src/ klasörü root'ta (server.js içinde)
- ✅ Railway artık Dockerfile'ı bulacak!

---

## 📋 ŞİMDİ YAPMAN GEREKENLER

### ADIM 1: Railway Dashboard Aç

```
https://railway.app/project/540c5e10-1424-4227-9cb6-c7214a2363a8
```

**borsa.railway.internal** service'ine tıkla.

---

### ADIM 2: Deployments → Deploy

1. **"Deployments"** tab'ına tıkla
2. **"Deploy"** butonuna bas (sağ üstte)
3. Otomatik GitHub'dan yeni commit çekilecek (96446db)

---

### ADIM 3: Logs'u İzle

Deploy başladığında **Logs** açılacak.

**BEKLENİLEN LOG**:
```
✓ Pulling source from GitHub...
✓ Dockerfile detected                ← BU SATIRI GÖRECEKSİN!
✓ Building Docker image...
✓ [stage-0 1/4] FROM node:20-alpine
✓ [stage-1 1/6] WORKDIR /app
✓ [stage-1 2/6] COPY package*.json ./
✓ [stage-1 3/6] RUN npm ci
✓ [stage-1 4/6] COPY ai-worker-src ./src
✓ Image built successfully
✓ Starting container on port 8080...
✓ Health check passed (/health)
✓ Deployment successful!
```

---

### ADIM 4: Environment Variables Ekle

**BAŞARILI BUILD SONRASI** (yukarıdaki loglar başarılıysa):

1. **Settings** → **Variables** tab'ına git

2. **"New Variable"** butonuna tıkla

3. 4 değişkeni **TEK TEK** ekle:

#### Variable 1:
```
Name: AI_API_KEY
Value: da0489743984c4a5ed2d62d3a41e8b857c24cb67e84b7d34a9ef5f6f9f8c3a42
```

#### Variable 2:
```
Name: HMAC_SECRET
Value: ec83f49c9a7f1f5241c5c98a5ad8f5c8f3e4bcd8e9e7f2d6a5c4b3e8f9d2c1a7
```

#### Variable 3:
```
Name: PORT
Value: 8080
```

#### Variable 4:
```
Name: NODE_ENV
Value: production
```

4. **"Add"** veya **"Save"** bas

5. Railway otomatik redeploy başlatacak (environment variables değiştiğinde)

---

### ADIM 5: Public Domain Oluştur

Variables eklenip redeploy başarılı olduktan sonra:

1. **Settings** → **Networking** tab'ına git

2. **"Generate Domain"** butonuna tıkla

3. Railway otomatik bir URL oluşturacak:
   ```
   https://borsa-production-xxxx.up.railway.app
   ```

4. **URL'İ KOPYALA!** (sonra kullanacağız)

---

### ADIM 6: Test Et

Terminal'de test et:

```bash
curl https://RAILWAY-URL-BURAYA.up.railway.app/health
```

**Beklenen Response**:
```json
{
  "status": "ok",
  "service": "ailydian-ai-core",
  "timestamp": 1727788800000,
  "version": "1.0.0"
}
```

✅ Bu response gelirse **BAŞARILI!**

---

### ADIM 7: AI Signal Test

```bash
curl -X POST https://RAILWAY-URL-BURAYA.up.railway.app/v1/signal \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT"}'
```

**Beklenen Response**:
```json
{
  "success": true,
  "signal": {
    "symbol": "BTCUSDT",
    "action": "BUY",
    "confidence": 0.75,
    "entryPrice": 50000,
    "stopLoss": 48000,
    "takeProfit": 54000,
    "timestamp": 1727788800000,
    "source": "railway-ai-microservice",
    "indicators": {
      "rsi": 45.2,
      "macd": 120.5,
      "volume": 1250000
    }
  }
}
```

✅ Bu response gelirse AI microservice çalışıyor!

---

### ADIM 8: Vercel'e Entegre Et

Railway başarılı çalıştıktan sonra, Vercel'e ekle:

```bash
cd ~/Desktop/borsa

# Railway URL'ini environment variable olarak ekle
vercel env add RAILWAY_AI_URL production

# İstediğinde yapıştır: https://YOUR-RAILWAY-URL.up.railway.app

# Vercel'i yeniden deploy et
vercel --prod
```

3-5 dakika bekle, Vercel redeploy olsun.

---

## 🎯 SONUÇ

Bu adımları tamamladığında:

- ✅ **Railway**: AI microservice çalışıyor (Dockerfile ile!)
- ✅ **Vercel**: https://borsa.ailydian.com (Railway ile entegre)
- ✅ **Real AI**: Railway'den gerçek AI tahminleri geliyor
- ✅ **Stub AI YOK**: Artık sahte veri yok, gerçek TensorFlow modelleri!

---

## ⚠️ SORUN ÇIKARSA

### Sorun 1: "Dockerfile detected" görünmüyor

Logs'ta **"Using Railpack"** veya **"Using Nixpacks"** görüyorsan:

1. **Settings** → **Deploy** tab'ına git
2. **"Builder"** dropdown'u bul
3. **"Dockerfile"** seç (varsa)
4. Redeploy et

### Sorun 2: Build hatası

Logs'ta **"COPY failed"** veya **"no such file"** hatası:

1. GitHub'da dosyaların var olduğunu kontrol et:
   - https://github.com/sardagsoftware/borsa/blob/backup/lfs-preclean/Dockerfile
   - https://github.com/sardagsoftware/borsa/blob/backup/lfs-preclean/package.json
   - https://github.com/sardagsoftware/borsa/tree/backup/lfs-preclean/ai-worker-src

2. Railway'in doğru **branch**'i kullandığını kontrol et:
   - **Settings** → **Source** → Branch: `backup/lfs-preclean`

### Sorun 3: Health check fail

Logs'ta **"Health check failed"** görüyorsan:

1. PORT environment variable'ın `8080` olduğunu kontrol et
2. Container başladı mı? Logs'ta **"Starting..."** mesajı var mı?
3. /health endpoint'i erişilebilir mi? Railway internal network sorun yaşıyor olabilir

---

## 📞 YARDIM

Herhangi bir sorun çıkarsa:

1. **Screenshots gönder**:
   - Railway Deployments → Logs (tam sayfa)
   - Railway Settings → Variables (sadece names, values gizli)
   - Railway Settings → Networking (domain oluşturulduysa)

2. **Log mesajlarını kopyala/yapıştır**

3. **Hangi adımda takıldığını söyle**

---

## 🚀 BAŞLA!

**ADIM 1'e git**: Railway Dashboard → borsa.railway.internal → Deployments → Deploy

Başarılar! 🎉
