# 🔐 ANTHROPIC API KEY - DOĞRU KEY ALMA REHBERİ

## ❌ SORUN

Girdiğin key: `sk-ant-admin01-x-...`
Bu **workspace admin key** - API çağrıları için **çalışmaz**!

## ✅ ÇÖZÜM

### Adım 1: Anthropic Console'a Git
https://console.anthropic.com/settings/keys

### Adım 2: YENİ API Key Oluştur

**ÖNEMLİ:** "Create Key" butonuna tıkla

**Key türlerini karıştırma:**
- ❌ Workspace Keys (sk-ant-admin01-...) → **Bu ÇALIŞMAZ!**
- ✅ API Keys (sk-ant-api03-...) → **Bu GEREKLİ!**

### Adım 3: Doğru Key'i Kopyala

Key formatı şöyle olmalı:
```
sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Uzunluk:** ~108 karakter
**Prefix:** `sk-ant-api03-` (api03 önemli!)

### Adım 4: Key'i Kur

Terminal'de:
```bash
cd ~/Desktop/ailydian-ultra-pro
./setup-api-key.sh
```

**Girdiğin key'in prefix'ine dikkat et:**
- ✅ `sk-ant-api03-...` → Doğru!
- ❌ `sk-ant-admin01-...` → Yanlış!

### Adım 5: Test Et

```bash
source venv/bin/activate
python apps/rlaif/generate_preferences.py \
  --prompts data/test_single_prompt.jsonl \
  --output data/test_preferences.jsonl \
  --num-responses 2
```

---

## 📸 EKRAN GÖRÜNTÜLERİ (Anthropic Console)

**DOĞRU SAYFA:**
- URL: https://console.anthropic.com/settings/keys
- Sekme: "API Keys" (NOT "Workspace Keys"!)
- Buton: "Create Key"

**KEY FORMATI:**
```
Name: My API Key
Key:  sk-ant-api03-xxxxxxx... (Bu doğru!)
      └─────┬─────┘
         api03 olmalı
```

---

## 🆘 HALA ÇALIŞMAZSA

1. **Yeni key oluştur** (Console'da Create Key)
2. **Key'i kopyalarken boşluk bırakma**
3. **Tüm key'i kopyala** (108 karakter)
4. **setup-api-key.sh'yi tekrar çalıştır**

---

## ✅ BAŞARILI OLUNCA

```
✅ API key başarıyla kaydedildi!
   📏 Uzunluk: 108 karakter
   🔑 Prefix: sk-ant-api03...  ← Bu görünmeli!
```

Sonra RLAIF çalışacak:
```
✅ Chosen (Score: 8.5): ...
❌ Rejected (Score: 6.2): ...
```
