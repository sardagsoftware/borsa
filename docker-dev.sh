#!/bin/bash

# AILYDIAN AI LENS TRADER - Docker Development Management Script
# Bu script ile Docker ortamını kolayca yönetebilirsiniz

set -e

# Renkli çıktılar için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "================================================="
echo "   AILYDIAN AI LENS TRADER - Docker Manager     "
echo "================================================="
echo -e "${NC}"

# Fonksiyonlar
show_help() {
    echo -e "${YELLOW}Kullanım:${NC}"
    echo "  ./docker-dev.sh [KOMUT]"
    echo ""
    echo -e "${YELLOW}Komutlar:${NC}"
    echo "  up       - Tüm servisleri başlat (detached mode)"
    echo "  down     - Tüm servisleri durdur"
    echo "  restart  - Tüm servisleri yeniden başlat"
    echo "  logs     - Canlı logları göster"
    echo "  status   - Servis durumlarını göster"
    echo "  clean    - Tüm container, volume ve image'ları temizle"
    echo "  build    - Container'ları yeniden build et"
    echo "  shell    - Ana uygulama container'ına bağlan"
    echo "  db       - PostgreSQL container'ına bağlan"
    echo "  redis    - Redis container'ına bağlan"
    echo "  health   - Tüm servislerin sağlığını kontrol et"
    echo "  urls     - Erişilebilir URL'leri göster"
    echo ""
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker yüklü değil!${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose yüklü değil!${NC}"
        exit 1
    fi
}

start_services() {
    echo -e "${GREEN}🚀 AILYDIAN AI LENS TRADER servisleri başlatılıyor...${NC}"
    docker-compose -f docker-compose.dev.yml up -d
    
    echo -e "${YELLOW}⏳ Servislerin hazır olması bekleniyor...${NC}"
    sleep 10
    
    show_urls
    show_status
}

stop_services() {
    echo -e "${YELLOW}🛑 Servisler durduruluyor...${NC}"
    docker-compose -f docker-compose.dev.yml down
}

restart_services() {
    echo -e "${YELLOW}🔄 Servisler yeniden başlatılıyor...${NC}"
    docker-compose -f docker-compose.dev.yml restart
    show_urls
}

show_logs() {
    echo -e "${BLUE}📋 Canlı loglar gösteriliyor... (Çıkmak için Ctrl+C)${NC}"
    docker-compose -f docker-compose.dev.yml logs -f
}

show_status() {
    echo -e "${BLUE}📊 Servis Durumları:${NC}"
    docker-compose -f docker-compose.dev.yml ps
}

clean_all() {
    echo -e "${RED}🧹 TÜM Docker kaynakları temizleniyor...${NC}"
    read -p "Emin misiniz? Tüm data silinecek! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f docker-compose.dev.yml down -v
        docker system prune -af
        docker volume prune -f
        echo -e "${GREEN}✅ Temizlik tamamlandı!${NC}"
    else
        echo -e "${YELLOW}❌ İptal edildi.${NC}"
    fi
}

build_containers() {
    echo -e "${BLUE}🔨 Container'lar yeniden build ediliyor...${NC}"
    docker-compose -f docker-compose.dev.yml build --no-cache
}

shell_access() {
    echo -e "${BLUE}🐚 Ana uygulama container'ına bağlanılıyor...${NC}"
    docker-compose -f docker-compose.dev.yml exec app sh
}

db_access() {
    echo -e "${BLUE}🗄️ PostgreSQL container'ına bağlanılıyor...${NC}"
    docker-compose -f docker-compose.dev.yml exec db psql -U ailydian -d ailydian_borsa
}

redis_access() {
    echo -e "${BLUE}📦 Redis container'ına bağlanılıyor...${NC}"
    docker-compose -f docker-compose.dev.yml exec redis redis-cli
}

check_health() {
    echo -e "${BLUE}🏥 Sağlık kontrolleri yapılıyor...${NC}"
    
    services=("app:3000" "db:5432" "redis:6379" "prisma-studio:5555" "adminer:8080" "redis-commander:8081")
    
    for service in "${services[@]}"; do
        name=${service%:*}
        port=${service#*:}
        
        if docker-compose -f docker-compose.dev.yml ps | grep -q "$name.*Up"; then
            echo -e "${GREEN}✅ $name servisi çalışıyor${NC}"
        else
            echo -e "${RED}❌ $name servisi çalışmıyor${NC}"
        fi
    done
}

show_urls() {
    echo -e "${GREEN}🌐 Erişilebilir URL'ler:${NC}"
    echo -e "${YELLOW}┌────────────────────────────────────────────────┐${NC}"
    echo -e "${YELLOW}│ Ana Uygulama:      http://localhost:3000       │${NC}"
    echo -e "${YELLOW}│ Prisma Studio:     http://localhost:5555       │${NC}"
    echo -e "${YELLOW}│ Adminer (DB):      http://localhost:8080       │${NC}"
    echo -e "${YELLOW}│ Redis Commander:   http://localhost:8081       │${NC}"
    echo -e "${YELLOW}│ PostgreSQL:        localhost:5432              │${NC}"
    echo -e "${YELLOW}│ Redis:             localhost:6379              │${NC}"
    echo -e "${YELLOW}└────────────────────────────────────────────────┘${NC}"
}

# Ana script mantığı
check_docker

case "${1:-}" in
    "up"|"start")
        start_services
        ;;
    "down"|"stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "logs")
        show_logs
        ;;
    "status"|"ps")
        show_status
        ;;
    "clean")
        clean_all
        ;;
    "build")
        build_containers
        ;;
    "shell"|"bash")
        shell_access
        ;;
    "db"|"database")
        db_access
        ;;
    "redis")
        redis_access
        ;;
    "health")
        check_health
        ;;
    "urls")
        show_urls
        ;;
    "help"|"-h"|"--help"|"")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Bilinmeyen komut: $1${NC}"
        show_help
        exit 1
        ;;
esac
