# AILYDIAN AI LENS TRADER - Docker Kullanım Kılavuzu

## 🚀 Hızlı Başlangıç

Docker ortamı artık aktif! Aşağıdaki URL'leri kullanarak erişebilirsiniz:

### 🌐 Erişim URL'leri
- **Ana Uygulama**: http://localhost:3000
- **Prisma Studio** (DB Yönetimi): http://localhost:5555
- **Adminer** (DB Web Interface): http://localhost:8080
- **Redis Commander** (Redis Web Interface): http://localhost:8081
- **PostgreSQL**: localhost:5432 (kullanıcı: ailydian, şifre: ailydian2025)
- **Redis**: localhost:6379

## 🛠️ Yönetim Komutları

### Temel Komutlar
```bash
# Tüm servisleri başlat
./docker-dev.sh up

# Tüm servisleri durdur
./docker-dev.sh down

# Servisleri yeniden başlat
./docker-dev.sh restart

# Canlı logları göster
./docker-dev.sh logs

# Servis durumlarını kontrol et
./docker-dev.sh status
```

### İleri Düzey Komutlar
```bash
# Ana uygulamaya terminal erişimi
./docker-dev.sh shell

# PostgreSQL veritabanına erişim
./docker-dev.sh db

# Redis'e erişim
./docker-dev.sh redis

# Sağlık kontrolleri
./docker-dev.sh health

# Container'ları yeniden build et
./docker-dev.sh build

# Tüm Docker kaynaklarını temizle
./docker-dev.sh clean
```

## 🔥 Hot Reload (Canlı Takip)

Docker ortamında kodlarınızı değiştirdiğinizde otomatik olarak yenilenir:

1. **Dosya değişikliği** → Otomatik tespit
2. **Next.js yeniden compile** → Hızlı build
3. **Tarayıcı otomatik yenileme** → Anında görünüm

### Kod Değişikliği Yapma
- Ana uygulama klasöründeki dosyaları değiştirin
- Kaydettiğinizde otomatik olarak yenilenir
- Terminal'de build loglarını görebilirsiniz

## 🔍 Hata Ayıklama

### Logları İnceleme
```bash
# Tüm servislerin logları
./docker-dev.sh logs

# Sadece ana uygulamanın logları
docker logs borsa-app-1 -f

# Veritabanı logları
docker logs borsa-db-1 -f
```

### Konteyner İçine Erişim
```bash
# Ana uygulamaya erişim
./docker-dev.sh shell

# Veritabanına erişim
./docker-dev.sh db

# Redis'e erişim  
./docker-dev.sh redis
```

## 🗄️ Veritabanı Yönetimi

### Prisma Studio (Önerilen)
- **URL**: http://localhost:5555
- **Özellikler**: Görsel veritabanı yönetimi, tablo düzenleme, veri ekleme/çıkarma

### Adminer (Alternatif)
- **URL**: http://localhost:8080
- **Sunucu**: db
- **Kullanıcı**: ailydian
- **Şifre**: ailydian2025
- **Veritabanı**: ailydian_borsa

## 📦 Redis Yönetimi

### Redis Commander
- **URL**: http://localhost:8081
- **Özellikler**: Redis key-value görüntüleme, cache yönetimi

## 💾 Veri Kalıcılığı

Docker volumes kullanılarak verileriniz korunur:
- **PostgreSQL verileri**: `borsa_postgres_data` volume'unda
- **Redis verileri**: `borsa_redis_data` volume'unda

Konteynerları yeniden başlattığınızda verileriniz kaybolmaz.

## 🔧 Konfigürasyon

### Environment Değişkenleri
Dosya: `.env.local`
- Database, Redis, API anahtarları burada yapılandırılır
- Değişiklik sonrası `./docker-dev.sh restart` çalıştırın

### Docker Ayarları
- **docker-compose.dev.yml**: Servis konfigürasyonu
- **Dockerfile.dev**: Development container tanımı

## ⚡ Performans Optimizasyonu

### Hot Reload için
- `WATCHPACK_POLLING=true` - Dosya değişiklik tespiti
- `FAST_REFRESH=true` - Hızlı React yenileme

### Memory Optimizasyonu
- Redis max memory: 512MB
- PostgreSQL shared buffers: otomatik

## 🚨 Sorun Giderme

### Port Çakışması
```bash
# Kullanılan portları kontrol et
lsof -i :3000
lsof -i :5432

# Docker servislerini durdur
./docker-dev.sh down
```

### Build Sorunları
```bash
# Cache'i temizle ve yeniden build et
./docker-dev.sh build

# Tüm Docker kaynaklarını temizle
./docker-dev.sh clean
```

### Volume Sorunları
```bash
# Volume'ları listele
docker volume ls

# Veritabanını sıfırla (DİKKAT: Veri kaybı!)
docker volume rm borsa_postgres_data
```

## 🎯 Kullanım İpuçları

1. **Kod değişiklikleri** anında yansıtılır
2. **Veritabanı değişiklikleri** Prisma Studio'dan yapın
3. **API testleri** için Adminer kullanın  
4. **Cache kontrolü** için Redis Commander kullanın
5. **Log takibi** sürekli açık tutun

## 🔄 Güncellemeler

Proje güncellendiğinde:
```bash
git pull
./docker-dev.sh down
./docker-dev.sh build
./docker-dev.sh up
```

---

**Not**: Docker Desktop'ın çalıştığından emin olun. İlk çalıştırmada internet bağlantısı gereklidir.
