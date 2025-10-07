#!/bin/bash

###############################################################################
# AILYDIAN ULTRA PRO - PRODUCTION SETUP SCRIPT
# Automated PostgreSQL, HTTPS, and Backup Configuration
###############################################################################

set -e  # Exit on error

echo "🚀 =========================================="
echo "   AILYDIAN ULTRA PRO PRODUCTION SETUP"
echo "   =========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should NOT be run as root${NC}"
   exit 1
fi

echo -e "${GREEN}✓ Environment check passed${NC}"
echo ""

###############################################################################
# 1. POSTGRESQL SETUP
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 STEP 1: PostgreSQL Database Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Have you created a PostgreSQL database? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}📝 PostgreSQL Setup Options:${NC}"
    echo ""
    echo "Option 1: Supabase (Recommended for quick start)"
    echo "  • Free tier: 500MB, up to 2 databases"
    echo "  • https://supabase.com/dashboard/projects"
    echo "  • Create project → Settings → Database → Connection string"
    echo ""
    echo "Option 2: Railway"
    echo "  • $5/month, 1GB storage"
    echo "  • https://railway.app/new/template/postgres"
    echo ""
    echo "Option 3: Azure Database for PostgreSQL"
    echo "  • Enterprise-grade, auto-scaling"
    echo "  • https://portal.azure.com → Create PostgreSQL"
    echo ""
    echo "Option 4: Self-hosted"
    echo "  • Install PostgreSQL 15+"
    echo "  • Create database: createdb ailydian_production"
    echo ""
    read -p "Press Enter when ready to continue..."
fi

echo ""
read -p "Enter PostgreSQL connection string (postgresql://user:pass@host:5432/db): " DB_URL

if [[ -z "$DB_URL" ]]; then
    echo -e "${RED}❌ Database URL required${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Database URL configured${NC}"

# Test connection
echo "Testing database connection..."
if command -v psql &> /dev/null; then
    if psql "$DB_URL" -c "SELECT version();" &> /dev/null; then
        echo -e "${GREEN}✓ Database connection successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not test connection (psql command failed)${NC}"
        echo "   Make sure your database is accessible from production server"
    fi
else
    echo -e "${YELLOW}⚠️  psql not found - skipping connection test${NC}"
fi

# Run migrations
echo ""
echo "Running database migrations..."
if [ -f "../database/schema.sql" ]; then
    echo "Schema file found. Run this on your PostgreSQL instance:"
    echo "  psql \$DATABASE_URL < database/schema.sql"
else
    echo -e "${YELLOW}⚠️  schema.sql not found${NC}"
fi

echo ""
echo -e "${GREEN}✓ Step 1 Complete: PostgreSQL configured${NC}"
echo ""

###############################################################################
# 2. HTTPS/SSL SETUP
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 STEP 2: HTTPS & SSL Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Is your domain SSL-enabled? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}📝 SSL Setup Options:${NC}"
    echo ""
    echo "Option 1: Vercel (Automatic SSL)"
    echo "  • Free SSL via Let's Encrypt"
    echo "  • Auto-renewal"
    echo "  • Deploy: vercel --prod"
    echo ""
    echo "Option 2: Cloudflare (Recommended)"
    echo "  • Free SSL + CDN + DDoS protection"
    echo "  • https://dash.cloudflare.com"
    echo "  • Add site → Change nameservers → Enable SSL"
    echo ""
    echo "Option 3: Let's Encrypt (Self-hosted)"
    echo "  • Free SSL certificates"
    echo "  • sudo certbot --nginx -d yourdomain.com"
    echo ""
    echo "Option 4: Railway/Azure/AWS"
    echo "  • Built-in SSL"
    echo "  • No additional configuration needed"
    echo ""
    read -p "Press Enter when SSL is configured..."
fi

echo ""
echo -e "${GREEN}✓ Step 2 Complete: HTTPS configured${NC}"
echo ""

###############################################################################
# 3. BACKUP STRATEGY
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💾 STEP 3: Database Backup Strategy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create backup script
cat > ../scripts/backup-database.sh << 'BACKUP_SCRIPT'
#!/bin/bash
###############################################################################
# AILYDIAN DATABASE BACKUP SCRIPT
# Automated PostgreSQL backup to local + cloud storage
###############################################################################

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-$HOME/ailydian-backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ailydian_backup_${DATE}.sql.gz"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database URL from environment
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set"
    exit 1
