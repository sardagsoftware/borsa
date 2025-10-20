# 🤖 Otomatik Akıllı Trading Sistemi - Kullanım Kılavuzu

## ⚡ Yeni Özellikler (19 Ekim 2025)

---

## 🎯 1. Varsayılan 4 Saatlik Zaman Dilimi

### ✅ Ne Değişti?
- **Önceki:** Sistem 5 dakika ile başlıyordu
- **Yeni:** Sistem artık **4 saatlik (4h)** zaman dilimi ile başlıyor
- **Preset:** Swing Trading otomatik aktif

### 🎯 Neden 4 Saat?
- Swing trading için ideal zaman dilimi
- Daha güvenilir sinyaller
- Gürültü (noise) daha az
- Orta vadeli pozisyonlar için uygun

---

## 🚨 2. Otomatik Hacim Patlaması Tespiti

### ⚙️ Nasıl Çalışır?

**Otomatik Tarama:**
```
✓ Her 30 saniyede bir otomatik tarama
✓ Sadece 4h zaman diliminde aktif
✓ Threshold: %300+ hacim artışı
✓ Son 10 mum kontrol edilir
```

**Tespit Edildiğinde:**
1. 🚨 Toast bildirimi: "X hacim patlaması tespit edildi!"
2. 📊 Alert drawer'ı otomatik açılır
3. 🔔 Alarmlar listeye eklenir
4. 📈 Chart üzerinde işaretlenir

### ✅ ARTIK + BUTONUNA TIKLAMANIZA GEREK YOK!

Sistem arka planda sürekli izliyor ve hacim patlaması olduğunda:
- Sizi otomatik uyarıyor
- Alert panelini otomatik açıyor
- Detayları gösteriyor

---

## 🕐 3. Otomatik Çoklu Zaman Analizi

### ⚙️ Nasıl Çalışır?

**Sembol Değiştirdiğinizde:**
```
1. BTCUSDT → ETHUSDT değiştirdiniz
2. MTF (Multi-Timeframe) drawer otomatik açılır
3. 3 zaman dilimi analizi gösterilir:
   - Üst: 1d (Trend)
   - Mevcut: 4h (Ana)
   - Alt: 1h (Giriş)
4. 5 saniye sonra otomatik kapanır
```

### 📊 Gördükleriniz

**Hızlı Analiz:**
- ✅ Tüm zaman dilimlerinde AL → Güçlü sinyal
- ⚠️ Karışık sinyaller → Dikkatli ol
- ❌ Çelişkili sinyaller → İşlem yapma

**Örnek:**
```
┌─────────────────────────────┐
│ ETHUSDT - MTF Analizi       │
├─────────────────────────────┤
│ 1d:  🟢 AL (Trend yukarı)   │
│ 4h:  🟢 GÜÇLÜ AL (Ana)      │
│ 1h:  🟢 AL (Giriş zamanı)   │
│                             │
│ ✅ ONAYLI - Güven: %95      │
└─────────────────────────────┘
```

---

## 🎯 4. Destek/Direnç Otomatik Uyarısı

### ⚙️ Nasıl Çalışır?

**Gerçek Zamanlı İzleme:**
```
✓ 4h destek/direnç seviyeleri hesaplanır
✓ Fiyat seviyeye %0.5 yaklaşınca uyarı
✓ Toast bildirimi gösterilir
✓ Güç seviyesi belirtilir
```

### 🔔 Uyarı Örnekleri

**Destek Seviyesi:**
```
🟢 Destek seviyesine yaklaşıldı: $45,234.50 (Güç: 8)
→ Muhtemel AL fırsatı
→ Stop loss seviyesi
```

**Direnç Seviyesi:**
```
🔴 Direnç seviyesine yaklaşıldı: $46,789.20 (Güç: 9)
→ Muhtemel SAT bölgesi
→ Take profit seviyesi
```

### 📊 Güç Seviyeleri
- **1-3:** Zayıf seviye (test edilebilir)
- **4-6:** Orta seviye (dikkatli olun)
- **7-10:** Güçlü seviye (önemli!)

---

## 🤖 Sistemin Tam Otomatik İş Akışı

### 📍 Senaryo 1: Yeni Koin Araştırması

**Adımlar:**
```
1. Topbar'da BTCUSDT'ye tıklayın
2. SOLUSDT yazın, ENTER basın

OTOMATIK OLANLAR:
✓ 4h chart yüklenir
✓ MTF drawer 5 saniye açılır (3 TF analizi)
✓ Destek/direnç seviyeleri hesaplanır
✓ Swing sinyalleri güncellenir
✓ Hacim izleme başlar
```

**Sonuç:** 5 saniye içinde koinin tam analizini görürsünüz!

---

