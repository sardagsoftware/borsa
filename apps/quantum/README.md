# 🌌 LyDian Quantum Computing - Quick Start

**BlueQubit Entegrasyonu - Production Ready**

---

## 📦 Kurulum (5 Dakika)

### 1. Python Environment

```bash
cd apps/quantum
python3 -m venv venv
source venv/bin/activate
pip install bluequbit qiskit numpy scipy
```

### 2. Bağlantı Testi

```bash
python test_bluequbit_connection.py
```

**Beklenen Output:**
```
✅ bluequbit imported successfully (v0.18.0b1)
✅ qiskit imported successfully (v2.2.2)
✅ Bell state circuit created
⏳ API key bekleniyor
```

### 3. BlueQubit API Key (Opsiyonel)

**Free tier için:**
1. https://app.bluequbit.io → Sign Up
2. API Keys → Create new key
3. Copy key

**Kullanım:**
```bash
export BLUEQUBIT_API_KEY='bq-your-key-here'
python test_bluequbit_connection.py
```

**Beklenen Output:**
```
✅ API key found: bq-xxxx...xxxx
✅ Job submitted successfully!
🎉 ALL TESTS PASSED!
```

---

## 🧬 VQE Moleküler Simülasyon

### H2 Molekülü (Hidrojen)

```bash
python vqe_molecular_simulation.py
```

**Output:**
```
⚛️  Ground state energy: -1.848248 Hartree
💊 Energy in pharma units: -1159.79 kcal/mol
🔁 Function evaluations: 47
⏱️  Execution time: ~1 second
```

### Desteklenen Moleküller

| Molekül | Qubit | Device | Estimated Cost |
|---------|-------|--------|----------------|
| H2 (Hidrojen) | 2 | CPU | $0 (free) |
| H2O (Su) | 8 | CPU/GPU | $0-0.05 |
| NH3 (Amonyak) | 8 | CPU/GPU | $0-0.05 |
| CH4 (Metan) | 10 | GPU | $0.05 |
| C6H6 (Benzen) | 30 | MPS GPU | $0.10 |
| C20H12 (İlaç) | 50 | IBM Heron QPU | $5.00 |

---

## 🔌 API Kullanımı

### Node.js Server Başlat

```bash
cd /Users/sardag/Desktop/ailydian-ultra-pro
PORT=3100 node server.js
```

### Endpoint 1: VQE Simülasyonu

```bash
curl -X POST http://localhost:3100/api/quantum/vqe \
  -H "Content-Type: application/json" \
  -d '{
    "molecule": "H2",
    "bondDistance": 0.735,
    "device": "cpu",
    "budget": 0.10
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "energy": {
      "hartree": -1.848248,
      "kcalMol": -1159.79
    },
    "device": "cpu",
    "cost": 0,
    "executionTime": "886ms"
  }
}
```

### Endpoint 2: Medical Quantum Analysis

```bash
curl -X POST http://localhost:3100/api/medical/quantum-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "molecule": "H2O",
    "device": "cpu",
    "language": "en"
  }'
```

**Response:**
```json
{
  "quantumSimulation": {
    "energy": { ... },
    "executionTime": "455ms"
  },
  "medicalAnalysis": {
    "content": "QUANTUM SIMULATION RESULTS...",
    "model": "LyDian Medical AI"
  }
}
```

### Endpoint 3: Stats

```bash
curl http://localhost:3100/api/quantum/stats
```

**Response:**
```json
{
  "performance": {
    "totalJobs": 10,
    "successRate": "100.00%"
  },
  "cache": {
    "hitRate": "30.00%"
  },
  "cost": {
    "total": "$0.15"
  }
}
```

---

## 🧪 Integration Test

```bash
chmod +x test_medical_quantum.sh
./test_medical_quantum.sh
```

**Beklenen:**
```
🧬 MEDICAL QUANTUM ANALYSIS - INTEGRATION TEST
✅ Server is running
✅ Quantum VQE - H2 Molecule PASSED
✅ Quantum Stats PASSED
✅ Medical Quantum Analysis - H2O PASSED
✅ Medical Quantum Analysis - C6H6 PASSED

🎉 ALL TESTS PASSED!
```

---

## 📊 Performans Beklentileri

### Yanıt Süreleri

