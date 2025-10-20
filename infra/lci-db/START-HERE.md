# 🚀 LCI Platform - Başlangıç Rehberi

## ⚠️ ÖNEMLİ: Docker Desktop Gereklidir

LCI platformunu çalıştırmadan **önce** Docker Desktop'ı **manuel olarak** başlatmalısınız.

### 1️⃣ Docker Desktop'ı Başlatın

**Manuel Başlatma (Gerekli):**
```
1. Finder → Uygulamalar → Docker.app
2. Docker.app'e çift tıklayın
3. Docker'ın tam başlamasını bekleyin
4. Üst menü çubuğunda Docker ikonu görünecek
5. İkon durağan olduğunda hazır demektir
```

Docker'ın çalıştığını kontrol edin:
```bash
docker ps
# Hata vermemeli, çalışan container'ları göstermeli
```

---

## 2️⃣ LCI Platformunu Başlatın

### Yöntem A: Otomatik Başlatma (Önerilen)

Tek komutla her şeyi başlatır:

```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro/infra/lci-db
./start-lci.sh
```

Bu script otomatik olarak:
- ✅ PostgreSQL container'ını başlatır
- ✅ Database migration'larını çalıştırır
- ✅ Prisma Client'ı oluşturur
- ✅ Seed data'yı yükler (20 marka + 50 şikayet)
- ✅ LCI API'yi başlatır

---

### Yöntem B: Manuel Adımlar

Her adımı kendiniz çalıştırmak isterseniz:

#### Adım 1: PostgreSQL Başlat
```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro/infra/lci-db
docker-compose up -d
```

#### Adım 2: Migration'ları Çalıştır
```bash
npx prisma migrate deploy
```

#### Adım 3: Prisma Client Oluştur
```bash
npx prisma generate
```

#### Adım 4: Seed Data Yükle
```bash
npm run seed
```

#### Adım 5: API'yi Başlat
```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro/apps/lci-api
npm run start:dev
```

---

## 3️⃣ Platformun Çalıştığını Doğrulayın

### Health Check
```bash
curl http://localhost:3201/health
```

Beklenen yanıt:
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T...",
  "uptime": 123,
  "database": "connected",
  "version": "1.0.0"
}
```

### Demo Kullanıcı ile Login
```bash
curl -X POST http://localhost:3201/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lci.lydian.ai",
    "password": "Demo1234!"
  }'
```

---

## 4️⃣ E2E Testleri Çalıştırın

```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro/apps/lci-api
npm run test:e2e
```

Beklenen sonuç:
```
✓ 11 auth testi geçti
✓ 18 şikayet testi geçti
✓ PII maskeleme çalışıyor
```

---

## 📍 Servisler

| Servis | URL | Durum |
|--------|-----|-------|
| PostgreSQL | `localhost:5432` | Database |
| LCI API | `http://localhost:3201` | Backend |
| Health Check | `http://localhost:3201/health` | Monitor |
| Prisma Studio | `npx prisma studio` | DB GUI |

---

## 👤 Demo Hesaplar (Seed Data)

### Admin
```
Email: admin@lci.lydian.ai
Password: Demo1234!
Role: ADMIN (Tüm yetkilere sahip)
```

### Moderator
```
Email: moderator@lci.lydian.ai
Password: Demo1234!
Role: MODERATOR (Şikayetleri escalate edebilir)
```

### Marka Temsilcisi (Turkcell)
```
Email: agent.turkcell@turkcell.com.tr
Password: Demo1234!
Role: BRAND_AGENT (Turkcell şikayetlerine yanıt verebilir)
```

### Normal Kullanıcılar
```
Email: ahmet.yilmaz@gmail.com (ve 9 tane daha)
Password: Demo1234!
Role: USER (Şikayet oluşturabilir)
```

Tüm kullanıcılar: `infra/lci-db/prisma/seed.ts` dosyasında

---

## 🧪 Test Senaryoları

### 1. Kullanıcı Kaydı ve Login
```bash
# Kayıt ol
curl -X POST http://localhost:3201/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "yeni@example.com",
    "password": "Test1234!",
    "locale": "tr"
  }'

# Login
curl -X POST http://localhost:3201/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "yeni@example.com",
    "password": "Test1234!"
  }'
```

