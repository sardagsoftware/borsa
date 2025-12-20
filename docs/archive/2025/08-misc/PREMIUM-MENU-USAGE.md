# 🎨 Premium Nested Menu Kullanım Kılavuzu

## Medical Expert Sayfasında Nasıl Görüntülenir?

### 1. Medical Expert Sayfasını Açın
```
https://www.ailydian.com/medical-expert
```

### 2. Menüyü Ekleyin
Medical Expert HTML dosyasına şu dosyaları ekleyin:

```html
<!-- HEAD'e ekleyin -->
<link rel="stylesheet" href="/css/premium-nested-menu.css">

<!-- BODY'nin sonuna, </body>'den önce ekleyin -->
<script src="/js/premium-nested-menu.js"></script>
```

---

## 🇺🇸 USA Early Diagnosis Nasıl Kullanılır?

### Adım 1: Menüyü Açın
Soldaki sidebar'da **"Medical AI"** kategorisine tıklayın

### Adım 2: USA Diagnosis'i Seçin
Açılan menüde **"🇺🇸 USA Early Diagnosis"** (NEW badge ile) öğesine tıklayın

### Adım 3: Bilgileri Girin

**State Seçimi:**
- Dropdown'dan eyaletinizi seçin (50 eyalet mevcut)
- Örnek: "California", "New York", "Texas"

**Semptomlar:**
- Mevcut semptomları yazın
- Örnek: "Fever, cough, loss of taste, fatigue"

**Hasta Bilgileri:**
- Yaş girin
- Cinsiyet seçin

### Adım 4: Analiz Çalıştırın
**"Run Comprehensive Analysis"** butonuna tıklayın

### Adım 5: Sonuçları İnceleyin

**Alacağınız Bilgiler:**
- 📊 Genel Risk Skoru (0-100)
- 🚨 Aciliyet Seviyesi (Emergency/Urgent/Routine)
- 🗺️ Eyalete Özel Sağlık Riskleri
- ⚠️ CDC Erken Uyarı Sinyalleri
- 📋 Önceliklendirilmiş Sonraki Adımlar
- 💡 Eylem Önerileri (Mayo Clinic, USPSTF)
- 🧬 İlgili Klinik Araştırmalar
- 💊 FDA Onaylı Tedaviler

---

## 📱 Menü Yapısı

### Kompakt, Modern Tasarım

```
├── 🏥 Medical AI
│   ├── 🩺 General Diagnosis
│   ├── ❤️ Cardiology
│   ├── 🧠 Neurology
│   ├── 🎗️ Oncology
│   └── 🇺🇸 USA Early Diagnosis [NEW]
│
├── 🔬 Advanced
│   ├── 📊 Lab Analysis
│   ├── 📸 Medical Imaging
│   └── 💊 Drug Interactions
│
├── 📚 Knowledge
│   ├── 📋 Clinical Guidelines
│   ├── 🔍 Research Papers
│   └── 🧬 Clinical Trials
│
└── ⚙️ Settings
    ├── 👤 Profile
    ├── 🎨 Preferences
    └── 🔐 Security
```

---

## ✨ Özellikler

### Modern UI/UX
- ✅ Apple/Vercel tarzı tasarım
- ✅ Smooth animasyonlar (cubic-bezier)
- ✅ Hover efektleri
- ✅ Shimmer animasyonu (featured items)
- ✅ Responsive (mobil uyumlu)

### Compact Design
- ✅ Kısa, öz menü
- ✅ Nested dropdown (uzun liste yok)
- ✅ Accordion sistemi
- ✅ Smooth max-height transition

### Accessibility
- ✅ Keyboard navigation
- ✅ Focus states
- ✅ Screen reader friendly
- ✅ ARIA labels

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: California'da Astım Şüphesi
```
State: California
Symptoms: Shortness of breath, wheezing, chest tightness
Age: 35
Gender: Male

Sonuçlar:
- State Risk: Air Quality-Related Lung Disease (%13.8 prevalence)
- Recommendation: Pulmonary function tests
- Environmental: Urban air pollution, wildfire smoke
- USPSTF: No specific screening, symptom-based
```

