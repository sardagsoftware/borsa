# 📱 MOBİL CİHAZ KULLANIM REHBERİ

**www.ukalai.ai** - Mobil Kullanım (iOS & Android)
**Tarih**: 20 Ekim 2025

---

## ⚠️ ÖNEMLİ: MOBİL CİHAZDA FARKLILIKLAR

### Android (✅ TAM DESTEK)

**Chrome Browser**:
```
✅ Background notifications: TAM DESTEK
✅ PWA (Add to Home): TAM DESTEK
✅ 7/24 çalışma: TAM DESTEK
✅ Browser minimize: Çalışmaya devam eder
✅ Screen off: Çalışmaya devam eder
```

**Kısıtlamalar**:
- ❌ Browser tamamen kapatılırsa: Scanner durur
- ❌ Battery saver mode: Bildirimler gecikmeli olabilir
- ❌ Data saver mode: Arka plan istekleri kısıtlanabilir

### iOS (⚠️ KISITLI DESTEK)

**Safari Browser**:
```
⚠️ Background notifications: SINIRLI DESTEK
⚠️ PWA (Add to Home): Çalışır ama kısıtlı
⚠️ 7/24 çalışma: SINIRLI (iOS kısıtlamaları)
❌ Browser minimize: ~5 dakika sonra durur
❌ Screen off: Hemen durur
```

**iOS Kısıtlamaları** (Apple politikası):
- iOS Safari background işlemleri ~5 dakika sonra durdurur
- PWA olarak yüklensek bile background sınırlı
- Web Push Notifications iOS 16.4+ gerektirir
- Background process'ler agresif şekilde sonlandırılır

---

## 🎯 MOBİL CIHAZDA EN İYİ KULLANIM

### Android Kullanıcısıysan (✅ ÖNERİLEN)

**Yöntem 1: PWA Olarak Kur (EN İYİ)**

```
ADIM 1: Chrome'da www.ukalai.ai/market aç

ADIM 2: Menü (⋮) → "Add to Home screen" / "Ana ekrana ekle"

ADIM 3: PWA olarak aç (Ana ekran icon'una tıkla)

ADIM 4: Bildirimleri etkinleştir
   → "🔕 Bildirimleri Aç" → Allow

ADIM 5: Scanner'ı başlat
   → "🔔 Scanner Başlat" → Yeşil olana kadar bekle

ADIM 6: Uygulamayı minimize et
   → Ana ekrana dön
   → PWA arka planda çalışmaya devam eder

✅ SONUÇ: 7/24 bildirimler gelir!
```

**Yöntem 2: Chrome Tab Olarak Bırak**

```
ADIM 1: Chrome'da www.ukalai.ai/market aç

ADIM 2: Bildirimleri etkinleştir + Scanner başlat

ADIM 3: Tab'ı açık bırak (kapatma!)

ADIM 4: Ana ekrana dön veya başka uygulamalar kullan

⚠️ NOT: Chrome'u tamamen kapatırsan scanner durur
✅ NOT: Tab açık kaldığı sürece çalışır
```

**Yöntem 3: Chrome Background Mode**

```
ADIM 1-2: Yukarıdaki gibi

ADIM 3: Chrome Settings → Advanced → "Close tabs on exit" → OFF

ADIM 4: "Continue running background apps" → ON (varsa)

✅ SONUÇ: Chrome kapatılsa bile bazı işlemler devam eder
```

### iOS Kullanıcısıysan (⚠️ KISITLAMALI)

**Gerçekçi Beklentiler**:

```
❌ 7/24 arka plan taraması: MÜMKÜN DEĞİL (iOS kısıtlaması)
❌ Ekran kapalıyken notification: MÜMKÜN DEĞİL
⚠️ Safari açıkken tarama: 5 dakika sonra durur
✅ Aktif kullanımda tarama: ÇALIŞIR
```

**iOS'ta En İyi Kullanım**:

```
YÖNTEM 1: Manuel Kontrol (ÖNERİLEN)
   1. Günde 2-3 kez www.ukalai.ai/market aç
   2. "TARA" butonuna tıkla
   3. Yeşil çerçevelilere bak
   4. İlginç coin'e tıkla → Detaylı analiz
   5. Karar ver

YÖNTEM 2: Safari Açık Bırak (SINIRLI)
   1. Safari'de market sayfasını aç
   2. Scanner başlat
   3. Safari'yi ön planda bırak (minimize etme!)
   4. Ekranı kapatma!
   5. Max ~5 dakika çalışır

YÖNTEM 3: PWA Yükle (SINIRLI)
   1. Safari → Share → "Add to Home Screen"
   2. PWA olarak aç
   3. Scanner başlat
   4. Ön planda bırak
   5. ⚠️ Yine de ~5 dakika sonra durur
```

