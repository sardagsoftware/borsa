# 🚀 Başlangıç Rehberi - Ailydian Ultra Pro

> **Hedef Kitle:** Yeni geliştiriciler ve sistem yöneticileri
> **Tahmini Süre:** 2-4 saat
> **Zorluk:** 🟢 Başlangıç

---

## 📋 ÖN KOŞULLAR

### Gerekli Yazılımlar
- ✅ **Node.js** v18.0.0 veya üzeri
- ✅ **npm** v9.0.0 veya üzeri (veya pnpm v9.15.9)
- ✅ **PostgreSQL** v14.0 veya üzeri
- ✅ **Git** v2.30.0 veya üzeri
- ✅ **Redis** v6.0.0 veya üzeri (opsiyonel, caching için)

### Tavsiye Edilen Araçlar
- 🔧 **VS Code** veya **WebStorm** (IDE)
- 🔧 **Postman** veya **Insomnia** (API testing)
- 🔧 **PostgreSQL GUI** (pgAdmin, DBeaver, vs.)
- 🔧 **Docker Desktop** (opsiyonel, containerization için)

---

## 🛠️ KURULUM ADIMLARI

### Adım 1: Repository'yi Klonlayın

```bash
git clone https://github.com/yourusername/ailydian-ultra-pro.git
cd ailydian-ultra-pro
```

### Adım 2: Bağımlılıkları Yükleyin

```bash
# npm kullanarak
npm install

# veya pnpm kullanarak (önerilen)
pnpm install
```

### Adım 3: Veritabanını Kurun

```bash
# PostgreSQL'e bağlanın
psql -U postgres

# Yeni veritabanı oluşturun
CREATE DATABASE ailydian_dev;

# Kullanıcı oluşturun (opsiyonel)
CREATE USER ailydian_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ailydian_dev TO ailydian_user;

# Çıkış
\q
```

### Adım 4: Environment Değişkenlerini Yapılandırın

```bash
# .env.example dosyasını kopyalayın
cp .env.example .env

# .env dosyasını düzenleyin
nano .env
```

**Minimum Konfigürasyon:**
```bash
NODE_ENV=development
PORT=3100

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ailydian_dev

# JWT Secret (güçlü bir değer oluşturun)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Session Secret
SESSION_SECRET=your_super_secret_session_key_here_min_32_chars
```

### Adım 5: Prisma Migrate Çalıştırın

```bash
# Database schema'yı oluşturun
npx prisma migrate dev --name init

# Prisma Client'i generate edin
npx prisma generate
```

### Adım 6: Development Server'ı Başlatın

```bash
# Development mode
npm run dev

# veya
pnpm dev
```

✅ **Başarılı!** Server http://localhost:3100 adresinde çalışıyor olmalı.

---

## 🔑 API ANAHTARLARI KURULUMU

### LyDian Labs API Key

1. https://platform.openai.com/api-keys adresine gidin
2. "Create new secret key" butonuna tıklayın
3. `.env` dosyasına ekleyin:

```bash
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

### LyDian Research API Key

1. https://console.anthropic.com/settings/keys adresine gidin
2. "Create Key" butonuna tıklayın
3. `.env` dosyasına ekleyin:

```bash
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
```

### Google LyDian Vision API Key

1. https://makersuite.google.com/app/apikey adresine gidin
2. "Create API Key" seçeneğini kullanın
3. `.env` dosyasına ekleyin:

```bash
GOOGLE_API_KEY=your-google-gemini-api-key-here
```

### LyDian Acceleration API Key

1. https://console.groq.com/keys adresine gidin
2. "Create API Key" butonuna tıklayın
3. `.env` dosyasına ekleyin:

```bash
GROQ_API_KEY=gsk_your-groq-api-key-here
```

---

## 🧪 İLK TESTİNİZ

### 1. Health Check

```bash
curl http://localhost:3100/api/health
```

**Beklenen Çıktı:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-20T...",
  "environment": "development",
  "models_count": 23
}
```

### 2. Basit Chat Testi

```bash
curl -X POST http://localhost:3100/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Merhaba, nasılsın?",
    "provider": "openai",
    "model": "OX1D4A7F"
  }'
```

### 3. Web Interface

Tarayıcınızda açın:
- **Ana Sayfa:** http://localhost:3100/
- **Chat Interface:** http://localhost:3100/chat.html
- **Dashboard:** http://localhost:3100/dashboard.html

---

## 🔒 GÜVENLİK KURULUMU (ÖNEMLİ!)

### 1. CSRF Protection

`.env` dosyasında:
```bash
CSRF_SECRET=your_csrf_secret_minimum_32_characters_long
```

### 2. HTTPS (Production)

```bash
ENFORCE_HTTPS=true
```

### 3. Rate Limiting

Default olarak aktif, `.env`'de özelleştirebilirsiniz:
```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 dakika
RATE_LIMIT_MAX_REQUESTS=100  # Maksimum 100 istek
```

---

## 📚 SONRAKİ ADIMLAR

### 1. Dokümantasyonu İnceleyin
- [API Dokümantasyonu](../current/api-docs/)
- [Güvenlik En İyi Uygulamalar](Security-Best-Practices.md)
- [Developer Guide](Developer-Guide.md)

### 2. Örnek Projeleri Deneyin
```bash
# Örnek test scriptlerini çalıştırın
npm run test
```

### 3. Topluluk ile Bağlantı Kurun
- Discord kanalına katılın
- GitHub Issues'ı takip edin
- Email ile soru sorun

---

## ❓ SIKÇA SORULAN SORULAR

### "npm install" hata veriyor?

**Çözüm:**
```bash
# Cache'i temizleyin
npm cache clean --force

# Node sürümünüzü kontrol edin
node --version  # v18.0.0+ olmalı

# Tekrar deneyin
npm install
```

### Database bağlantı hatası?

**Kontrol Listesi:**
- ✅ PostgreSQL çalışıyor mu? `pg_isready`
- ✅ Database oluşturuldu mu? `psql -l`
- ✅ DATABASE_URL doğru mu?
- ✅ Kullanıcı izinleri var mı?

### Port zaten kullanımda?

**Çözüm:**
```bash
# Portu kullanan process'i bulun
lsof -i :3100

# Process'i durdurun
kill -9 <PID>

# Veya farklı port kullanın
PORT=3200 npm run dev
```

---

## 🆘 YARDIM ALIN

### Hala Sorun mu Yaşıyorsunuz?

1. 📖 [Troubleshooting Guide](Troubleshooting.md) sayfasını inceleyin
2. 🔍 [GitHub Issues](https://github.com/yourusername/ailydian-ultra-pro/issues)'da arayın
3. 💬 Discord topluluğuna sorun
4. 📧 Email gönderin: support@ailydian.com

---

**Son Güncelleme:** 20 Aralık 2025
**Yazar:** Ailydian Core Team
**Versiyon:** 1.0.0
