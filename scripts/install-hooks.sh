#!/bin/bash

# ============================
# 🌍 LyDian Git Hooks Installer
# ============================
#
# Installs custom git hooks for i18n validation
#
# Usage:
#   ./scripts/install-hooks.sh
#
# What it does:
# - Copies hooks from .githooks/ to .git/hooks/
# - Makes hooks executable
# - Configures git to use custom hooks directory
#
# @author LyDian AI Platform
# @license MIT
# @version 2.0.0

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🌍 LyDian Git Hooks Installer                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Error: Not in a git repository root${NC}"
    echo "   Run this script from the project root directory"
    exit 1
fi

# Check if .githooks directory exists
if [ ! -d ".githooks" ]; then
    echo -e "${YELLOW}⚠️  Error: .githooks directory not found${NC}"
    exit 1
fi

# Method 1: Use git config core.hooksPath (recommended)
echo -e "${BLUE}📝 Configuring git to use .githooks directory...${NC}"

git config core.hooksPath .githooks

echo -e "${GREEN}✅ Git configured to use .githooks${NC}"
echo ""

# Make all hooks executable
echo -e "${BLUE}🔧 Making hooks executable...${NC}"

chmod +x .githooks/*

echo -e "${GREEN}✅ Hooks are now executable${NC}"
echo ""

# List installed hooks
echo -e "${BLUE}📋 Installed hooks:${NC}"
echo ""

for hook in .githooks/*; do
    if [ -f "$hook" ]; then
        hook_name=$(basename "$hook")
        echo -e "   ${GREEN}✓${NC} $hook_name"
    fi
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Git hooks installed successfully!${NC}"
echo ""
echo -e "${BLUE}📝 What happens next:${NC}"
echo "   • Pre-commit hook will validate i18n files"
echo "   • JSON syntax will be checked"
echo "   • Translation completeness verified"
echo "   • Security scans for XSS/RTL spoofing"
echo ""
echo -e "${YELLOW}💡 To bypass hooks (not recommended):${NC}"
echo "   git commit --no-verify"
echo ""
echo -e "${YELLOW}💡 To uninstall hooks:${NC}"
echo "   git config --unset core.hooksPath"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
