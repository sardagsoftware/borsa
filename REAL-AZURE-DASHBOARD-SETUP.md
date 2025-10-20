# 🔥 Gerçek Azure Dashboard Kurulum Rehberi

**Localhost'ta Gerçek Azure Verilerini Görüntüleme**

---

## ✅ Yapılanlar

### 1. Azure SDK Paketleri Yüklendi
```bash
✅ @azure/identity
✅ @azure/arm-monitor
✅ @azure/arm-resources
✅ @azure/arm-containerservice
✅ @azure/arm-sql
✅ @azure/arm-rediscache
✅ @azure/arm-frontdoor
✅ @azure/arm-signalr
✅ @azure/arm-search
```

### 2. Azure Metrics API Oluşturuldu
```
📁 api/azure-metrics.js (570 satır)
```

**API Özellikleri:**
- ✅ Gerçek Azure servislerinden veri çekme
- ✅ AKS, SQL, Redis, Front Door, SignalR, Search metrics
- ✅ Sistem sağlık skoru hesaplama
- ✅ Maliyet takibi
- ✅ Bölge durumu
- ✅ SLA compliance tracking

---

## 🚀 Kurulum Adımları

### Adım 1: Azure Credentials Ayarlama

#### A) Azure CLI ile Login (Önerilen)
```bash
# Azure'a giriş yap
az login

# Subscription'ı seç
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Subscription ID'yi al
az account show --query id -o tsv
```

#### B) Environment Variables Ayarlama
```bash
# .env dosyasına ekle
echo "AZURE_SUBSCRIPTION_ID=your-subscription-id-here" >> .env
echo "AZURE_TENANT_ID=your-tenant-id" >> .env
echo "AZURE_CLIENT_ID=your-client-id" >> .env
echo "AZURE_CLIENT_SECRET=your-client-secret" >> .env
```

#### C) Service Principal Oluşturma (Opsiyonel)
```bash
# Service principal oluştur
az ad sp create-for-rbac \
  --name "ailydian-dashboard-sp" \
  --role "Monitoring Reader" \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/ailydian-ultra-pro-rg

# Çıktı:
# {
#   "appId": "xxx",        # → AZURE_CLIENT_ID
#   "password": "xxx",     # → AZURE_CLIENT_SECRET
#   "tenant": "xxx"        # → AZURE_TENANT_ID
# }
```

### Adım 2: API Route'u Server'a Ekle

`server.js` dosyasına ekle:
```javascript
// Azure Metrics API
const azureMetrics = require('./api/azure-metrics');

// API endpoint
app.get('/api/azure/metrics', azureMetrics.handleMetricsRequest);
```

### Adım 3: Dashboard'u Güncelle

Dashboard HTML'ine JavaScript ekle:
```html
<script>
async function loadRealAzureData() {
    try {
        const response = await fetch('http://localhost:5001/api/azure/metrics');
        const result = await response.json();
        
        if (result.success) {
            updateDashboard(result.data);
            console.log('✅ Gerçek Azure verileri yüklendi:', result.source);
        }
    } catch (error) {
        console.error('❌ Azure verisi yüklenemedi:', error);
    }
}

function updateDashboard(data) {
    // System Health
    document.querySelector('#systemHealth').textContent = data.systemHealth.score + '%';
    
    // Cost
    document.querySelector('#monthlyCost').textContent = '$' + data.cost.current;
    
    // Active Users
    document.querySelector('#activeUsers').textContent = data.activeUsers.toLocaleString();
    
    // AKS Metrics
    document.querySelector('#aksCpu').textContent = data.aks.nodeCPU + '%';
    document.querySelector('#aksMemory').textContent = data.aks.nodeMemory + '%';
    document.querySelector('#aksP ods').textContent = data.aks.runningPods;
    
    // SQL Metrics
    document.querySelector('#sqlCpu').textContent = data.sql.cpu + '%';
    document.querySelector('#sqlDtu').textContent = data.sql.dtu + '%';
    
    // Redis Metrics
    document.querySelector('#redisHitRate').textContent = data.redis.hitRate + '%';
    
    // Front Door
    document.querySelector('#latency').textContent = data.frontDoor.globalLatency + 'ms';
    
    // Search
    document.querySelector('#searchQps').textContent = data.search.queriesPerSec;
    
    // SignalR
    document.querySelector('#signalrConnections').textContent = data.signalR.activeConnections;
}

// İlk yükleme
loadRealAzureData();

// Her 30 saniyede bir güncelle
setInterval(loadRealAzureData, 30000);
</script>
```

---

## 🔍 API Test

### Manuel Test
```bash
# Server'ı başlat
cd ~/Desktop/ailydian-ultra-pro
PORT=5001 node server.js

# Başka bir terminalde test et
curl http://localhost:5001/api/azure/metrics
```

