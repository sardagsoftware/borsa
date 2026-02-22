# 🌐 Custom Domain Setup - www.ailydian.com/lydian-legal-search.html

## 📋 Mevcut Durum

**Vercel Production URL:**
https://ailydian-pp0fw7v58-lydian-projects.vercel.app

**Hedef URL:**
https://www.ailydian.com/lydian-legal-search.html

---

## 🔧 Adım Adım Kurulum

### 1. Vercel Dashboard'a Giriş

1. Tarayıcınızda açın: https://vercel.com/login
2. GitHub hesabınızla giriş yapın
3. **ailydian** projesini seçin

---

### 2. Domain Ekleme

1. **Settings** sekmesine tıklayın
2. Sol menüden **Domains** seçin
3. **Add Domain** butonuna tıklayın
4. `www.ailydian.com` yazın
5. **Add** butonuna tıklayın

---

### 3. DNS Ayarları

Vercel size aşağıdaki DNS kayıtlarını gösterecek:

#### Seçenek 1: CNAME (Önerilen)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### Seçenek 2: A Record
```
Type: A
Name: www
Value: 76.76.21.21
TTL: 3600
```

---

### 4. DNS Sağlayıcınızda Ayarlama

**GoDaddy, Cloudflare, Namecheap vb. için:**

1. DNS sağlayıcınızın kontrol paneline girin
2. `ailydian.com` domaini için DNS yönetimini açın
3. Yeni CNAME kaydı ekleyin:
   - **Host/Name:** `www`
   - **Points to/Value:** `cname.vercel-dns.com`
   - **TTL:** `3600` (veya Auto)
4. Kaydedin

---

### 5. SSL Sertifikası (Otomatik)

Vercel otomatik olarak:
- ✅ Let's Encrypt SSL sertifikası oluşturacak
- ✅ HTTPS'i zorunlu kılacak
- ✅ HTTP'yi HTTPS'e yönlendirecek

**Süre:** 5-10 dakika

---

### 6. Doğrulama

DNS değişikliklerinin yayılması **10-60 dakika** sürebilir.

**Kontrol:**
```bash
# DNS doğrulama
nslookup www.ailydian.com

# HTTPS testi
curl -I https://www.ailydian.com/lydian-legal-search.html
```

---

## 🎯 Sonuç

### Domain bağlandıktan sonra:

**Ana Sayfa:**
https://www.ailydian.com

**Legal AI Sayfası:**
https://www.ailydian.com/lydian-legal-search.html

**API Endpoints:**
- https://www.ailydian.com/api/legal-ai
- https://www.ailydian.com/api/health
- https://www.ailydian.com/api/legal-ai/case-law
- https://www.ailydian.com/api/legal-ai/precedent
- https://www.ailydian.com/api/legal-ai/constitutional-court
- https://www.ailydian.com/api/legal-ai/legislation

---

## 📝 Navbar Linki

`index.html` veya diğer sayfalardaki navbar'da legal AI linki:

```html
<a href="/lydian-legal-search.html">Hukuk AI</a>
```

veya

```html
<a href="https://www.ailydian.com/lydian-legal-search.html">Hukuk AI</a>
```

---

## 🔍 Sorun Giderme

### "Domain not found" hatası:
- DNS kayıtlarının doğru olduğundan emin olun
- DNS propagation süresini bekleyin (24 saate kadar)
- `dig www.ailydian.com` komutuyla kontrol edin

### SSL Hatası:
- Vercel Dashboard'da SSL durumunu kontrol edin
- "Renew Certificate" butonunu deneyin
- 24 saat bekleyin (bazen gecikme olabilir)

### 404 Hatası:
- `vercel.json` dosyasının doğru yapılandırıldığından emin olun
- Rewrite kurallarını kontrol edin
- Yeni deploy yapın: `vercel --prod`

---

## 📊 Alternatif: Mevcut URL ile Kullanım

Domain bağlayana kadar mevcut Vercel URL'sini kullanabilirsiniz:

**Legal AI Sayfası:**
https://ailydian-pp0fw7v58-lydian-projects.vercel.app/lydian-legal-search.html

---

## 🎉 Domain Bağlandıktan Sonra

1. ✅ `www.ailydian.com/lydian-legal-search.html` çalışacak
2. ✅ HTTPS otomatik aktif olacak
3. ✅ Tüm API endpoints çalışacak
4. ✅ SSL sertifikası otomatik yenilenecek

---

**Not:** Domain'i Vercel'e bağlamak için Vercel Dashboard kullanmanız gerekiyor. CLI ile domain ekleme, domain sahibi doğrulaması gerektirir.

**Vercel Dashboard Link:**
https://vercel.com/lydian-projects/ailydian/settings/domains
