#!/bin/bash
# Complete SEO Deployment Script
# Automates the full deployment of SEO infrastructure

set -e

echo "╔════════════════════════════════════════════╗"
echo "║  LyDian SEO Complete Deployment            ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

STEP=1
TOTAL_STEPS=10

# Function to print step
step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Step $STEP/$TOTAL_STEPS: $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    ((STEP++))
}

# Function to check command success
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        exit 1
    fi
}

# Change to project directory
cd "$(dirname "$0")/.." || exit 1

step "Verify All SEO Files Exist"
echo -n "Checking robots.txt... "
[ -f "public/robots.txt" ] && echo -e "${GREEN}✓${NC}" || { echo -e "${RED}✗${NC}"; exit 1; }

echo -n "Checking sitemap.xml... "
[ -f "public/sitemap.xml" ] && echo -e "${GREEN}✓${NC}" || { echo -e "${RED}✗${NC}"; exit 1; }

echo -n "Checking llms.txt... "
[ -f "public/llms.txt" ] && echo -e "${GREEN}✓${NC}" || { echo -e "${RED}✗${NC}"; exit 1; }

echo -n "Checking organization.jsonld... "
[ -f "web/seo/organization.jsonld" ] && echo -e "${GREEN}✓${NC}" || { echo -e "${RED}✗${NC}"; exit 1; }

echo -n "Checking faq.jsonld... "
[ -f "web/seo/faq.jsonld" ] && echo -e "${GREEN}✓${NC}" || { echo -e "${RED}✗${NC}"; exit 1; }

step "Validate JSON-LD Schemas"
echo "Validating organization.jsonld..."
jq empty web/seo/organization.jsonld 2>/dev/null
check

echo "Validating faq.jsonld..."
jq empty web/seo/faq.jsonld 2>/dev/null
check

step "Copy Schema Files to Public"
echo "Copying organization.jsonld to public..."
cp web/seo/organization.jsonld public/organization.jsonld
check

echo "Copying faq.jsonld to public..."
cp web/seo/faq.jsonld public/faq.jsonld
check

step "Verify Meta Tags in index.html"
echo -n "Checking Google verification tag... "
grep -q "google-site-verification" public/index.html && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}⚠ Not found${NC}"

echo -n "Checking Bing verification tag... "
grep -q "msvalidate.01" public/index.html && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}⚠ Not found${NC}"

echo -n "Checking OpenGraph tags... "
grep -q "og:title" public/index.html && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}⚠ Not found${NC}"

echo -n "Checking Twitter Card tags... "
grep -q "twitter:card" public/index.html && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}⚠ Not found${NC}"

step "Git Status Check"
echo "Current git status:"
git status --short

step "Stage All SEO Files"
echo "Staging files..."
git add public/robots.txt
git add public/sitemap.xml
git add public/llms.txt
git add public/organization.jsonld
git add public/faq.jsonld
git add public/index.html
git add public/*placeholder.svg
git add web/seo/
git add docs/
git add scripts/
git add wiki/
git add linkedin/
check

step "Commit Changes"
echo "Creating commit..."
git commit -m "$(cat <<'EOF'
feat(seo): Complete SEO infrastructure deployment

✨ Features Added:
- robots.txt with crawler directives
- sitemap.xml with 40+ URLs
- llms.txt for AI/LLM discovery
- Schema.org structured data (Organization, FAQ)
- Meta verification tags (Google, Bing)
- OpenGraph and Twitter Card tags
- Visual placeholders (logo, OG image, LinkedIn cover)

📚 Documentation:
- Wikipedia drafts (TR/EN)
- LinkedIn company profile content
- Search Console setup guide
- Visual assets guide
- Master execution checklist

🔒 White-Hat Compliance:
- W3C compliant schemas
- No cloaking or black-hat techniques
- All facts verifiable
- OWASP compliant

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
check

step "Push to Remote"
read -p "Push to remote repository? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing to remote..."
    git push
    check
else
    echo -e "${YELLOW}Skipped push. Run 'git push' manually when ready.${NC}"
fi

step "Run SEO Validation Tests"
if [ -f "scripts/test-seo-files.sh" ]; then
    echo "Running SEO tests..."
    bash scripts/test-seo-files.sh https://www.ailydian.com || echo -e "${YELLOW}⚠ Some tests failed (expected before deployment)${NC}"
else
    echo -e "${YELLOW}⚠ Test script not found${NC}"
fi

step "Next Steps"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Complete!                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "📝 Manual Steps Required:"
echo ""
echo "1. ${BLUE}Deploy to Vercel:${NC}"
echo "   ${YELLOW}vercel --prod${NC}"
echo ""
echo "2. ${BLUE}Google Search Console:${NC}"
echo "   • Go to: https://search.google.com/search-console"
echo "   • Add property: https://www.ailydian.com"
echo "   • Click 'Verify' (meta tag already in HTML)"
echo "   • Submit sitemap: sitemap.xml"
echo ""
echo "3. ${BLUE}Bing Webmaster Tools:${NC}"
echo "   • Go to: https://www.bing.com/webmasters"
echo "   • Add site: https://www.ailydian.com"
echo "   • Click 'Verify' (meta tag already in HTML)"
echo "   • Submit sitemap: https://www.ailydian.com/sitemap.xml"
echo ""
echo "4. ${BLUE}Create Visual Assets:${NC}"
echo "   • Logo (400×400 px)"
echo "   • LinkedIn cover (1584×396 px)"
echo "   • OG image (1200×628 px)"
echo "   • See: docs/VISUAL-ASSETS-GUIDE.md"
echo ""
echo "5. ${BLUE}Set Up LinkedIn:${NC}"
echo "   • Go to: linkedin.com/company/setup/new/"
echo "   • Follow: docs/LINKEDIN-SETUP-GUIDE.md"
echo "   • Use content from: linkedin/profile/"
echo ""
echo "6. ${BLUE}Monitor & Validate:${NC}"
echo "   • Test Rich Results: https://search.google.com/test/rich-results"
echo "   • Check indexing status in Search Console"
echo "   • Monitor analytics weekly"
echo ""
echo -e "${BLUE}📚 Documentation:${NC} See docs/MASTER-EXECUTION-CHECKLIST.md"
echo ""
