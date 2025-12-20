# New AI APIs Documentation

## Overview
This document describes the newly implemented AI API endpoints for Ailydian Ultra Pro. All endpoints are production-ready with proper error handling, rate limiting, and CORS support.

## Implemented APIs

### 1. LyDian Core-5 API (Azure AI Foundry)
**File**: `/api/chat-gpt5.js`
**Endpoints**:
- `POST /api/chat/gpt5` - Main endpoint
- `POST /api/gpt5` - Alias

**Supported Models**:
- `gpt-5` - Most advanced LyDian Core-5 model (128K context)
- `gpt-5-mini` - Efficient variant (64K context)
- `gpt-5-nano` - Fast, lightweight (32K context)
- `gpt-5-chat` - Optimized for conversations (128K context)

**Request Body**:
```json
{
  "message": "Your message here",
  "messages": [], // Optional: conversation history
  "model": "gpt-5",
  "temperature": 0.7,
  "max_tokens": 4096,
  "stream": false,
  "systemPrompt": "Optional system prompt"
}
```

**Response**:
```json
{
  "success": true,
  "response": "AI response text",
  "model": "gpt-5",
  "provider": "Azure AI Foundry",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60
  },
  "timestamp": "2025-10-03T..."
}
```

**Features**:
- Streaming support
- Rate limiting (100 req/min)
- Automatic error handling
- Azure AI Foundry integration

---

### 2. AX9F7E2B API (LyDian Research)
**File**: `/api/chat-AX9F7E2B.js`
**Endpoints**:
- `POST /api/chat/AX9F7E2B` - Chat endpoint
- `POST /api/AX9F7E2B/chat` - Alias
- `GET /api/AX9F7E2B/models` - List available models

**Supported Models**:
- `AX9F7E2B` - Most intelligent (200K context)
- `AX9F7E2B-latest` - Latest version
- `AX4D8C1A` - Most powerful (200K context)
- `AX9F7E2B-3-sonnet` - Balanced (200K context)
- `AX2B6E9F` - Fastest (200K context)

**Request Body**:
```json
{
  "message": "Your message here",
  "messages": [], // Optional: conversation history
  "model": "AX9F7E2B",
  "temperature": 1.0,
  "max_tokens": 4096,
  "stream": false,
  "systemPrompt": "Optional system instructions"
}
```

**Response**:
```json
{
  "success": true,
  "response": "AX9F7E2B's response",
  "model": "AX9F7E2B",
  "provider": "LyDian Research",
  "usage": {
    "input_tokens": 15,
    "output_tokens": 120
  },
  "stop_reason": "end_turn",
  "timestamp": "2025-10-03T..."
}
```

**Features**:
- Full LyDian Research SDK integration
- Streaming support
- Rate limiting (50 req/min)
- System prompts support
- Conversation history

---

### 3. LyDian Vision API (Google AI)
**File**: `/api/chat-gemini.js`
**Endpoints**:
- `POST /api/chat/gemini` - Chat endpoint
- `POST /api/gemini/chat` - Alias
- `GET /api/gemini/models` - List available models

**Supported Models**:
- `gemini-2.0-flash` - Latest LyDian Vision 2.0 (1M context)
- `gemini-2.0-flash-thinking` - Extended reasoning (32K context)
- `GE6D8A4F` - Most capable (2M context)
- `gemini-1.5-flash` - Fast and versatile (1M context)
- `gemini-1.5-flash-8b` - Efficient 8B model (1M context)

**Request Body**:
```json
{
  "message": "Your message here",
  "messages": [], // Optional: conversation history
  "model": "gemini-2.0-flash",
  "temperature": 1.0,
  "max_tokens": 8192,
  "stream": false,
  "systemPrompt": "Optional system instructions",
  "topP": 0.95,
  "topK": 40
}
```

