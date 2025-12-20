# 🔄 VERCEL CACHE INVALIDATION GUIDE
## www.ailydian.com - Deployment Yansıma Sorunu

**Durum:** Yeni deployment yapıldı ama custom domain hala eski versiyonu gösteriyor
**Sebep:** Vercel CDN cache'i eski deployment'ı serve ediyor
**Çözüm:** Cache invalidation + Yeni deployment kontrolü

---

## 📊 MEVCUT DURUM

```bash
Domain: www.ailydian.com
Cache Status: HIT (eski cache'den serve ediliyor)
Vercel ID: fra1::frkzf-1761318341856-cfd63d5f7310
HTTP Status: 200 OK

✅ Site çalışıyor
⚠️ Eski deployment gösteriyor (cache)
```

---

## 🎯 ÇÖZÜM ADIMLARI (SIRA İLE)

### **ADIM 1: Vercel Dashboard - Deployment Durumu Kontrol** ⭐

**Link:**
```
https://vercel.com/emrahsardag-yandexcoms-projects/ailydian
```

**Kontrol Et:**

1. **"Deployments" sekmesine** git

2. **En üstteki (latest) deployment'a bak:**

   **✅ Başarılı ise görürsün:**
   ```
   Status: Ready ✅
   Commit: 9a920be - feat(production): Concurrent request...
   Branch: main
   Timestamp: Birkaç dakika/saat önce
   Domain: ✅ www.ailydian.com
   ```

   **⏳ Hala building ise:**
   ```
   Status: Building... ⏳
   ```
   ➡️ **Bekle:** 5-10 dakika daha

   **❌ Failed ise:**
   ```
   Status: Failed ❌
   ```
   ➡️ **Tıkla:** Build logs'u kontrol et, bana error'u söyle

---

### **ADIM 2: Cache Invalidation (Temizleme)** 🧹

**Deployment BAŞARILI ise (Ready ✅), cache'i temizle:**

#### **Yöntem A: Vercel Dashboard'dan (Önerilen)**

1. **Latest deployment'a tıkla** (Ready olan)

2. **Sağ üstte "..." (3 nokta) menü** ▸ Click

3. **"Redeploy"** ▸ Click

4. **ÖNEMLI:** Açılan popup'ta:
   - ☑️ "Use existing Build Cache" ▸ **İŞARETİ KALDIR** ❌
   - Bu cache'i temizler

5. **"Redeploy"** butonu ▸ Click

6. **Yeni deployment başlayacak (~2-5 dakika)**

---

#### **Yöntem B: URL'e ?nocache Parametresi (Hızlı Test)**

**Sadece test için, kalıcı çözüm değil:**

```
https://www.ailydian.com/?nocache=1
https://www.ailydian.com/medical-expert.html?v=2
```

Bu URL'leri aç, yeni versiyonu göreceksin. Ama cache temizlemez.

---

#### **Yöntem C: Browser Cache Temizle (Senin tarafında)**

**Sadece senin browser'ın için:**

1. **Hard Refresh:**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`

2. **DevTools Cache Temizle:**
   - `F12` ▸ DevTools aç
   - Network sekmesi
   - ☑️ "Disable cache" işaretle
   - Sayfayı yenile

3. **Browser Cache Sil:**
   - Chrome: Settings ▸ Privacy ▸ Clear browsing data
   - Timerange: Last hour
   - ☑️ Cached images and files
   - Clear data

---

### **ADIM 3: Vercel Cache Purge (Manual)** 🚀

**Eğer Yöntem A çalışmazsa:**

Vercel Dashboard'da:

1. **Project Settings** ▸ **General**

2. **Scroll down** ▸ **"Purge Cache"** bölümü

3. **"Purge Cache"** butonu ▸ Click

4. **Confirm** ▸ Yes

5. **Bekle:** ~1-2 dakika

6. **Test et:** www.ailydian.com

---

## 🔍 DEPLOYMENT DOĞRULAMA

### **Yeni deployment'ın aktif olduğunu doğrula:**

```bash
# 1. Medical Expert - Logo beyaz mı?
https://www.ailydian.com/medical-expert.html
# Sidebar'da "LyDian Medical AI" yazısı beyaz görünmeli

# 2. HTTP Header kontrol
curl -I https://www.ailydian.com/
# x-vercel-cache: MISS (ilk istek) veya HIT (cache yenilendi)
# x-vercel-id: yeni deployment ID

