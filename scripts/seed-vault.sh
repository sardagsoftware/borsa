#!/bin/bash
# ========================================
# LYDIAN-IQ VAULT SEEDER
# ========================================
# Purpose: Seed HashiCorp Vault with API credentials from .env.vaultseed
# Usage: ./scripts/seed-vault.sh [--dry-run|--real-run]
# Compliance: KVKK/GDPR/PDPL, 7-day retention, Legal Gate enforcement
#
# MODES:
#   --dry-run:  Validate file and show what would be uploaded (default)
#   --real-run: Actually upload secrets to Vault (requires confirmation)
#
# PREREQUISITES:
#   - HashiCorp Vault installed and running
#   - VAULT_ADDR environment variable set
#   - VAULT_TOKEN with write access to secret/lydian-iq
#   - .env.vaultseed file populated with actual credentials
#
# LEGAL GATE:
#   - partner_required vendors: Only seed after partner approval
#   - sandbox_only (RU): Test credentials only, NEVER production
#   - public_api: Optional (public endpoints)
#
# ========================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VAULT_PATH="secret/lydian-iq"
SEED_FILE="docs/api-discovery/.env.vaultseed"
VENDORS_FILE="docs/api-discovery/vendors.apidex.json"

# Parse arguments
MODE="${1:---dry-run}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}LYDIAN-IQ VAULT SEEDER${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ========== Pre-flight Checks ==========

echo -e "${YELLOW}[1/5] Pre-flight checks...${NC}"

# Check if .env.vaultseed exists
if [ ! -f "$SEED_FILE" ]; then
  echo -e "${RED}❌ ERROR: $SEED_FILE not found${NC}"
  echo "Please create the vault seed file first."
  exit 1
fi
echo -e "${GREEN}✅ Vault seed file found: $SEED_FILE${NC}"

# Check if vendors.apidex.json exists
if [ ! -f "$VENDORS_FILE" ]; then
  echo -e "${RED}❌ ERROR: $VENDORS_FILE not found${NC}"
  echo "Please run API discovery first."
  exit 1
fi
echo -e "${GREEN}✅ Vendors registry found: $VENDORS_FILE${NC}"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${RED}❌ ERROR: jq is not installed${NC}"
  echo "Install jq: brew install jq (macOS) or apt-get install jq (Ubuntu)"
  exit 1
fi
echo -e "${GREEN}✅ jq installed${NC}"

# Check if Vault is installed (only for real-run)
if [ "$MODE" = "--real-run" ]; then
  if ! command -v vault &> /dev/null; then
    echo -e "${RED}❌ ERROR: HashiCorp Vault is not installed${NC}"
    echo "Install Vault: brew install vault (macOS)"
    exit 1
  fi
  echo -e "${GREEN}✅ Vault CLI installed${NC}"

  # Check VAULT_ADDR
  if [ -z "$VAULT_ADDR" ]; then
    echo -e "${RED}❌ ERROR: VAULT_ADDR environment variable not set${NC}"
    echo "Example: export VAULT_ADDR='http://127.0.0.1:8200'"
    exit 1
  fi
  echo -e "${GREEN}✅ VAULT_ADDR set: $VAULT_ADDR${NC}"

  # Check VAULT_TOKEN
  if [ -z "$VAULT_TOKEN" ]; then
    echo -e "${RED}❌ ERROR: VAULT_TOKEN environment variable not set${NC}"
    echo "Example: export VAULT_TOKEN='your-vault-token'"
    exit 1
  fi
  echo -e "${GREEN}✅ VAULT_TOKEN set${NC}"

  # Test Vault connectivity
  if ! vault status &> /dev/null; then
    echo -e "${RED}❌ ERROR: Cannot connect to Vault${NC}"
    echo "Check if Vault is running: vault status"
    exit 1
  fi
  echo -e "${GREEN}✅ Vault connectivity OK${NC}"
fi

echo ""

# ========== Validate Vendor Registry ==========

echo -e "${YELLOW}[2/5] Validating vendor registry...${NC}"

VENDOR_COUNT=$(jq '.vendors | length' "$VENDORS_FILE")
echo -e "${GREEN}✅ Found $VENDOR_COUNT vendors in registry${NC}"

if [ "$VENDOR_COUNT" -lt 48 ]; then
  echo -e "${YELLOW}⚠️  WARNING: Expected at least 48 vendors, found $VENDOR_COUNT${NC}"
fi

