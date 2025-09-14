# 🐳 AILYDIAN Docker Development Dashboard
**Design Tokens + A/B Testing System** tam çalışır durumda!

## 🚀 Servisler (Tüm servisleri açmak için linklere tıklayın)

### 📱 Ana Uygulama
- **AILYDIAN Borsa Trader**: http://localhost:3000
  - Design Tokens sistemi aktif
  - A/B Testing çalışıyor
  - Telemetri sistemi hazır
  
### 🧪 Test Sayfaları  
- **Smoke Test**: http://localhost:3000/smoke-test-new
  - Design tokens showcase
  - A/B tema switching test
  - Interactive theme controls
  
### 💾 Veritabanı Yönetimi
- **Adminer (DB Web UI)**: http://localhost:8080
  - Server: `db`
  - Database: `ailydian_borsa` 
  - Username: `ailydian`
  - Password: `ailydian2025`

- **Prisma Studio**: http://localhost:5555 
  - Modern DB interface
  - Schema visualization
  - Data management

### 🔧 Geliştirici Araçları
- **Redis Commander**: http://localhost:8081
  - Cache management
  - Session storage
  - A/B test data

---

## 🎨 Design Tokens Test Rehberi

### 1. Ana Sayfa Test
1. http://localhost:3000 adresine gidin
2. Sayfa otomatik olarak A/B test variant'ı atar
3. Browser console'u açın
4. Bu komutları deneyin:
```javascript
// Mevcut tema durumu
window.themeDebug?.logCurrentState()

// Calm theme (Variant A)
window.themeDebug?.setTestVariant('A')

// Elevated theme (Variant B) 
window.themeDebug?.setTestVariant('B')

// Shock theme (High volatility)
window.themeDebug?.simulateVolatility(0.9)
```

### 2. Smoke Test Sayfası
1. http://localhost:3000/smoke-test-new adresine gidin
2. Tüm UI component'leri test edin
3. Tema değiştirme butonlarını kullanın
4. Design tokens'ın gerçek zamanlı değişimini gözlemleyin

### 3. Telemetri Test
1. Browser Network tab'ını açın
2. Tema değişikliklerini yapın
3. `/api/telemetry/theme` endpoint'ine POST istekleri görün
4. Rate limiting test edin (çok hızlı istek)

---

## 📊 A/B Testing Sistemi

### Variant Assignment Logic
- **Mobile kullanıcılar**: %55 şans ile Variant B (Elevated)
- **Desktop kullanıcılar**: %50 şans ile Variant B
- **High volatility**: Otomatik Shock theme
- **Cookie persistence**: 30 gün süreyle saklama

### Theme Regimes
- **Calm (A)**: Sakin renkler, düşük kontrast
- **Elevated (B)**: Enerjik renkler, yüksek kontrast  
- **Shock**: Yoğun renkler, acil durum modu

---

## 🔍 Debug & Monitoring

### Design Tokens Debug
```javascript
// Token değerleri
getComputedStyle(document.documentElement).getPropertyValue('--color-primary')

// Regime durumu
document.documentElement.getAttribute('data-regime')

// Theme debug interface
window.themeDebug
```

### Container Logs
```bash
# Ana uygulama
docker logs borsa-app-1 -f

# Tüm servislerin durumu
docker-compose -f docker-compose.dev.yml ps
```

---

## 🎯 Şu Anda Aktif Özellikler

✅ **Design Tokens System** - Style Dictionary ile CSS variables  
✅ **A/B Testing Logic** - UA-based assignment & persistence  
✅ **Theme Switching** - Real-time CSS custom properties  
✅ **Telemetry API** - Rate-limited event tracking  
✅ **Figma Sync Ready** - Import/export klasör yapısı  
✅ **Mobile Responsive** - All breakpoints tested  
✅ **Zero-Error Build** - TypeScript compilation success  
✅ **Docker Production** - Full stack containerized  

**🚀 Sistem %100 çalışır durumda ve production-ready!**
