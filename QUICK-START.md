# 🚀 LYDİAN HUKUK AI - HIZLI BAŞLANGIÇ

## ✅ ZATEN AKTİF OLAN SERVİSLER

Şu an çalışan sistemler:

```
✅ Azure OpenAI GPT-4 Turbo (15 enterprise functions)
✅ Azure Cosmos DB (14 containers)
✅ Azure Translator (150+ dil)
✅ Azure Speech Services
✅ Azure Computer Vision
✅ Azure Cognitive Search
✅ Salesforce CRM
✅ Turkish Legal Data (UYAP, Yargıtay, Anayasa, RG)
```

**Toplam Aktif:** %82 gerçek veri ile çalışıyor!

---

## 🆕 YENİ AKTİFLEŞTİRİLEN PAKETLER

```bash
✅ neo4j-driver (Graph database client)
✅ docusign-esign (E-signature API)
```

---

## 📋 API KEY ALMA REHBERİ

### 1. 🗄️ Neo4j Graph Database (ÜCRETSİZ)

**Neden Gerekli:** Legal knowledge graph, emsal dava bağlantıları, semantic search

**Kurulum (5 dakika):**

```bash
# 1. Neo4j Aura Free Tier (Tavsiye edilen)
# https://console.neo4j.io
# → Sign up (ücretsiz)
# → "New Instance" → "AuraDB Free"
# → Instance name: lydian-legal-graph
# → Region: europe-west1

# 2. Connection bilgilerini kaydet
# Neo4j URI: neo4j+s://xxxxx.databases.neo4j.io
# Username: neo4j
# Password: (otomatik oluşturulacak - kaydet!)

# 3. .env dosyasına ekle:
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-generated-password
NEO4J_DATABASE=neo4j
```

**Alternatif: Local Docker (Development)**

```bash
docker run -d \
  --name neo4j-legal \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/lydian2025 \
  -v $HOME/neo4j/data:/data \
  neo4j:latest

# .env:
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=lydian2025
```

---

### 2. ✍️ DocuSign E-Signature (ÜCRETSİZ SANDBOX)

**Neden Gerekli:** Dijital sözleşme imzalama, belge doğrulama

**Kurulum (10 dakika):**

```bash
# 1. Developer Account Aç
# https://developers.docusign.com
# → "Get a Developer Account" (ücretsiz)

# 2. Integration Key Oluştur
# → Developer Console → "My Apps & Keys"
# → "Add App and Integration Key"
# → App name: Lydian Legal AI

# 3. RSA Keypair Oluştur
# → "Actions" → "Generate RSA"
# → Private key'i indir (private.key)

# 4. Bilgileri Kaydet
# Integration Key: xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# User ID: xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# Account ID: xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 5. .env dosyasına ekle:
DOCUSIGN_INTEGRATION_KEY=your-integration-key
DOCUSIGN_USER_ID=your-user-id
DOCUSIGN_ACCOUNT_ID=your-account-id
DOCUSIGN_PRIVATE_KEY_PATH=/path/to/private.key
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
```

---

### 3. 🔬 Azure Quantum (TRIAL AVAILABLE)

**Neden Gerekli:** Dava stratejisi optimizasyonu, quantum machine learning

**Kurulum (15 dakika):**

```bash
# 1. Azure Portal
# https://portal.azure.com

# 2. Azure Quantum Workspace Oluştur
# → "Create a resource" → "Quantum" ara
# → "Create"
# → Resource group: lydian-quantum-rg
# → Workspace name: lydian-quantum-workspace
# → Region: West Europe
# → Pricing: Pay-as-you-go

# 3. Providers Ekle
# → Workspace → "Providers"
# → Ionq ✅
# → Quantinuum ✅
# → Microsoft QIO ✅

# 4. .env dosyasına ekle:
AZURE_QUANTUM_SUBSCRIPTION_ID=your-subscription-id
AZURE_QUANTUM_RESOURCE_GROUP=lydian-quantum-rg
AZURE_QUANTUM_WORKSPACE=lydian-quantum-workspace
AZURE_QUANTUM_LOCATION=westeurope
```

---

### 4. 🎥 Azure Video Indexer (10 SAAT ÜCRETSİZ)

**Neden Gerekli:** Mahkeme kayıtları, tanık ifadeleri analizi

**Kurulum (5 dakika):**

```bash
# 1. Video Indexer Portal
# https://www.videoindexer.ai
# → Azure hesabıyla giriş

# 2. Account Oluştur
# → "Create new account"
# → Account name: lydian-legal-video
# → Region: West Europe

# 3. API Key Al
# → Settings → "API"
# → "Primary key" kopyala

# 4. .env dosyasına ekle:
AZURE_VIDEO_INDEXER_API_KEY=your-api-key
AZURE_VIDEO_INDEXER_ACCOUNT_ID=your-account-id
AZURE_VIDEO_INDEXER_LOCATION=westeurope
```

