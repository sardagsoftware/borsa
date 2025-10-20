#!/bin/bash

# LyDian yazı karakterini Righteous'dan Caveat'e değiştiren script
# Backup ve old dosyalarını atlar

cd /Users/sardag/Desktop/ailydian-ultra-pro/public

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

    # .logo CSS - Righteous'u Caveat'e çevir, font-weight 900'ü 700'e çevir
    sed -i '' \
        -e "s/font-family: 'Righteous', cursive !important;/font-family: 'Caveat', cursive !important;/g" \
        -e "s/font-weight: 900 !important;/font-weight: 700 !important;/g" \
        "$file"

    echo "✅ Tamamlandı: $file"
done

echo ""
echo "🎉 Tüm dosyalar güncellendi!"
echo "📝 LyDian yazı karakteri artık Caveat (el yazısı) fontu kullanıyor."
