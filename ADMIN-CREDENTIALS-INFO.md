# 🔐 Admin Panel - Giriş Bilgileri

**Tarih**: 17 Ekim 2025
**Sistem**: LyDian Ultra Pro Authentication System

---

## 🌐 Admin Panel URL'leri

### Production (www.ailydian.com)
```
Main Dashboard: https://www.ailydian.com/dashboard
Admin Panel: https://www.ailydian.com/admin-dashboard
Auth Page: https://www.ailydian.com/auth
```

### LCI - Complaint Intelligence System
```
Complaint Form: https://www.ailydian.com/sikayet-olustur.html
Brand Management: https://www.ailydian.com/api/lci/v1/brands (API)
Complaints API: https://www.ailydian.com/api/lci/v1/complaints (API)
```

---

## 👤 Default Admin Kullanıcısı

### Yönetici Hesabı ✅ OLUŞTURULDU

**Admin Hesap Bilgileri**:
- **Email**: admin@ailydian.com
- **Password**: Admin@2025!Secure
- **Name**: Sardag Admin
- **Role**: ADMIN
- **User ID**: 2
- **Durum**: ✅ Aktif ve Kullanıma Hazır

**Oluşturma Tarihi**: 17 Ekim 2025

---

## 🎉 İlk Giriş Adımları

1. **Admin Panel'e Git**: https://www.ailydian.com/auth
2. **Login Bilgilerini Gir**:
   - Email: `admin@ailydian.com`
   - Password: `Admin@2025!Secure`
3. **Dashboard'a Eriş**: https://www.ailydian.com/dashboard
4. **Admin Paneline Git**: https://www.ailydian.com/admin-dashboard

---

## 📝 Alternatif Admin Kullanıcısı Oluşturma

Farklı bir admin hesabı oluşturmak isterseniz aşağıdaki yöntemlerden birini kullanın:

---

## 🚀 Admin Kullanıcısı Oluşturma

### Yöntem 1: Auth API ile Kayıt

**Endpoint**: `POST https://www.ailydian.com/api/auth/register`

**Request Body**:
```json
{
  "email": "admin@ailydian.com",
  "password": "Admin@2025!Secure",
  "name": "Sardag Admin",
  "phone": "+90XXXXXXXXXX"
}
```

**cURL Komutu**:
```bash
curl -X POST "https://www.ailydian.com/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ailydian.com",
    "password": "Admin@2025!Secure",
    "name": "Sardag Admin",
    "phone": "+905551234567"
  }'
```

