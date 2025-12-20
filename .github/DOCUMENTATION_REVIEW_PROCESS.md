# 📋 AYLIK DOKÜMANTASYON REVIEW SÜRECİ

> **Amaç:** Dokümantasyonun güncel, doğru ve kullanışlı kalmasını sağlamak
> **Frekans:** Aylık (Her ayın ilk haftası)
> **Sorumlular:** Documentation Team + Core Developers

---

## 🎯 REVIEW SÜRECİ GENEL BAKIŞ

### Review Döngüsü
```
1. Hazırlık (1. Gün)
   ↓
2. İnceleme (2-4. Günler)
   ↓
3. Güncelleme (5-6. Günler)
   ↓
4. Doğrulama (7. Gün)
   ↓
5. Yayınlama ve Arşivleme
```

---

## 📅 AYLIK TAKVİM

### Her Ayın İlk Haftası (1-7 Aralık, 1-7 Ocak, vs.)

| Gün | Aktivite | Sorumlular | Süre |
|-----|----------|------------|------|
| 1 | Review toplantısı planla | Doc Lead | 30 dk |
| 2 | Mevcut dokümanları incele | Tüm ekip | 2 saat |
| 3 | Güncellemeleri belirle | Core Team | 2 saat |
| 4 | Eski içeriği arşivle | Doc Team | 1 saat |
| 5 | Yeni içerik yaz/güncelle | Writers | 3 saat |
| 6 | Peer review | Reviewers | 2 saat |
| 7 | Final approval ve publish | Doc Lead | 1 saat |

---

## ✅ REVIEW KONTROL LİSTESİ

### 1️⃣ DOĞRULUK KONTROLÜ

#### API Dokümantasyonu
- [ ] Tüm endpoint'ler aktif ve çalışıyor mu?
- [ ] Request/response örnekleri doğru mu?
- [ ] HTTP status code'lar güncel mi?
- [ ] Rate limit bilgileri değişmiş mi?

#### Kod Örnekleri
- [ ] Kod örnekleri çalışıyor mu?
- [ ] Syntax highlighting doğru mu?
- [ ] Deprecated kod var mı?
- [ ] Versiyonlar güncel mi?

#### Konfigürasyon
- [ ] Environment variable'lar doğru mu?
- [ ] Port numaraları güncel mi?
- [ ] Database connection string'ler doğru mu?

### 2️⃣ TAZELIK KONTROLÜ

- [ ] Son deployment notları eklendi mi?
- [ ] Yeni özellikler dokümante edildi mi?
- [ ] Breaking changes belgelendi mi?
- [ ] Migration guide'lar hazır mı?

### 3️⃣ KULLANILABILIRLIK KONTROLÜ

- [ ] Link'ler kırık değil mi?
- [ ] Görseller yükleniyor mu?
- [ ] İçindekiler (TOC) güncel mi?
- [ ] Arama fonksiyonu çalışıyor mu?

### 4️⃣ TUTARLILIK KONTROLÜ

- [ ] Terminoloji tutarlı mı?
- [ ] Format standardlara uygun mu?
- [ ] Başlıklar hiyerarşik mi?
- [ ] Stil rehberine uygun mu?

---

## 📊 REVIEW KATEGORİLERİ

### 🟢 Yüksek Öncelik (Kritik)
**İnceleme:** Ayda 1 kez, detaylı

- `docs/current/setup-guides/` - Kurulum rehberleri
- `docs/current/api-docs/` - API dökümanları
- `docs/current/security/` - Güvenlik dökümanları
- `DOCUMENTATION-INDEX.md` - Ana index
- `README.md` - Proje README'si

### 🟡 Orta Öncelik
**İnceleme:** 2 ayda 1 kez

- `docs/current/architecture/` - Mimari dökümanlar
- `docs/current/user-guides/` - Kullanıcı rehberleri
- `docs/wiki/` - Wiki sayfaları
- `CHANGELOG.md` - Versiyon notları

### 🔵 Düşük Öncelik
**İnceleme:** 3 ayda 1 kez

- `docs/archive/` - Arşiv dökümanlar (sadece organizasyon)
- `docs/tutorials/` - Tutorial planları
- Blog posts ve makaleler

---

## 🔄 GÜNCELLEME PROSEDÜRÜ

### Adım 1: Mevcut Durumu Analiz Et
```bash
# Tüm dökümanları tarih sırasına göre listele
find docs/current -name "*.md" -exec ls -lt {} \; | head -20

# Son değişiklikleri kontrol et
git log --since="1 month ago" --name-only -- docs/
```

### Adım 2: Güncelleme Gerekenleri Belirle
```markdown
## Güncelleme Listesi - [Ay/Yıl]

### Kritik Güncellemeler
- [ ] API endpoint değişiklikleri
- [ ] Security patch dökümanları
- [ ] Breaking changes

### İyileştirmeler
- [ ] Daha net açıklamalar
- [ ] Yeni örnekler
- [ ] Screenshot güncellemeleri
```

### Adım 3: Branch Oluştur
```bash
git checkout -b docs/monthly-review-YYYY-MM
```

### Adım 4: Güncellemeleri Yap
- Dokümanları düzenle
- Yeni içerik ekle
- Eski içeriği arşivle

### Adım 5: PR Oluştur
```bash
git add docs/
git commit -m "📚 Monthly documentation review - [Month YYYY]"
git push origin docs/monthly-review-YYYY-MM
```

