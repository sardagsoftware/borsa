# 🚨 MX KAYITLARI MANUEL KURULUM KILAVUZU

**Date**: 2025-10-10 15:25 UTC+3
**Domain**: ailydian.com
**DNS Provider**: Vercel (ns1.vercel-dns.com, ns2.vercel-dns.com)

---

## ⚠️ DURUM

Vercel CLI'dan MX kayıtları ekleme permission hatası alındı:
```
Error: You don't have permissions to add records to domain ailydian.com
```

**Sebep**: DNS, Vercel nameservers'ında ama CLI'dan değil, web dashboard'dan yönetilmesi gerekiyor.

**Çözüm**: Aşağıdaki 3 yöntemden biri ile MX kayıtları eklenebilir.

---

## 🎯 YÖNTEM 1: VERCEL WEB DASHBOARD (ÖNERİLEN)

### Adım Adım Kılavuz

**1. Vercel Dashboard'a Giriş Yap**
🔗 https://vercel.com/login

**2. Ailydian Projesine Git**
🔗 https://vercel.com/lydian-projects/ailydian

**3. Settings'e Tıkla**
Sol menüden **Settings** sekmesini aç

**4. Domains'e Git**
Settings içinden **Domains** sekmesine tıkla

**5. ailydian.com Domain'ini Bul**
Domain listesinden **ailydian.com** (apex domain) satırını bul

**6. DNS Records'a Git**
- Domain satırında **...** (3 nokta) veya **Manage** butonuna tıkla
- **DNS Records** bölümüne git
- Veya direkt: https://vercel.com/lydian-projects/ailydian/settings/domains/ailydian.com/records

**7. Add Record Butonuna Tıkla**

**8. İlk MX Kaydını Ekle**
```
Type: MX
Name: @ (veya boş bırak)
Value: mx.zoho.eu
Priority: 10
TTL: 3600 (default)
```
- **Save** / **Add** butonuna tıkla

**9. İkinci MX Kaydını Ekle**
Tekrar **Add Record** butonuna tıkla:
```
Type: MX
Name: @
Value: mx2.zoho.eu
Priority: 20
TTL: 3600
```
- **Save** / **Add** butonuna tıkla

**10. Üçüncü MX Kaydını Ekle**
Tekrar **Add Record** butonuna tıkla:
```
Type: MX
Name: @
Value: mx3.zoho.eu
Priority: 50
TTL: 3600
```
- **Save** / **Add** butonuna tıkla

**11. Kayıtların Eklendiğini Doğrula**
DNS Records listesinde 3 yeni MX kaydı görünmeli:
```
@ MX mx.zoho.eu (Priority: 10)
@ MX mx2.zoho.eu (Priority: 20)
@ MX mx3.zoho.eu (Priority: 50)
```

---

## 🎯 YÖNTEM 2: ZOHO MAIL PANEL (KOLAY)

Eğer Vercel dashboard'da sorun yaşanırsa, Zoho'nun otomatik DNS kurulum özelliği kullanılabilir.

### Adım Adım

**1. Zoho Mail Control Panel'e Git**
🔗 https://mailadmin.zoho.eu

**2. Giriş Yap**
Zoho hesabınla login ol

**3. Domains'e Git**
Sol menüden **Domains** sekmesini aç

**4. ailydian.com'u Seç**
Domain listesinden **ailydian.com**'a tıkla

**5. Configure Email Delivery'ye Git**
- **Email Configuration** veya **MX Records** sekmesine git
- **Configure MX Records** butonuna tıkla

**6. Otomatik Kurulum**
Zoho, MX kayıtlarını otomatik ekleyebilir:
- **Auto-configure** seçeneğini işaretle
- Zoho, Vercel API'si üzerinden MX kayıtlarını ekler

**VEYA Manuel:**
- **Manual Configuration** seç
- Zoho, eklenecek MX kayıtlarını gösterir
- Bu kayıtları Vercel Dashboard'da manuel ekle (Yöntem 1)

**7. Verify**
- Kurulum bitince **Verify** butonuna tıkla
- Zoho, MX kayıtlarının doğru eklendiğini kontrol eder

---

## 🎯 YÖNTEM 3: DOMAIN REGISTRAR PANEL (ALTERNATİF)

Domain'in kayıtlı olduğu registrar: **Nics Telekomunikasyon (nicproxy.com)**

### Neden Bu Yöntem?
Eğer DNS yönetimi Vercel'de sıkıntılıysa, DNS'i doğrudan registrar'da yönetebilirsiniz.

### Adım Adım

**1. Domain Registrar Panel'e Giriş**
🔗 https://nicproxy.com
- Hesabınızla login olun
- ailydian.com domain'ini bulun

**2. DNS Yönetimi'ne Git**
- **DNS Management** veya **Name Servers** sekmesi
- Şu anda: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`

**3. İki Seçenek:**

**A) DNS'i Vercel'de Tut (Önerilen)**
- Nameservers'ı değiştirme
- Vercel Dashboard'dan MX kayıtları ekle (Yöntem 1)

**B) DNS'i Registrar'a Taşı**
- Nameservers'ı registrar'ın kendi NS'lerine değiştir
- Registrar panelinden A, CNAME, MX kayıtları ekle
- **DİKKAT**: Bu durumda Vercel deployment ayarlarını da güncellemen gerekir

---

## 📋 EKLENECEK MX KAYITLARI (ÖZET)

Hangi yöntemi kullanırsan kullan, bu 3 MX kaydı eklenecek:

```
Type: MX
Host/Name: @ (veya ailydian.com veya boş)
Value: mx.zoho.eu
Priority: 10
TTL: 3600 (1 hour) veya default

---

Type: MX
Host/Name: @
Value: mx2.zoho.eu
Priority: 20
TTL: 3600

