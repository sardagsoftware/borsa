# 📊 Azure Dashboard Kullanım Rehberi

**Ailydian Ultra Pro - Monitoring & Analytics Platform**

---

## 🚀 Hızlı Başlangıç (3 Adımda Kurulum)

### Adım 1: Azure CLI Kontrolü

```bash
# Azure CLI yüklü mü kontrol et
az --version

# Eğer yüklü değilse:
brew install azure-cli   # macOS
```

### Adım 2: Azure'a Giriş Yap

```bash
# Azure hesabınıza giriş yapın
az login

# Doğru subscription'ı seçin
az account list --output table
az account set --subscription "YOUR-SUBSCRIPTION-ID"
```

### Adım 3: Dashboard'u Deploy Et

```bash
# Proje dizinine gidin
cd ~/Desktop/ailydian-ultra-pro

# Deploy script'ini çalıştırın
./azure-services/deploy-dashboard.sh
```

**İşlem süresi:** ~2-3 dakika  
**Sonuç:** Dashboard Azure Portal'da kullanıma hazır! 🎉

---

## 📱 Azure Portal'da Dashboard Nasıl Açılır?

### Yöntem 1: Azure Portal (Tarayıcı)

1. **Tarayıcıda açın:** https://portal.azure.com
2. Sol menüden **Dashboard** seçeneğine tıklayın
3. Üst kısımda dropdown menüden **"Ailydian-Ultra-Pro-Unified-Dashboard"** seçin
4. Dashboard açılacak! 🎯

### Yöntem 2: Direkt URL

Deploy script'i size özel bir URL verecek:
```
https://portal.azure.com/#@/dashboard/arm/subscriptions/.../Ailydian-Ultra-Pro-Unified-Dashboard
```

Bu URL'yi:
- ✅ Tarayıcınıza bookmark olarak ekleyin
- ✅ Takım arkadaşlarınızla paylaşın
- ✅ Mobil cihazınızda açın

### Yöntem 3: Azure Mobile App

1. **App Store/Google Play'den indirin:** "Microsoft Azure" uygulaması
2. Giriş yapın
3. **Dashboard** → **Ailydian Ultra Pro**

---

## 🎯 Dashboard Sections (9 Bölüm)

### 1️⃣ Overview (Genel Bakış)

**Ne Gösterir:**
- ✅ System Health Score: **99.995%** (hedef: 99.99%)
- 💰 Monthly Spend: **$3,216** (bütçe: $3,320)
- 🌍 Active Regions: **3** (US East, US West, Europe)
- 👥 Active Users: **12,345** (son 24 saat)

**Nasıl Yorumlanır:**
```
🟢 Yeşil: Her şey normal
🟡 Sarı: Dikkat gerekli
🔴 Kırmızı: Acil müdahale!
```

### 2️⃣ Compute & Containers (AKS - Kubernetes)

**Ne Gösterir:**
- 📊 Node CPU Usage: **65%** (eşik: 85%)
- 📊 Node Memory Usage: **72%** (eşik: 90%)
- 🔄 Pod Status: Running (45), Pending (2), Failed (0)
- 📈 Node Count: **6** (min: 3, max: 20)

**Kritik Metrikler:**
```
CPU > 85%        → ⚠️  Scale up gerekli
Memory > 90%     → ⚠️  Memory leak kontrol et
Failed Pods > 5  → 🚨 Acil log kontrol!
Restarts > 10/h  → ⚠️  Container problemi
```

**Aksiyon:**
```bash
# Pod detaylarını gör
kubectl get pods --all-namespaces

# Failed pod loglarını kontrol et
kubectl logs <pod-name> -n <namespace>

# Manual scale (acil durum)
kubectl scale deployment <name> --replicas=10
```

### 3️⃣ Networking & Global Delivery (Front Door)

**Ne Gösterir:**
- ⚡ Global Latency: **42ms** (hedef: <50ms)
- 🌐 Origin Health: US East (✅), US West (✅), Europe (✅)
- 🛡️ WAF Blocks: **1,234** (son 1 saat)
- 📍 Top Countries: US (45%), EU (30%), Asia (25%)

**WAF Alert Seviyeleri:**
```
< 100 blocks/5min   → 🟢 Normal
100-1000 blocks/5min → 🟡 Suspected attack
> 1000 blocks/5min   → 🔴 DDoS attack!
```

**Aksiyon:**
```bash
# WAF loglarını kontrol et
az network front-door waf-log show \
  --resource-group ailydian-ultra-pro-rg \
  --name ailydian-global

# Block edilen IP'leri listele
# Dashboard'da "WAF Blocked Requests" tablosuna bakın
```