**Response**:
```json
{
  "success": true,
  "response": "LyDian Vision's response",
  "model": "gemini-2.0-flash",
  "provider": "Google AI",
  "usage": {
    "promptTokens": 20,
    "candidatesTokens": 150,
    "totalTokens": 170
  },
  "finishReason": "STOP",
  "timestamp": "2025-10-03T..."
}
```

**Features**:
- Latest LyDian Vision 2.0 Flash support
- Streaming responses
- Rate limiting (60 req/min)
- System instructions
- Advanced sampling (topP, topK)

---

### 4. Speech API (Azure Speech Services)
**File**: `/api/speech.js`
**Endpoints**:
- `POST /api/speech/transcribe` - Speech-to-Text
- `POST /api/speech/synthesize` - Text-to-Speech
- `GET /api/speech/voices` - List available voices

#### Speech-to-Text (Transcription)
**Request Body**:
```json
{
  "audioData": "base64_encoded_audio",
  "audioUrl": "https://example.com/audio.wav",
  "language": "tr-TR",
  "format": "wav"
}
```

**Response**:
```json
{
  "success": true,
  "text": "Transcribed text here",
  "language": "tr-TR",
  "duration": 5000,
  "timestamp": "2025-10-03T..."
}
```

#### Text-to-Speech (Synthesis)
**Request Body**:
```json
{
  "text": "Merhaba, ben Ailydian yapay zeka asistanıyım.",
  "language": "tr-TR",
  "voice": "tr-TR-EmelNeural",
  "rate": "1.0",
  "pitch": "0%",
  "format": "audio-16khz-32kbitrate-mono-mp3"
}
```

**Response**:
```json
{
  "success": true,
  "audioData": "base64_encoded_audio",
  "format": "audio-16khz-32kbitrate-mono-mp3",
  "voice": "tr-TR-EmelNeural",
  "language": "tr-TR",
  "textLength": 45,
  "timestamp": "2025-10-03T..."
}
```

**Features**:
- Azure Speech SDK integration
- Turkish language support
- Multiple voice options
- SSML support for advanced control
- Audio format flexibility
- Rate limiting (100 req/min)

**Turkish Voices**:
- `tr-TR-EmelNeural` - Female
- `tr-TR-AhmetNeural` - Male

---

### 5. Web Search API
**File**: `/api/web-search.js`
**Endpoints**:
- `GET /api/web-search` - Search the web
- `POST /api/web-search/clear-cache` - Clear cache
- `GET /api/web-search/stats` - Cache statistics

#### Search Query
**Query Parameters**:
```
?q=search+query
&num=10           // Number of results (default: 10)
&start=1          // Starting index (default: 1)
&language=tr      // Search language (default: tr)
&safe=active      // Safe search (default: active)
&nocache=false    // Skip cache (default: false)
```

**Example**:
```
GET /api/web-search?q=artificial+intelligence&num=5&language=tr
```

**Response**:
```json
{
  "success": true,
  "cached": false,
  "query": "artificial intelligence",
  "totalResults": 1500000,
  "searchTime": 0.45,
  "results": [
    {
      "title": "Result Title",
      "link": "https://example.com",
      "snippet": "Description of the result...",
      "displayLink": "example.com",
      "formattedUrl": "https://example.com/page",
      "image": "https://...",
      "thumbnail": "https://..."
    }
  ],
  "resultCount": 5,
  "timestamp": "2025-10-03T..."
}
```

**Features**:
- Google Custom Search API integration
- DuckDuckGo fallback (free, no API key)
- 1-hour result caching
- Rate limiting (50 req/min)
- Turkish language support
- Cache management

---

## Configuration

### Environment Variables Required

Add these to your `.env` file:

