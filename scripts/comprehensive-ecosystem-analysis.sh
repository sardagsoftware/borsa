#!/bin/bash
###############################################################################
# 🔍 COMPREHENSIVE ECOSYSTEM ANALYSIS
# www.ailydian.com - A'dan Z'ye Analiz
###############################################################################

set -e

PROJECT_DIR="/Users/sardag/Desktop/ailydian-ultra-pro/ailydian-from-github"
REPORT_FILE="${PROJECT_DIR}/ECOSYSTEM_ANALYSIS_REPORT.md"

cd "$PROJECT_DIR"

cat > "$REPORT_FILE" << 'EOF'
# 🔍 www.ailydian.com - Kapsamlı Ekosistem Analizi

**Analiz Tarihi:** $(date)
**Versiyon:** Production
**Domain:** www.ailydian.com

---

## 📊 1. GENEL BAKIŞ

EOF

# Count files
echo "### Proje Yapısı" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "Toplam HTML Sayfaları: $(find public -name '*.html' | wc -l | tr -d ' ')" >> "$REPORT_FILE"
echo "Toplam JavaScript: $(find . -name '*.js' -not -path './node_modules/*' | wc -l | tr -d ' ')" >> "$REPORT_FILE"
echo "Toplam CSS: $(find public -name '*.css' | wc -l | tr -d ' ')" >> "$REPORT_FILE"
echo "Toplam Görseller: $(find public -name '*.png' -o -name '*.jpg' -o -name '*.svg' | wc -l | tr -d ' ')" >> "$REPORT_FILE"
echo "Konfigürasyon: $(ls *.json *.js 2>/dev/null | wc -l | tr -d ' ')" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Frontend Analysis
cat >> "$REPORT_FILE" << 'FRONTEND_EOF'

## 🎨 2. FRONTEND ANALİZİ

### Ana Sayfalar:

FRONTEND_EOF

# List main pages
echo '```' >> "$REPORT_FILE"
ls -lh public/*.html 2>/dev/null | head -20 | awk '{print $9, "-", $5}' >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# JavaScript Analysis
cat >> "$REPORT_FILE" << 'JS_EOF'

### JavaScript Dosyaları:

JS_EOF

echo '```' >> "$REPORT_FILE"
find public/js -name '*.js' 2>/dev/null | head -20 >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# API Analysis
cat >> "$REPORT_FILE" << 'API_EOF'

## 🔌 3. API VE BACKEND

### API Endpoints:

API_EOF

echo '```' >> "$REPORT_FILE"
grep -r "fetch\|axios\|XMLHttpRequest" public/*.html 2>/dev/null | grep -o "https*://[^\"']*" | sort -u | head -20 >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Security Analysis
cat >> "$REPORT_FILE" << 'SECURITY_EOF'

## 🛡️ 4. GÜVENLİK ANALİZİ

### Güvenlik Headers:

SECURITY_EOF

echo '```' >> "$REPORT_FILE"
grep -r "X-Content-Type-Options\|X-Frame-Options\|Content-Security-Policy" public/*.html 2>/dev/null | head -5 >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# SEO Analysis
cat >> "$REPORT_FILE" << 'SEO_EOF'

## 🔍 5. SEO ANALİZİ

### SEO Metrics:

SEO_EOF

echo '```bash' >> "$REPORT_FILE"
echo "# Schema.org JSON-LD" >> "$REPORT_FILE"
echo "Toplam Schema: $(grep -r '@type' public/*.html 2>/dev/null | wc -l | tr -d ' ')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "# Meta Tags" >> "$REPORT_FILE"
echo "Meta Description: $(grep -r 'meta name=\"description\"' public/*.html 2>/dev/null | wc -l | tr -d ' ')" >> "$REPORT_FILE"
echo "OG Tags: $(grep -r 'property=\"og:' public/*.html 2>/dev/null | wc -l | tr -d ' ')" >> "$REPORT_FILE"
echo "Twitter Cards: $(grep -r 'name=\"twitter:' public/*.html 2>/dev/null | wc -l | tr -d ' ')" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Configuration
cat >> "$REPORT_FILE" << 'CONFIG_EOF'

## ⚙️ 6. KONFİGÜRASYON

### Ana Konfigürasyon Dosyaları:

CONFIG_EOF

echo '```' >> "$REPORT_FILE"
ls -lh *.json *.js 2>/dev/null | grep -v node_modules | awk '{print $9, "-", $5}' >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Services
cat >> "$REPORT_FILE" << 'SERVICES_EOF'

## 🔧 7. SERVİSLER VE ENTEGRASYONLAR

### Tespit Edilen Servisler:

SERVICES_EOF

echo '```' >> "$REPORT_FILE"
grep -rh "https://.*\.com\|https://.*\.ai" public/*.html 2>/dev/null | grep -o "https://[^\"']*" | cut -d'/' -f3 | sort -u | head -20 >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "✅ Analiz tamamlandı: $REPORT_FILE"