### 4️⃣ Database & Storage (SQL + Redis + Blob)

**Azure SQL Metrics:**
- 💾 CPU Usage: **58%** (eşik: 85%)
- 📊 DTU Consumption: **62%** (eşik: 90%)
- 📈 Active Connections: **42** (max: 100)
- ⏱️ Avg Query Time: **18ms**

**Redis Cache Metrics:**
- 🎯 Cache Hit Rate: **97.2%** (hedef: >95%)
- 📊 Memory Usage: **3.2 GB** / 4 GB
- ⚡ Operations/sec: **8,450**

**Kritik Durumlar:**
```
SQL CPU > 85%        → 🚨 Scale to higher tier
DTU > 90%            → 🚨 Add read replicas
Cache Hit < 85%      → ⚠️  Review cache strategy
Cache Memory > 90%   → ⚠️  Scale up Redis tier
```

**Aksiyon:**
```bash
# SQL slow queries
az sql db query-stats show \
  --resource-group ailydian-ultra-pro-rg \
  --server ailydian-sql \
  --database ailydian-prod

# Redis info
az redis show \
  --resource-group ailydian-ultra-pro-rg \
  --name ailydian-cache
```

### 5️⃣ Search & AI Services (Cognitive Search)

**Ne Gösterir:**
- 🔍 Search Queries/sec: **156** (max: 1000)
- ⏱️ Avg Search Latency: **68ms** (hedef: <75ms)
- 📊 Query Types: Simple (60%), Semantic (30%), Autocomplete (10%)
- 🌐 Top Languages: EN (45%), TR (25%), DE (15%)

**Performance Targets:**
```
Latency < 75ms   → 🟢 Excellent
Latency 75-150ms → 🟡 Acceptable
Latency > 150ms  → 🔴 Optimization needed
```

### 6️⃣ Real-Time Communication (SignalR)

**Ne Gösterir:**
- 🔌 Active Connections: **842** (max: 1000)
- 📨 Messages/sec: **1,250**
- 📡 Hub Activity:
  - chatHub: 45% traffic
  - aiStreamHub: 35% traffic
  - presenceHub: 12% traffic
  - notificationHub: 8% traffic

**Capacity Planning:**
```
< 800 connections   → 🟢 Plenty of capacity
800-950 connections → 🟡 Monitor closely
> 950 connections   → 🔴 Scale up NOW!
```

**Aksiyon:**
```bash
# SignalR metrics
az signalr show \
  --resource-group ailydian-ultra-pro-rg \
  --name ailydian-signalr \
  --query "{sku:sku.name, capacity:sku.capacity, units:sku.units}"
```

### 7️⃣ Identity & Security (Azure AD B2C)

**Ne Gösterir:**
- 👤 Sign-ins (24h): **8,934** (success: 99.2%)
- 🔐 MFA Usage: **72%** of sign-ins
- ⚠️ Failed Attempts: **68** (0.8%)
- 🌍 Top Locations: US, Germany, UK

**Security Alerts:**
```
Failed % < 1%     → 🟢 Normal
Failed % 1-5%     → 🟡 Monitor
Failed % > 5%     → 🔴 Possible attack
Failed > 100/IP   → 🚨 Brute force!
```

### 8️⃣ Cost Management

**Monthly Budget Tracking:**
```
Current Spend:  $3,216
Monthly Budget: $3,320
Remaining:      $104 (3.1%)
Burn Rate:      ~$107/day
Days Left:      30 days

Status: 🟢 ON TRACK
```

**Service Breakdown:**
```
AKS:              $1,845  (57%)  [Target: $1,927]
SQL Database:     $448    (14%)  [Target: $450]
Front Door:       $312    (10%)  [Target: $320]
SignalR:          $235    (7%)   [Target: $240]
Cognitive Search: $218    (7%)   [Target: $220]
Redis Cache:      $98     (3%)   [Target: $100]
Blob Storage:     $38     (1%)   [Target: $40]
Azure AD B2C:     $22     (1%)   [Target: $23]
```

**Cost Alerts:**
```
< 90% budget  → 🟢 On track
90-100%       → 🟡 Watch closely
> 100%        → 🔴 OVER BUDGET!
> 110%        → 🚨 IMMEDIATE ACTION
```

### 9️⃣ Performance & SLA Tracker

**All Services SLA Status:**

