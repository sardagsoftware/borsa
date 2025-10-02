# 🔑 API Keys Kurulum Rehberi

Bu dosya, Ailydian Ultra Pro platformunda AI API'lerini nasıl aktif edeceğinizi gösterir.

## 📍 API Key'leri Nereye Ekleyeceğim?

**Dosya yolu:** `/Users/sardag/Desktop/ailydian-ultra-pro/.env`

Bu dosyayı herhangi bir text editörle (VS Code, Sublime, TextEdit) açabilirsiniz.

## 🤖 Mevcut API Durumu

### ✅ Aktif API'ler

1. **Anthropic Claude** (✅ ÇALIŞIYOR!)
   ```env
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx
   ```
   - **Model:** Claude 3.5 Sonnet (Default)
   - **Özellikler:** En akıllı model, uzun context, Türkçe destek
   - **Nereden alınır:** https://console.anthropic.com/

### ⏳ Eklenebilir API'ler

2. **OpenAI GPT-4**
   ```env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
   ```
   - **Nasıl alınır:**
     1. https://platform.openai.com/ adresine git
     2. Sign up / Login
     3. API Keys bölümüne git
     4. "Create new secret key" tıkla
     5. Key'i kopyala ve `.env` dosyasına yapıştır
   - **Not:** GPT-4 için ücretli hesap gerekli ($0.01 - $0.03 per 1K tokens)

3. **Groq (Ultra Hızlı)**
   ```env
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
   ```
   - **Nasıl alınır:**
     1. https://console.groq.com/ adresine git
     2. Sign up with Google/GitHub
     3. API Keys → Create API Key
     4. Key'i kopyala ve `.env` dosyasına yapıştır
   - **Not:** ÜCRETSİZ! Çok hızlı inference (500+ tokens/sec)
   - **Modeller:** Mixtral-8x7B, Llama 3.1

4. **Google AI (Gemini)**
   ```env
   GOOGLE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxx
   ```
   - **Nasıl alınır:**
     1. https://makersuite.google.com/app/apikey adresine git
     2. Google hesabınla giriş yap
     3. "Create API Key" tıkla
     4. Key'i kopyala ve `.env` dosyasına yapıştır
   - **Not:** ÜCRETSİZ! Gemini 2.0 Flash
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

### Claude Test (Varsayılan):
```
Soru: "Merhaba, nasılsın?"
Beklenen: Gerçek Claude yanıtı (akıllı, detaylı)
```

### OpenAI Test:
1. Model seçiciden "GPT-4 Turbo" seçin (chat başlığında)
2. Soru sorun
3. OpenAI API'den yanıt alacaksınız

### Groq Test (Ultra Hızlı):
1. "Mixtral-8x7B" seçin
2. Hızlı yanıt alacaksınız (<1 saniye)

## 🚨 Önemli Notlar

### Güvenlik:
- ⚠️ **ASLA** API keylerini GitHub'a push etmeyin!
- `.env` dosyası `.gitignore` içinde olmalı
- Production'da environment variables kullanın

### Maliyet:
- **ÜCRETSİZ:** Groq, Google AI (limitle)
- **ÜCRETLİ:** OpenAI GPT-4 ($0.01-0.03/1K tokens)
- **ÜCRETLİ:** Anthropic Claude ($3-15/1M tokens)

### Rate Limits:
- Claude: 50 requests/minute (Tier 1)
- OpenAI: 500 requests/minute (Tier 1)
- Groq: 30 requests/minute (FREE)
- Google AI: 60 requests/minute (FREE)

## 📊 API Karşılaştırması

| Provider | Model | Hız | Akıllılık | Türkçe | Fiyat |
|----------|-------|-----|-----------|--------|-------|
| Anthropic | Claude 3.5 Sonnet | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Mükemmel | $$ |
| OpenAI | GPT-4 Turbo | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Mükemmel | $$$ |
| Groq | Mixtral-8x7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ İyi | ÜCRETSİZ |
| Google | Gemini 2.0 Flash | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ İyi | ÜCRETSİZ |

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
- Ücretli plana geçin (OpenAI/Claude)

## 📚 Ek Kaynaklar

- [Anthropic API Docs](https://docs.anthropic.com/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Groq API Docs](https://console.groq.com/docs)
- [Google AI Docs](https://ai.google.dev/docs)

---

**Son Güncelleme:** 30 Eylül 2025
**Sürüm:** 1.0.0
**Durum:** ✅ Claude Aktif, Diğerleri Eklenebilir
