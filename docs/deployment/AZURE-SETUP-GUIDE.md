# 🔐 Azure API Setup Kılavuzu

**Güncelleme:** 2025-10-02
**Durum:** ✅ Hazır - 3 farklı yöntem

---

## 📋 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Yöntem 1: Quick Setup (Önerilen)](#yöntem-1-quick-setup)
3. [Yöntem 2: Enterprise Bootstrap](#yöntem-2-enterprise-bootstrap)
4. [Yöntem 3: Manuel Portal](#yöntem-3-manuel-portal)
5. [Permission Checker](#permission-checker)
6. [Sorun Giderme](#sorun-giderme)

---

## 🚀 Hızlı Başlangıç

### Önkoşullar

```bash
# Azure CLI kurulu mu kontrol et
az --version

# Kurulu değilse:
# macOS
brew install azure-cli

# Windows
# https://aka.ms/installazurecliwindows

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### 3 Dakikada Kurulum

```bash
cd ~/Desktop/ailydian-ultra-pro

# Option A: Hızlı kurulum (interaktif)
./azure-quick-setup.sh

# Option B: Enterprise kurulum (otomatik)
./azure-bootstrap-enterprise.sh
```

---

## 🎯 Yöntem 1: Quick Setup (Önerilen)

**En basit ve hızlı yöntem. Yeni başlayanlar için ideal.**

### Adım 1: Script Çalıştır

```bash
cd ~/Desktop/ailydian-ultra-pro
./azure-quick-setup.sh
```

### Adım 2: Script Ne Yapar?

1. ✅ Azure'a giriş yapar
2. ✅ Subscription seçer
3. ✅ App Registration oluşturur ("MyAilydianApp")
4. ✅ Client Secret üretir (2 yıl geçerli)
5. ✅ Size environment variables verir

### Adım 3: Çıktı Kopyala

Script şöyle bir çıktı verecek:

```bash
================================================
AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789abc
AZURE_CLIENT_SECRET=aBcDeFgH1234567890~_
AZURE_TENANT_ID=87654321-4321-4321-4321-cba987654321
AZURE_SUBSCRIPTION_ID=abcd1234-5678-90ab-cdef-1234567890ab
================================================
```

### Adım 4: .env Dosyasına Ekle

```bash
nano ~/Desktop/ailydian-ultra-pro/.env

# Aşağıdaki satırları ekle/güncelle:
AZURE_CLIENT_ID=YOUR_CLIENT_ID_FROM_SCRIPT
AZURE_CLIENT_SECRET=YOUR_CLIENT_SECRET_FROM_SCRIPT
AZURE_TENANT_ID=YOUR_TENANT_ID_FROM_SCRIPT
AZURE_SUBSCRIPTION_ID=YOUR_SUBSCRIPTION_ID_FROM_SCRIPT

# Azure OpenAI (varsa)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your_azure_openai_key
```

### Adım 5: Server Restart

```bash
pkill -f "node server.js"
cd ~/Desktop/ailydian-ultra-pro
PORT=5001 node server.js
```

✅ **Tamamlandı!** Azure API'ler artık aktif.

---

## 🏢 Yöntem 2: Enterprise Bootstrap

**Kurumsal kullanım için. Borsa entegrasyonu, Service Principal, Azure OpenAI dahil.**

### Adım 1: Script Çalıştır

```bash
cd ~/Desktop/ailydian-ultra-pro
./azure-bootstrap-enterprise.sh
```

### Adım 2: Script Ne Yapar?

1. ✅ Azure login (device code)
2. ✅ Resource Group oluşturur/doğrular (Ailydian-RG)
3. ✅ App Registration + Service Principal oluşturur
4. ✅ Client Secret (2 yıl)
5. ✅ Graph API permissions (User.Read)
6. ✅ Azure OpenAI varsa endpoint/key çeker
7. ✅ Borsa microservice endpoints ekler

### Adım 3: Oluşturulan Dosyalar

```bash
# ENV dosyası
cat .env.borsa

# JSON manifest
cat azure_bootstrap_manifest.json
```

### Adım 4: .env'e Birleştir

```bash
# .env.borsa içeriğini ana .env'e kopyala
cat .env.borsa >> .env

# Veya manuel düzenle
nano .env
```

### Adım 5: Admin Consent (Gerekirse)

Eğer "Admin consent verilemedi" uyarısı aldıysanız:

1. Azure Portal aç: https://portal.azure.com
2. **Entra ID** → **App registrations** → **Ailydian-Gateway**
3. **API permissions** → **Grant admin consent for [Org]**
4. Onayla

---

## 🖱️ Yöntem 3: Manuel Portal

**GUI kullanarak manuel kurulum.**

### Adım 1: Azure Portal'a Git

https://portal.azure.com → **Entra ID**

### Adım 2: App Registration Oluştur

1. Sol menü → **App registrations** → **+ New registration**
2. İsim: `Ailydian-App`
3. Supported account types: **Single tenant**
4. Redirect URI: (boş bırak)
5. **Register** tıkla

### Adım 3: Client Secret Oluştur

1. Yeni oluşan app'e tıkla
2. Sol menü → **Certificates & secrets**
3. **+ New client secret**
4. Description: `Ailydian-Secret`
5. Expires: **24 months**
6. **Add** tıkla
7. ⚠️ **Value** sütunundaki değeri HEMEN KOPYALA (bir daha göremezsin!)

### Adım 4: Değerleri Topla

**Overview** sayfasından kopyala:
- **Application (client) ID** → `AZURE_CLIENT_ID`
- **Directory (tenant) ID** → `AZURE_TENANT_ID`

**Certificates & secrets** sayfasından kopyala:
- **Client secret value** → `AZURE_CLIENT_SECRET`

**Subscriptions** sayfasından kopyala:
1. Portal ana sayfa → **Subscriptions**
2. Subscription ID kopyala → `AZURE_SUBSCRIPTION_ID`

### Adım 5: .env'e Ekle

```bash
nano ~/Desktop/ailydian-ultra-pro/.env

# Ekle:
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_TENANT_ID=your_tenant_id
AZURE_SUBSCRIPTION_ID=your_subscription_id
```

### Adım 6: API Permissions (Opsiyonel)

1. App registration → **API permissions**
2. **+ Add a permission**
3. **Microsoft Graph** → **Delegated permissions**
4. **User.Read** seç
5. **Add permissions**
6. **Grant admin consent for [Org]** (admin isen)

---

## 🔍 Permission Checker

Gerekli Azure rollerinizi kontrol edin:

```bash
./azure-permission-checker.sh
```

**Çıktı:**

```
✅ Kullanıcı: user@company.com
   Tenant:   abc-123-def
   Sub:      xyz-789-ghi

Kullanıcı Rolleriniz:
Contributor
Reader

⚡ Kritik Roller:
❌ Application Administrator yok
❌ Cloud Application Administrator yok
❌ Privileged Role Administrator yok

⚠️ Eksik roller var. Portal'da global admin / directory admin onayı gerekebilir.
```

### Gerekli Roller

**App Registration oluşturmak için:**
- `Application Administrator` (Entra ID)
- `Cloud Application Administrator` (Entra ID)
- VEYA `Global Administrator` (tüm yetkiler)

**Resource oluşturmak için:**
- `Owner` (Subscription level)
- `Contributor` (Subscription level)

**Rol yoksa ne yapmalı?**
1. Global Admin'den yetki iste
2. VEYA Portal'dan manuel oluştur (Yöntem 3)

---

## 🐛 Sorun Giderme

### 1. "az: command not found"

```bash
# Azure CLI kur
brew install azure-cli  # macOS
# veya
https://aka.ms/installazurecliwindows  # Windows
```

### 2. "Insufficient privileges to complete the operation"

**Sebep:** App Registration oluşturma yetkisi yok

**Çözüm:**
- Global Admin'den yetki iste
- VEYA Manuel Portal yöntemi kullan (Yöntem 3)

### 3. "Admin consent verilemedi"

**Sebep:** Admin rolü yok

**Çözüm:**
1. Azure Portal → Entra ID → App registrations → [App Name]
2. API permissions → Grant admin consent
3. Global Admin'e forward et

### 4. Azure OpenAI bulunamadı

**Sebep:** Azure OpenAI resource yok

**Çözüm:**
```bash
# Azure Portal'dan oluştur:
1. Portal → Create a resource
2. "Azure OpenAI" ara
3. Create → Resource name: Ailydian-OpenAI
4. Region: West Europe
5. Pricing tier: Standard S0
6. Create

# Endpoint ve Key al:
1. Resource → Keys and Endpoint
2. KEY 1 kopyala → AZURE_OPENAI_API_KEY
3. Endpoint kopyala → AZURE_OPENAI_ENDPOINT
```

### 5. Script çalışmıyor (permission error)

```bash
chmod +x ~/Desktop/ailydian-ultra-pro/azure-*.sh
```

### 6. "The subscription is not registered to use namespace"

```bash
# Provider register et
az provider register --namespace Microsoft.CognitiveServices
az provider register --namespace Microsoft.Search

# Wait for registration
az provider show -n Microsoft.CognitiveServices --query registrationState
```

---

## ✅ Kurulum Doğrulama

### Test 1: Environment Variables

```bash
cd ~/Desktop/ailydian-ultra-pro
grep "AZURE_" .env
```

Beklenen çıktı:
```
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_TENANT_ID=...
AZURE_SUBSCRIPTION_ID=...
AZURE_OPENAI_ENDPOINT=https://...
AZURE_OPENAI_API_KEY=...
```

### Test 2: Server Logs

```bash
# Server'ı başlat
PORT=5001 node server.js

# Loglarda şunu ara:
# ✅ Azure OpenAI GPT-4 Turbo response completed
```

### Test 3: API Test

```bash
curl -X POST http://localhost:5001/api/medical-expert \
  -H "Content-Type: application/json" \
  -d '{"message": "Test mesajı"}'
```

Başarılı ise:
```json
{
  "success": true,
  "response": "...",
  "provider": "Azure OpenAI GPT-4 Turbo",
  "aiAssistant": "DrLydian"
}
```

---

## 📚 Daha Fazla Bilgi

### Azure CLI Dokümantasyonu
https://learn.microsoft.com/en-us/cli/azure/

### App Registration Guide
https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app

### Azure OpenAI
https://learn.microsoft.com/en-us/azure/ai-services/openai/

---

## 🎯 Özet

| Yöntem | Süre | Zorluk | Kimler İçin |
|--------|------|--------|-------------|
| **Quick Setup** | 3 dk | ⭐ Kolay | Yeni başlayanlar |
| **Enterprise Bootstrap** | 5 dk | ⭐⭐ Orta | Kurumsal kullanıcılar |
| **Manuel Portal** | 10 dk | ⭐⭐⭐ Zor | Admin yetkisi olmayanlar |

**Önerimiz:** Quick Setup ile başla, sorun olursa Portal'a geç.

---

*Kılavuz hazırlandı: 2025-10-02*
*Claude AI (Sonnet 4.5)*