### 2. Şikayet Oluştur
```bash
# Token'ı kaydet (önceki login'den)
TOKEN="eyJhbGci..."

curl -X POST http://localhost:3201/complaints \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "BRAND_ID_HERE",
    "title": "Ürün hasarlı geldi",
    "body": "Sipariş ettiğim ürün hasarlı olarak teslim edildi.",
    "severity": "MEDIUM"
  }'
```

### 3. PII Maskeleme Testi
```bash
curl -X POST http://localhost:3201/complaints \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "BRAND_ID_HERE",
    "title": "TC kimlik ifşa edildi",
    "body": "TC kimlik numaram 12345678901 olan kişiye bilgi vermişler",
    "severity": "CRITICAL"
  }'

# Body'de "12345678901" yerine "TC****01" göreceksiniz
```

---

## 📚 Dokümantasyon

| Dosya | Açıklama |
|-------|----------|
| `apps/lci-api/API-REFERENCE.md` | 24 endpoint, request/response örnekleri |
| `apps/lci-api/PRODUCTION-READINESS.md` | 200+ maddelik production checklist |
| `apps/lci-api/PHASE-5-COMPLETE.md` | E2E testler ve final rapor |
| `infra/lci-db/docker-compose.yml` | PostgreSQL container config |
| `infra/lci-db/prisma/schema.prisma` | Database şeması |
| `infra/lci-db/prisma/seed.ts` | Demo data |

---

## 🛑 Platformu Durdurun

### API'yi Durdur
```bash
# PID'yi bulun
ps aux | grep "nest start"

# Durdur
kill <PID>
```

### PostgreSQL'i Durdur
```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro/infra/lci-db
docker-compose down
```

### Her Şeyi Sıfırla (Dikkat!)
```bash
# Database'i sil ve yeniden başlat
docker-compose down -v
docker-compose up -d
npx prisma migrate deploy
npm run seed
```

---

## 🔍 Sorun Giderme

### Docker Hatası
```bash
# Docker çalışıyor mu?
docker ps

# Çalışmıyorsa manuel başlat:
# Finder → Uygulamalar → Docker.app
```

### Database Bağlantı Hatası
```bash
# PostgreSQL çalışıyor mu?
docker ps | grep postgres

# Logları kontrol et
docker logs lci-postgres
```

### Migration Hatası
```bash
# Reset ve yeniden dene
npx prisma migrate reset
npx prisma migrate deploy
npm run seed
```

### Port Zaten Kullanımda
```bash
# 3201 portunu kullanan process'i bul
lsof -i :3201

# Durdur
kill <PID>
```

---

## 🎯 Özellikler

### ✅ Tamamlananlar
- **Authentication**: Email + JWT + Password (bcrypt cost 12)
- **RBAC**: 4 rol (USER, BRAND_AGENT, MODERATOR, ADMIN)
- **Şikayet Sistemi**: DRAFT → OPEN → IN_PROGRESS → RESOLVED
- **PII Maskeleme**: 9 Türkçe pattern (TC kimlik, email, telefon, IBAN, kredi kartı, adres, isim, doğum tarihi, pasaport)
- **SLA Tracking**: 24h/4h ilk yanıt, 72h çözüm (RED/YELLOW/GREEN)
- **KVKK/GDPR**: Data export + Right to erasure
- **File Upload**: 7 katmanlı güvenlik (size, MIME, extension, virus scan, access control, limits)
- **SEO**: 5 Schema.org component
- **E2E Tests**: 29 test case
- **API Docs**: 24 endpoint tam dokümante

### 📊 İstatistikler
- **Kod**: ~5,500+ satır
- **Dosya**: ~40 dosya
- **API Endpoints**: 24 endpoint
- **Test Cases**: 29 E2E test
- **Seed Data**: 13 kullanıcı, 20 marka, 50 şikayet
- **Documentation**: 1,500+ satır

---

## 📞 Destek

Sorun yaşıyorsanız:
1. `PRODUCTION-READINESS.md` dosyasındaki troubleshooting bölümüne bakın
2. E2E testleri çalıştırıp sonuçları kontrol edin
3. API logs'ları inceleyin

---

**Son Güncelleme**: 2025-10-15
**Versiyon**: 1.0.0
**Durum**: Production Ready (Docker başlatıldıktan sonra)
