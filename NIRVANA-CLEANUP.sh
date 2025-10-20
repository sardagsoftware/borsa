#!/bin/bash
# === AILYDIAN NIRVANA LEVEL CLEANUP & HARDENING ===
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  AILYDIAN - NIRVANA LEVEL SYSTEM CLEANUP                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. LOG TEMİZLİĞİ (KRİTİK)
echo -e "${YELLOW}[1/7] Log dosyalarından gizli bilgiler temizleniyor...${NC}"

# Log dosyalarını bul ve yedekle
CLEANED=0
if find . -name "*.log" -type f 2>/dev/null | grep -q .; then
  # Önce yedek al
  mkdir -p .log-backups
  find . -name "*.log" -type f -exec cp {} .log-backups/ 2>/dev/null \; || true
  
  # Gizli bilgileri temizle
  find . -name "*.log" -type f -exec sed -i.bak \
    -e 's/password[[:space:]]*[:=][[:space:]]*[^[:space:]]*/password=***REDACTED***/gi' \
    -e 's/secret[[:space:]]*[:=][[:space:]]*[^[:space:]]*/secret=***REDACTED***/gi' \
    -e 's/token[[:space:]]*[:=][[:space:]]*[^[:space:]]*/token=***REDACTED***/gi' \
    -e 's/api[_-]key[[:space:]]*[:=][[:space:]]*[^[:space:]]*/api_key=***REDACTED***/gi' \
    -e 's/Bearer [A-Za-z0-9_-]+/Bearer ***REDACTED***/g' \
    {} \; 2>/dev/null && CLEANED=$((CLEANED + 1)) || true
  
  # Backup dosyalarını temizle
  find . -name "*.log.bak" -delete 2>/dev/null || true
  
  echo -e "${GREEN}✅ $CLEANED log dosyası temizlendi${NC}"
else
  echo -e "${GREEN}✅ Temizlenecek log dosyası bulunamadı${NC}"
fi
echo ""

# 2. GÜVENLİK BAŞLIKLARI
echo -e "${YELLOW}[2/7] Güvenlik başlıkları server.js'e ekleniyor...${NC}"

if [ -f "server.js" ]; then
  # server.js'i oku ve güvenlik başlıkları ekle
  if ! grep -q "helmet" server.js 2>/dev/null; then
    cat > server-security-patch.js << 'SECURITY_PATCH'
// === SECURITY HEADERS MIDDLEWARE ===
const securityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://vercel.live wss://ws-*.pusher.com https://*.pusher.com; " +
    "frame-ancestors 'self'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  
  // HTTP Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};

// Export for use in server
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { securityHeaders };
}
SECURITY_PATCH

    echo -e "${GREEN}✅ Güvenlik başlıkları patch dosyası oluşturuldu${NC}"
    echo -e "${YELLOW}   server.js'e manual olarak eklenecek: require('./server-security-patch.js')${NC}"
  else
    echo -e "${GREEN}✅ Güvenlik başlıkları zaten mevcut${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  server.js bulunamadı${NC}"
fi
echo ""

# 3. .ENV GÜVENLİĞİ
echo -e "${YELLOW}[3/7] .env dosyaları güvenlik kontrolü...${NC}"

# .env.example oluştur (gerçek değerler olmadan)
if [ -f ".env" ]; then
  cat .env | sed 's/=.*/=YOUR_VALUE_HERE/g' > .env.example 2>/dev/null || true
  echo -e "${GREEN}✅ .env.example oluşturuldu${NC}"
fi

# .env dosyalarının .gitignore'da olduğundan emin ol
if [ -f ".gitignore" ]; then
  if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo ".env" >> .gitignore
    echo ".env.local" >> .gitignore
    echo ".env.*.local" >> .gitignore
    echo -e "${GREEN}✅ .env dosyaları .gitignore'a eklendi${NC}"
  else
    echo -e "${GREEN}✅ .env zaten .gitignore'da${NC}"
  fi
fi
echo ""

# 4. PORT KONTROLÜ VE SERVİS DURUMU
echo -e "${YELLOW}[4/7] Port ve servis durumu kontrol ediliyor...${NC}"