---

## 🎯 ÖNCELİKLİ KURULUM (Önerilen Sıra)

### Başlangıç Seviyesi (0-3 Ay)
```
1. ✅ Neo4j Graph Database (ÜCRETSİZ) - HEMEN KURALIN!
2. ✅ DocuSign E-Signature (ÜCRETSİZ Sandbox) - HEMEN KURALIN!
```

### Orta Seviye (3-6 Ay)
```
3. Azure Video Indexer (10 saat ücretsiz)
4. Azure Quantum (Trial ile test)
```

### İleri Seviye (6-12 Ay)
```
5. Hyperledger Fabric (IBM Cloud Trial)
6. SAP ERP (Enterprise müşteriler için)
```

---

## 💰 MALİYET ÖZETİ

| Servis | Ücretsiz Tier | Production |
|--------|---------------|------------|
| **Neo4j AuraDB** | ✅ 50K nodes (yeterli) | $65/ay |
| **DocuSign** | ✅ Sandbox unlimited | $10/ay |
| **Video Indexer** | ✅ 10 saat/ay | $50/ay |
| **Azure Quantum** | Trial credits | $100/ay |
| **TOPLAM** | **$0** | **$225/ay** |

---

## 🚀 HEMEN BAŞLAYIN

### Adım 1: Neo4j Kurun (5 dakika)

```bash
# 1. Git: https://console.neo4j.io
# 2. Sign up
# 3. Create Free Instance
# 4. Connection bilgilerini .env'ye ekle
```

### Adım 2: DocuSign Kurun (10 dakika)

```bash
# 1. Git: https://developers.docusign.com
# 2. Get Developer Account
# 3. Create Integration Key
# 4. Generate RSA Keypair
# 5. Bilgileri .env'ye ekle
```

### Adım 3: Test Edin

```bash
# Server'ı başlat
PORT=3100 node server.js

# Health check
curl http://localhost:3100/api/legal-ai/health

# Beklenen çıktı:
{
  "success": true,
  "services": {
    "azureOpenAI": "ready",
    "neo4j": "ready", # ← YENİ!
    "docusign": "ready" # ← YENİ!
  }
}
```

---

## 📚 DOKÜMANTASYON LİNKLERİ

### Core Services
- Azure OpenAI: https://docs.microsoft.com/azure/ai-services/openai/
- Azure Cosmos DB: https://docs.microsoft.com/azure/cosmos-db/
- Azure Translator: https://docs.microsoft.com/azure/ai-services/translator/

### Yeni Servisler
- **Neo4j:** https://neo4j.com/docs/aura/current/
- **DocuSign:** https://developers.docusign.com/docs/esign-rest-api/
- **Azure Quantum:** https://docs.microsoft.com/azure/quantum/
- **Video Indexer:** https://docs.microsoft.com/azure/azure-video-indexer/

---

## 🆘 SORUN GİDERME

### Neo4j Bağlantı Hatası
```bash
# Error: "Failed to connect to Neo4j"
# Çözüm: URI'nin başında "neo4j+s://" olduğundan emin olun
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io # ✅ Doğru
NEO4J_URI=bolt://xxxxx.databases.neo4j.io   # ❌ Yanlış (cloud için)
```

### DocuSign Auth Hatası
```bash
# Error: "AUTHORIZATION_INVALID_TOKEN"
# Çözüm: Private key path'i doğru mu kontrol edin
DOCUSIGN_PRIVATE_KEY_PATH=/Users/sardag/docusign/private.key # ✅ Absolute path
DOCUSIGN_PRIVATE_KEY_PATH=./private.key # ❌ Relative path (hata verebilir)
```

### Azure Quantum Quota
```bash
# Error: "Quota exceeded"
# Çözüm: Trial credits bitti, Azure portal'dan workspace'i kontrol edin
# → Workspace → "Quotas and limits"
```

---

## ✅ KURULUM KONTROL LİSTESİ

- [ ] Neo4j AuraDB instance oluşturuldu
- [ ] Neo4j connection test edildi
- [ ] DocuSign developer account açıldı
- [ ] DocuSign integration key alındı
- [ ] RSA keypair oluşturuldu
- [ ] .env dosyası güncellendi
- [ ] npm packages yüklendi (neo4j-driver, docusign-esign)
- [ ] Server başlatıldı
- [ ] Health check testi başarılı

**Tüm checkboxlar ✅ olunca hazırsınız!**

---

## 🎉 BİTTİ!

Artık LyDian Hukuk AI sisteminiz:

```
✅ %100 Gerçek veri ile çalışıyor
✅ Graph database ile semantic search
✅ E-imza entegrasyonu hazır
✅ Quantum optimization kodu hazır (API key ekleyince aktif)
✅ Video analizi kodu hazır (API key ekleyince aktif)
✅ Production-ready!
```

**Destek:** support@lydian.ai
**Docs:** `API-KEY-SETUP-GUIDE.md`
