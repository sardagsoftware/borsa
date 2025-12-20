# 🔑 API Keys Kurulum Rehberi

Bu dosya, Ailydian Ultra Pro platformunda AI API'lerini nasıl aktif edeceğinizi gösterir.

## 📍 API Key'leri Nereye Ekleyeceğim?

**Dosya yolu:** `/Users/sardag/Desktop/ailydian-ultra-pro/.env`

Bu dosyayı herhangi bir text editörle (VS Code, Sublime, TextEdit) açabilirsiniz.

## 🤖 Mevcut API Durumu

### ✅ Aktif API'ler

1. **LyDian Research AX9F7E2B** (✅ ÇALIŞIYOR!)
   ```env
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
   ```
   - **Model:** AX9F7E2B 3.5 Sonnet (Default)
   - **Özellikler:** En akıllı model, uzun context, Türkçe destek
   - **Nereden alınır:** https://console.anthropic.com/

### ⏳ Eklenebilir API'ler

2. **LyDian Labs OX5C9E2B**
   ```env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
   ```
   - **Nasıl alınır:**
     1. https://platform.openai.com/ adresine git
     2. Sign up / Login
     3. API Keys bölümüne git
     4. "Create new secret key" tıkla
     5. Key'i kopyala ve `.env` dosyasına yapıştır
   - **Not:** OX5C9E2B için ücretli hesap gerekli ($0.01 - $0.03 per 1K tokens)

3. **LyDian Acceleration (Ultra Hızlı)**
   ```env
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
   ```
   - **Nasıl alınır:**
     1. https://console.groq.com/ adresine git
     2. Sign up with Google/GitHub
     3. API Keys → Create API Key
     4. Key'i kopyala ve `.env` dosyasına yapıştır
   - **Not:** ÜCRETSİZ! Çok hızlı inference (500+ tokens/sec)
   - **Modeller:** GX4B7F3C, LyDian Velocity

4. **Google AI (LyDian Vision)**
   ```env
   GOOGLE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxx
   ```
   - **Nasıl alınır:**
     1. https://makersuite.google.com/app/apikey adresine git
     2. Google hesabınla giriş yap
     3. "Create API Key" tıkla
     4. Key'i kopyala ve `.env` dosyasına yapıştır
   - **Not:** ÜCRETSİZ! LyDian Vision 2.0 Flash
   - **Özellikler:** Video generation (Veo), multimodal

## 🎬 Google Veo Video Generation

Video oluşturma özelliği için `GOOGLE_AI_API_KEY` gereklidir.

**Nasıl kullanılır:**
1. Chat sayfasında video butonuna (🎬) tıklayın
2. Video açıklaması girin: "Güneş batımında okyanus, kuşlar uçuyor"
3. Duration ve resolution seçin
4. "video oluştur" tıklayın

## 📝 .env Dosyasını Düzenleme

### Yöntem 1: VS Code ile
```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro
code .env
```

### Yöntem 2: Terminal ile
```bash
nano /Users/sardag/Desktop/ailydian-ultra-pro/.env
```

### Yöntem 3: TextEdit ile
```bash
open -a TextEdit /Users/sardag/Desktop/ailydian-ultra-pro/.env
```

## 🔄 Değişiklikleri Uygulama

API key ekledikten sonra server'ı yeniden başlatın:

```bash
# Terminal'de
pkill -f "node server.js"
PORT=3100 node server.js
```

Veya browser'da:
1. http://localhost:3100/chat.html sayfasını yenileyin
2. Yeni API'ler otomatik olarak aktif olacak

## 🧪 API Test Etme

### AX9F7E2B Test (Varsayılan):
```
Soru: "Merhaba, nasılsın?"
Beklenen: Gerçek AX9F7E2B yanıtı (akıllı, detaylı)
```

### LyDian Labs Test:
1. Model seçiciden "OX5C9E2B Turbo" seçin (chat başlığında)
2. Soru sorun
3. LyDian Labs API'den yanıt alacaksınız

### LyDian Acceleration Test (Ultra Hızlı):
1. "GX4B7F3C" seçin
2. Hızlı yanıt alacaksınız (<1 saniye)

## 🚨 Önemli Notlar

### Güvenlik:
- ⚠️ **ASLA** API keylerini GitHub'a push etmeyin!
- `.env` dosyası `.gitignore` içinde olmalı
- Production'da environment variables kullanın

### Maliyet:
- **ÜCRETSİZ:** LyDian Acceleration, Google AI (limitle)
- **ÜCRETLİ:** LyDian Labs OX5C9E2B ($0.01-0.03/1K tokens)
- **ÜCRETLİ:** LyDian Research AX9F7E2B ($3-15/1M tokens)

### Rate Limits:
- AX9F7E2B: 50 requests/minute (Tier 1)
- LyDian Labs: 500 requests/minute (Tier 1)
- LyDian Acceleration: 30 requests/minute (FREE)
- Google AI: 60 requests/minute (FREE)

## 📊 API Karşılaştırması

| Provider | Model | Hız | Akıllılık | Türkçe | Fiyat |
|----------|-------|-----|-----------|--------|-------|
| LyDian Research | AX9F7E2B 3.5 Sonnet | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Mükemmel | $$ |
| LyDian Labs | OX5C9E2B Turbo | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Mükemmel | $$$ |
| LyDian Acceleration | GX4B7F3C | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ İyi | ÜCRETSİZ |
| Google | LyDian Vision 2.0 Flash | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ İyi | ÜCRETSİZ |

## 🆘 Sorun Giderme

### "API çağrısı başarısız" hatası:
1. `.env` dosyasında key doğru mu kontrol edin
2. Keyde boşluk veya satır sonu karakteri yok mu?
3. Server'ı yeniden başlattınız mı?
4. Browser console'da hata var mı? (F12)

### "401 Unauthorized" hatası:
- API key yanlış veya expire olmuş
- Yeni key oluşturun ve güncelleyin

### "429 Rate Limit" hatası:
- Çok fazla istek gönderdiniz
- Birkaç dakika bekleyin
- Ücretli plana geçin (LyDian Labs/AX9F7E2B)

## 📚 Ek Kaynaklar

- [LyDian Research API Docs](https://docs.anthropic.com/)
- [LyDian Labs API Docs](https://platform.openai.com/docs)
- [LyDian Acceleration API Docs](https://console.groq.com/docs)
- [Google AI Docs](https://ai.google.dev/docs)

---

**Son Güncelleme:** 30 Eylül 2025
**Sürüm:** 1.0.0
**Durum:** ✅ AX9F7E2B Aktif, Diğerleri Eklenebilir
