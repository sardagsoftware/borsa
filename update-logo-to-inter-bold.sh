#!/bin/bash

# LyDian logo yazı karakterini Inter Bold'a çeviren script
# Backup ve old dosyalarını atlar

cd /Users/sardag/Desktop/ailydian-ultra-pro/public

echo "🔄 LyDian logo karakteri Inter Bold'a çevriliyor..."
echo ""

# Backup/old dosyalarını hariç tut, sadece ana production dosyalarını işle
for file in *.html; do
    # Backup, old, demo dosyalarını atla
    if [[ "$file" =~ -backup|-old|-BACKUP|-demo|index-new ]]; then
        echo "⏭️  Atlanıyor: $file"
        continue
    fi

    # index.html'i atla (zaten yapıldı)
    if [[ "$file" == "index.html" ]]; then
        echo "✅ Zaten tamamlandı: $file"
        continue
    fi

    echo "🔄 İşleniyor: $file"

    # Caveat'i Inter'e çevir, font-weight 700'ü 900'e çevir
    sed -i '' \
        -e "s/font-family: 'Caveat', cursive !important;/font-family: 'Inter', sans-serif !important;/g" \
        -e "s/font-weight: 700 !important;/font-weight: 900 !important;/g" \
        "$file"

    echo "✅ Tamamlandı: $file"
done

echo ""
echo "🎉 Tüm dosyalar güncellendi!"
echo "📝 LyDian logo karakteri artık Inter Bold (weight: 900) fontu kullanıyor."
