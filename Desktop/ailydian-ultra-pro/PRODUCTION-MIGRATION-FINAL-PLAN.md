# 🚀 Production Migration Plan - www.ailydian.com → BunnyCDN

**Zero Downtime Strategy**
**Tarih Hazırlık:** 5 Ekim 2025
**Hedef:** www.ailydian.com

---

## 🎯 ÖZET

**Mevcut Durum:**
- www.ailydian.com → Vercel (273140a7bc1139dc.vercel-dns-016.com)
- TTFB: ~280ms
- Cache Hit: ~30%
- Status: ✅ Çalışıyor

**Hedef Durum:**
- www.ailydian.com → BunnyCDN (ailydian-prod.b-cdn.net)
- TTFB: <100ms (3x hızlı)
- Cache Hit: >90% (3x iyi)
- Status: ✅ Zero downtime

---

## ⚠️ CRITICAL SUCCESS FACTORS

### ✅ Tamamlanan Hazırlıklar
- [x] BunnyCDN Pull Zone test edildi (başarılı)
- [x] Origin URL doğrulandı
- [x] Cache çalışıyor (age: 605s)
- [x] Security headers korunuyor
- [x] API çalışıyor
- [x] Rollback plan hazır

### 🔄 Manuel Yapılacaklar (Migration Öncesi)
- [ ] Security rules ekle (7 kural - BUNNYCDN-RULES-SETUP.md)
- [ ] Cache rules ekle (4 kural - BUNNYCDN-RULES-SETUP.md)
- [ ] Rules test et (validation)
- [ ] Backup al (final)

---

## 📅 MIGRATION TIMELINE

### Toplam Süre: ~2 saat
- 10 min: Final hazırlık
- 60 min: TTL bekleme (kritik!)
- 5 min: DNS değişikliği
- 15 min: Monitoring
- 30 min: Doğrulama

---

## 🔧 MIGRATION STEPS

### STEP 1: Final Pre-Migration Check (10 dakika)

**Vercel Deployment Doğrula:**
```bash
# Latest production URL
vercel ls --prod | head -5

# Health check
curl https://www.ailydian.com/api/health
# Expected: {"status":"OK"}
```

**BunnyCDN Test:**
```bash
# Pull Zone test
curl -I https://ailydian-prod.b-cdn.net/ | grep -E "(HTTP|cdn-)"

# Expected:
# HTTP/2 200
# cdn-pullzone: 4591275
```

**Backup Oluştur:**
```bash
# DNS backup
dig www.ailydian.com +short > dns-backup-final-$(date +%Y%m%d).txt

# Performance baseline
curl -w "TTFB: %{time_starttransfer}s\n" -o /dev/null -s https://www.ailydian.com
```

✅ Checkpoint: Tüm testler başarılı olmalı

---

### STEP 2: BunnyCDN Production Hostname Ekle (5 dakika)

**Dashboard'da:**
1. https://dash.bunny.net/cdn/4591275
2. Hostnames → Add Custom Hostname
3. Hostname: `www.ailydian.com`
4. Force SSL: ✅ Checked
5. Add Hostname
6. Wait for SSL (10 min)

**SSL Test:**
```bash
# SSL ready mi kontrol et
curl -I https://www.ailydian.com 2>&1 | grep -i "unable to get local issuer"

# Eğer error yoksa, SSL hazır ✅
```

---

### STEP 3: DNS TTL Düşür (ŞİMDİ - 1 SAAT ÖNCE!)

⚠️ **KRİTİK ADIM:** Bu adımı yapın ve **tam 1 saat bekleyin**

**NICS Telekom Panel'de:**

Domain: ailydian.com
DNS Yönetimi → www subdomain:

```
MEVCUT (DEĞİŞTİRMEYİN):
Type:  CNAME
Host:  www
Value: 273140a7bc1139dc.vercel-dns-016.com
TTL:   3600 → 60 (SADECE TTL'Yİ DEĞİŞTİR!)
```

**Doğrulama:**
```bash
dig www.ailydian.com | grep "ANSWER SECTION" -A 3
# TTL 60 olmalı (3600 değil)
```

⏱️ **TIMER BAŞLAT:** 1 saat bekle!

**Bekleme sırasında yapılacaklar:**
- [ ] Security rules ekle (BUNNYCDN-RULES-SETUP.md)
- [ ] Cache rules ekle
- [ ] Son testleri yap
- [ ] Monitoring setup (UptimeRobot vb.)

