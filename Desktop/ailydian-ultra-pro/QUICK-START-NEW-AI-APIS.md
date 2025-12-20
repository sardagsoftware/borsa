# Quick Start Guide - New AI APIs

## 🚀 Get Started in 5 Minutes

### 1. Environment Check
Your API keys are already configured! ✅
```bash
# Verify .env has:
AZURE_AI_FOUNDRY_ENDPOINT=https://ailydian-openai.services.ai.azure.com/...
AZURE_AI_FOUNDRY_API_KEY=FoUbK...
ANTHROPIC_API_KEY=sk-ant-api03-9c9c7CfPZlvANS_n...
GOOGLE_AI_API_KEY=AIzaSyCVhkPVM2ag7fcOGgzhPxEfjnEGYJI0P60
AZURE_SPEECH_KEY=4b34da7b17144b1bab1f18f20ebcee1d
AZURE_SPEECH_REGION=swedencentral
```

### 2. Start Server
```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro
npm start
```
Server runs on: http://localhost:3100

### 3. Run Tests
```bash
node test-new-ai-apis.js
```

### 4. Test Individual APIs

#### LyDian Core-5 (Azure AI Foundry)
```bash
curl -X POST http://localhost:3100/api/chat/gpt5 \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! What can you do?",
    "model": "gpt-5",
    "max_tokens": 100
  }'
```

#### AX9F7E2B 3.5 Sonnet
```bash
curl -X POST http://localhost:3100/api/chat/AX9F7E2B \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain quantum computing briefly",
    "model": "AX9F7E2B",
    "max_tokens": 150
  }'
```

#### LyDian Vision 2.0 Flash
```bash
curl -X POST http://localhost:3100/api/chat/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is machine learning?",
    "model": "gemini-2.0-flash",
    "max_tokens": 100
  }'
```

#### Text-to-Speech (Turkish)
```bash
curl -X POST http://localhost:3100/api/speech/synthesize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Merhaba, ben Ailydian yapay zeka asistanıyım.",
    "language": "tr-TR",
    "voice": "tr-TR-EmelNeural"
  }'
```

#### Web Search
```bash
curl "http://localhost:3100/api/web-search?q=artificial+intelligence&num=5&language=tr"
```

---

## 📦 Available Endpoints

### Chat APIs
- `POST /api/chat/gpt5` - LyDian Core-5 chat
- `POST /api/chat/AX9F7E2B` - AX9F7E2B chat
- `POST /api/chat/gemini` - LyDian Vision chat

### Speech APIs
- `POST /api/speech/transcribe` - Speech-to-text
- `POST /api/speech/synthesize` - Text-to-speech
- `GET /api/speech/voices` - List voices

### Search APIs
- `GET /api/web-search` - Search the web
- `GET /api/web-search/stats` - Cache statistics

### Info APIs
- `GET /api/AX9F7E2B/models` - List AX9F7E2B models
- `GET /api/gemini/models` - List LyDian Vision models

---

## 🧪 Frontend Integration

### JavaScript Fetch Example
```javascript
// Chat with LyDian Core-5
async function chatGPT5(message) {
  const res = await fetch('http://localhost:3100/api/chat/gpt5', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      model: 'gpt-5',
      temperature: 0.7,
      max_tokens: 2000
    })
  });
  const data = await res.json();
  console.log(data.response);
  return data;
}

// Chat with AX9F7E2B
async function chatAX9F7E2B(message) {
  const res = await fetch('http://localhost:3100/api/chat/AX9F7E2B', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      model: 'AX9F7E2B',
      max_tokens: 4096
    })
  });
  return await res.json();
}

// Chat with LyDian Vision
async function chatGemini(message) {
  const res = await fetch('http://localhost:3100/api/chat/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      model: 'gemini-2.0-flash',
      max_tokens: 8192
    })
  });
  return await res.json();
}

// Text-to-Speech
async function speakText(text) {
  const res = await fetch('http://localhost:3100/api/speech/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: text,
      language: 'tr-TR',
      voice: 'tr-TR-EmelNeural'
    })
  });
  const data = await res.json();

  // Play audio
  const audio = new Audio('data:audio/mp3;base64,' + data.audioData);
  audio.play();
}

// Web Search
async function searchWeb(query) {
  const res = await fetch(
    `http://localhost:3100/api/web-search?q=${encodeURIComponent(query)}&num=10`
  );
  return await res.json();
}

// Usage
chatGPT5("Hello LyDian Core-5!");
chatAX9F7E2B("Hello AX9F7E2B!");
chatGemini("Hello LyDian Vision!");
speakText("Merhaba dünya!");
searchWeb("artificial intelligence");
```

---

## 📚 Full Documentation

- **Implementation Report**: `IMPLEMENTATION-REPORT.md`
- **API Documentation**: `NEW-AI-APIS-DOCUMENTATION.md`
- **Test Suite**: `test-new-ai-apis.js`

---

## 🐛 Troubleshooting

### API Returns 500 Error
- Check API keys in `.env`
- Verify internet connection
- Check server logs

### API Returns 401 Error
- API key is invalid or expired
- Update API key in `.env`
- Restart server

### API Returns 429 Error
- Rate limit exceeded
- Wait 1 minute
- Check rate limits in documentation

### Test Suite Warnings
- Some API keys may need configuration
- Services may be temporarily unavailable
- Check specific error messages

---

## ✅ Next Steps

1. ✅ Test all APIs
2. ✅ Integrate with frontend
3. 🔄 Phase 2: RAG (Document Q&A)
4. 🔄 Phase 3: Video AI

---

**Ready to use!** 🚀