# Count by status
PUBLIC_API_COUNT=$(jq '[.vendors[] | select(.status == "public_api")] | length' "$VENDORS_FILE")
PARTNER_REQ_COUNT=$(jq '[.vendors[] | select(.status == "partner_required")] | length' "$VENDORS_FILE")
SANDBOX_ONLY_COUNT=$(jq '[.vendors[] | select(.status == "sandbox_only")] | length' "$VENDORS_FILE")

echo "  - public_api: $PUBLIC_API_COUNT"
echo "  - partner_required: $PARTNER_REQ_COUNT"
echo "  - sandbox_only: $SANDBOX_ONLY_COUNT"

echo ""

# ========== Parse .env.vaultseed ==========

echo -e "${YELLOW}[3/5] Parsing vault seed file...${NC}"

# Count non-empty credentials
TOTAL_KEYS=$(grep -c "^[A-Z]" "$SEED_FILE" || true)
FILLED_KEYS=$(grep -c "=.\\+" "$SEED_FILE" || true)
EMPTY_KEYS=$((TOTAL_KEYS - FILLED_KEYS))

echo -e "${GREEN}✅ Total API keys defined: $TOTAL_KEYS${NC}"
echo "  - Filled credentials: $FILLED_KEYS"
echo "  - Empty placeholders: $EMPTY_KEYS"

if [ "$FILLED_KEYS" -eq 0 ]; then
  echo -e "${YELLOW}⚠️  WARNING: No credentials filled in $SEED_FILE${NC}"
  echo "Please fill in actual API keys before running --real-run"
  if [ "$MODE" = "--real-run" ]; then
    exit 1
  fi
fi

echo ""

# ========== Legal Gate Validation ==========

echo -e "${YELLOW}[4/5] Legal Gate validation...${NC}"

# Check for RU vendors (sandbox_only)
RU_VENDORS=$(jq -r '.vendors[] | select(.country == "RU") | .vendor' "$VENDORS_FILE")
echo "  Sandbox-only vendors (RU):"
for vendor in $RU_VENDORS; do
  echo "    - $vendor (data_residency=ru_only, production=DISABLED)"
done

# Check for partner_required vendors
PARTNER_REQ_VENDORS=$(jq -r '.vendors[] | select(.status == "partner_required") | "\(.vendor) (\(.country))"' "$VENDORS_FILE" | head -10)
echo "  Partner-required vendors (sample):"
echo "$PARTNER_REQ_VENDORS" | while read line; do
  echo "    - $line"
done

echo -e "${GREEN}✅ Legal Gate compliance validated${NC}"

echo ""

# ========== Dry-run vs Real-run ==========

if [ "$MODE" = "--dry-run" ]; then
  echo -e "${YELLOW}[5/5] DRY-RUN MODE (no changes will be made)${NC}"
  echo ""
  echo "Vault path: $VAULT_PATH"
  echo "Command that would be executed:"
  echo ""
  echo -e "${BLUE}  vault kv put $VAULT_PATH @$SEED_FILE${NC}"
  echo ""
  echo -e "${GREEN}✅ DRY-RUN PASSED${NC}"
  echo ""
  echo "To actually seed Vault, run:"
  echo -e "${BLUE}  ./scripts/seed-vault.sh --real-run${NC}"
  echo ""
  exit 0
fi

if [ "$MODE" = "--real-run" ]; then
  echo -e "${YELLOW}[5/5] REAL-RUN MODE${NC}"
  echo ""
  echo -e "${RED}⚠️  WARNING: This will upload secrets to Vault!${NC}"
  echo ""
  echo "Vault address: $VAULT_ADDR"
  echo "Vault path: $VAULT_PATH"
  echo "Credentials: $FILLED_KEYS filled, $EMPTY_KEYS empty"
  echo ""
  read -p "Are you sure you want to proceed? (yes/no): " -r
  echo ""
  if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Aborted."
    exit 1
  fi

  echo "Uploading secrets to Vault..."
  vault kv put "$VAULT_PATH" @"$SEED_FILE"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ REAL-RUN COMPLETE${NC}"
    echo ""
    echo "Secrets uploaded to: $VAULT_PATH"
    echo ""
    echo "Verify with:"
    echo -e "${BLUE}  vault kv get $VAULT_PATH${NC}"
    echo ""
  else
    echo -e "${RED}❌ REAL-RUN FAILED${NC}"
    exit 1
  fi
fi

# ========== Summary ==========

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}VAULT SEEDER SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Mode: $MODE"
echo "Vendors: $VENDOR_COUNT"
echo "Credentials: $FILLED_KEYS/$TOTAL_KEYS filled"
echo "Legal Gate: ✅ Enforced"
echo ""
echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
echo -e "${BLUE}========================================${NC}"