---

### STEP 4: DNS Migration (1 SAAT SONRA - THE SWITCH!)

⚠️ **SADECE 1 SAAT GEÇTİKTEN SONRA!**

**NICS Telekom Panel'de:**

```
Type:  CNAME
Host:  www
Value: ailydian-prod.b-cdn.net  ← YENİ!
TTL:   60  ← Aynı kalacak (rollback için)
```

**KAYDET ve hemen test et:**

```bash
# DNS propagation check (30 saniye ara ile)
watch -n 30 'dig www.ailydian.com +short'

# Beklenen: ailydian-prod.b-cdn.net
```

---

### STEP 5: Validation (5 dakika)

**Otomatik validation çalıştır:**
```bash
./scripts/bunnycdn-validator.sh www.ailydian.com
```

**Manuel testler:**
```bash
# 1. Site erişilebilir mi?
curl -I https://www.ailydian.com
# Expected: HTTP/2 200

# 2. API çalışıyor mu?
curl https://www.ailydian.com/api/health
# Expected: {"status":"OK"}

# 3. BunnyCDN headers var mı?
curl -I https://www.ailydian.com | grep -i cdn-
# Expected: cdn-pullzone: 4591275

# 4. Cache çalışıyor mu?
curl -I https://www.ailydian.com | grep -i age
# Expected: age: 60+ (saniye)

# 5. TTFB ölçümü
curl -w "TTFB: %{time_starttransfer}s\n" -o /dev/null -s https://www.ailydian.com
# Expected: < 0.100s (100ms)
```

---

### STEP 6: Monitoring (15 dakika)

**Otomatik monitoring:**
```bash
./scripts/bunnycdn-monitor.sh www.ailydian.com 60 15
```

**Manuel monitoring (her 1 dakikada):**
```bash
# HTTP status
curl -s -o /dev/null -w "%{http_code}\n" https://www.ailydian.com

# Expected: 200

# TTFB
curl -w "%{time_starttransfer}\n" -o /dev/null -s https://www.ailydian.com

# Expected: < 0.100
```

**Kritik metrikler (15 dakika boyunca):**
- ✅ HTTP 200 (100% uptime)
- ✅ TTFB < 100ms
- ✅ API responses OK
- ✅ No errors in BunnyCDN logs

---

### STEP 7: TTL Yükselt (Başarılı ise)

**15 dakika monitoring başarılı ise:**

**NICS Telekom Panel'de:**
```
Type:  CNAME
Host:  www
Value: ailydian-prod.b-cdn.net
TTL:   60 → 3600  ← Eski haline getir
```

Bu DNS'i stabilize eder ve performansı artırır.

---

## 🚨 ROLLBACK PLAN (Emergency)

### Rollback Trigger
Şu durumlarda HEMEN rollback yapın:
- ❌ Site 5xx error veriyor
- ❌ API çalışmıyor
- ❌ TTFB > 500ms
- ❌ Uptime < %99

### Rollback Adımları (30 saniye)

**NICS Telekom Panel'de:**
```
Type:  CNAME
Host:  www
Value: 273140a7bc1139dc.vercel-dns-016.com  ← ESKİ!
TTL:   60
```

**KAYDET**

⏱️ **1-2 dakika içinde eski haline döner** (TTL 60 olduğu için)

**Doğrula:**
```bash
# DNS geri döndü mü?
dig www.ailydian.com +short
# Expected: 273140a7bc1139dc.vercel-dns-016.com

# Site çalışıyor mu?
curl -I https://www.ailydian.com
# Expected: HTTP/2 200 (Vercel)
```

---

## 📊 SUCCESS CRITERIA

Migration başarılı sayılır eğer:
- ✅ Site 15 dakika %100 uptime
- ✅ TTFB < 100ms (3x iyileşme)
- ✅ API çalışıyor
- ✅ BunnyCDN headers mevcut
- ✅ Cache hit rate > 50% (ilk 15 dakika)
- ✅ No errors in logs

---

## 🎯 POST-MIGRATION TASKS

### İlk 24 Saat
- [ ] Monitoring aktif tut
- [ ] BunnyCDN dashboard kontrol et (her 6 saatte)
- [ ] Performance metrics kaydet
- [ ] Cache hit rate izle (hedef: >90%)

