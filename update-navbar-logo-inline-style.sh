#!/bin/bash

# Navbar logolarına inline style ekleyen script
# Inter Bold (weight: 900) uygular

cd /Users/sardag/Desktop/ailydian-ultra-pro/public

echo "🔄 Navbar logoları Inter Bold inline style ile güncelleniyor..."
echo ""

# Backup/old dosyalarını hariç tut
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

    # Navbar logo'yu kontrol et
    if grep -q 'class="logo"' "$file"; then
        echo "🔄 İşleniyor: $file"

        # Logo inline style'ına font-family ve font-weight ekle
        # Eğer zaten inline style varsa, üzerine ekle
        sed -i '' \
            -e 's/class="logo" style="\([^"]*\)"/class="logo" style="\1 font-family: '\''Inter'\'', sans-serif !important; font-weight: 900 !important;"/g' \
            -e 's/class="logo">/class="logo" style="font-family: '\''Inter'\'', sans-serif !important; font-weight: 900 !important;">/g' \
            "$file"

        echo "✅ Tamamlandı: $file"
    else
        echo "⏭️  Logo yok: $file"
    fi
done

echo ""
echo "🎉 Navbar logoları güncellendi!"
echo "📝 Tüm logolar artık Inter Bold (weight: 900) kullanıyor."
