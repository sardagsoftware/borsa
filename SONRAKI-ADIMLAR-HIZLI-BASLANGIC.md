# 🚀 PARAM STACK - SONRAKİ ADIMLAR (HIZLI BAŞLANGIÇ)

**Tarih:** 2025-10-19
**Durum:** ✅ Infrastructure hazır, şimdi RLAIF test'e geçiş

---

## 📋 ŞU ANDA NEREDEYIZ?

✅ **Tamamlanan:**
- Multi-tenant infrastructure
- Ed25519 attestation
- Guardrails.ai security policy
- vLLM launch script (optimized)
- RLAIF preference generator script
- DPO training script
- KServe Canary deployment manifests

⏳ **Şimdi yapılacak:**
- API key kurulumu
- Demo test (5 prompt ile RLAIF)
- Preference data kalite kontrolü

---

## 🎯 SONRAKİ 5 ADIM (15 DAKİKA)

### Adım 1: API Key Kurulumu (2 dakika)

```bash
# Terminal'de çalıştır
./setup-api-key.sh
```

**Ne yapacak:**
- API key'ini güvenli şekilde alacak (görünmez input)
- `.env` dosyasına kaydedecek (chmod 600)
- Validation yapacak

**API key nereden:**
- https://console.anthropic.com/settings/keys
- Format: `sk-ant-api03-...`

---

### Adım 2: Virtual Environment (3 dakika)

```bash
# Virtual environment oluştur
python3 -m venv venv

# Aktive et
source venv/bin/activate

# Dependencies yükle (sadece gerekli olanlar)
pip install anthropic python-dotenv

# Doğrulama
python3 -c "import anthropic; print('✅ Anthropic SDK yüklü')"
```

---

### Adım 3: Demo Prompts Oluştur (1 dakika)

```bash
# Demo prompts oluştur
python apps/rlaif/generate_preferences.py --create-demo

# Kontrol et
cat data/demo_prompts.jsonl
```

**Oluşturulacak prompts:**
1. "Ailydian AI Ecosystem nedir?"
2. "PyTorch ile model nasıl eğitilir?"
3. "Türkçe doğal dil işleme için en iyi yaklaşımlar nelerdir?"
4. "COVID-19 aşısının yan etkileri nelerdir?"
5. "Anayasa Mahkemesi'ne bireysel başvuru süreci nasıl işler?"

---

### Adım 4: RLAIF Test (5 dakika - İLK PROMPT)

```bash
# Sadece 1 prompt ile test (hızlı)
echo '{"prompt": "Ailydian AI Ecosystem nedir?"}' > data/test_single_prompt.jsonl

# RLAIF çalıştır (tek prompt, 2 response)
python apps/rlaif/generate_preferences.py \
  --prompts data/test_single_prompt.jsonl \
  --output data/test_preferences.jsonl \
  --num-responses 2

# Sonucu kontrol et
cat data/test_preferences.jsonl | python -m json.tool
```

**Beklenen çıktı:**
```json
{
  "prompt": "Ailydian AI Ecosystem nedir?",
  "chosen": "... (yüksek skorlu cevap)",
  "rejected": "... (düşük skorlu cevap)",
  "chosen_score": 8.5,
  "rejected_score": 6.2,
  "metadata": {
    "chosen_temp": 0.5,
    "rejected_temp": 0.9,
    "num_candidates": 2
  }
}
```

---

### Adım 5: Kalite Kontrolü (4 dakika)

```bash
# Preference quality check
python3 -c "
import json

with open('data/test_preferences.jsonl', 'r') as f:
    for line in f:
        pair = json.loads(line)
        print('='*60)
        print(f'Prompt: {pair[\"prompt\"]}')
        print('')
        print(f'✅ CHOSEN (Score: {pair[\"chosen_score\"]:.1f}):')
        print(f'   {pair[\"chosen\"][:150]}...')
        print('')
        print(f'❌ REJECTED (Score: {pair[\"rejected_score\"]:.1f}):')
        print(f'   {pair[\"rejected\"][:150]}...')
        print('')
        print(f'Score Gap: {pair[\"chosen_score\"] - pair[\"rejected_score\"]:.1f}')
        print('='*60)
"
```

**Başarı kriterleri:**
- ✅ Chosen score > Rejected score
- ✅ Score gap ≥ 1.5 (ideal: ≥ 2.0)
- ✅ Chosen yanıt daha detaylı ve doğru
- ✅ Rejected yanıt eksik veya belirsiz

---

## 🎉 BAŞARILI OLURSA - SONRAKI ADIMLAR

### 1. Full Demo (10 dakika)
```bash
# Tüm 5 prompt ile RLAIF
python apps/rlaif/generate_preferences.py \
  --prompts data/demo_prompts.jsonl \
  --output data/preferences.jsonl \
  --num-responses 4

# Her 10 promptta checkpoint kaydediliyor
```

### 2. Production Data Toplama (1-2 gün)
```bash
# 100-1000 Türkçe prompt topla:
# - Tıp soruları
# - Hukuk soruları
# - Genel AI soruları
# - Türkçe NLP soruları
```

