#!/bin/bash
# Premium Favicon ve Logo Ekleme Script'i

FAVICON='<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg width='\''32'\'' height='\''32'\'' viewBox='\''0 0 32 32'\'' xmlns='\''http://www.w3.org/2000/svg'\''%3E%3Crect width='\''32'\'' height='\''32'\'' rx='\''6'\'' fill='\''%230f172a'\''/%3E%3Cpath d='\''M8 12l8-6 8 6v12l-8 6-8-6z'\'' fill='\''none'\'' stroke='\''%23e2e8f0'\'' stroke-width='\''1.5'\''/%3E%3Cpath d='\''M16 12l-4 3v6l4 3 4-3v-6z'\'' fill='\''%23e2e8f0'\'' opacity='\''0.3'\''/%3E%3C/svg%3E">'

count=0
for file in *.html; do
    # chat.html'i atla (zaten eklendi)
    if [ "$file" == "chat.html" ]; then
        continue
    fi
    
    # Favicon zaten varsa atla
    if grep -q "favicon" "$file" 2>/dev/null; then
        echo "⏭️  $file - zaten favicon var"
        continue
    fi
    
    # <head> sonrasına favicon ekle
    if grep -q "<head>" "$file" 2>/dev/null; then
        sed -i '' "/<head>/a\\
    <!-- Favicon -->\\
    $FAVICON\\
" "$file"
        echo "✅ $file - favicon eklendi"
        ((count++))
    fi
done

echo ""
echo "🎉 Toplam $count dosyaya favicon eklendi!"
