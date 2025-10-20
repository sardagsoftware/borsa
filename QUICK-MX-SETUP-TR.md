# ⚡ HIZLI MX KAYIT KURULUM - 5 DAKİKA

**Domain**: ailydian.com
**Tarih**: 2025-10-10

---

## 🚨 DURUM

Vercel CLI'dan MX kayıtları eklenemedi (permission hatası).

**Çözüm**: Vercel Web Dashboard'dan manuel ekleme (çok kolay!)

---

## 🎯 3 ADIMDA KURULUM

### 1️⃣ VERCEL DASHBOARD'A GİT

**DİREKT LİNK**:
🔗 https://vercel.com/emrahsardag-yandexcoms-projects/ailydian/settings/domains

Veya:
1. https://vercel.com giriş yap
2. **ailydian** projesine tıkla
3. **Settings** → **Domains**

---

### 2️⃣ MX KAYITLARINI EKLE

**ailydian.com** domain'inde **DNS Records** bölümüne git.

**"Add Record"** butonuna tıkla ve şu 3 kaydı ekle:

#### 📧 Kayıt 1
```
Type: MX
Name: @ (veya boş bırak)
Value: mx.zoho.eu
Priority: 10
```
✅ **Save**

#### 📧 Kayıt 2
```
Type: MX
Name: @
Value: mx2.zoho.eu
Priority: 20
```
✅ **Save**

#### 📧 Kayıt 3
```
Type: MX
Name: @
Value: mx3.zoho.eu
Priority: 50
```
✅ **Save**

---

### 3️⃣ DOĞRULA (15 DAKİKA SONRA)

#### Terminal'den:
```bash
./check-email-dns.sh
```

Veya manuel:
```bash
dig MX ailydian.com +short
```

**Beklenen çıktı**:
```
10 mx.zoho.eu.
20 mx2.zoho.eu.
50 mx3.zoho.eu.
```

#### Web'den:
🔗 https://www.ailydian.com/email-setup-status

Sayfa yeşil ✅ gösterecek!

---

## 🧪 TEST EMAIL

MX kayıtları eklenince:

1. **Email gönder**: Kendi emailinden → admin@ailydian.com
2. **Zoho'da kontrol**: https://mail.zoho.eu
3. **Inbox'ta gör**: Test email geldi mi?

---

## 📱 ALTERNATİF: ZOHO OTOMATİK KURULUM

Eğer Vercel'de sorun olursa:

1. 🔗 https://mailadmin.zoho.eu
2. **Domains** → **ailydian.com**
3. **Configure MX Records** → **Auto-configure**
4. ✅ **Verify**

---

## 🎯 ÖZET

| Adım | Durum |
|------|-------|
| 1. Vercel Dashboard'a git | ⏳ Yapılacak |
| 2. 3 MX kaydı ekle | ⏳ Yapılacak |
| 3. 15 dakika bekle | ⏳ Yapılacak |
| 4. Doğrula | ⏳ Yapılacak |
| 5. Test email gönder | ⏳ Yapılacak |

---

## 💡 HIZLI LİNKLER

**Vercel DNS Settings**:
🔗 https://vercel.com/emrahsardag-yandexcoms-projects/ailydian/settings/domains

**Email Status Check**:
🔗 https://www.ailydian.com/email-setup-status

**Zoho Mail Panel**:
🔗 https://mailadmin.zoho.eu

**MX Toolbox (Doğrulama)**:
🔗 https://mxtoolbox.com/SuperTool.aspx?action=mx%3aailydian.com

---

## ✅ BAŞARI!

MX kayıtları eklendikten sonra:

```
✅ Email Dashboard: LIVE
✅ MX Records: OK
✅ Email Sending: WORKING
✅ Email Receiving: WORKING
```

**🎉 EMAIL SİSTEMİ TAM ÇALIŞIR DURUMDA!**

---

**Detaylı kılavuz**: `MX-RECORDS-MANUAL-SETUP-2025-10-10.md`
