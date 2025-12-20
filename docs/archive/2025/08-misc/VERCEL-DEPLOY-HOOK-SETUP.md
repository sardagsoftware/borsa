# 🎯 VERCEL DEPLOY HOOK - OTOMATİK DEPLOYMENT

## Sorun: GitHub push Vercel'i tetiklemiyor

**Çözüm: Deploy Hook kullan - Tek komutla deployment**

---

## 📋 DEPLOY HOOK OLUŞTURMA (1 Dakika)

### **Vercel Dashboard'da:**

1. **Project Settings'e git:**
   ```
   https://vercel.com/emrahsardag-yandexcoms-projects/ailydian/settings
   ```

2. **"Git"** sekmesi → Scroll down

3. **"Deploy Hooks"** bölümü → **"Create Hook"**

4. **Hook Name:** `main-production`

5. **Git Branch:** `main`

6. **Create Hook** → Click

7. **Hook URL kopyala:**
   ```
   https://api.vercel.com/v1/integrations/deploy/[PROJECT_ID]/[HOOK_ID]
   ```

---

## 🚀 HOOK'U KULLANMA (Tek Komut)

### **Terminal'den deployment tetikle:**

```bash
# Hook URL'i değişkenle tanımla
DEPLOY_HOOK="https://api.vercel.com/v1/integrations/deploy/[PROJECT_ID]/[HOOK_ID]"

# Deployment tetikle
curl -X POST "$DEPLOY_HOOK"
```

**Sonuç:**
```json
{
  "job": {
    "id": "...",
    "state": "PENDING",
    "createdAt": 1234567890
  }
}
```

---

## 💾 HOOK'U KAYDET (.env)

### **.env dosyasına ekle:**

```bash
# Vercel Deploy Hook
VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/[PROJECT_ID]/[HOOK_ID]
```

### **Kullanımı:**

```bash
# .env'den yükle
source .env

# Deploy tetikle
curl -X POST "$VERCEL_DEPLOY_HOOK"
```

---

## 🔧 SCRIPT OLUŞTUR (Otomatik)

### **deploy.sh:**

```bash
#!/bin/bash

echo "🚀 Triggering Vercel Production Deployment..."
echo ""

# .env'den hook URL'i yükle
source .env

if [ -z "$VERCEL_DEPLOY_HOOK" ]; then
    echo "❌ VERCEL_DEPLOY_HOOK not found in .env"
    exit 1
fi

# Deployment tetikle
RESPONSE=$(curl -s -X POST "$VERCEL_DEPLOY_HOOK")

echo "✅ Deployment triggered!"
echo ""
echo "Response:"
echo "$RESPONSE" | jq .

echo ""
echo "🌐 Check status:"
echo "https://vercel.com/emrahsardag-yandexcoms-projects/ailydian"
```

### **Kullan:**

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🎯 NEDEN DEPLOY HOOK?

### **Avantajlar:**

1. **Tek komut:** `curl -X POST $HOOK_URL`
2. **Token gerektirmez:** Public webhook
3. **Hızlı:** Anında deployment başlatır
4. **Güvenilir:** Vercel resmi yöntemi
5. **CI/CD:** GitHub Actions'dan çağırılabilir

### **GitHub Actions ile:**

```yaml
- name: Trigger Vercel Deployment
  run: |
    curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}
```

---

## 📊 DEPLOYMENT TAKIP

### **Hook tetikledikten sonra:**

1. **Vercel Dashboard:**
   ```
   https://vercel.com/emrahsardag-yandexcoms-projects/ailydian
   ```

2. **Deployments sekmesi** → En yeni deployment görünür

3. **Status kontrol:**
   - ⏳ Queued → Building
   - 🔨 Building → ~5-10 dakika
   - ✅ Ready → Deployment başarılı

4. **Production URL test et:**
   ```
   https://www.ailydian.com
   ```

---

## 🚨 SORUN GİDERME

### **Hook çalışmıyor:**

1. **URL doğru mu kontrol et:**
   ```bash
   echo $VERCEL_DEPLOY_HOOK
   ```

2. **Curl ile test et:**
   ```bash
   curl -v -X POST "$VERCEL_DEPLOY_HOOK"
   ```

3. **Vercel Dashboard'da kontrol et:**
   - Settings → Git → Deploy Hooks
   - Hook aktif mi?

---

## 📝 CHECKLIST

- [ ] Vercel Dashboard → Settings → Git
- [ ] Deploy Hooks → Create Hook
- [ ] Hook Name: `main-production`
- [ ] Branch: `main`
- [ ] Hook URL'i kopyala
- [ ] .env'e ekle: `VERCEL_DEPLOY_HOOK=...`
- [ ] Test et: `curl -X POST $VERCEL_DEPLOY_HOOK`
- [ ] Vercel Dashboard → Deployments → Yeni deployment var mı?
- [ ] 5-10 dakika bekle
- [ ] www.ailydian.com test et

---

**Bu yöntemi kullanarak Vercel CLI veya authentication olmadan direkt deployment tetikleyebiliriz!** 🚀