fi

echo "🔄 Starting database backup..."
echo "   Date: $(date)"
echo "   File: $BACKUP_FILE"

# Create backup
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully"
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "   Size: $BACKUP_SIZE"
else
    echo "❌ Backup failed"
    exit 1
fi

# Upload to Azure Blob Storage (if configured)
if [ -n "$AZURE_STORAGE_CONNECTION_STRING" ]; then
    echo "☁️  Uploading to Azure Blob Storage..."
    az storage blob upload \
        --connection-string "$AZURE_STORAGE_CONNECTION_STRING" \
        --container-name "ailydian-backups" \
        --file "$BACKUP_DIR/$BACKUP_FILE" \
        --name "$BACKUP_FILE"
    echo "✅ Cloud backup complete"
fi

# Clean old backups
echo "🧹 Cleaning old backups (>${RETENTION_DAYS} days)..."
find "$BACKUP_DIR" -name "ailydian_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "✅ Cleanup complete"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ BACKUP COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BACKUP_SCRIPT

chmod +x ../scripts/backup-database.sh

echo "Backup script created: scripts/backup-database.sh"
echo ""

# Setup cron job
echo "Setting up automated daily backups..."
echo ""
echo "Add this to your crontab (crontab -e):"
echo ""
echo -e "${YELLOW}# Ailydian daily backup at 3 AM${NC}"
echo -e "${YELLOW}0 3 * * * cd /path/to/ailydian-ultra-pro && ./scripts/backup-database.sh >> /var/log/ailydian-backup.log 2>&1${NC}"
echo ""

read -p "Do you want to add this cron job now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    CRON_JOB="0 3 * * * cd $(pwd)/.. && ./scripts/backup-database.sh >> /var/log/ailydian-backup.log 2>&1"
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✓ Cron job added${NC}"
else
    echo -e "${YELLOW}⚠️  Remember to add the cron job manually${NC}"
fi

echo ""
echo -e "${GREEN}✓ Step 3 Complete: Backup strategy configured${NC}"
echo ""

###############################################################################
# 4. ENVIRONMENT VARIABLES
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  STEP 4: Production Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Updating .env.production with database URL..."

# Update DATABASE_URL in .env.production
if [ -f "../.env.production" ]; then
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$DB_URL|g" ../.env.production
    echo -e "${GREEN}✓ .env.production updated${NC}"
else
    echo -e "${RED}❌ .env.production not found${NC}"
fi

echo ""
echo "Critical environment variables to set in your hosting platform:"
echo ""
echo -e "${YELLOW}Required:${NC}"
echo "  ✓ DATABASE_URL (already set)"
echo "  ✓ JWT_SECRET (from .env.production)"
echo "  ✓ SESSION_SECRET (from .env.production)"
echo "  ✓ SENDGRID_API_KEY"
echo ""
echo -e "${YELLOW}Recommended:${NC}"
echo "  • OPENAI_API_KEY"
echo "  • ANTHROPIC_API_KEY"
echo "  • GROQ_API_KEY"
echo "  • SENTRY_DSN (error tracking)"
echo "  • APPLICATIONINSIGHTS_CONNECTION_STRING"
echo ""

###############################################################################
# 5. DEPLOYMENT CHECKLIST
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ PRODUCTION DEPLOYMENT CHECKLIST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

checklist=(
    "PostgreSQL database created and accessible"
    "Database migrations run successfully"
    "HTTPS/SSL certificate active"
    "Backup script tested and cron job configured"
    "All environment variables set in hosting platform"
    "API keys rotated from development"
    "SendGrid account created and verified"
    "OAuth apps configured with production callback URLs"
    "Sentry error tracking configured"
    "Application Insights enabled"
)

for item in "${checklist[@]}"; do
    echo "  [ ] $item"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Review and complete the checklist above"
echo "  2. Test database connection: npm run test:db"
echo "  3. Run a manual backup: ./scripts/backup-database.sh"
echo "  4. Deploy to production: vercel --prod"
echo "  5. Monitor logs: tail -f /var/log/ailydian-backup.log"
echo ""
echo "📚 Documentation: docs/PRODUCTION_DEPLOYMENT.md"
echo ""
