# 🗄️ NEO4J KNOWLEDGE GRAPH - KULLANIM REHBERİ

## ✅ KURULUM TAMAMLANDI!

```
✅ Neo4j AuraDB Instance: RUNNING
✅ Connection: Başarıyla test edildi
✅ Backend Service: /services/neo4j-knowledge-graph.js
✅ API Endpoints: /api/knowledge-graph/*
✅ Test Data: TCK 142 + Emsal Dava hazır
```

---

## 📋 HUKUK AI ARAYÜZÜNDE KULLANIM

### ✅ OTOMATİK KNOWLEDGE GRAPH ENTEGRASYONu (AKTİF!)

**lydian-legal-search.html** artık Knowledge Graph ile tamamen entegre! 🎯

**Nasıl Çalışıyor:**
1. Kullanıcı mesaj yazar (örn: "TCK 142 emsal kararları neler?")
2. Sistem otomatik olarak hukuk maddelerini algılar
3. Neo4j'den ilgili emsal kararları çeker
4. OX5C9E2B'e Knowledge Graph context'i ile gönderir
5. RAG-powered yanıt üretir

**Desteklenen Hukuk Sistemleri ve Madde Formatları:**

### 🇹🇷 Türk Hukuk Sistemi
- `TCK 142` → Türk Ceza Kanunu
- `BK 101` → Borçlar Kanunu
- `CMK 145` → Ceza Muhakemesi Kanunu
- `HMK 25` → Hukuk Muhakemeleri Kanunu
- `İİK 68` → İcra İflas Kanunu
- `AİHM 10` → Avrupa İnsan Hakları Sözleşmesi
- `TMK 4` → Türk Medeni Kanunu
- `4857 2`, `5237 142` → Kanun numarası + madde

### 🇺🇸 US Law
- `U.S.C. 18` → United States Code
- `CFR 42` → Code of Federal Regulations
- `Federal Register 123`

### 🇬🇧 UK Law
- `Act 2010` → UK Statutes
- `Statutory Instrument 2020`

### 🇩🇪 Deutsches Recht (German Law)
- `BGB § 242` → Bürgerliches Gesetzbuch (Civil Code)
- `StGB § 211` → Strafgesetzbuch (Criminal Code)
- `§ 123 ZPO` → Zivilprozessordnung

### 🇫🇷 Droit français (French Law)
- `Code civil Article 1382`
- `Code pénal Art. 121-1`

### 🇪🇸 Derecho español (Spanish Law)
- `Código Civil Artículo 1902`
- `CP Art. 138` → Código Penal

### 🇮🇹 Diritto italiano (Italian Law)
- `Codice Civile Articolo 2043`
- `C.P. Art. 575`

### 🇨🇳 中国法律 (Chinese Law)
- `刑法 第 232 条` → Criminal Law
- `民法典 第 1165 条` → Civil Code

### 🇯🇵 日本法 (Japanese Law)
- `民法 第 709 条` → Civil Code
- `刑法 第 199 条` → Criminal Code

### 🇸🇦 القانون السعودي (Saudi/Arabic Law)
- `نظام المعاملات المدنية المادة 78`
- `قانون الجزائي م. 12`

**Test Etmek İçin:**
```
1. http://localhost:3100/lydian-legal-search.html adresine git
2. "TCK 142 emsal kararları nedir?" diye sor
3. OX5C9E2B yanıtında Neo4j'den çekilen emsal kararları göreceksin!
```

---

### 1. **JavaScript ile Manuel Emsal Dava Arama** (Opsiyonel)

```javascript
// Hukuk AI arayüzünde (lydian-legal-search.html)
async function searchPrecedents(lawArticle) {
  try {
    const response = await fetch(`/api/knowledge-graph/precedents/${lawArticle}`);
    const data = await response.json();

    console.log('Emsal davalar:', data.precedents);

    // Örnek kullanım:
    data.precedents.forEach(precedent => {
      console.log(`📋 ${precedent.karar_no} - ${precedent.mahkeme}`);
      console.log(`   Sonuç: ${precedent.sonuc}`);
      console.log(`   Özet: ${precedent.ozet}`);
    });

  } catch (error) {
    console.error('Hata:', error);
  }
}

// Kullanım
searchPrecedents('TCK 142');
```

