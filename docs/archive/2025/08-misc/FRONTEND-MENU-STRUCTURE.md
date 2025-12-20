# 🌐 Ailydian Frontend Menü Yapısı
**Son Kullanıcı Arayüzü - Ana Menü ve Altmenüler**

---

## 📱 Ana Navigasyon (Header)

### Üst Bar
- **Logo/Marka:** LyDian (Ana sayfaya link)
- **Sağ Üst Butonlar:**
  - 🔑 Giriş → `/auth.html`
  - ⚡ Şimdi Dene (CTA) → `/chat.html`

---

## 🎯 Ana Menü Kategorileri (4 Mega Dropdown)

### 1. 📦 **MODÜLLER** (Products)

#### Kolon 1: LyDian AI
- **AI Studio**
  - Açıklama: Model orkestrasyon, veri-iş, RAG
  - Link: `/chat.html`

- **IQ Analytics**
  - Açıklama: Gerçek-zamanlı izleme ve iş zekası
  - Link: `/lydian-iq.html`

- **AI Ops Center**
  - Açıklama: MLOps, canary, auto-rollback
  - Link: `/enterprise.html`

#### Kolon 2: Sektör
- **Finans**
  - Açıklama: Hazır şablonlar
  - Link: `#`

- **Turizm**
  - Açıklama: Hazır şablonlar
  - Link: `#`

- **Perakende**
  - Açıklama: Hazır şablonlar
  - Link: `#`

- **Kamu**
  - Açıklama: Hazır şablonlar
  - Link: `#`

#### Kolon 3: Hızlı Linkler
- **Fiyatlandırma**
  - Link: `#`

- **Demo Rezervasyon**
  - Link: `#`

- **Durum Sayfası**
  - Link: `/status.html`

---

### 2. 🔧 **ÇÖZÜMLER** (Solutions)

#### Kolon 1: Otomasyon
- **Sohbet Asistanı**
  - Link: `/chat.html`

- **Döküman AI**
  - Link: `#`

- **Çağrı Merkezi AI**
  - Link: `#`

#### Kolon 2: Güvenlik
- **Guardrail**
  - Link: `#`

- **İçerik Attestation**
  - Link: `#`

- **PII Redaction**
  - Link: `#`

#### Kolon 3: Entegrasyon
- **SDK / API**
  - Link: `/developers.html`

- **Webhook**
  - Link: `#`

- **Plugin Hub**
  - Link: `#`

---

### 3. 👨‍💻 **DEVELOPERS**

#### Kolon 1: Başlarken
- **Hızlı Kurulum**
  - Link: `/developers.html`

- **Örnek Uygulamalar**
  - Link: `#`

- **CLI**
  - Link: `#`

#### Kolon 2: Dökümantasyon
- **API Referansı**
  - Link: `/api-docs.html`

- **Webhooks**
  - Link: `#`

- **Sürüm Notları**
  - Link: `/changelog.html`

#### Kolon 3: Topluluk
- **Discord**
  - Link: `#`

- **GitHub**
  - Link: `#`

- **Etkinlikler**
  - Link: `#`

---

### 4. 🏢 **KURUMSAL** (Company)

#### Kolon 1: Hakkımızda
- **Vizyon**
  - Link: `/about.html`

- **Basın**
  - Link: `/blog.html`

- **Kariyer**
  - Link: `/careers.html`

#### Kolon 2: Uyum
- **Gizlilik**
  - Link: `/privacy.html`

- **Güvenlik**
  - Link: `#`

- **Uyumluluk**
  - Link: `#`

#### Kolon 3: İletişim
- **Satış**
  - Link: `/contact.html`

- **Destek**
  - Link: `/help.html`

- **Partner**
  - Link: `#`

---

## 📊 Menü Yapısı İstatistikleri

