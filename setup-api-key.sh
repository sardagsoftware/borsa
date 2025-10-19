#!/bin/bash

###############################################################################
# 🔐 AILYDIAN - ANTHROPIC API KEY KURULUM SCRIPTI
# Güvenli key girişi ve .env dosyasına kaydetme
###############################################################################

set -e

echo "============================================================"
echo "🔐 ANTHROPIC API KEY KURULUMU"
echo "============================================================"
echo ""

# .env dosyası kontrolü
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env dosyası zaten mevcut."
    echo ""
    read -p "Üzerine yazmak ister misin? (y/N): " overwrite
    if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
        echo "❌ İşlem iptal edildi."
        exit 0
    fi
fi

echo ""
echo "📝 Anthropic API Key'ini gir (girdiğin görünmeyecek):"
echo "   Format: sk-ant-api03-..."
echo ""

# Güvenli key girişi (görünmez)
read -s -p "ANTHROPIC_API_KEY: " api_key
echo ""

# Validation (basic)
if [[ ! "$api_key" =~ ^sk-ant- ]]; then
    echo ""
    echo "❌ Hatalı format! API key 'sk-ant-' ile başlamalı."
    exit 1
fi

if [ ${#api_key} -lt 20 ]; then
    echo ""
    echo "❌ API key çok kısa! Lütfen doğru key'i gir."
    exit 1
fi

# .env dosyasına kaydet
echo "# ═══════════════════════════════════════════════════════════════" > "$ENV_FILE"
echo "# AILYDIAN PARAM STACK - ENVIRONMENT VARIABLES" >> "$ENV_FILE"
echo "# ═══════════════════════════════════════════════════════════════" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"
echo "# Anthropic API (RLAIF için gerekli)" >> "$ENV_FILE"
echo "ANTHROPIC_API_KEY=$api_key" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"
echo "# MLflow tracking" >> "$ENV_FILE"
echo "MLFLOW_TRACKING_URI=./data/mlruns" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"
echo "# Default configurations" >> "$ENV_FILE"
echo "BASE_MODEL=mistralai/Mistral-7B-Instruct-v0.3" >> "$ENV_FILE"
echo "DRAFT_MODEL=TinyLlama/TinyLlama-1.1B-Chat-v1.0" >> "$ENV_FILE"
echo "" >> "$ENV_FILE"

# File permissions (sadece owner okuyabilir)
chmod 600 "$ENV_FILE"

echo ""
echo "✅ API key başarıyla kaydedildi!"
echo ""
echo "📁 Dosya: $ENV_FILE"
echo "🔒 Permissions: 600 (owner-only read/write)"
echo ""
echo "Doğrulama:"
python3 -c "
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('ANTHROPIC_API_KEY', '')

if api_key:
    print(f'   ✅ ANTHROPIC_API_KEY yüklendi')
    print(f'   📏 Uzunluk: {len(api_key)} karakter')
    print(f'   🔑 Prefix: {api_key[:12]}...')
else:
    print('   ❌ API key yüklenemedi!')
" 2>/dev/null || echo "   ⚠️  Python dotenv yüklü değil (pip install python-dotenv)"

echo ""
echo "============================================================"
echo "✅ KURULUM TAMAMLANDI!"
echo "============================================================"
echo ""
echo "Sonraki adımlar:"
echo "  1. Demo prompts oluştur:"
echo "     python apps/rlaif/generate_preferences.py --create-demo"
echo ""
echo "  2. RLAIF preference generation başlat:"
echo "     python apps/rlaif/generate_preferences.py"
echo ""
echo "============================================================"