declare -A PORTS=(
  ["Web"]="3100"
  ["Chat"]="3901"
  ["Brain-API"]="5001"
)

for service in "${!PORTS[@]}"; do
  port="${PORTS[$service]}"
  if lsof -i ":$port" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ $service (Port $port): ÇALIŞIYOR${NC}"
  else
    echo -e "${YELLOW}⏳ $service (Port $port): ÇALIŞMIYOR${NC}"
  fi
done
echo ""

# 5. DNS PROPAGATION KONTROL
echo -e "${YELLOW}[5/7] DNS propagation durumu kontrol ediliyor...${NC}"

DOMAINS=("ailydian.com" "travel.ailydian.com" "blockchain.ailydian.com")
PROPAGATED=0

for domain in "${DOMAINS[@]}"; do
  if timeout 3 curl -sSI "https://$domain" 2>&1 | grep -q "x-azure-ref" 2>/dev/null; then
    echo -e "${GREEN}✅ $domain: Azure AFD AKTİF${NC}"
    PROPAGATED=$((PROPAGATED + 1))
  else
    echo -e "${YELLOW}⏳ $domain: Hala Vercel'de (propagating)${NC}"
  fi
done

echo -e "${CYAN}DNS Propagation: $PROPAGATED/3 domain${NC}"
echo ""

# 6. API HEALTH CHECK
echo -e "${YELLOW}[6/7] API endpoint'leri test ediliyor...${NC}"

ENDPOINTS=(
  "http://localhost:3100"
  "http://localhost:3100/api/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
  if timeout 5 curl -sSf "$endpoint" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ $endpoint: SAĞLIKLI${NC}"
  else
    echo -e "${YELLOW}⏳ $endpoint: ERİŞİLEMEZ${NC}"
  fi
done
echo ""

# 7. FİNAL GÜVENLİK SKORU
echo -e "${YELLOW}[7/7] Final güvenlik skoru hesaplanıyor...${NC}"

SCORE=0
MAX_SCORE=100

# Log temizliği (+30 puan)
if [ $CLEANED -gt 0 ]; then
  SCORE=$((SCORE + 30))
  echo -e "${GREEN}✅ [+30] Log dosyaları temizlendi${NC}"
fi

# .env güvenliği (+20 puan)
if grep -q "^\.env$" .gitignore 2>/dev/null; then
  SCORE=$((SCORE + 20))
  echo -e "${GREEN}✅ [+20] .env güvenliği sağlandı${NC}"
fi

# Servisler çalışıyor (+30 puan)
if lsof -i :3100 >/dev/null 2>&1; then
  SCORE=$((SCORE + 30))
  echo -e "${GREEN}✅ [+30] Web servisi çalışıyor${NC}"
fi

# DNS propagation (+20 puan)
if [ $PROPAGATED -gt 0 ]; then
  POINTS=$((PROPAGATED * 7))
  SCORE=$((SCORE + POINTS))
  echo -e "${GREEN}✅ [+$POINTS] DNS propagation ilerleme${NC}"
fi

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  NIRVANA LEVEL GÜVENLİK SKORU: $SCORE/100                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $SCORE -ge 80 ]; then
  echo -e "${GREEN}🏆 MÜKEMMEL! Sistem Nirvana seviyesine yakın!${NC}"
elif [ $SCORE -ge 60 ]; then
  echo -e "${YELLOW}⚡ İYİ! Birkaç iyileştirme daha yapılabilir${NC}"
else
  echo -e "${RED}⚠️  DİKKAT! Daha fazla güvenlik önlemi gerekli${NC}"
fi

echo ""
echo -e "${CYAN}Temizlik tamamlandı! Sonraki adımlar:${NC}"
echo "1. Chat servisini başlat: cd apps/chat-ailydian && PORT=3901 npm run dev"
echo "2. Azure Portal kurulumunu tamamla: ops/AZURE-PORTAL-QUICK-START.md"
echo "3. DNS propagation'ı izle: cd ops && ./monitor-propagation.sh"
echo ""