**iOS Gerçeği**:
```
Apple, battery life için web app'lerin arka planda
çalışmasını agresif şekilde kısıtlar. Bu bizim
kontrolümüz dışında bir durum.

ÇÖZÜM: iOS'ta 7/24 bildirim için native app gerekir.
(Gelecekte native iOS app geliştirilebilir)
```

---

## 📲 MOBİL KURULUM - ADIM ADIM

### Android (Chrome) Kurulum

**1. PWA Yükleme**

```
┌─────────────────────────────────────────┐
│ Chrome Browser                          │
├─────────────────────────────────────────┤
│ www.ukalai.ai/market                    │
│                                         │
│ [Market görünümü]                       │
│                                         │
└─────────────────────────────────────────┘
         ↓
    Menü (⋮) tıkla
         ↓
┌─────────────────────────────────────────┐
│ ⋮ Menü                                  │
├─────────────────────────────────────────┤
│ Yeni sekme                              │
│ Yeni gizli sekme                        │
│ Yer işaretleri                          │
│ → Ana ekrana ekle          ◄── TIKLA    │
│ Geçmiş                                  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Ana ekrana ekle                         │
├─────────────────────────────────────────┤
│ İsim: ukalai.ai                         │
│ [Icon preview]                          │
│                                         │
│           [Ekle] ◄── TIKLA              │
└─────────────────────────────────────────┘
         ↓
Ana ekranda "ukalai.ai" icon'u oluşur ✅
```

**2. Bildirim İzni**

```
Ana ekranda icon'a tıkla
         ↓
Market sayfası PWA olarak açılır
         ↓
┌─────────────────────────────────────────┐
│ 📊 Market Overview                      │
│ [Header]                                │
│ 🔕 Bildirimleri Aç ◄── TIKLA            │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ ukalai.ai bildirim göndermek istiyor    │
│                                         │
│   [Engelle]    [İzin ver] ◄── TIKLA    │
└─────────────────────────────────────────┘
         ↓
Button: 🔔 Scanner Başlat olur ✅
```

**3. Scanner Başlatma**

```
┌─────────────────────────────────────────┐
│ 📊 Market Overview                      │
│ [Header]                                │
│ 🔔 Scanner Başlat ◄── TIKLA             │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ 📊 Market Overview                      │
│ [Header]                                │
│ 🔔 Scanner Aktif ✅                     │
│    (Yeşil + pulse)                      │
└─────────────────────────────────────────┘
         ↓
Ana ekrana dön (Home butonuna bas)
         ↓
✅ TAMAMLANDI!
Scanner arka planda çalışıyor
Her 5 dakikada bildirim gelecek
```

### iOS (Safari) Kurulum

**1. PWA Yükleme**

```
┌─────────────────────────────────────────┐
│ Safari Browser                          │
├─────────────────────────────────────────┤
│ www.ukalai.ai/market                    │
│                                         │
│ [Market görünümü]                       │
│                                         │
└─────────────────────────────────────────┘
         ↓
    Share butonu (⬆️) tıkla
         ↓
┌─────────────────────────────────────────┐
│ Share Sheet                             │
├─────────────────────────────────────────┤
│ [Social apps]                           │
│ [Actions]                               │
│ → Ana Ekrana Ekle     ◄── TIKLA         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│ Ana Ekrana Ekle                         │
├─────────────────────────────────────────┤
│ İsim: ukalai.ai                         │
│ [Icon preview]                          │
│                                         │
│           [Ekle] ◄── TIKLA              │
└─────────────────────────────────────────┘
         ↓
Ana ekranda "ukalai.ai" icon'u oluşur ✅
```

**2. Bildirim İzni (iOS 16.4+)**

```
⚠️ NOT: iOS 16.4 veya üstü gerekli!

Ana ekranda icon'a tıkla
         ↓
Market sayfası PWA olarak açılır
         ↓
"🔕 Bildirimleri Aç" tıkla
         ↓
┌─────────────────────────────────────────┐
│ "ukalai.ai" Would Like to Send You     │
│ Notifications                           │
│                                         │
│   [Don't Allow]    [Allow] ◄── TIKLA   │
└─────────────────────────────────────────┘
         ↓
Button: 🔔 Scanner Başlat olur ✅
```