| Service | Target | Actual | Status |
|---------|--------|--------|--------|
| AKS | 99.95% | 99.998% | ✅ +0.048% |
| SQL | 99.995% | 99.999% | ✅ +0.004% |
| Front Door | 99.99% | 99.995% | ✅ +0.005% |
| SignalR | 99.9% | 99.92% | ✅ +0.02% |
| Search | 99.9% | 99.95% | ✅ +0.05% |
| Redis | 99.9% | 99.98% | ✅ +0.08% |
| Blob | 99.99% | 100% | ✅ +0.01% |
| AD B2C | 99.9% | 99.96% | ✅ +0.06% |

**Overall:** 🟢 **100% services meeting/exceeding SLA**

---

## 📊 Azure Monitor Workbook (Detaylı Analiz)

### Workbook Nasıl Açılır?

1. Azure Portal'da **Monitor** → **Workbooks**
2. **"Ailydian Ultra Pro - Advanced Analytics"** seçin
3. Time Range ve filtreler seçin
4. Detaylı KQL query sonuçlarını görün

### Workbook'ta Neler Var?

**11 İnteraktif Bölüm:**
1. Executive Summary (Genel özet)
2. Kubernetes Pod & Node Analytics
3. SQL Query Performance Analysis
4. Redis Cache Hit Rate Trends
5. Search Query Patterns
6. SignalR Real-Time Metrics
7. Authentication & Security Events
8. WAF & Threat Detection
9. Cost Analysis & Optimization
10. Business KPIs (AI Conversations)
11. Custom Metrics

### Örnek KQL Queries

**En Yavaş SQL Queries:**
```kql
AzureDiagnostics
| where ResourceProvider == 'MICROSOFT.SQL'
| where Category == 'QueryStoreRuntimeStatistics'
| summarize 
    TotalExecutions = sum(execution_count_d),
    AvgDuration = avg(avg_duration_d)
    by query_hash_s
| order by AvgDuration desc
| take 10
```

**Cache Hit Rate (Son 1 saat):**
```kql
customMetrics
| where name in ('redis_cache_hits', 'redis_cache_misses')
| where timestamp > ago(1h)
| summarize Count = sum(value) by name, bin(timestamp, 5m)
| extend HitRate = (cache_hits * 100.0 / (cache_hits + cache_misses))
| render timechart
```

**Pod Restart Analizi:**
```kql
KubePodInventory
| where ContainerRestartCount > 0
| summarize TotalRestarts = sum(ContainerRestartCount) by PodName, Namespace
| order by TotalRestarts desc
| take 20
```

---

## 🔔 Alert Notifications (Uyarı Bildirimleri)

### Slack Integration

**Channels:**
- `#ailydian-alerts` - Kritik sistem uyarıları
- `#ailydian-costs` - Bütçe ve maliyet uyarıları
- `#ailydian-deployments` - Deployment notifications

**Alert Examples:**
```
🔴 CRITICAL: AKS Node CPU > 90% for 5 minutes
🟡 WARNING: SQL DTU consumption at 85%
🟢 INFO: New deployment to production
💰 COST: Daily spend exceeded $120 threshold
```

### Microsoft Teams Integration

**Webhook URL'inizi ekleyin:**
```bash
# azure-dashboard-config.json dosyasını edit edin
nano ~/Desktop/ailydian-ultra-pro/azure-services/azure-dashboard-config.json

# "teams.webhookUrl" alanını güncelleyin
```

### PagerDuty Integration

**Critical alerts only:**
- System availability < 99%
- All nodes down
- Database offline
- Security breach detected

---

## 📱 Mobile Access (Mobil Kullanım)

### iOS/Android Azure App

1. **Download:** App Store/Google Play - "Microsoft Azure"
2. **Login:** Azure hesabınızla giriş yapın
3. **Navigate:** Dashboard → Ailydian Ultra Pro
4. **Enable Notifications:** Settings → Push Notifications

**Mobile Features:**
- ✅ Real-time metrics
- ✅ Push notifications
- ✅ Quick actions
- ✅ Cost tracking
- ✅ Resource health

---

## 🛠️ Troubleshooting (Sorun Giderme)

### Dashboard görünmüyor?

```bash
# Dashboard'un deploy edildiğini kontrol et
az portal dashboard list \
  --resource-group ailydian-ultra-pro-rg \
  --output table

# Eğer yoksa tekrar deploy et
cd ~/Desktop/ailydian-ultra-pro
./azure-services/deploy-dashboard.sh
```

### Metrics güncellenmiyor?

```bash
# Application Insights kontrol
az monitor app-insights component show \
  --resource-group ailydian-ultra-pro-rg \
  --app ailydian-insights

# Log Analytics Workspace kontrol
az monitor log-analytics workspace show \
  --resource-group ailydian-ultra-pro-rg \
  --workspace-name ailydian-logs
```