### Beklenen Çıktı
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-10-03T00:00:00.000Z",
    "systemHealth": {
      "score": "99.995",
      "status": "excellent"
    },
    "cost": {
      "current": 3216,
      "budget": 3320,
      "remaining": 104
    },
    "aks": {
      "nodeCount": 6,
      "nodeCPU": 65,
      "nodeMemory": 72,
      "runningPods": 45
    },
    "sql": { ... },
    "redis": { ... },
    "frontDoor": { ... },
    "search": { ... },
    "signalR": { ... },
    "sla": { ... }
  },
  "source": "azure"  // veya "mock" (credentials yoksa)
}
```

---

## 📊 Veri Kaynakları

### Gerçek Azure Credentials Varsa:
```
source: "azure"
```
- ✅ Gerçek AKS cluster durumu
- ✅ Gerçek SQL database metrikleri
- ✅ Gerçek Redis cache performansı
- ✅ Gerçek Front Door latency
- ✅ Gerçek SignalR connections
- ✅ Gerçek Search metrics

### Credentials Yoksa:
```
source: "mock"
```
- ⚠️  Gerçekçi simülasyon verileri
- ⚠️  Rastgele değişen metrikler
- ⚠️  Gerçek kaynak sayılarına göre tahmin
- ✅ Dashboard testi için yeterli

---

## 🎯 Avantajlar

### Gerçek Azure Verisi ile:
1. ✅ **Canlı Monitoring** - Gerçek zamanlı sistem durumu
2. ✅ **Accurate Metrics** - Doğru CPU, memory, latency değerleri
3. ✅ **Real Costs** - Gerçek aylık harcama
4. ✅ **True SLA** - Gerçek uptime yüzdesi
5. ✅ **Live Alerts** - Gerçek sorunlarda uyarı
6. ✅ **Resource Management** - Gerçek kaynak durumu

### Mock Verisi ile:
1. ✅ **No Azure Account Needed** - Azure hesabı gerekmez
2. ✅ **Fast Development** - Hızlı geliştirme
3. ✅ **Demo Ready** - Demo için hazır
4. ✅ **No API Costs** - API maliyeti yok
5. ✅ **Offline Work** - İnternet olmadan çalışır

---

## 🔐 Güvenlik

### Production Ortamında:
```javascript
// IP white listing
const allowedIPs = ['127.0.0.1', '::1', 'your-office-ip'];
app.use('/api/azure/metrics', (req, res, next) => {
    const clientIP = req.ip;
    if (!allowedIPs.includes(clientIP)) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
});

// API Key authentication
app.use('/api/azure/metrics', (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.DASHBOARD_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});
```

---

## 📈 Performance

### Caching Strategy:
```javascript
const NodeCache = require('node-cache');
const metricsCache = new NodeCache({ stdTTL: 60 }); // 1 dakika cache

async function getCachedMetrics() {
    const cached = metricsCache.get('azure-metrics');
    if (cached) return cached;
    
    const fresh = await getAllMetrics();
    metricsCache.set('azure-metrics', fresh);
    return fresh;
}
```

### Rate Limiting:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 dakika
    max: 30 // Max 30 request
});

app.use('/api/azure/metrics', limiter);
```

---

## 🛠️ Troubleshooting

### Sorun: "Azure credentials not configured"
```bash
# Çözüm 1: Azure CLI login
az login

# Çözüm 2: Environment variables
export AZURE_SUBSCRIPTION_ID="your-id"
export AZURE_TENANT_ID="your-tenant"
```

### Sorun: "Permission denied"
```bash
# Service principal'a reader role ver
az role assignment create \
  --assignee YOUR_APP_ID \
  --role "Monitoring Reader" \
  --scope /subscriptions/YOUR_SUBSCRIPTION_ID
```

### Sorun: "Resource not found"
```bash
# Resource group ve kaynakların varlığını kontrol et
az group show --name ailydian-ultra-pro-rg
az resource list --resource-group ailydian-ultra-pro-rg
```

---

## 📝 Next Steps

### Hemen Yapılacaklar:
1. ✅ Azure credentials ayarla (`az login`)
2. ✅ API endpoint'i server.js'e ekle
3. ✅ Dashboard JavaScript'ini güncelle
4. ✅ Server'ı restart et
5. ✅ Tarayıcıda gerçek verileri gör!

### Gelecek Geliştirmeler:
- [ ] WebSocket ile real-time updates
- [ ] Grafana entegrasyonu
- [ ] Alert notification sistemi
- [ ] Historical data storage
- [ ] Custom metrics tracking
- [ ] Multi-subscription support

---

## 🎉 Sonuç

Artık localhost dashboard'unuz **gerçek Azure verilerini** gösterebilir!

**Özet:**
- ✅ Azure SDK paketleri yüklü
- ✅ API backend hazır (api/azure-metrics.js)
- ✅ Mock data fallback var
- ⏳ Server'a endpoint eklenmeli
- ⏳ Dashboard JavaScript güncellenmeli

**Şu an durum:**
- 🟡 Simülasyon verisi gösteriliyor
- 🟢 Azure'a bağlanmaya hazır
- 🎯 Credentials eklenince gerçek veri akacak!

