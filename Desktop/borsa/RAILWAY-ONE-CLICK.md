# 🚂 RAILWAY ONE-CLICK DEPLOYMENT

## 🎯 3 Yöntem - Hepsi Otomatik!

---

## Yöntem 1: Railway Button (EN KOLAY!)

### Adım 1: Railway Template URL'ini Oluştur

Railway Dashboard'da:
```
https://railway.app/new/template
```

### Adım 2: GitHub Repository Bağla

Template sayfasında:
1. "From GitHub Repo" seç
2. Repository: `sardagsoftware/borsa`
3. Branch: `backup/lfs-preclean`
4. Root Path: `services/ai-worker`

### Adım 3: Environment Variables Ekle

Template'e değişkenleri ekle:

```
AI_API_KEY=da0489743984c4a5ed2d62d3a41e8b857c24cb67e84b7d34a9ef5f6f9f8c3a42
HMAC_SECRET=ec83f49c9a7f1f5241c5c98a5ad8f5c8f3e4bcd8e9e7f2d6a5c4b3e8f9d2c1a7
PORT=8080
NODE_ENV=production
```

### Adım 4: Deploy!

"Deploy" butonuna tıkla - Otomatik olacak! ✅

---

## Yöntem 2: Railway CLI (Terminal)

Terminal'de:

```bash
cd ~/Desktop/borsa/services/ai-worker

# Railway login
railway login

# Link to project
railway link 540c5e10-1424-4227-9cb6-c7214a2363a8

# Environment variables (tek komutla)
railway variables set \
  AI_API_KEY="da0489743984c4a5ed2d62d3a41e8b857c24cb67e84b7d34a9ef5f6f9f8c3a42" \
  HMAC_SECRET="ec83f49c9a7f1f5241c5c98a5ad8f5c8f3e4bcd8e9e7f2d6a5c4b3e8f9d2c1a7" \
  PORT="8080" \
  NODE_ENV="production"

# Deploy (railway.toml kullanır, otomatik Dockerfile)
railway up --detach

# Domain oluştur
railway domain

# Logs izle
railway logs
```

✅ railway.toml ve railway.json zaten hazır, otomatik Dockerfile seçecek!

---

## Yöntem 3: Direct Deploy URL

Bu URL'i tarayıcıda aç:

```
https://railway.app/new?template=https://github.com/sardagsoftware/borsa/tree/backup/lfs-preclean/services/ai-worker
```

Otomatik olarak:
- ✅ Repository clone edilir
- ✅ railway.toml okunur
- ✅ Dockerfile detected
- ✅ Service oluşturulur

Sadece:
1. Environment variables ekle (4 tane)
2. Deploy tıkla!

---

## 📋 Hazır Dosyalar

### Root Directory'de (Desktop/borsa/):
- ✅ `railway.json` - Root-level config
- ✅ `railway.toml` - Root-level config (TOML)

### AI Worker Directory'de (services/ai-worker/):
- ✅ `railway.json` - Service-specific config
- ✅ `railway.toml` - Service-specific config (TOML)
- ✅ `Dockerfile` - Multi-stage build
- ✅ `package.json` - Dependencies
- ✅ `src/server.js` - Main server

---

## 🎯 railway.toml Özellikleri

```toml
[build]
builder = "DOCKERFILE"  # ← Nixpacks yerine Dockerfile kullan
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node src/server.js"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
numReplicas = 1
```

Bu config ile Railway otomatik olarak:
- ✅ Dockerfile'ı algılar
- ✅ Nixpacks kullanmaz
- ✅ Health check yapar
- ✅ Restart policy uygular

---

## ✅ Test

Deploy sonrası:

```bash
# Railway URL'ini al
railway domain

# Test et
curl https://YOUR-RAILWAY-URL.up.railway.app/health

# Beklenen:
# {"status":"ok","service":"ailydian-ai-core","timestamp":...}
```

---

## 🔗 Vercel Integration

Railway URL'i aldıktan sonra:

```bash
cd ~/Desktop/borsa

vercel env add RAILWAY_AI_URL production
# Paste Railway URL

vercel --prod
```

---

## 🎉 Sonuç

3 yöntemden birini seç:

1. **Railway Button** - Template sayfasından (görsel)
2. **Railway CLI** - Terminal'den (otomatik)
3. **Direct URL** - Tek tıkla (en hızlı)

Hepsi aynı şeyi yapar:
- ✅ Dockerfile kullanır (Nixpacks DEĞİL!)
- ✅ Otomatik deploy
- ✅ Health check aktif
- ✅ Environment variables hazır

**railway.toml ve railway.json sayesinde her şey otomatik! 🚀**

---

## 📞 Sorun Yaşarsan

Railway logs:
```bash
railway logs
```

Service status:
```bash
railway status
```

Redeploy:
```bash
railway up --detach
```

---

**Config as Code = Zero Click Deployment! 🎯**