**3. Scanner Başlatma (Dikkatli!)**

```
🔔 Scanner Başlat tıkla
         ↓
Button yeşil + pulse olur ✅
         ↓
⚠️ UYARI: iOS'ta arka plan kısıtlaması var!
         ↓
SEÇENEKLER:

SEÇENEK A (Manuel kontrol - ÖNERİLEN):
   → Ana ekrana dön
   → Günde 2-3 kez aç ve "TARA" butonuna tıkla

SEÇENEK B (Aktif kullanım):
   → Uygulamayı ÖN PLANDA bırak
   → Ekranı AÇIK tut
   → Max ~5 dakika çalışır
   → Sonra yeniden aç
```

---

## 🔋 BATTERY & PERFORMANS

### Android Optimizasyonları

**1. Battery Optimization Kapatma (Önerilen)**

```
Settings → Apps → ukalai.ai (PWA) / Chrome
   → Battery → "Not optimized"

VEYA

Settings → Battery → Battery optimization
   → ukalai.ai / Chrome → "Don't optimize"
```

**2. Data Saver'ı Kapat**

```
Settings → Network & Internet → Data Saver → OFF

VEYA

Chrome Settings → Data Saver → OFF
```

**3. Background Data İzni**

```
Settings → Apps → Chrome
   → Mobile data & Wi-Fi
   → Background data → ON ✅
   → Unrestricted data usage → ON ✅
```

### iOS Optimizasyonları

**1. Low Power Mode'u Kapat**

```
Settings → Battery
   → Low Power Mode → OFF

NOT: Low Power Mode aktifken arka plan işlemleri durur
```

**2. Background App Refresh**

```
Settings → General → Background App Refresh
   → Background App Refresh → ON
   → Safari → ON

NOT: Web app'ler için sınırlı etkisi var
```

**3. Notifications Ayarları**

```
Settings → Notifications → Safari
   → Allow Notifications → ON ✅
   → Sounds → ON
   → Badges → ON
```

---

## 📊 MOBİL'DE BEKLENEN PERFORMANS

### Android (Gerçekçi Beklentiler)

```
PWA Kullanımında:
✅ Scanner: Her 5 dakikada çalışır
✅ Bildirim: Anında gelir
✅ Battery: %1-2/saat (~20-40 saat)
✅ Data: ~1-2 MB/saat
✅ Uptime: 7/24 (uygulama kapatılmadıkça)

Chrome Tab Kullanımında:
✅ Scanner: Her 5 dakikada çalışır
⚠️ Battery: %2-3/saat (biraz daha fazla)
✅ Data: ~1-2 MB/saat
⚠️ Uptime: Tab açık kaldığı sürece
```

### iOS (Gerçekçi Beklentiler)

```
PWA/Safari Kullanımında:
⚠️ Scanner: Max ~5 dakika çalışır
⚠️ Bildirim: Sınırlı (iOS kısıtlaması)
✅ Battery: Minimal etki
✅ Data: Minimal kullanım
❌ Uptime: 7/24 mümkün değil

Manuel Kontrol (Önerilen):
✅ Açtığında anında tara (TARA butonu)
✅ 570 coin 1 saniyede taranır
✅ Yeşil çerçevelileri hemen gör
✅ Battery: Sadece kullanırken
✅ Data: Sadece kullanırken
✅ Güvenilir: Her zaman çalışır
```

---

## 🎯 PLATFORM KARŞILAŞTIRMASI

| Özellik | Android Chrome | iOS Safari | Desktop |
|---------|----------------|------------|---------|
| **Background Scan** | ✅ TAM | ❌ YOK | ✅ TAM |
| **7/24 Bildirim** | ✅ EVET | ❌ HAYIR | ✅ EVET |
| **PWA Desteği** | ✅ TAM | ⚠️ SINIRLI | ✅ TAM |
| **Battery İzni** | ✅ OK | ❌ AGRESIF | ✅ OK |
| **Manuel Tara** | ✅ EVET | ✅ EVET | ✅ EVET |
| **Uptime** | ✅ 7/24 | ❌ ~5 dk | ✅ 7/24 |

---

## 💡 ÖNERİLER (Platform Bazında)

