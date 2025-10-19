# 🚀 Advanced Status Dashboard Features

## Özet
Vanilla JS ile gelişmiş status monitoring sistemi tamamlandı! Next.js yerine Static HTML + Express.js mimarisi kullanıldı.

## 📦 Yeni Dosyalar

### 1. Konfigürasyon
- `/data/sla-config.json` - SLA grupları ve hedefler
  ```json
  {
    "groups": {
      "Modules": { "uptimeTarget": 99.5, "p95TargetMs": 1200 },
      "Developers": { "uptimeTarget": 99.0, "p95TargetMs": 1500 },
      "Company": { "uptimeTarget": 99.0, "p95TargetMs": 1800 }
    }
  }
  ```

### 2. Frontend Components (Vanilla JS)
- `/public/js/incident-classifier.js` - Otomatik olay etiketleme
  - Tags: DNS, Auth, Upstream, RateLimit, Network, Redirect, Client4xx, Server5xx, Security, Unknown
  - Heuristic kurallar ile sınıflandırma

- `/public/js/action-notes.js` - Kök-neden analizi
  - Her incident tag için actionable öneriler
  - Troubleshooting adımları

### 3. Backend API
- `/routes/api/incident-push.js` - Slack/Jira entegrasyonu
  - Single incident push
  - Bulk push (top 5 DOWN)
  - ENV: SLACK_WEBHOOK_URL, JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY

## 🎯 Özellikler

### Incident Auto-Tagging
```javascript
const classified = classifyIncident({
  name: 'Auth',
  url: '/auth.html',
  code: 502,
  status: 'down',
  err: 'Bad Gateway'
});
// Result: { ...incident, tag: 'Server5xx', hint: 'Backend 5xx error' }
```

### Action Notes
```javascript
const notes = generateActionNotes(classified);
// Result:
// {
//   title: '🔴 Backend 5xx Hatası',
//   steps: [
//     'Son deploy ve config değişikliklerini kontrol et',
//     'Uygulama loglarında stack trace ara',
//     ...
//   ]
// }
```

### Slack/Jira Push
```bash
# Single incident
curl -X POST http://localhost:3100/api/incident-push \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auth",
    "url": "/auth.html",
    "code": 502,
    "status": "down",
    "tag": "Server5xx",
    "hint": "Backend 5xx error",
    "ts": 1234567890,
    "note": { "title": "...", "steps": [...] }
  }'

# Bulk push
curl -X POST http://localhost:3100/api/incident-push \
  -H "Content-Type: application/json" \
  -d '{ "bulk": [ {...}, {...} ] }'
```

## 🎨 Dashboard Entegrasyonu

Mevcut `/public/status-dashboard.html` sayfasına bu özellikleri eklemek için:

```html
<!-- Incident classifier & action notes -->
<script src="/js/incident-classifier.js"></script>
<script src="/js/action-notes.js"></script>

<script>
// Classify incidents from health data
const incidents = healthData.items
  .filter(item => item.status !== 'up')
  .map(item => classifyIncident(item));

// Generate action notes
incidents.forEach(incident => {
  const notes = generateActionNotes(incident);
  console.log(notes.title, notes.steps);
});

// Push to Slack/Jira
async function pushIncident(incident) {
  const notes = generateActionNotes(incident);
  const payload = { ...incident, note: notes };
  
  const response = await fetch('/api/incident-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  console.log('Push result:', result);
}
</script>
```

## 📊 SLA Groups Calculation

```javascript
// Load SLA config
const slaConfig = await fetch('/data/sla-config.json').then(r => r.json());

// Calculate group metrics from ring buffer
const snapshots = getRecentSnapshots(60); // Last 1 hour

Object.entries(slaConfig.groups).forEach(([groupName, config]) => {
  const groupTargets = config.targets;
  const groupData = snapshots.flatMap(snap =>
    snap.items.filter(item => groupTargets.includes(item.name))
  );
  
  const upCount = groupData.filter(d => d.status === 'up').length;
  const uptimePct = (upCount / groupData.length) * 100;
  
  const latencies = groupData
    .filter(d => d.status === 'up')
    .map(d => d.ms)
    .sort((a, b) => a - b);
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  
  console.log(`${groupName}:`, {
    uptime: uptimePct.toFixed(1) + '%',
    target: config.uptimeTarget + '%',
    p95: p95 + 'ms',
    targetP95: config.p95TargetMs + 'ms'
  });
});
```

## 🚀 Kullanım

1. **ENV Variables Ayarla**:
   ```bash
   export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   export JIRA_BASE_URL=https://yourorg.atlassian.net
   export JIRA_EMAIL=your@email.com
   export JIRA_API_TOKEN=your-token
   export JIRA_PROJECT_KEY=AID
   ```

2. **Server Çalıştır**:
   ```bash
   cd /Users/sardag/Desktop/ailydian-ultra-pro
   node server.js
   ```

3. **Dashboard Aç**:
   ```
   http://localhost:3100/status-dashboard.html
   ```

## 📈 Next Steps

Şu özellikleri ekleyebilirsiniz:
- 7-day heatmap visualization (canvas)
- Historical trend charts
- Alert rules & thresholds
- Auto-remediation workflows
- Runbook integration

## 🎁 Bonus: Heatmap Örneği

7 günlük incident heatmap için canvas kodu eklenebilir:

```javascript
// 7 days x 24 hours heatmap
const canvas = document.createElement('canvas');
canvas.width = 600;
canvas.height = 200;
const ctx = canvas.getContext('2d');

const days = 7;
const hours = 24;
const cellW = canvas.width / hours;
const cellH = canvas.height / days;

// Calculate incident counts per hour
const grid = Array(days).fill(0).map(() => Array(hours).fill(0));

snapshots.forEach(snap => {
  const date = new Date(snap.ts);
  const dayOfWeek = (date.getDay() + 6) % 7; // Monday = 0
  const hour = date.getHours();
  const incidents = snap.items.filter(i => i.status !== 'up').length;
  grid[dayOfWeek][hour] += incidents;
});

// Render heatmap
const maxCount = Math.max(...grid.flat());

grid.forEach((row, d) => {
  row.forEach((count, h) => {
    const intensity = count / maxCount;
    const alpha = 0.2 + (intensity * 0.8);
    ctx.fillStyle = `rgba(184, 107, 255, ${alpha})`;
    ctx.fillRect(h * cellW, d * cellH, cellW - 1, cellH - 1);
  });
});

document.body.appendChild(canvas);
```