```bash
# Azure AI Foundry (LyDian Core-5)
AZURE_AI_FOUNDRY_ENDPOINT=https://ailydian-openai.services.ai.azure.com/api/projects/ailydian-openai-project
AZURE_AI_FOUNDRY_API_KEY=FoUbKXu08Pks2btAoMj4hZwhbQrFHhY7zX9QRyjqF54VHvhSAAYwJQQJ99BJACfhMk5XJ3w3AAABACOG88Te

# LyDian Research (AX9F7E2B)
ANTHROPIC_API_KEY=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

# Google AI (LyDian Vision & Search)
GOOGLE_AI_API_KEY=AIzaSyCVhkPVM2ag7fcOGgzhPxEfjnEGYJI0P60
GOOGLE_SEARCH_ENGINE_ID=optional_custom_search_id

# Azure Speech Services
AZURE_SPEECH_KEY=4b34da7b17144b1bab1f18f20ebcee1d
AZURE_SPEECH_REGION=swedencentral
```

---

## Rate Limits

| API | Rate Limit | Window |
|-----|------------|--------|
| LyDian Core-5 | 100 req | 1 minute |
| AX9F7E2B | 50 req | 1 minute |
| LyDian Vision | 60 req | 1 minute |
| Speech | 100 req | 1 minute |
| Search | 50 req | 1 minute |

---

## Error Handling

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2025-10-03T..."
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad request (invalid parameters)
- `401` - Authentication failed (invalid API key)
- `405` - Method not allowed
- `429` - Rate limit exceeded
- `500` - Internal server error
- `503` - Service unavailable

---

## Testing

### Quick Test
```bash
# Start server
npm start

# Run test suite
node test-new-ai-apis.js
```

### Manual Testing with cURL

**LyDian Core-5**:
```bash
curl -X POST http://localhost:3100/api/chat/gpt5 \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "model": "gpt-5", "max_tokens": 100}'
```

**AX9F7E2B**:
```bash
curl -X POST http://localhost:3100/api/chat/AX9F7E2B \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain AI", "model": "AX9F7E2B", "max_tokens": 100}'
```

**LyDian Vision**:
```bash
curl -X POST http://localhost:3100/api/chat/gemini \
  -H "Content-Type: application/json" \
  -d '{"message": "What is ML?", "model": "gemini-2.0-flash", "max_tokens": 100}'
```

**Speech Synthesis**:
```bash
curl -X POST http://localhost:3100/api/speech/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "Merhaba dünya", "language": "tr-TR", "voice": "tr-TR-EmelNeural"}'
```

**Web Search**:
```bash
curl "http://localhost:3100/api/web-search?q=AI&num=5"
```

---

## File Structure

```
/Users/sardag/Desktop/ailydian-ultra-pro/
├── api/
│   ├── chat-gpt5.js          (263 lines)
│   ├── chat-AX9F7E2B.js        (253 lines)
│   ├── chat-gemini.js        (337 lines)
│   ├── speech.js             (349 lines)
│   └── web-search.js         (335 lines)
├── server.js                  (updated with routes)
├── test-new-ai-apis.js        (test suite)
└── NEW-AI-APIS-DOCUMENTATION.md (this file)
```

**Total Lines of Code**: ~1,537 lines

---

## Production Checklist

- [x] All API endpoints implemented
- [x] Error handling and validation
- [x] Rate limiting implemented
- [x] CORS headers configured
- [x] Logging and monitoring
- [x] Environment variable configuration
- [x] Streaming support (where applicable)
- [x] Caching (web search)
- [x] Documentation
- [x] Test suite

---

## Next Steps

### Phase 2: RAG (Retrieval-Augmented Generation)
- Document embedding with Azure LyDian Labs
- Vector database integration (Cosmos DB or Azure AI Search)
- Document upload and indexing
- Semantic search capabilities

### Phase 3: Video AI
- Video generation with Veo (Google)
- Video analysis and transcription
- Frame extraction and analysis
- Video summarization

### Phase 4: Advanced Features
- Multi-modal RAG (images + text + video)
- Long-form content generation
- Advanced analytics and insights
- Custom fine-tuning support

---

## Support & Issues

For issues or questions:
1. Check environment variables are configured
2. Verify API keys are valid
3. Check rate limits
4. Review server logs
5. Run test suite: `node test-new-ai-apis.js`

---

## License
Proprietary - Ailydian Ultra Pro
Copyright (c) 2025