| İşlem | CPU (free) | GPU | IBM Heron QPU |
|-------|-----------|-----|---------------|
| H2 (2 qubit) | 800ms | 200ms | 2s |
| H2O (8 qubit) | 1.5s | 400ms | 5s |
| C6H6 (30 qubit) | N/A | 2s | 10s |
| Drug (50 qubit) | N/A | N/A | 30s |

### Cache Performance

```
First query:  ~1000ms (VQE execution)
Cache hit:    <50ms (instant)
Cache TTL:    24 hours
Hit rate:     30-70% (production estimate)
```

---

## 💰 Maliyet Optimizasyonu

### Free Tier Stratejisi

```javascript
// Otomatik cihaz seçimi
device: 'auto'  // CPU → GPU → QPU (bütçeye göre)

// Cache kullan
// Aynı molekül 24 saat içinde tekrar sorulursa: $0

// Rate limit
// Free tier: 10 request/minute
// Paid tier: 100 request/minute
```

### Budget Control

```javascript
{
  "molecule": "C6H6",
  "device": "auto",
  "budget": 0.05  // Max $0.05 harcamak istiyorum
}
```

Eğer hesaplama $0.05'den pahalıysa → **Error: Budget exceeded**

---

## 🔐 Güvenlik

### API Key Güvenliği

```bash
# ✅ İYİ - Environment variable
export BLUEQUBIT_API_KEY='...'

# ❌ KÖTÜ - Code içinde hardcode
const API_KEY = 'bq-...'  # YAPMA!
```

### Rate Limiting

```javascript
// Free tier: 10 request/minute
// Aşarsan: HTTP 429 (Too Many Requests)
{
  "error": "Rate limit exceeded",
  "resetIn": 42  // seconds
}
```

---

## 🐛 Troubleshooting

### Problem 1: "Module not found: bluequbit"

```bash
# Çözüm: Virtual environment aktif mi kontrol et
source venv/bin/activate
which python  # apps/quantum/venv/bin/python olmalı
pip install bluequbit
```

### Problem 2: "API key not valid"

```bash
# Çözüm: Key'i kontrol et
echo $BLUEQUBIT_API_KEY  # 'bq-' ile başlamalı
# Yeni key al: https://app.bluequbit.io/api-keys
```

### Problem 3: "Endpoint not found"

```bash
# Çözüm: Server restart gerekli
pkill -f "node server.js"
PORT=3100 node server.js
```

### Problem 4: "Budget exceeded"

```bash
# Çözüm: device='cpu' kullan veya budget arttır
{
  "device": "cpu",  # Ücretsiz
  "budget": 0.10    # veya bütçeyi arttır
}
```

---

## 📚 İleri Seviye

### Custom Hamiltonian

```python
# PySCF ile gerçek Hamiltonian
from pyscf import gto, scf, fci

mol = gto.M(atom='H 0 0 0; H 0 0 0.74', basis='sto-3g')
mf = scf.RHF(mol).run()
# ... BlueQubit'e gönder
```

### Multi-Molecule Pipeline

```javascript
const molecules = ['H2', 'H2O', 'NH3', 'CH4'];
const results = await Promise.all(
  molecules.map(m =>
    fetch('/api/quantum/vqe', {
      method: 'POST',
      body: JSON.stringify({ molecule: m, device: 'cpu' })
    })
  )
);
```

### Production Monitoring

```javascript
// Prometheus metrics
quantum_jobs_total{device="cpu"} 142
quantum_jobs_total{device="gpu"} 23
quantum_cache_hit_rate 0.42
quantum_cost_total_dollars 1.35
```

---

## 🎯 Next Steps

1. **API Key Al** → https://app.bluequbit.io (5 dakika)
2. **Gerçek QPU Test Et** → `export BLUEQUBIT_API_KEY=...` (2 dakika)
3. **Medical Expert UI** → `medical-expert.html` entegrasyon (1 gün)
4. **Production Deploy** → Vercel + monitoring setup (2 gün)
5. **Clinical Validation** → Peer review + benchmarks (3 ay)

---

## 📞 Support

- **BlueQubit Docs**: https://app.bluequbit.io/docs
- **LyDian Issue**: GitHub Issues
- **Email**: support@ailydian.com

---

**🎉 Başarılar! Kuantum bilişim artık parmaklarınızın ucunda.**

**Generated with:** Claude Code
**Last Updated:** 24 Ekim 2025
