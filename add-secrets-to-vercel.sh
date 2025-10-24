#!/bin/bash
# 🔒 BEYAZ ŞAPKALI - Vercel Secrets Ekleme Script'i
# Oluşturulma: 2025-10-19

set -e  # Exit on error

echo "🔒 BEYAZ ŞAPKALI - Vercel Environment Variables Ekleniyor..."
echo ""

# Secrets dosyasını oku
SECRETS_FILE=".env.production.secrets"

if [ ! -f "$SECRETS_FILE" ]; then
    echo "❌ Hata: $SECRETS_FILE bulunamadı!"
    exit 1
fi

# JWT_SECRET'ı çıkar
JWT_SECRET=$(grep "^JWT_SECRET=" "$SECRETS_FILE" | cut -d'=' -f2)
SESSION_SECRET=$(grep "^SESSION_SECRET=" "$SECRETS_FILE" | cut -d'=' -f2)

echo "📝 Bulunan secrets:"
echo "   - JWT_SECRET: ${JWT_SECRET:0:20}... (128 karakter)"
echo "   - SESSION_SECRET: ${SESSION_SECRET:0:20}... (128 karakter)"
echo ""

# Confirm
echo "⚠️  Bu secrets'lar Vercel Production environment'a eklenecek"
echo "   Devam etmek istiyor musunuz? (y/n)"
read -r CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "❌ İşlem iptal edildi"
    exit 0
fi

echo ""
echo "🚀 Vercel'e ekleniyor..."

# JWT_SECRET ekle
echo "$JWT_SECRET" | vercel env add JWT_SECRET production --yes

# SESSION_SECRET ekle
echo "$SESSION_SECRET" | vercel env add SESSION_SECRET production --yes

echo ""
echo "✅ Secrets başarıyla eklendi!"
echo ""
echo "📋 Sonraki adım: Deployment'ı yeniden başlat"
echo "   Komut: vercel --prod --yes"