**Password Requirements**:
- ✅ Minimum 8 karakter
- ✅ En az 1 büyük harf (A-Z)
- ✅ En az 1 küçük harf (a-z)
- ✅ En az 1 rakam (0-9)
- ✅ En az 1 özel karakter (!@#$%^&*)
- ❌ Yaygın şifreler kullanılamaz (password123, admin, vb.)
- ❌ Ardışık karakterler kullanılamaz (abc, 123, vb.)
- ❌ Tekrarlanan karakterler kullanılamaz (aaa, 111, vb.)

---

### Yöntem 2: Web UI ile Kayıt

1. Giriş: https://www.ailydian.com/auth
2. "Kayıt Ol" butonuna tıklayın
3. Bilgileri doldurun:
   - Email: `admin@ailydian.com`
   - Password: Güçlü bir şifre (yukarıdaki kurallara uygun)
   - Name: `Sardag Admin`
   - Phone: `+90XXXXXXXXXX`
4. "Kayıt Ol" butonuna tıklayın

---

### Yöntem 3: Doğrudan Database ile Oluşturma

```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro
node -e "
const User = require('./backend/models/User');

(async () => {
  try {
    const user = await User.createUser({
      email: 'admin@ailydian.com',
      password: 'Admin@2025!Secure',
      name: 'Sardag Admin',
      phone: '+905551234567'
    });

    console.log('✅ Admin user created:', user);

    // Update role to ADMIN
    const updated = await User.updateUserRole(user.id, 'ADMIN');
    console.log('✅ User role updated to ADMIN');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
"
```

---

## 🔑 Giriş Yapma

### Web UI ile Login

1. Giriş sayfası: https://www.ailydian.com/auth
2. Email: `admin@ailydian.com`
3. Password: Oluşturduğunuz şifre
4. "Giriş Yap" butonuna tıklayın

### API ile Login

**Endpoint**: `POST https://www.ailydian.com/api/auth/login`

**Request Body**:
```json
{
  "email": "admin@ailydian.com",
  "password": "Admin@2025!Secure"
}
```

**cURL Komutu**:
```bash
curl -X POST "https://www.ailydian.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ailydian.com",
    "password": "Admin@2025!Secure"
  }'
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@ailydian.com",
    "name": "Sardag Admin",
    "role": "ADMIN",
    "subscription": "free",
    "credits": 100
  }
}
```

---

## 🛡️ Role-Based Access Control (RBAC)

### Mevcut Roller

1. **USER** (Default)
   - Normal kullanıcı
   - Dashboard erişimi
   - Chat, API kullanımı
   - Kendi verileri üzerinde tam kontrol

2. **MODERATOR**
   - Kullanıcı şikayetlerini görme
   - Şikayet moderasyonu
   - İçerik yönetimi

3. **ADMIN**
   - Tüm sistem erişimi
   - Kullanıcı yönetimi
   - Role değiştirme
   - Sistem konfigürasyonu
   - Tüm API'ler üzerinde tam kontrol

4. **SUPER_ADMIN**
   - En üst seviye yetki
   - Database yönetimi
   - Sistem güvenlik ayarları
   - Kritik işlemler

---

## 📊 Dashboard Özellikleri

### Main Dashboard
- Kullanıcı bilgileri
- Kullanım istatistikleri
- Kredi bakiyesi
- Son aktiviteler
- Quick actions

### Admin Dashboard (Sadece ADMIN/SUPER_ADMIN)
- Tüm kullanıcıları görme
- Kullanıcı rollerini değiştirme
- Sistem metrikleri
- Log görüntüleme
- Brand yönetimi
- Complaint moderasyonu

---

## 🔐 Two-Factor Authentication (2FA)

### 2FA Aktifleştirme

1. Dashboard'a giriş yapın
2. Settings → Security
3. "Enable 2FA" butonuna tıklayın
4. QR kodu Google Authenticator ile tarayın
5. 6 haneli kodu girin
6. 2FA aktif edildi ✅

### 2FA ile Giriş

1. Email ve password ile giriş yapın
2. 2FA kodu istenir
3. Google Authenticator'dan 6 haneli kodu girin
4. Giriş tamamlandı ✅

---

## 🧪 Test Kullanıcıları (Geliştirme Ortamı)

### Test User 1 - Normal Kullanıcı
```
Email: test@ailydian.com
Password: Test@2025!User
Role: USER
```

### Test User 2 - Moderator
```
Email: moderator@ailydian.com
Password: Mod@2025!Secure
Role: MODERATOR
```

### Test User 3 - Admin
```
Email: admin@ailydian.com
Password: Admin@2025!Secure
Role: ADMIN
```

**NOT**: Bu test kullanıcılarını oluşturmak için yukarıdaki yöntemleri kullanın.

---

## 🔒 Security Features

### Password Security
- ✅ Bcrypt hashing (12 rounds)
- ✅ Strong password validation
- ✅ Common password prevention
- ✅ Sequential character prevention
- ✅ Rate limiting (to prevent brute force)

### Session Security
- ✅ JWT tokens (7 days expiry)
- ✅ Refresh tokens (30 days expiry)
- ✅ IP address tracking
- ✅ User agent tracking
- ✅ Session invalidation on logout
- ✅ Activity logging

### API Security
- ✅ CORS enabled
- ✅ CSRF protection
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS prevention

---

## 📁 Database Location

```bash
# SQLite Database
/Users/sardag/Desktop/ailydian-ultra-pro/database/ailydian.db

# Backup Location
/Users/sardag/Desktop/ailydian-ultra-pro/database/backups/
```

### Database Tables
- `users` - Kullanıcı bilgileri
- `sessions` - Aktif oturumlar
- `activity_log` - Kullanıcı aktiviteleri
- `usage_stats` - Kullanım istatistikleri

---

## 🔧 Troubleshooting

### Problem: Giriş yapamıyorum
**Çözüm**:
1. Email adresinizi kontrol edin
2. Şifrenizi doğru yazdığınızdan emin olun
3. Browser cache'ini temizleyin
4. Farklı browser deneyin

### Problem: "Invalid email or password" hatası
**Çözüm**:
1. Şifre sıfırlama linki isteyin
2. Veya database'de kullanıcı olup olmadığını kontrol edin

### Problem: 2FA kodu çalışmıyor
**Çözüm**:
1. Telefonunuzun saatinin doğru olduğundan emin olun
2. QR kodu yeniden tarayın
3. Backup kodları kullanın

### Problem: Dashboard yüklenmiyor
**Çözüm**:
1. F12 → Console'da hata kontrolü yapın
2. Auth token'ın geçerli olduğundan emin olun
3. Logout → Login yapın

---

## 📞 Support

**Email**: support@ailydian.com
**GitHub**: https://github.com/ailydian/ultra-pro
**Documentation**: https://www.ailydian.com/docs

---

## ✅ Önerilen İlk Adımlar

1. **Admin Kullanıcısı Oluştur**
   ```bash
   curl -X POST "https://www.ailydian.com/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@ailydian.com","password":"Admin@2025!Secure","name":"Sardag Admin"}'
   ```

2. **Login Yap**
   ```bash
   curl -X POST "https://www.ailydian.com/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@ailydian.com","password":"Admin@2025!Secure"}'
   ```

3. **Role'ü ADMIN Yap**
   ```javascript
   // Node.js ile
   const User = require('./backend/models/User');
   await User.updateUserRole(1, 'ADMIN');
   ```

4. **Dashboard'a Eriş**
   - https://www.ailydian.com/dashboard
   - Token'ı localStorage'a kaydet
   - Dashboard otomatik yüklenecek

---

**Geliştirici**: Claude + Sardag
**Tarih**: 17 Ekim 2025
**Versiyon**: v1.0 - Authentication System

🔐 **SECURE AUTHENTICATION READY!** ✅