### 2. **İlişkili Hukuk Maddeleri Bulma**

```javascript
async function findRelated(lawArticle) {
  const response = await fetch(`/api/knowledge-graph/related/${lawArticle}`);
  const data = await response.json();

  data.related.forEach(article => {
    console.log(`🔗 ${article.kod}: ${article.baslik}`);
    console.log(`   Kategori: ${article.kategori}`);
  });
}

findRelated('TCK 142');
```

### 3. **RAG (Retrieval-Augmented Generation) Context**

```javascript
// OX5C9E2B'e göndermeden önce Knowledge Graph'tan context al
async function getRAGContext(userQuery) {
  const response = await fetch('/api/knowledge-graph/rag-context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: userQuery })
  });

  const { context } = await response.json();

  // Context'i OX5C9E2B prompt'una ekle
  const enhancedPrompt = `
    Context (Neo4j Knowledge Graph):
    ${JSON.stringify(context, null, 2)}

    Kullanıcı Sorusu: ${userQuery}

    Yukarıdaki context'i kullanarak cevap ver.
  `;

  // OX5C9E2B'e gönder
  const aiResponse = await sendToLyDian Core(enhancedPrompt);
  return aiResponse;
}
```

### 4. **Yeni Emsal Dava Ekleme**

```javascript
async function addPrecedent(lawArticle, precedentData) {
  const response = await fetch('/api/knowledge-graph/precedent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lawArticle: lawArticle,
      karar_no: '2024/5678',
      mahkeme: 'Anayasa Mahkemesi',
      tarih: '2024-03-15',
      sonuc: 'İhlal',
      ozet: 'İfade özgürlüğü ihlali tespit edildi'
    })
  });

  const result = await response.json();
  console.log('Emsal eklendi:', result);
}
```

---

## 🌐 MEVCUT TEST VERİSİ

```javascript
// Veritabanında şu an mevcut:
{
  "HukukMaddesi": [
    {
      "kod": "TCK 142",
      "baslik": "Hakaret",
      "kategori": "Kişilere Karşı Suçlar",
      "ceza": "3 aydan 2 yıla kadar hapis"
    },
    {
      "kod": "TCK 125",
      "baslik": "Hakaretin Kamuya Açık Ortamda İşlenmesi",
      "kategori": "Kişilere Karşı Suçlar"
    }
  ],

  "EmsalDava": [
    {
      "karar_no": "2023/1234",
      "mahkeme": "Yargıtay 4. Ceza Dairesi",
      "tarih": "2023-05-15",
      "sonuc": "Beraat",
      "ozet": "Sosyal medyada yapılan eleştirinin hakaret kapsamında değerlendirilmemesi"
    }
  ],

  "İlişkiler": [
    "TCK 142 ← ILISKILI_MADDE → TCK 125",
    "TCK 142 ← EMSAL_KARAR → Yargıtay 2023/1234"
  ]
}
```

---

## 🎯 HUKUK AI ENTEGRASYONU ÖRNEĞİ

**Kullanıcı sorusu:** "Hakaret suçunda emsal kararlar neler?"

```javascript
// 1. Önce Knowledge Graph'tan emsal al
const precedents = await fetch('/api/knowledge-graph/precedents/TCK%20142')
  .then(r => r.json());

// 2. Context'i OX5C9E2B prompt'una ekle
const prompt = `
Kullanıcı hakaret suçu hakkında soru soruyor.

İlgili Emsal Karar:
- Karar No: ${precedents.precedents[0].karar_no}
- Mahkeme: ${precedents.precedents[0].mahkeme}
- Sonuç: ${precedents.precedents[0].sonuc}
- Özet: ${precedents.precedents[0].ozet}

