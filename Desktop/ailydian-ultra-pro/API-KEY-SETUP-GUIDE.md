# 🔑 LYDİAN HUKUK AI - API KEY KURULUM REHBERİ

## ✅ MEVCUT AKTİF SERVİSLER (API Key Var)

Bu servisler zaten `.env` dosyanızda yapılandırılmış ve çalışıyor:

- ✅ Azure OpenAI (GPT-4 Turbo, GPT-4o, Embeddings, Whisper)
- ✅ Azure Cosmos DB (14 containers)
- ✅ Azure Translator (150+ dil)
- ✅ Azure Speech Services (STT/TTS/Biometric)
- ✅ Azure Computer Vision (OCR, Document AI)
- ✅ Azure Cognitive Search

---

## 🆕 AKTİFLEŞTİRİLECEK SERVİSLER

### 1. 🔬 Azure Quantum (Quantum Computing)

**Ne İçin:**
- Dava stratejisi optimizasyonu
- Karmaşık hukuki senaryolar için quantum annealing
- Süper hızlı pattern recognition
- Post-quantum kriptografi

**API Key Alma Adımları:**

1. **Azure Portal'a Git:**
   ```
   https://portal.azure.com
   ```

2. **Azure Quantum Workspace Oluştur:**
   - "Create a resource" → "Quantum" ara
   - "Azure Quantum" seç → "Create"
   - Resource group: `lydian-quantum-rg`
   - Workspace name: `lydian-quantum-workspace`
   - Region: `West Europe` (en yakın)
   - Pricing: Pay-as-you-go

3. **Quantum Providers'ı Etkinleştir:**
   - Workspace → "Providers" sekmesi
   - Ionq ✅ (Quantum gates)
   - Quantinuum ✅ (Quantum annealing)
   - Microsoft QIO ✅ (Optimization)

4. **Connection Bilgilerini Al:**
   - Workspace → "Access keys"
   - Resource ID'yi kopyala
   - Subscription ID'yi kopyala

5. **`.env` Dosyasına Ekle:**
   ```bash
   # Azure Quantum
   AZURE_QUANTUM_SUBSCRIPTION_ID=your-subscription-id
   AZURE_QUANTUM_RESOURCE_GROUP=lydian-quantum-rg
   AZURE_QUANTUM_WORKSPACE=lydian-quantum-workspace
   AZURE_QUANTUM_LOCATION=westeurope
   ```

**Maliyet:** ~$100/ay (optimizasyon işlemleri için)

**Dokümantasyon:**
```
https://docs.microsoft.com/azure/quantum/
```

---

### 2. 🎥 Azure Video Indexer (Video Analizi)

**Ne İçin:**
- Mahkeme kayıtları analizi
- Tanık ifadeleri video transkripsiyon
- Yüz tanıma (şüpheli/tanık tespiti)
- Ses analizi (stres, yalan tespiti)

**API Key Alma Adımları:**

1. **Video Indexer Portal:**
   ```
   https://www.videoindexer.ai
   ```

2. **Azure Hesabıyla Giriş Yap**

3. **Yeni Account Oluştur:**
   - "Create new account"
   - Account name: `lydian-legal-video`
   - Region: `West Europe`
   - Resource group: Mevcut RG'yi seç

4. **API Key Al:**
   - Settings → "API"
   - "Primary key" kopyala

5. **`.env` Dosyasına Ekle:**
   ```bash
   # Azure Video Indexer
   AZURE_VIDEO_INDEXER_API_KEY=your-video-indexer-key
   AZURE_VIDEO_INDEXER_ACCOUNT_ID=your-account-id
   AZURE_VIDEO_INDEXER_LOCATION=westeurope
   ```

**Maliyet:** İlk 10 saat ücretsiz, sonra ~$0.10/dakika

**Dokümantasyon:**
```
https://docs.microsoft.com/azure/azure-video-indexer/
```

---

### 3. 🗄️ Neo4j Graph Database (Knowledge Graph)

**Ne İçin:**
- Legal Knowledge Graph (hukuk kavramları arası ilişkiler)
- Multi-Graph RAG (recursive retrieval)
- Emsal dava bağlantıları
- Semantic search engine

**API Key Alma Adımları:**