### Adım 6: Peer Review
- En az 2 kişi inceleme yapsın
- Feedback'leri uygula
- Approve al

### Adım 7: Merge ve Deploy
```bash
git checkout main
git merge docs/monthly-review-YYYY-MM
git push origin main
```

---

## 📈 METRİKLER VE KPI'LAR

### Takip Edilecek Metrikler

| Metrik | Hedef | Ölçüm |
|--------|-------|-------|
| Dokümantasyon güncellik oranı | >90% | Son 30 günde değişen docs / Toplam |
| Kırık link sayısı | 0 | Automated link checker |
| Kullanıcı memnuniyeti | >4.5/5.0 | Survey feedback |
| Ortalama sayfa görüntüleme | >100/ay | Analytics |
| Arama başarı oranı | >80% | Search analytics |

### Aylık Rapor Template
```markdown
# Dokümantasyon Review Raporu - [Ay YYYY]

## Özet
- Toplam incelenen dosya: X
- Güncellenen dosya: Y
- Arşivlenen dosya: Z
- Yeni eklenen: W

## Yapılan Değişiklikler
1. ...
2. ...

## Bulunan Sorunlar
1. ...
2. ...

## Sonraki Ay Planı
1. ...
2. ...

## Metrikler
- Güncellik: %XX
- Kırık link: X adet
- User satisfaction: X/5.0
```

---

## 🤖 OTOMATİZASYON

### Otomatik Kontroller (CI/CD)

```yaml
# .github/workflows/docs-check.yml
name: Documentation Check

on:
  schedule:
    - cron: '0 9 1 * *'  # Her ayın 1'i, 09:00
  pull_request:
    paths:
      - 'docs/**'

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check for broken links
        uses: gaurav-nelson/github-action-markdown-link-check@v1

      - name: Check file freshness
        run: |
          find docs/current -name "*.md" -mtime +90 -ls

      - name: Spell check
        uses: rojopolis/spellcheck-github-actions@v0
```

### Link Checker Script
```bash
#!/bin/bash
# scripts/check-doc-links.sh

echo "🔍 Checking documentation links..."

find docs/ -name "*.md" -exec markdown-link-check {} \;

if [ $? -eq 0 ]; then
    echo "✅ All links are valid!"
else
    echo "❌ Broken links found!"
    exit 1
fi
```

---

## 👥 ROLLER VE SORUMLULUKLAR

### Documentation Lead
- ✅ Review sürecini koordine eder
- ✅ Final approval verir
- ✅ Metrikleri takip eder
- ✅ Aylık raporları hazırlar

### Core Developers
- ✅ Teknik doğruluğu kontrol eder
- ✅ API değişikliklerini dokümante eder
- ✅ Code example'ları test eder

### Technical Writers
- ✅ İçerik güncellemelerini yapar
- ✅ Yeni döküman yazımı
- ✅ Stil ve format kontrolü

### QA Team
- ✅ Tutorial'ları test eder
- ✅ Setup guide'ları doğrular
- ✅ Screenshot güncellemelerini yapar

---

## 📝 ARŞİVLEME POLİTİKASI

### Ne Zaman Arşivlenir?

1. **Outdated Content** (>6 ay güncel değil)
   - Eski versiyonlara ait dökümanlar
   - Deprecated feature dökümanları
   - Artık kullanılmayan API'ler

2. **Duplicate Content**
   - Tekrar eden bilgiler
   - Birleştirilmiş dökümanlar

3. **Historical Records**
   - Eski deployment raporları
   - Geçmiş sprint notları
   - Tamamlanmış proje dökümanları

### Arşivleme Prosedürü
```bash
# 1. Dosyayı arşiv klasörüne taşı
mv docs/current/old-doc.md docs/archive/2025/08-misc/

# 2. Index'ten kaldır
# DOCUMENTATION-INDEX.md dosyasını güncelle

# 3. Redirect ekle (opsiyonel)
echo "Bu döküman arşivlendi: [Yeni konum](../archive/...)" > old-location.md

# 4. Commit
git add .
git commit -m "📦 Archive outdated documentation"
```

---

## 🎯 BAŞARI KRİTERLERİ

### Aylık Hedefler
- ✅ Tüm kritik dökümanlar incelendi
- ✅ 0 kırık link
- ✅ Tüm API dökümanları güncel
- ✅ Kullanıcı feedback'leri değerlendirildi
- ✅ Aylık rapor hazırlandı

### Üç Aylık Hedefler
- ✅ >95% güncellik oranı
- ✅ Yeni tutorial videoları eklendi
- ✅ Wiki sayfaları genişletildi
- ✅ User satisfaction >4.5/5.0

---

## 📞 İLETİŞİM VE FEEDBACK

### Dokümantasyon Sorunları İçin
- 📧 **Email:** docs@ailydian.com
- 💬 **Discord:** #documentation kanalı
- 🐛 **GitHub:** Issue açın (label: documentation)

### Feedback Formu
https://forms.ailydian.com/docs-feedback

---

## 📚 KAYNAKLAR

- [Markdown Style Guide](https://www.markdownguide.org/)
- [Technical Writing Best Practices](https://developers.google.com/tech-writing)
- [Documentation Tools](https://github.com/collections/documentation)

---

**Son Güncelleme:** 20 Aralık 2025
**Sonraki Review:** 1-7 Ocak 2026
**Versiyon:** 1.0.0
**Durum:** ✅ Aktif