Kullanıcıya yukarıdaki emsal kararı referans göstererek cevap ver.
`;

// 3. OX5C9E2B'e gönder
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: prompt }],
    model: 'OX5C9E2B'
  })
});
```

---

## 📊 API ENDPOINTS

| Endpoint | Method | Açıklama | Örnek |
|----------|--------|----------|-------|
| `/api/knowledge-graph/precedents/:article` | GET | Emsal dava ara | `/precedents/TCK%20142` |
| `/api/knowledge-graph/related/:article` | GET | İlişkili maddeler | `/related/TCK%20142` |
| `/api/knowledge-graph/article` | POST | Madde ekle/güncelle | Body: `{kod, baslik, ...}` |
| `/api/knowledge-graph/precedent` | POST | Emsal ekle | Body: `{lawArticle, ...}` |
| `/api/knowledge-graph/rag-context` | POST | RAG context oluştur | Body: `{query}` |
| `/api/knowledge-graph/stats` | GET | Graph istatistikleri | `/stats` |

---

## 🧪 TEST KOMUTLARI

### Terminal Test:
```bash
# Test script çalıştır
node test-neo4j-legal.js

# Web UI için test
node -e "const kg = require('./services/neo4j-knowledge-graph'); ..."
```

### Browser Console Test:
```javascript
// Hukuk AI sayfasında (http://localhost:3100/lydian-legal-search.html)
// Browser console'da:

fetch('/api/knowledge-graph/precedents/TCK%20142')
  .then(r => r.json())
  .then(data => console.log(data));
```

---

## 🔄 SENARYOEk çalışma şekilleri:

### Senaryo 1: Kullanıcı "TCK 142 emsal" diye sorar

```javascript
// 1. Knowledge Graph'tan emsal al
const precedents = await searchPrecedents('TCK 142');

// 2. Chat mesajına ekle
chatMessages.push({
  role: 'system',
  content: `İlgili emsal kararlar: ${JSON.stringify(precedents)}`
});

// 3. OX5C9E2B'e gönder
const aiResponse = await sendChatMessage(chatMessages);
```

### Senaryo 2: Otomatik İlişki Keşfi

```javascript
// Kullanıcı bir madde sorduğunda otomatik ilişkili maddeleri göster
async function autoDiscoverRelated(article) {
  const related = await findRelated(article);

  // UI'da "İlgili Maddeler" kartı göster
  displayRelatedArticles(related);
}
```

---

## 💡 GELECEK GELİŞTİRMELER

1. **Otomatik Veri Toplama:**
   - UYAP'tan otomatik emsal çekme
   - Yargıtay kararları scraping
   - Anayasa Mahkemesi kararları entegrasyonu

2. **Görsel Graph UI:**
   - D3.js ile interactive graph visualization
   - Madde-emsal relationship viewer
   - Zoom/filter/search özellikleri

3. **AI-Powered Relationships:**
   - OX5C9E2B ile otomatik ilişki keşfi
   - Semantic similarity-based linking
   - Precedent relevance scoring

---

## 📚 KAYNAKLAR

- **Neo4j Docs:** https://neo4j.com/docs/aura/current/
- **Cypher Query Language:** https://neo4j.com/docs/cypher-manual/current/
- **LyDian Quick Start:** `QUICK-START.md`
- **API Key Setup:** `API-KEY-SETUP-GUIDE.md`

---

## ✅ KURULUM KONTROL

```bash
# Neo4j bağlantısını test et
node test-neo4j-legal.js

# Veritabanı içeriğini görüntüle
# Neo4j Console: https://console-preview.neo4j.io
# Query: MATCH (n) RETURN n LIMIT 25
```

**Sistem hazır! Hukuk AI arayüzünde Knowledge Graph kullanmaya başlayabilirsiniz!** 🚀