**Seçenek A: Neo4j AuraDB (Cloud - Önerilen)**

1. **Neo4j Aura Signup:**
   ```
   https://console.neo4j.io
   ```

2. **Free Tier Instance Oluştur:**
   - "New Instance" → "AuraDB Free"
   - Instance name: `lydian-legal-graph`
   - Region: `europe-west1` (en yakın)

3. **Connection Bilgilerini Kaydet:**
   - Connection URI kopyala
   - Username: `neo4j`
   - Password: Otomatik oluşturulan şifreyi kaydet

4. **`.env` Dosyasına Ekle:**
   ```bash
   # Neo4j Graph Database
   NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=your-generated-password
   NEO4J_DATABASE=neo4j
   ```

**Seçenek B: Docker (Local Development)**

1. **Docker ile Başlat:**
   ```bash
   docker run -d \
     --name neo4j-legal \
     -p 7474:7474 -p 7687:7687 \
     -e NEO4J_AUTH=neo4j/lydian2025 \
     -v $HOME/neo4j/data:/data \
     neo4j:latest
   ```

2. **`.env` Dosyasına Ekle:**
   ```bash
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=lydian2025
   ```

**Maliyet:**
- Free tier: 50K nodes, 175K relationships (yeterli başlangıç için)
- Professional: $65/ay (unlimited)

**Dokümantasyon:**
```
https://neo4j.com/docs/aura/current/
```

---

### 4. ⛓️ Hyperledger Fabric (Blockchain)

**Ne İçin:**
- Hukuki belge doğrulama (notarization)
- Immutable audit trail
- Smart contracts (sözleşme otomasyonu)
- NFT certificates (dijital belge sertifikası)

**Kurulum Adımları:**

**Seçenek A: IBM Blockchain Platform (Cloud - Kolay)**

1. **IBM Cloud Hesabı Aç:**
   ```
   https://cloud.ibm.com/catalog/services/blockchain-platform
   ```

2. **Free Tier Seç:**
   - Service name: `lydian-blockchain`
   - Region: `Frankfurt` (en yakın)

3. **Network Oluştur:**
   - "Launch console"
   - "Create a network"
   - Orderer + 2 Peers

4. **Connection Profile İndir:**
   - Network → "Connection profile"
   - JSON dosyasını indir

5. **`.env` Dosyasına Ekle:**
   ```bash
   # Hyperledger Fabric
   BLOCKCHAIN_NETWORK_ID=your-network-id
   BLOCKCHAIN_CONNECTION_PROFILE=/path/to/connection-profile.json
   BLOCKCHAIN_WALLET_PATH=/path/to/wallet
   BLOCKCHAIN_ADMIN_IDENTITY=admin
   ```

**Seçenek B: Local Test Network (Development)**

1. **Fabric Samples İndir:**
   ```bash
   curl -sSL https://bit.ly/2ysbOFE | bash -s
   cd fabric-samples/test-network
   ```

2. **Network Başlat:**
   ```bash
   ./network.sh up createChannel -c legal-channel -ca
   ```

3. **`.env` Dosyasına Ekle:**
   ```bash
   BLOCKCHAIN_NETWORK_ID=test-network
   BLOCKCHAIN_CHANNEL=legal-channel
   BLOCKCHAIN_CHAINCODE=legal-contracts
   ```

**Maliyet:**
- IBM Free tier: 30 gün trial
- Production: ~$300/ay (dedicated nodes)

**Dokümantasyon:**
```
https://cloud.ibm.com/docs/blockchain
https://hyperledger-fabric.readthedocs.io/
```

---

### 5. ✍️ DocuSign API (E-İmza)

**Ne İçin:**
- Dijital sözleşme imzalama
- Hukuki belge doğrulama
- Multi-party signing
- Audit trail

**API Key Alma Adımları:**

1. **DocuSign Developer Account:**
   ```
   https://developers.docusign.com
   ```

2. **Free Developer Account Oluştur:**
   - "Get a Developer Account"
   - Email ile signup

3. **Integration Key Oluştur:**
   - Developer Console → "My Apps & Keys"
   - "Add App and Integration Key"
   - App name: `Lydian Legal AI`

4. **RSA Keypair Oluştur:**
   - "Actions" → "Generate RSA"
   - Private key'i indir