---

Type: MX
Host/Name: @
Value: mx3.zoho.eu
Priority: 50
TTL: 3600
```

**NOT**: Bazı panellerde "Name" yerine "Host" veya "@" yerine "ailydian.com" yazmanız gerekebilir.

---

## ✅ DOĞRULAMA

MX kayıtları ekledikten sonra:

### 1. DNS Propagation Bekle
**Süre**: 5-15 dakika (bazen 24 saate kadar)

### 2. Terminal'den Kontrol Et
```bash
./check-email-dns.sh
```

Veya manuel:
```bash
dig MX ailydian.com +short
```

**Beklenen Çıktı**:
```
10 mx.zoho.eu.
20 mx2.zoho.eu.
50 mx3.zoho.eu.
```

### 3. Web'den Kontrol Et
🔗 https://www.ailydian.com/email-setup-status

Status page, MX kayıtlarını otomatik kontrol eder ve yeşil ✅ gösterir.

### 4. Online DNS Tools
- https://mxtoolbox.com/SuperTool.aspx?action=mx%3aailydian.com
- https://dnschecker.org/all-dns-records-of-domain.php?query=ailydian.com

---

## 🧪 EMAIL TEST

MX kayıtları doğrulandıktan sonra:

### Test 1: Email Gönder
Kendi kişisel emailinden (Gmail, Outlook, vb.) test email gönder:

```
To: admin@ailydian.com
Subject: Test Email
Body: Testing Zoho Mail on ailydian.com
```

### Test 2: Zoho Mail'de Kontrol Et
1. Git: https://mail.zoho.eu
2. Login ol
3. **admin@ailydian.com** hesabını aç
4. Inbox'ta test email'i gör

### Test 3: Reply Test
1. Zoho Mail'den test email'e reply yap
2. Kendi email'inde reply'ı kontrol et
3. Bidirectional email çalışıyor mu?

---

## 🚨 SORUN GİDERME

### Problem 1: Vercel Dashboard'da DNS Records Buton Yok
**Çözüm**:
- Domain'in Vercel'e제doğru transfer edildiğinden emin ol
- Team permissions kontrol et
- Yöntem 2 (Zoho Panel) veya Yöntem 3 (Registrar) dene

### Problem 2: MX Kayıtları Eklenmiyor
**Çözüm**:
- Nameservers'ın doğru olduğunu kontrol et: `dig NS ailydian.com +short`
- 24 saat DNS propagation bekle
- Browser cache temizle, incognito mode'da dene

### Problem 3: Email Gelmiyor
**Kontroller**:
1. MX kayıtları doğru mu? `dig MX ailydian.com +short`
2. Zoho'da email hesabı oluşturuldu mu?
3. Spam folder'a bakmayı dene
4. Zoho Mail logs'u kontrol et (Zoho Admin Panel)

### Problem 4: DNS Propagation Çok Uzun
**Normal Süreler**:
- Minimum: 5 dakika
- Ortalama: 1-4 saat
- Maximum: 24-48 saat

**Hızlandırma**:
- TTL'i düşük tut (3600 = 1 hour)
- DNS cache temizle: `sudo dscacheutil -flushcache` (Mac)
- Online tools kullan: mxtoolbox.com

---

## 📞 DESTEK

### Vercel Support
- Dashboard: https://vercel.com/support
- Docs: https://vercel.com/docs/concepts/projects/domains/dns-records

### Zoho Mail Support
- Help Center: https://www.zoho.com/mail/help/
- Community: https://help.zoho.com/portal/en/community/mail

### Domain Registrar Support
- Nics Telekom: https://nicproxy.com
- Phone: +90 212 213 2963
- Email: abuse@nicproxy.com

---

## 🎯 HIZLI ÖZET

**EN KOLAY YÖNTEM**: Vercel Web Dashboard

1. 🔗 https://vercel.com/lydian-projects/ailydian/settings/domains
2. ailydian.com → DNS Records
3. Add 3 MX records:
   - Priority 10: mx.zoho.eu
   - Priority 20: mx2.zoho.eu
   - Priority 50: mx3.zoho.eu
4. 15 dakika bekle
5. `./check-email-dns.sh` ile doğrula

**EĞER VERCEL DASHBOARD'DA SIKINTI VARSA**: Zoho Panel

1. 🔗 https://mailadmin.zoho.eu
2. Domains → ailydian.com
3. Configure MX Records → Auto-configure
4. Verify

---

## ✅ BAŞARI KRİTERLERİ

MX kayıtları başarıyla eklendi sayılır eğer:

- [x] `dig MX ailydian.com +short` 3 kayıt gösterirse
- [x] https://www.ailydian.com/email-setup-status yeşil ✅ gösterirse
- [x] mxtoolbox.com testi geçerse
- [x] Test email admin@ailydian.com'a ulaşırsa
- [x] Zoho Mail'de inbox'ta email görünürse

---

**Rapor Tarihi**: 2025-10-10 15:25 UTC+3
**Durum**: 🟡 **MANUEL KURULUM GEREKLİ**
**Önerilen Yöntem**: Vercel Web Dashboard (Yöntem 1)
**Alternatifler**: Zoho Panel veya Registrar Panel

---

## 🎓 SONRAKI ADIMLAR

### Şimdi Yap (Kritik)
1. **Vercel Dashboard'a git** → MX kayıtları ekle
2. **15 dakika bekle** → DNS propagation
3. **Doğrula** → `./check-email-dns.sh`

### Sonra Yap (Önemli)
4. **Zoho'da 10 email hesabı oluştur**
5. **Test email gönder/al**
6. **Backend entegrasyonu planla**

---

**🚀 MX KAYITLARI EKLENİNCE EMAIL SİSTEMİ TAM ÇALIŞACAK!**