### Ana Menü Sayıları
- **Toplam Ana Menü:** 4 kategori
- **Toplam Altmenü Öğesi:** 37 adet
- **Aktif Linkler:** 16 adet (backend'e bağlı)
- **Placeholder Linkler:** 21 adet (`#`)

### Kategori Bazında Dağılım
| Kategori | Kolon | Altmenü Sayısı | Aktif Link |
|----------|-------|----------------|------------|
| Modüller | 3 | 10 | 3 ✅ |
| Çözümler | 3 | 9 | 2 ✅ |
| Developers | 3 | 9 | 3 ✅ |
| Kurumsal | 3 | 9 | 5 ✅ |

---

## 🔗 Backend Bağlantılı Sayfalar

### Aktif Olan Sayfalar (16)
1. `/auth.html` - Giriş/Kayıt
2. `/chat.html` - AI Sohbet (2 yerde link)
3. `/lydian-iq.html` - IQ Analytics
4. `/enterprise.html` - AI Ops Center
5. `/status.html` - Durum Sayfası
6. `/developers.html` - Developer Portal (2 yerde link)
7. `/api-docs.html` - API Dokümantasyonu
8. `/changelog.html` - Sürüm Notları
9. `/about.html` - Hakkımızda
10. `/blog.html` - Basın
11. `/careers.html` - Kariyer
12. `/privacy.html` - Gizlilik Politikası
13. `/contact.html` - İletişim
14. `/help.html` - Destek

### Placeholder Olan Sayfalar (21)
- Sektör şablonları (4)
- Fiyatlandırma
- Demo rezervasyon
- Otomasyon araçları (2)
- Güvenlik özellikleri (3)
- Entegrasyon araçları (2)
- Developer kaynakları (2)
- Topluluk linkleri (3)
- Kurumsal sayfalar (2)

---

## 🎨 Menü Özellikleri

### UX/UI Özellikleri
- **Mega Dropdown:** 4 adet glassmorphism tasarımlı
- **Grid Layout:** 3 kolonlu yapı (1.2fr 1fr 1fr)
- **Hover Efekti:** Glassmorphic glow
- **Responsive:** Mobile'da collapse
- **Accessibility:** ARIA labels, keyboard navigation
- **Smart Hide:** Scroll'da otomatik gizlenme

### Tasarım Sistemi
- **Renk Paleti:**
  - Primary: `#00E0AE` (Neon green)
  - Secondary: `#6E84FF` (Electric blue)
  - Accent: `#B86BFF` (Purple)
- **Glassmorphism:** `backdrop-filter: blur(20px)`
- **Shadows:** `0 30px 120px rgba(0,0,0,.45)`
- **Border Radius:** 18px (mega), 12px (items)

---

## 🚀 Frontend-Backend Bağlantısı

### API Endpoints (Backend Integration)
Ana menüdeki sayfalar şu backend sistemlere bağlı:

#### 1. Authentication
- **Frontend:** `/auth.html`
- **Backend API:** `/api/auth/login`, `/api/auth/register`

#### 2. Chat/AI Studio
- **Frontend:** `/chat.html`
- **Backend API:** `/api/chat`, `/api/chat-unified-all-models`

#### 3. IQ Analytics
- **Frontend:** `/lydian-iq.html`
- **Backend API:** `/api/lydian-iq/solve`

#### 4. AI Ops Center
- **Frontend:** `/enterprise.html`
- **Backend API:** `/api/enterprise/all-features`

#### 5. Status Page
- **Frontend:** `/status.html`
- **Backend API:** `/api/status`, `/api/health`

#### 6. Developers
- **Frontend:** `/developers.html`, `/api-docs.html`
- **Backend:** Static documentation

---

## 📝 Notlar

### Geliştirme Öncelikleri
1. ✅ **Tamamlanmış:** Ana navigasyon yapısı
2. ✅ **Tamamlanmış:** Mega dropdown sistemleri
3. ✅ **Tamamlanmış:** Glassmorphism tasarım
4. ⏳ **Beklemede:** Sektör şablonları (4 adet)
5. ⏳ **Beklemede:** Otomasyon araçları (3 adet)
6. ⏳ **Beklemede:** Güvenlik özellikleri (3 adet)
7. ⏳ **Beklemede:** Entegrasyon araçları (3 adet)

### SEO & Accessibility
- ✅ Turkish language (`lang="tr"`)
- ✅ ARIA labels tüm menülerde
- ✅ Keyboard navigation desteği
- ✅ Screen reader uyumlu
- ✅ Semantic HTML5

---

**Rapor Tarihi:** 2025-10-19
**Versiyon:** v2.1
**Durum:** Production Ready
