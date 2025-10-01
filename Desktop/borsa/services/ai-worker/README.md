# AILYDIAN AI Microservice (Railway)

## 🎯 Overview
Lightweight AI processing microservice designed for Railway deployment. Handles heavy AI computations separately from Next.js frontend.

## 🚀 Quick Start

### Local Development
```bash
npm install
npm run dev
```

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Get public URL
railway domain
```

## 📡 API Endpoints

### Health Check
```
GET /health
Response: { status: "ok", service: "ailydian-ai-core", timestamp: 1234567890 }
```

### AI Processing
```
POST /v1/process
Body: { task: "echo", input: "data" }
Response: { ok: true, task: "echo", summary: "data", ... }
```

### Trading Signal
```
POST /v1/signal
Body: { symbol: "BTCUSDT" }
Response: { success: true, signal: {...} }
```

### Batch Processing
```
POST /v1/batch
Body: { symbols: ["BTCUSDT", "ETHUSDT"] }
Response: { success: true, results: [...] }
```

## 🏗️ Architecture

```
Next.js (Vercel)          Railway (Microservice)
┌─────────────┐          ┌─────────────────┐
│   UI/Pages  │          │  AI Processing  │
│             │          │  Heavy Libs     │
│  /api/proxy │─────────→│  /v1/*          │
│             │  HTTP    │  No Size Limit  │
└─────────────┘          └─────────────────┘
   < 250MB                  Unlimited
```

## 🔧 Environment Variables

```bash
PORT=8080  # Railway sets this automatically
```

## 📦 Dependencies
- `hono` - Ultra-fast web framework
- `@hono/node-server` - Node.js adapter for Hono

## 🎨 Adding Real AI Models

Replace stub logic in `src/server.js` with:
- TensorFlow.js for ML models
- ONNX Runtime for optimized inference
- OpenCV for image processing
- Any heavy computation library

Railway has no bundle size limits!

## 💰 Cost Estimate
- Railway Hobby: $5/month (512MB RAM, always-on)
- Railway Pro: $20/month (8GB RAM, priority support)

## 🔗 Integration with Next.js

See `src/app/api/railway-proxy/route.ts` in main project for proxy implementation.

## 📊 Monitoring

Railway provides:
- Real-time logs
- Metrics dashboard
- Automatic restarts
- Health checks

## 🚀 Production Checklist
- [ ] Replace stub endpoints with real AI logic
- [ ] Add authentication/API keys
- [ ] Configure CORS for your domain
- [ ] Set up monitoring/alerts
- [ ] Enable auto-scaling
- [ ] Add rate limiting