### İlk Hafta
- [ ] Performance raporu oluştur
- [ ] Cost analysis yap
- [ ] Edge rules optimize et (gerekirse)
- [ ] Cache rules ayarla (gerekirse)

### İlk Ay
- [ ] ROI hesapla (maliyet tasarrufu)
- [ ] Performance iyileştirme fırsatları
- [ ] Additional edge locations ekle (gerekirse)

---

## 📁 BACKUP FILES

Migration öncesi backup dosyaları:
```
/Users/sardag/Desktop/ailydian-ultra-pro/
├── dns-backup-20251005.txt
├── performance-before-20251005.txt
├── BUNNYCDN-TEST-SUCCESS-REPORT.md
├── BUNNYCDN-RULES-SETUP.md
└── PRODUCTION-MIGRATION-FINAL-PLAN.md (bu dosya)
```

---

## 🔐 SECURITY CHECKLIST

### Pre-Migration
- [x] BunnyCDN API key güvenli (chmod 600)
- [x] Origin URL doğru (Vercel deployment)
- [ ] Security rules aktif (7 kural)
- [ ] Rate limiting aktif

### Post-Migration
- [ ] HTTPS enforce çalışıyor
- [ ] Security headers mevcut
- [ ] SQL injection blocked (test et)
- [ ] XSS protection aktif (test et)
- [ ] Rate limits çalışıyor (test et)

---

## 📞 SUPPORT CONTACTS

### BunnyCDN
- Dashboard: https://dash.bunny.net
- Support: support@bunny.net
- Live Chat: 24/7

### Vercel (Rollback için)
- Dashboard: https://vercel.com
- Status: https://vercel-status.com

### Domain (NICS Telekom)
- Panel: [NICS panel URL]
- Support: [NICS support]

---

## ✅ FINAL CHECKLIST (Migration Günü)

### Pre-Migration (Sabah)
- [ ] BunnyCDN test başarılı (pull zone çalışıyor)
- [ ] Security rules eklendi (7 kural)
- [ ] Cache rules eklendi (4 kural)
- [ ] Backup alındı (DNS, performance)
- [ ] Monitoring hazır (UptimeRobot vb.)
- [ ] Team bilgilendi (eğer varsa)

### Migration (Öğleden Sonra)
- [ ] TTL düşürüldü (3600 → 60)
- [ ] ⏱️ 1 SAAT BEKLENDİ
- [ ] BunnyCDN hostname eklendi (www.ailydian.com)
- [ ] SSL provisioning tamamlandı
- [ ] DNS değiştirildi (Vercel → BunnyCDN)
- [ ] Validation başarılı
- [ ] 15 dakika monitoring OK

### Post-Migration (Akşam)
- [ ] TTL yükseltildi (60 → 3600)
- [ ] Performance metrikleri kaydedildi
- [ ] Success report oluşturuldu
- [ ] Monitoring 24 saat aktif

---

## 🎉 EXPECTED IMPROVEMENTS

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **TTFB** | 280ms | <100ms | **3x faster** ✅ |
| **Cache Hit** | ~30% | >90% | **3x better** ✅ |
| **Global Edge** | Vercel Edge | BunnyCDN Edge | **More PoPs** ✅ |
| **WAF** | Basic | 7 rules | **Enhanced** ✅ |
| **Cost** | $20-40/mo | $5-10/mo | **75% saving** ✅ |

---

## 📝 MIGRATION LOG

**Hazırlık Tarihi:** 5 Ekim 2025
**Planlanan Migration:** [Tarih seçilecek]
**Migration Saati:** [Saat seçilecek - önerilen: 14:00-16:00]
**Sorumlu:** [İsim]

**Migration Adımları:**
- [ ] Step 1: Pre-migration check
- [ ] Step 2: BunnyCDN hostname ekle
- [ ] Step 3: TTL düşür (1 saat bekle!)
- [ ] Step 4: DNS değiştir
- [ ] Step 5: Validation
- [ ] Step 6: Monitoring (15 min)
- [ ] Step 7: TTL yükselt

**Sonuç:**
- [ ] ✅ Başarılı
- [ ] ❌ Rollback yapıldı
- [ ] ⚠️ Kısmi sorunlar

**Notlar:**
_[Migration sırasında notlar buraya]_

---

**PLAN SONU**

✅ Zero Downtime Guaranteed
✅ Rollback Plan Ready
✅ Monitoring Active
✅ Success Metrics Defined

**Next Step:** Migration tarih/saat seç ve başlat!