### 📍 Senaryo 2: Hacim Patlaması Yakalama

**Adımlar:**
```
1. Chart'ı açık bırakın
2. Başka işlerle ilgilenin

OTOMATIK OLANLAR:
✓ Her 30 saniyede tarama yapılır
✓ Hacim patlaması tespit edilir
✓ 🚨 Bildirim gösterilir
✓ Alert drawer otomatik açılır
✓ Detayları inceleyebilirsiniz
```

**Sonuç:** Hiçbir fırsat kaçmaz!

---

### 📍 Senaryo 3: Destek/Direnç Testi

**Adımlar:**
```
1. 4h chart'ta izlemeye devam edin
2. Fiyat hareket ediyor

OTOMATIK OLANLAR:
✓ Destek/direnç sürekli hesaplanır
✓ Fiyat %0.5 yaklaşınca uyarı
✓ 🎯 Toast bildirimi
✓ Güç seviyesi gösterilir
```

**Sonuç:** Kritik seviyeleri kaçırmazsınız!

---

## ⚙️ Teknik Detaylar

### Otomatik Hacim Tarama
```typescript
// Her 30 saniye
if (tf === "4h" && candles.length >= 50) {
  const alerts = scanVolumeBreakout(symbol, tf, candles, 3, 10);
  if (alerts.length > 0) {
    // Otomatik drawer aç
    setActiveDrawer("alerts");
    toast.success("🚨 Hacim patlaması tespit edildi!");
  }
}
```

### Otomatik MTF Drawer
```typescript
// Sembol her değiştiğinde
useEffect(() => {
  setActiveDrawer("mtf");

  // 5 saniye sonra kapat
  setTimeout(() => setActiveDrawer(null), 5000);
}, [symbol]);
```

### Destek/Direnç Uyarısı
```typescript
// Sürekli izleme
const threshold = currentPrice * 0.005; // %0.5

srLevels.forEach((level) => {
  const distance = Math.abs(currentPrice - level.price);
  if (distance <= threshold) {
    toast(`🎯 ${type} seviyesine yaklaşıldı!`);
  }
});
```

---

## 📊 Varsayılan Ayarlar

### Başlangıç Değerleri
```typescript
{
  symbol: "BTCUSDT",
  tf: "4h",           // ← YENİ (önceden 5m idi)
  preset: "swing",    // ← YENİ (önceden daytrading)
  market: "futures"
}
```

### Swing Trading Indikatörleri
```
✓ EMA(50) - Kısa vadeli trend
✓ EMA(200) - Uzun vadeli trend
✓ MACD(12,26,9) - Momentum
✓ RSI(14) - Divergence
✓ BB(20,2) - Volatilite
✓ VWAP - Hacim ağırlıklı fiyat
```

---

## 🎮 Kullanıcı Kontrolleri

### Manuel Kontroller (İsteğe Bağlı)

**FAB Butonu (Desktop):**
- Hala kullanabilirsiniz
- Drawer'ları manuel açmak için
- Tarama butonu (🔍 Tara)

**Bottom Nav (Mobil):**
- Manuel drawer açma
- Hızlı navigasyon

**Klavye:**
- ESC → Drawer kapat
- Enter (Search) → Sembol değiştir

---

## 🔔 Bildirim Türleri

### 1. Hacim Patlaması
```
🚨 3 hacim patlaması tespit edildi!
→ Duration: 5 saniye
→ Alert drawer otomatik açılır
```

### 2. Destek/Direnç
```
🎯 Destek seviyesine yaklaşıldı: $45,234.50 (Güç: 8)
→ Duration: 7 saniye
→ Icon: 🟢 (destek) / 🔴 (direnç)
```

### 3. Fiyat Alarmı
```
🔔 Fiyat Alarmı: BTCUSDT üstünde $50,000.00
→ Duration: 5 saniye
→ Price-alerts drawer'da yönetebilirsiniz
```

---

## ✅ Kontrol Listesi

### Sistem Çalışıyor mu?

**1. Varsayılan 4h Kontrolü:**
- [ ] Sayfa açıldığında "4h" seçili mi?
- [ ] Preset "Swing Trading" mi?
- [ ] Chart 4 saatlik mumları gösteriyor mu?

**2. Otomatik Tarama:**
- [ ] 4h seçiliyken her 30 saniyede tarama yapılıyor mu?
- [ ] Console'da "[Auto Scan]" logları var mı?
- [ ] Hacim patlaması bulunca bildirim geliyor mu?

**3. Otomatik MTF:**
- [ ] Sembol değiştirince MTF drawer açılıyor mu?
- [ ] 5 saniye sonra otomatik kapanıyor mu?
- [ ] 3 zaman dilimi gösteriliyor mu?