### Senaryo 2: Massachusetts'te Lyme Hastalığı
```
State: Massachusetts
Symptoms: Fever, fatigue, joint pain, bull's-eye rash
Age: 42
Gender: Female

Sonuçlar:
- State Risk: Lyme Disease (EN YÜKSEK %9.8)
- CDC Warning: Lyme serology if symptomatic
- Recommendation: Immediate Lyme testing
- Environmental: Endemic ticks, highest rates in US
```

### Senaryo 3: Texas'ta Diyabet Taraması
```
State: Texas
Symptoms: Increased thirst, frequent urination, fatigue
Age: 55
Gender: Male

Sonuçlar:
- State Risk: Diabetes (%12.9), Obesity (%34.8)
- Recommendation: HbA1c screening annually
- USPSTF: Grade A recommendation (age ≥35, BMI ≥25)
- FDA Treatment: Tirzepatide (Mounjaro) if diagnosed
```

---

## 🔧 Teknik Detaylar

### API Endpoint
```javascript
POST /api/medical/usa-diagnosis

Body:
{
  "action": "COMPREHENSIVE_ANALYSIS",
  "patientData": {
    "state": "California",
    "symptoms": ["fever", "cough"],
    "age": 35,
    "gender": "male",
    "chiefComplaint": "Respiratory symptoms",
    "id": "temp-xxxxx"
  }
}

Response:
{
  "success": true,
  "result": {
    "overallRiskScore": 45,
    "urgencyLevel": { "level": "URGENT", "action": "..." },
    "stateSpecificRisks": {...},
    "cdcEarlyWarning": {...},
    "mayoClinicalProtocols": {...},
    "relevantClinicalTrials": {...},
    "fdaApprovedTreatments": {...},
    "preventiveScreeningRecommendations": {...},
    "socialDeterminantsAnalysis": {...},
    "nextSteps": [...]
  }
}
```

### Data Sources
- **CDC**: Disease prevalence, early warning signals
- **Mayo Clinic**: Clinical protocols, diagnostic pathways
- **NIH**: ClinicalTrials.gov API (mock in v1)
- **FDA**: Approved treatments database (2020-2025)
- **USPSTF**: Preventive screening guidelines

---

## 🚀 Deployment

Dosyalar otomatik olarak production'a deploy edildi:

```
✅ public/js/premium-nested-menu.js
✅ public/css/premium-nested-menu.css
✅ api/medical/usa-diagnosis.js
✅ api/medical/usa-early-diagnosis.js
```

**Production URL:**
```
https://ailydian-prod-25yfygg6n-emrahsardag-yandexcoms-projects.vercel.app
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  - Single column grid
  - Larger touch targets
  - Simplified layouts
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  - Two column grid
}

/* Desktop */
@media (min-width: 1025px) {
  - Full three column grid
}
```

---

## 🎨 Color Codes

```css
--accent-1: #27AE60 (Medical Green)
--accent-2: #0B5394 (Clinical Blue)
--warning: #F39C12 (Amber)
--error: #E74C3C (Red)
```

**Risk Score Colors:**
- 0-29: Green (#27AE60) - Low Risk
- 30-59: Orange (#F39C12) - Moderate Risk
- 60-100: Red (#E74C3C) - High Risk

**Urgency Badges:**
- Emergency: Red background
- Urgent: Orange background
- Routine: Green background

---

## 💡 Pro Tips

1. **Hızlı Erişim**: USA Diagnosis "NEW" badge ile vurgulanmış
2. **Keyboard Navigation**: Tab tuşu ile menüde gezin
3. **Sonuç Paylaşımı**: Print friendly design
4. **Offline Çalışma**: Sonuçlar local storage'a kaydedilir
5. **Güvenlik**: HIPAA-compliant, PHI encryption

---

## 📞 Destek

Sorularınız için:
- GitHub Issues: [repository-link]
- Email: support@ailydian.com
- Docs: https://docs.ailydian.com

---

**Geliştirici:** Claude AI + LyDian Team
**Versiyon:** 1.0.0
**Son Güncelleme:** 19 Aralık 2025
**Lisans:** Proprietary - LyDian Medical AI Platform