5. **`.env` Dosyasına Ekle:**
   ```bash
   # DocuSign E-Signature
   DOCUSIGN_INTEGRATION_KEY=your-integration-key
   DOCUSIGN_USER_ID=your-user-id
   DOCUSIGN_ACCOUNT_ID=your-account-id
   DOCUSIGN_PRIVATE_KEY_PATH=/path/to/private.key
   DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
   ```

**Maliyet:**
- Developer sandbox: Ücretsiz (test için)
- Production: $10/kullanıcı/ay (25 envelope/ay)

**Dokümantasyon:**
```
https://developers.docusign.com/docs/esign-rest-api/
```

---

### 6. 🏢 SAP ERP (Kurumsal Entegrasyon)

**Ne İçin:**
- Kurumsal hukuk departmanları için
- Fatura/maliyet entegrasyonu
- HR sistemi bağlantısı
- CRM/ERP unified data

**API Key Alma Adımları:**

1. **SAP BTP Trial Account:**
   ```
   https://account.hanatrial.ondemand.com
   ```

2. **Trial Account Oluştur:**
   - "Register" → Email ile kayıt

3. **SAP API Business Hub:**
   ```
   https://api.sap.com
   ```

4. **API Key Al:**
   - "Try Out" → "Show API Key"
   - Key'i kopyala

5. **`.env` Dosyasına Ekle:**
   ```bash
   # SAP ERP Integration
   SAP_API_KEY=your-sap-api-key
   SAP_BASE_URL=https://sandbox.api.sap.com
   SAP_CLIENT_ID=your-client-id
   SAP_CLIENT_SECRET=your-client-secret
   ```

**Maliyet:**
- Trial: Ücretsiz
- Production: Enterprise lisans (özel fiyat)

**Dokümantasyon:**
```
https://help.sap.com/docs/SAP_S4HANA_CLOUD
```

---

## 🚀 HIZLI KURULUM

Tüm servisleri hızlıca aktifleştirmek için:

### 1. `.env` Dosyasını Güncelle

Mevcut `.env.example` dosyanızı kopyalayın:

```bash
cp .env.example .env
```

### 2. Gerekli Paketleri Yükle

```bash
npm install @azure/quantum-jobs @azure/video-analyzer-edge \
  neo4j-driver hyperledger-fabric-client docusign-esign \
  node-sap-cloud-sdk
```

### 3. Servisleri Başlat

```bash
# Ana server
PORT=3100 node server.js

# Legal AI server
PORT=3500 node legal-ai-server.js
```

---

## 💰 MALIYET TAHMİNİ

| Servis | Başlangıç | Production |
|--------|-----------|------------|
| Azure Quantum | Ücretsiz trial | ~$100/ay |
| Video Indexer | 10 saat ücretsiz | ~$50/ay |
| Neo4j AuraDB | Free tier | $65/ay |
| Hyperledger Fabric | 30 gün trial | $300/ay |
| DocuSign | Sandbox ücretsiz | $10/ay |
| SAP ERP | Trial ücretsiz | Enterprise |
| **TOPLAM** | **$0** | **~$525/ay** |

---

## 📞 DESTEK

Kurulum sırasında sorun yaşarsanız:

1. **Azure Support:**
   ```
   https://portal.azure.com → Support → New support request
   ```

2. **Community Forums:**
   - Azure: https://docs.microsoft.com/answers/
   - Neo4j: https://community.neo4j.com/
   - Hyperledger: https://discord.gg/hyperledger

3. **Lydian Support:**
   - Email: support@lydian.ai
   - Discord: https://discord.gg/lydian-ai

---

## ✅ AKTİFLEŞTİRME KONTROL LİSTESİ

- [ ] Azure Quantum workspace oluşturuldu
- [ ] Video Indexer account hazır
- [ ] Neo4j database kuruldu
- [ ] Blockchain network ayakta
- [ ] DocuSign integration key alındı
- [ ] SAP API key hazır
- [ ] `.env` dosyası güncellendi
- [ ] `npm install` çalıştırıldı
- [ ] Server başlatıldı
- [ ] Health check testi yapıldı

**Test URL:**
```
http://localhost:3100/api/legal-ai/health
```

Tüm servisler "ready" durumunda olmalı! ✅
