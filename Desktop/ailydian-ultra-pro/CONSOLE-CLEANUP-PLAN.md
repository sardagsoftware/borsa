# 🧹 Console Cleanup & AI Enhancement Plan

## Tespitler

### 1. Console Log Kirliliği
- ✅ WebSocket connections her açılıp kapanışta log basıyor (çok fazla)
- ✅ Health checks her 15 saniyede log basıyor
- ✅ dotenv mesajları (7 adet)
- ✅ Expert sistem başlatma mesajları (12 sistem)

### 2. Hatalar
```
❌ Translation System başlatma hatası
❌ SEO System başlatma hatası
❌ System Scanner Bot başlatma hatası
❌ LyDian Research API Error: invalid x-api-key
```

### 3. AI Response Language
- Şu anda Türkçe yanıtlar
- İngilizce'ye çevrilmeli

## Çözüm Planı

### A. QUIET_MODE Ayarları (.env)
```env
# Console log azaltma
QUIET_MODE=true
LOG_LEVEL=error
DISABLE_HEALTH_CHECK_LOGS=true
DISABLE_WEBSOCKET_LOGS=true
DISABLE_DOTENV_TIPS=true
```

### B. Medical AI Language Fix
`server.js` içinde medical chat endpoint:
```javascript
// Force English responses for medical chat
const systemPrompt = `You are a medical AI assistant specializing in ${specialization}.
IMPORTANT: Always respond in English, regardless of the input language.
Provide evidence-based medical information...`;
```

### C. Azure SDK + RAG Enhancement
```javascript
// Use Azure LyDian Labs with RAG
const response = await openai.chat.completions.create({
  model: "OX7A3F8D",
  messages: [
    { role: "system", content: medicalSystemPrompt },
    { role: "user", content: ragEnhancedQuery }
  ],
  temperature: 0.3,
  max_tokens: 2000
});
```

### D. Console Log Cleanup
1. WebSocket logs → sadece error'da
2. Health check logs → sadece state değişimlerinde
3. dotenv tips → tamamen kapat
4. Expert sistem logs → sadece hatalarda

## Uygulama

Bu değişiklikler için:
- [ ] .env güncelleme
- [ ] server.js medical chat endpoint güncelleme
- [ ] Health monitor log seviyesi düşürme
- [ ] WebSocket log filtreleme
- [ ] LyDian Research API key düzeltme (.env)