### 3. DPO Training (2-4 saat)
```bash
# Virtual env'de
pip install torch transformers peft trl bitsandbytes

# DPO training
python apps/trainer/dpo_train.py \
  --base_model mistralai/Mistral-7B-Instruct-v0.3 \
  --dataset data/preferences.jsonl \
  --output_dir data/artifacts/adapters/ailydian-dpo \
  --epochs 3 \
  --batch_size 4

# GPU gerekli (minimum: NVIDIA T4 16GB)
```

---

## ⚠️ TROUBLESHOOTING

### Hata: "ModuleNotFoundError: No module named 'anthropic'"
```bash
# Virtual env aktif mi kontrol et
which python  # venv/bin/python olmalı

# Değilse aktive et
source venv/bin/activate

# Yükle
pip install anthropic python-dotenv
```

### Hata: "ANTHROPIC_API_KEY not found"
```bash
# .env dosyası var mı?
ls -la .env

# Yüklenmiş mi?
python3 -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('ANTHROPIC_API_KEY', 'NOT FOUND'))"

# Yoksa setup-api-key.sh tekrar çalıştır
./setup-api-key.sh
```

### Hata: "Rate limit exceeded"
```bash
# Anthropic API rate limit:
# - Tier 1: 50 requests/minute
# - Tier 2: 1000 requests/minute

# Çözüm: --num-responses azalt (4 → 2)
# veya sleep time arttır (generate_preferences.py:171, 186)
```

### Hata: "Out of memory" (GPU)
```bash
# DPO training için GPU gerekli
# Minimum: NVIDIA T4 16GB

# Yoksa:
# 1. Batch size azalt (--batch_size 4 → 2)
# 2. Model değiştir (Mistral-7B → TinyLlama-1.1B)
# 3. Google Colab kullan (ücretsiz T4)
```

---

## 📊 BEKLENEN PERFORMANS

### RLAIF (Tek Prompt)
- **Süre:** ~30 saniye
- **API calls:** 6 adet
  - 2 response generation
  - 2 scoring
  - Toplam: 4 Claude API call
- **Maliyet:** ~$0.01-0.02

### RLAIF (5 Demo Prompt)
- **Süre:** ~2-3 dakika
- **API calls:** 30 adet (5 × 6)
- **Maliyet:** ~$0.05-0.10

### DPO Training (100 Preference Pairs)
- **Süre:** ~30-45 dakika (T4 GPU)
- **GPU Memory:** ~12-14GB
- **Disk:** ~2GB (model + checkpoints)

---

## 🎯 BAŞARI KRİTERLERİ

### Phase 1: RLAIF Test ✅
- [ ] API key kuruldu
- [ ] Virtual env hazır
- [ ] Demo prompts oluşturuldu
- [ ] İlk preference pair üretildi
- [ ] Score gap ≥ 1.5

### Phase 2: Full RLAIF 🔄
- [ ] 5 demo prompt tamamlandı
- [ ] Tüm score gaps ≥ 1.5
- [ ] Chosen yanıtlar kaliteli
- [ ] Checkpoint kaydedildi

### Phase 3: Production Data 🚀
- [ ] 100+ Türkçe prompt toplandı
- [ ] RLAIF ile preference pairs üretildi
- [ ] Data quality validation yapıldı
- [ ] DPO training için hazır

---

## 📞 YARDIM

### Dökümanlar
- `PARAM-STACK-FINAL-COMPLETE-TR-2025-10-19.md` → Full implementation guide
- `PARAM-STACK-TEST-RAPORU-TR-2025-10-19.md` → Test results
- `PYTORCH-QUICK-REFERENCE-TR.md` → PyTorch basics

### Scripts
- `setup-api-key.sh` → API key setup
- `apps/rlaif/generate_preferences.py` → RLAIF generator
- `apps/trainer/dpo_train.py` → DPO training

### Example Commands
```bash
# RLAIF help
python apps/rlaif/generate_preferences.py --help

# DPO help
python apps/trainer/dpo_train.py --help
```

---

## ✅ CHECKLIST - BUGÜN

**Hemen şimdi yapılacaklar (15 dakika):**

- [ ] `./setup-api-key.sh` çalıştır → API key kurulumu
- [ ] `python3 -m venv venv && source venv/bin/activate` → Virtual env
- [ ] `pip install anthropic python-dotenv` → Dependencies
- [ ] `python apps/rlaif/generate_preferences.py --create-demo` → Demo prompts
- [ ] İlk RLAIF testi → 1 prompt ile preference pair üret
- [ ] Sonucu kontrol et → Score gap ≥ 1.5 mi?

**Başarılı olursa (opsiyonel, 10 dakika):**

- [ ] Full demo → 5 prompt ile RLAIF
- [ ] Kalite analizi → Tüm pairs için score check

---

**🎉 Başarılar! RLAIF test'ine başlayabilirsin!**

**İlk komut:**
```bash
./setup-api-key.sh
```
