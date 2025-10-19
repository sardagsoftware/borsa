#!/bin/bash
# ===============================================
# AILYDIAN ENV FILES REMOVAL HOTFIX
# Fixes: FINDING #2 - .env Files in Repository
# CVSS: 9.3 CRITICAL
# ===============================================

set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🚨 AILYDIAN .ENV FILES REMOVAL"
echo "========================================"
echo "⚠️  WARNING: This will remove .env files from git"
echo "⚠️  Make sure you have backups of all secrets!"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Aborted"
  exit 1
fi

echo ""
echo "[1/4] Backing up current .env files..."
BACKUP_DIR="ops/backups/env-files-$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

# Backup all .env files
find . -name ".env*" -not -path "*/node_modules/*" -not -path "*/.git/*" -type f | while read file; do
  echo "  Backing up: $file"
  mkdir -p "$BACKUP_DIR/$(dirname $file)"
  cp "$file" "$BACKUP_DIR/$file"
done

echo "✅ Backup created at: $BACKUP_DIR"
echo ""

echo "[2/4] Updating .gitignore..."
if ! grep -q "# Environment files - NEVER COMMIT" .gitignore; then
  cat >> .gitignore << 'EOF'

# Environment files - NEVER COMMIT
.env
.env.*
!.env.example
!.env.test.example

# Security
*.key
*.pem
*secret*
*password*
!forgot-password.html
!reset-password.html

# Database
*.db-shm
*.db-wal

EOF
  echo "✅ .gitignore updated"
else
  echo "⚠️  .gitignore already contains env file rules"
fi
echo ""

echo "[3/4] Removing .env files from git..."
# Remove from git cache (not from filesystem)
git rm --cached .env.production 2>/dev/null || echo "  .env.production not in git"
git rm --cached .env.local 2>/dev/null || echo "  .env.local not in git"
git rm --cached .env.vercel 2>/dev/null || echo "  .env.vercel not in git"
git rm --cached infra/lci-db/.env 2>/dev/null || echo "  infra/lci-db/.env not in git"
git rm --cached ops/.env.dns 2>/dev/null || echo "  ops/.env.dns not in git"

echo "✅ Files removed from git cache"
echo ""

echo "[4/4] Creating commit..."
git add .gitignore
git commit -m "security(critical): Remove .env files from repository

SECURITY FIX - CRITICAL

Removed sensitive .env files from git repository:
- .env.production
- .env.local
- .env.vercel
- infra/lci-db/.env
- ops/.env.dns

These files contained:
- VERCEL_OIDC_TOKEN
- Database credentials
- API keys

Impact: CVSS 9.3 - Secrets exposure
Action: All exposed secrets must be rotated immediately

Refs: PENTEST-FINDING-#2

Co-Authored-By: Security Bot <security@ailydian.com>"

echo "✅ Commit created"
echo ""

echo "==============================================="
echo "✅ .ENV FILES REMOVAL COMPLETE"
echo "==============================================="
echo ""
echo "⚠️  CRITICAL NEXT STEPS:"
echo ""
echo "1. Rotate ALL exposed secrets:"
echo "   - Run: ops/security/rotate-secrets.sh"
echo ""
echo "2. Set up proper secrets management:"
echo "   - Use Vercel environment variables"
echo "   - Or use HashiCorp Vault"
echo "   - Or use AWS Secrets Manager"
echo ""
echo "3. Verify .env files are ignored:"
echo "   - Run: git status"
echo "   - Should NOT show .env files"
echo ""
echo "4. Push to remote:"
echo "   - git push origin main"
echo ""
echo "Backup location: $BACKUP_DIR"
echo ""