# 3. Concurrent Manager kontrol
https://www.ailydian.com/api/health
# "status": "OK" dönmeli
```

---

## ⏱️ CACHE PROPAGATION SÜRELERİ

### **Vercel CDN:**
- **Redeploy sonrası:** ~1-2 dakika
- **Manual Purge sonrası:** ~30 saniye - 2 dakika
- **Browser cache:** Anında (hard refresh ile)

### **DNS Propagation (farklı):**
- **A/CNAME değişiklikleri:** 1-48 saat
- **Bizim durumumuzda:** DNS değişmedi, sadece cache sorunu

---

## 🚨 SORUN GİDERME

### **Problem: "Redeploy" sonrası hala eski versiyon**

**Çözüm 1: Incognito/Private Mode**
```
Chrome: Ctrl + Shift + N
Safari: Cmd + Shift + N
```
Incognito'da aç: www.ailydian.com
Eğer yeni versiyon görünüyorsa ➡️ Browser cache sorunu

**Çözüm 2: Farklı cihaz/network**
```
Telefon data'sı ile aç (WiFi kapat)
```
Eğer yeni versiyon görünüyorsa ➡️ Local network cache sorunu

**Çözüm 3: Cloudflare/CDN temizle**
```
Eğer domain'in önünde Cloudflare varsa:
Cloudflare Dashboard → Caching → Purge Everything
```

---

### **Problem: "Build failed" görüyorum**

1. **Deployment'a tıkla** ▸ **Build logs**

2. **Error mesajını bul:**
   ```
   Common errors:
   - "Module not found" → package.json eksik
   - "Build timeout" → Timeout artır
   - "Memory exceeded" → Memory limit artır
   ```

3. **Bana error'u söyle:** Build logs'tan error'u kopyala, bana yapıştır

---

### **Problem: "Ready" ama hala eski versiyon**

1. **Deployment'ın domain'e atandığını kontrol et:**
   ```
   Deployment → Domains tab
   ✅ www.ailydian.com (Production)
   ✅ ailydian.com (Production)
   ```

2. **Vercel Analytics kontrol:**
   ```
   Vercel Dashboard → Analytics
   Son isteklere bak, hangi deployment ID'den gelmiş?
   ```

3. **Manual URL test:**
   ```
   https://ailydian-RANDOM.vercel.app
   (Deployment'ın kendi URL'i)
   ```
   Bu URL'de yeni versiyon varsa ➡️ Custom domain cache sorunu

---

## 📋 CHECKLIST - SIRA İLE YAP

- [ ] **1. Vercel Dashboard aç**
      https://vercel.com/emrahsardag-yandexcoms-projects/ailydian

- [ ] **2. Latest deployment durumu kontrol et**
      - Ready ✅ mi?
      - Commit: 9a920be mi?

- [ ] **3. Cache temizle (Redeploy)**
      - "..." menü → Redeploy
      - "Use existing Build Cache" ❌ işareti kaldır
      - Redeploy tıkla

- [ ] **4. Yeni deployment bekle**
      - ~2-5 dakika

- [ ] **5. Browser cache temizle**
      - Cmd+Shift+R (Mac)
      - Ctrl+Shift+R (Windows)

- [ ] **6. Test et**
      - www.ailydian.com
      - Medical Expert logo beyaz mı?

- [ ] **7. Bana bildir**
      - "Cache temizlendi, yeni versiyon görünüyor" ✅
      - Ya da "Hala eski versiyon" + screenshot

---

## 🎯 BEKLENTİLER

### **Başarılı olduğunda göreceksin:**

**Medical Expert (www.ailydian.com/medical-expert.html):**
```css
/* Sidebar'da beyaz logo */
.logo {
    color: #FFFFFF;
    text-shadow: 0 0 10px rgba(0,224,174,0.3);
}

/* Beyaz butonlar */
.new-consultation-btn {
    color: #FFFFFF;
}

/* Beyaz menü items */
.specialization-item:hover {
    color: #FFFFFF;
}
```

**API Health (www.ailydian.com/api/health):**
```json
{
  "status": "OK",
  "server": "LyDian",
  "version": "2.0.0",
  "models_count": 25
}
```

**Concurrent Manager:**
- Medical Expert'i kullanırken "Too many concurrent requests" hatası gelmeyecek

---

## 📞 BENİ BİLGİLENDİR

Her adımda bana haber ver:

✅ **Deployment Ready:** "Deployment ready görünüyor, commit 9a920be"
⏳ **Redeploy Başladı:** "Cache temizleme redeployment başlattım"
🔄 **Test Sonucu:** "Yeni versiyon görünüyor!" veya "Hala eski"
❌ **Error:** "Build failed, error: ..." (error mesajını yapıştır)

---

**Şimdi yapman gereken:**
1. Vercel Dashboard'ı aç
2. Latest deployment durumunu kontrol et
3. Bana durumu söyle (Ready mi, Building mi, Failed mi?)

Ben buradayım, takip ediyorum! 🚀