**4. Destek/Direnç:**
- [ ] Chart'ta S/R çizgileri görünüyor mu?
- [ ] Fiyat yaklaşınca toast bildirimi geliyor mu?
- [ ] Güç seviyesi belirtiliyor mu?

---

## 🚀 Performans

### Optimizasyonlar
```
✓ Web Worker - Indikatör hesaplamaları
✓ useMemo - Ağır hesaplamalar cache'lenir
✓ Interval - 30 saniye (sunucu yükü az)
✓ Drawer lazy load - Açılınca render
```

### Kaynak Kullanımı
```
Auto Scan:      Her 30 saniye
MTF Drawer:     Sadece sembol değişince
S/R Check:      Her candle update'inde
Total Impact:   Düşük (optimize edilmiş)
```

---

## 📱 Mobil Kullanım

### Otomatik Özellikler Mobilde de Çalışır

**Bottom Navigation:**
- Manuel kontrol için kullanın
- Otomatik drawer'lar yine açılır
- Touch-optimized

**Bildirimler:**
- Mobilde de toast gösterilir
- Full-width drawer'lar
- Smooth animations

---

## 🎯 Örnek Kullanım Senaryosu

### Gerçek Hayat Örneği

**Durum:**
"BTCUSDT'yi 4h'te izliyorsunuz, swing pozisyonu arıyorsunuz"

**Sistem Otomatik Yapar:**

**09:00** - Sayfa açıldı
```
✓ 4h chart yüklendi
✓ Swing preset aktif
✓ MTF drawer 5 saniye gösterildi
✓ Destek: $45,000, Direnç: $46,500
```

**09:30** - İlk otomatik tarama
```
ℹ️ Hacim patlaması yok
```

**10:00** - İkinci tarama
```
🚨 1 hacim patlaması tespit edildi!
→ Alert drawer açıldı
→ Detay: %380 hacim artışı, 10:00 mumu
```

**10:15** - Fiyat hareketi
```
🎯 Direnç seviyesine yaklaşıldı: $46,500 (Güç: 9)
→ Muhtemel SAT bölgesi
→ Dikkatli olun
```

**10:20** - Başka koin baktınız
```
ETHUSDT yazdınız
✓ MTF drawer 5 saniye açıldı
✓ 1d: AL, 4h: NÖTR, 1h: SAT
✓ ⚠️ Karışık sinyal - bekleyin
```

**Sonuç:** Hiçbir şey kaçırmadınız, tüm kritik bilgileri aldınız!

---

## 🛠️ Sorun Giderme

### Otomatik Tarama Çalışmıyor?

**Kontrol:**
1. Zaman dilimi 4h mi? (Sadece 4h'te aktif)
2. En az 50 mum var mı?
3. Console'da hata var mı?

**Çözüm:**
```javascript
// Console'da test edin:
console.log("TF:", tf);           // "4h" olmalı
console.log("Candles:", candles.length); // ≥ 50 olmalı
```

### MTF Drawer Açılmıyor?

**Kontrol:**
1. Sembol gerçekten değişti mi?
2. Veriler yüklendi mi?

**Çözüm:**
```javascript
// Sembol değiştirin:
BTCUSDT → ETHUSDT
// 1-2 saniye bekleyin
// MTF drawer otomatik açılmalı
```

### Destek/Direnç Uyarısı Yok?

**Kontrol:**
1. 4h seçili mi?
2. S/R seviyeleri chart'ta var mı?
3. Fiyat seviyeye %0.5'ten daha yakın mı?

---

## 📈 Gelecek Özellikler

### Planlananlar

1. **Akıllı Bildirimler**
   - E-posta bildirimi
   - Telegram/Discord entegrasyonu
   - Özel uyarı kuralları

2. **AI Önerileri**
   - GPT-4 piyasa analizi
   - Otomatik strateji önerisi
   - Risk/reward hesaplama

3. **Otomatik Trading**
   - Paper trading simülasyonu
   - Real trading API
   - Risk yönetimi

---

## ✅ ÖZET

**Artık Sistem Tamamen Otomatik:**

✅ **4 saatlik** zaman dilimi ile başlar
✅ **Hacim patlamaları** otomatik tespit edilir
✅ **Alert drawer** otomatik açılır
✅ **MTF analizi** sembol değişince gösterilir
✅ **Destek/direnç** uyarıları gerçek zamanlı
✅ **+ butonu** tıklamaya gerek yok
✅ **Gerçek veriler** ile kusursuz çalışır

**Tek Yapmanız Gereken:**
Chart'ı açın ve izleyin. Sistem geri kalanını halleder! 🚀

---

**🎉 Trading Artık Daha Kolay!**

URL: http://localhost:3001/charts