### Uyarılar gelmiyor?

1. **Slack webhook'u kontrol et:**
   - Slack workspace → Apps → Incoming Webhooks
   - Test message gönder

2. **Teams webhook'u kontrol et:**
   - Teams channel → Connectors → Incoming Webhook
   - Test et

3. **Azure Action Groups kontrol et:**
   ```bash
   az monitor action-group list \
     --resource-group ailydian-ultra-pro-rg
   ```

---

## 📖 Best Practices (En İyi Uygulamalar)

### Günlük Kontroller (5 dakika)

```
✅ 09:00 AM - Dashboard açılır
✅ System Health Score kontrol (hedef: >99.9%)
✅ Cost tracking kontrol (bütçe dahilinde mi?)
✅ Critical alerts var mı?
✅ Failed pods/restarts kontrol
```

### Haftalık Kontroller (15 dakika)

```
✅ Pazartesi 10:00 AM - Weekly review
✅ Workbook'ta deep-dive analytics
✅ Slow SQL queries optimize et
✅ Cache hit rate trends
✅ Security events review
✅ Cost optimization opportunities
```

### Aylık Review (30 dakika)

```
✅ Her ayın 1'i - Monthly report
✅ SLA compliance review (tüm servisler)
✅ Cost analysis (aylık trend)
✅ Capacity planning (growth projections)
✅ Performance optimization
✅ Team training (yeni metrikler)
```

---

## 🎓 Eğitim Videoları & Dokümanlar

### Microsoft Learn
- [Azure Dashboards](https://docs.microsoft.com/azure/azure-portal/azure-portal-dashboards)
- [Azure Monitor Workbooks](https://docs.microsoft.com/azure/azure-monitor/visualize/workbooks-overview)
- [KQL Query Language](https://docs.microsoft.com/azure/data-explorer/kusto/query/)

### Ailydian Documentation
- `ENTERPRISE-DASHBOARD-MONITORING-FINAL-REPORT.md` - Tam dokümantasyon
- `azure-services/deploy-dashboard.sh` - Deployment script
- `monitoring/azure-monitor-workbook.json` - Workbook template

---

## 🆘 Acil Durum Prosedürleri

### 🔴 CRITICAL: System Down

```bash
# 1. Immediate check
az aks show --resource-group ailydian-ultra-pro-rg --name ailydian-aks
az sql db show --resource-group ailydian-ultra-pro-rg --server ailydian-sql --name ailydian-prod

# 2. Check Front Door health
az network front-door show --resource-group ailydian-ultra-pro-rg --name ailydian-global

# 3. Restart pods if needed
kubectl rollout restart deployment/<deployment-name>

# 4. Notify team
# Slack/Teams/PagerDuty otomatik bildirim gönderecek
```

### 🟡 WARNING: High Resource Usage

```bash
# Scale AKS nodes
az aks scale \
  --resource-group ailydian-ultra-pro-rg \
  --name ailydian-aks \
  --node-count 10

# Scale SQL tier
az sql db update \
  --resource-group ailydian-ultra-pro-rg \
  --server ailydian-sql \
  --name ailydian-prod \
  --service-objective S4

# Scale Redis
az redis update \
  --resource-group ailydian-ultra-pro-rg \
  --name ailydian-cache \
  --sku Standard \
  --size C2
```

---

## 📞 Support & İletişim

**Dashboard Issues:**
- 📧 Email: devops@ailydian.com
- 💬 Slack: `#ailydian-support`
- 📱 PagerDuty: Critical only

**Azure Support:**
- 🌐 Portal: https://portal.azure.com → Support
- 📞 Phone: Azure Support hotline
- 📧 Email: Azure Support Team

---

## ✅ Quick Checklist

Kurulumdan sonra kontrol edin:

- [ ] Azure CLI yüklü ve login yapılmış
- [ ] Dashboard başarıyla deploy edilmiş
- [ ] Azure Portal'da dashboard görünüyor
- [ ] Tüm metrics yükleniyor (system health, cost, etc.)
- [ ] Workbook import edilmiş
- [ ] Slack/Teams webhook'ları çalışıyor
- [ ] Mobile app'te dashboard erişilebilir
- [ ] Alert notification'lar test edilmiş
- [ ] Takım dashboard URL'si ile bookmarked

---

**Son Güncelleme:** 3 Ekim 2025  
**Versiyon:** 1.0  
**Doküman Sahibi:** Ailydian DevOps Team

🎉 **Dashboard'unuz kullanıma hazır!**