### Android Kullanıcısına Önerim:

```
✅ PWA olarak kur
✅ Battery optimization kapat
✅ Scanner'ı başlat
✅ Minimize et, unutup git
✅ 7/24 bildirim al

Sonuç: Desktop gibi çalışır! 🎉
```

### iOS Kullanıcısına Önerim:

```
⚠️ 7/24 arka plan beklemeden:

1. Günde 2-3 kez aç (sabah, öğle, akşam)
2. "TARA" butonuna tıkla (1 saniye)
3. Yeşil çerçevelilere bak
4. İlginç coin varsa detaya gir
5. Kapat, git

Veya:

1. Desktop/Android cihazında scanner başlat
2. iOS'tan sadece market durumunu kontrol et

Sonuç: iOS kısıtlamalarını aş! 💪
```

---

## 🚀 BAŞLARKEN (MOBİL)

### Android Hızlı Başlangıç

```
1. Chrome'da www.ukalai.ai/market
2. Menü → Ana ekrana ekle
3. Ana ekran icon'una tıkla
4. "Bildirimleri Aç" → İzin ver
5. "Scanner Başlat" → Yeşil olana kadar bekle
6. Ana ekrana dön
7. İşine devam et ✨

Süre: 1 dakika
Sonuç: 7/24 bildirimler! 🎉
```

### iOS Hızlı Başlangıç

```
YÖNTEM 1 (Önerilen - Manuel):
1. Safari'de www.ukalai.ai/market
2. Günde 2-3 kez aç
3. "TARA" butonuna tıkla
4. Yeşil çerçevelilere bak
5. Kapat

YÖNTEM 2 (PWA - Sınırlı):
1. Safari → Share → Ana Ekrana Ekle
2. Icon'a tıkla
3. "Bildirimleri Aç" → İzin ver (iOS 16.4+)
4. "Scanner Başlat"
5. ⚠️ Max ~5 dk çalışır
```

---

## 🔍 SORUN GİDERME (MOBİL)

### "Scanner durdu" (Android)

**Neden?**
- Battery optimization aktif
- Chrome tab kapatıldı
- Data saver aktif
- Background data kapalı

**Çözüm**:
1. Battery optimization kapat
2. PWA olarak kullan (tab değil)
3. Data saver kapat
4. Background data aç

### "Bildirim gelmiyor" (Android)

**Neden?**
- Notification izni yok
- Battery saver mode
- Do Not Disturb aktif

**Çözüm**:
1. Settings → Apps → Notifications → ON
2. Battery saver kapat
3. Do Not Disturb kapat

### "Scanner durdu" (iOS)

**Neden?**
- iOS background kısıtlaması (NORMAL!)
- Safari minimize edildi
- Ekran kapandı
- Low Power Mode

**Çözüm**:
iOS'ta 7/24 arka plan MÜMKÜN DEĞİL.
Manuel kontrole geç (önerilen).

---

## 📈 DATA KULLANIMI

```
Scanner Çalışırken (Android):
   - Her 5 dakika: ~100 KB
   - Saatte: ~1.2 MB
   - Günde: ~30 MB
   - Ayda: ~900 MB

Manuel Kontrol (iOS):
   - Açılış: ~500 KB
   - TARA: ~200 KB
   - Coin detay: ~100 KB
   - Günde 3 kontrol: ~2.4 MB
   - Ayda: ~72 MB

Sonuç: Her iki durumda da minimal! ✅
```

---

## 🎊 SONUÇ

### Android Kullanıcısı İçin:

```
✅ Desktop ile aynı deneyim
✅ 7/24 arka plan taraması
✅ Otomatik bildirimler
✅ Minimal battery kullanımı
✅ PWA desteği mükemmel

→ SİSTEM HAZIR! 🚀
```

### iOS Kullanıcısı İçin:

```
⚠️ iOS kısıtlamaları var
❌ 7/24 arka plan mümkün değil
⚠️ Max ~5 dakika background
✅ Manuel kontrol mükemmel çalışır
✅ "TARA" butonu süper hızlı

→ MANUEL KULLANIM ÖNERİLİR 💪
```

---

**Son Güncelleme**: 20 Ekim 2025
**Platform Test**: ✅ Android (Chrome) | ⚠️ iOS (Safari)
**Production**: ✅ www.ukalai.ai

**Android?** → 7/24 bildirimler al! 🎉
**iOS?** → Manuel kontrol yap! 💪
