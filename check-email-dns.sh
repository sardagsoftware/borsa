#!/bin/bash

# ========================================
# EMAIL DNS CHECKER FOR www.ailydian.com
# ========================================
# This script checks if MX records are properly configured

echo "🔍 CHECKING EMAIL DNS CONFIGURATION..."
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check MX Records
echo "📧 Checking MX Records..."
MX_RECORDS=$(dig MX ailydian.com +short 2>/dev/null)

if [ -z "$MX_RECORDS" ]; then
    echo -e "${RED}❌ MX RECORDS NOT FOUND${NC}"
    echo ""
    echo "⚠️  Email will NOT work without MX records!"
    echo ""
    echo "Required MX records:"
    echo "  10 mx.zoho.eu"
    echo "  20 mx2.zoho.eu"
    echo "  50 mx3.zoho.eu"
    echo ""
    echo "👉 Add these records in Vercel Dashboard:"
    echo "   https://vercel.com/emrahsardag-yandexcoms-projects/ailydian/settings/domains"
    MX_STATUS="MISSING"
else
    echo -e "${GREEN}✅ MX RECORDS FOUND:${NC}"
    echo "$MX_RECORDS"
    echo ""

    # Check for required Zoho MX records
    if echo "$MX_RECORDS" | grep -q "mx.zoho.eu" && \
       echo "$MX_RECORDS" | grep -q "mx2.zoho.eu" && \
       echo "$MX_RECORDS" | grep -q "mx3.zoho.eu"; then
        echo -e "${GREEN}✅ All 3 Zoho MX records configured correctly!${NC}"
        MX_STATUS="OK"
    else
        echo -e "${YELLOW}⚠️  Zoho MX records incomplete${NC}"
        MX_STATUS="INCOMPLETE"
    fi
fi

echo ""
echo "======================================"
echo ""

# Check TXT Records (Zoho Verification)
echo "🔐 Checking TXT Records (Zoho Verification)..."
TXT_RECORDS=$(dig TXT ailydian.com +short 2>/dev/null)

if echo "$TXT_RECORDS" | grep -q "zoho-verification"; then
    echo -e "${GREEN}✅ ZOHO VERIFICATION RECORD FOUND${NC}"
    echo "$TXT_RECORDS" | grep "zoho-verification"
    TXT_STATUS="OK"
else
    echo -e "${YELLOW}⚠️  Zoho verification record not found${NC}"
    TXT_STATUS="MISSING"
fi

echo ""
echo "======================================"
echo ""

# Check A Record (www subdomain)
echo "🌐 Checking A Record (www.ailydian.com)..."
A_RECORDS=$(dig A www.ailydian.com +short 2>/dev/null)

if [ -z "$A_RECORDS" ]; then
    echo -e "${RED}❌ A RECORD NOT FOUND${NC}"
    A_STATUS="MISSING"
else
    echo -e "${GREEN}✅ A RECORD FOUND:${NC}"
    echo "$A_RECORDS"
    A_STATUS="OK"
fi

echo ""
echo "======================================"
echo ""

# Check HTTPS (SSL)
echo "🔒 Checking HTTPS/SSL..."
HTTP_STATUS=$(curl -I -s https://www.ailydian.com 2>&1 | head -1)

if echo "$HTTP_STATUS" | grep -q "200"; then
    echo -e "${GREEN}✅ HTTPS WORKING (SSL Active)${NC}"
    echo "$HTTP_STATUS"
    SSL_STATUS="OK"
else
    echo -e "${RED}❌ HTTPS NOT WORKING${NC}"
    SSL_STATUS="ERROR"
fi

echo ""
echo "======================================"
echo ""

# Check Email Dashboard Page
echo "📊 Checking Email Dashboard..."
DASHBOARD_STATUS=$(curl -I -s https://www.ailydian.com/email-dashboard 2>&1 | head -1)

if echo "$DASHBOARD_STATUS" | grep -q "200"; then
    echo -e "${GREEN}✅ EMAIL DASHBOARD LIVE${NC}"
    echo "   https://www.ailydian.com/email-dashboard"
    DASHBOARD_STATUS_OK="OK"
else
    echo -e "${RED}❌ EMAIL DASHBOARD NOT ACCESSIBLE${NC}"
    DASHBOARD_STATUS_OK="ERROR"
fi

echo ""
echo "======================================"
echo ""

# Summary
echo "📋 SUMMARY"
echo "======================================"
echo ""

if [ "$MX_STATUS" = "OK" ]; then
    echo -e "${GREEN}✅ MX Records: CONFIGURED${NC}"
elif [ "$MX_STATUS" = "INCOMPLETE" ]; then
    echo -e "${YELLOW}⚠️  MX Records: INCOMPLETE${NC}"
else
    echo -e "${RED}❌ MX Records: MISSING (CRITICAL!)${NC}"
fi

if [ "$TXT_STATUS" = "OK" ]; then
    echo -e "${GREEN}✅ Zoho Verification: OK${NC}"
else
    echo -e "${YELLOW}⚠️  Zoho Verification: MISSING${NC}"
fi

if [ "$A_STATUS" = "OK" ]; then
    echo -e "${GREEN}✅ Domain DNS: OK${NC}"
else
    echo -e "${RED}❌ Domain DNS: ERROR${NC}"
fi

if [ "$SSL_STATUS" = "OK" ]; then
    echo -e "${GREEN}✅ HTTPS/SSL: OK${NC}"
else
    echo -e "${RED}❌ HTTPS/SSL: ERROR${NC}"
fi

if [ "$DASHBOARD_STATUS_OK" = "OK" ]; then
    echo -e "${GREEN}✅ Email Dashboard: LIVE${NC}"
else
    echo -e "${RED}❌ Email Dashboard: ERROR${NC}"
fi

echo ""
echo "======================================"
echo ""

# Overall Status
if [ "$MX_STATUS" = "OK" ] && [ "$TXT_STATUS" = "OK" ] && [ "$A_STATUS" = "OK" ] && [ "$SSL_STATUS" = "OK" ] && [ "$DASHBOARD_STATUS_OK" = "OK" ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS GO! EMAIL SETUP COMPLETE!${NC}"
    echo ""
    echo "Next step: Test email delivery"
    echo "Send a test email to: admin@ailydian.com"
    echo ""
    OVERALL="SUCCESS"
elif [ "$MX_STATUS" != "OK" ]; then
    echo -e "${RED}⚠️  ACTION REQUIRED: ADD MX RECORDS${NC}"
    echo ""
    echo "Email will NOT work without MX records!"
    echo ""
    echo "Add these MX records in Vercel Dashboard:"
    echo "  Priority 10: mx.zoho.eu"
    echo "  Priority 20: mx2.zoho.eu"
    echo "  Priority 50: mx3.zoho.eu"
    echo ""
    echo "Dashboard: https://vercel.com/emrahsardag-yandexcoms-projects/ailydian/settings/domains"
    echo ""
    OVERALL="NEEDS_MX"
else
    echo -e "${YELLOW}⚠️  SOME ISSUES DETECTED${NC}"
    echo ""
    echo "Review the errors above and fix them."
    echo ""
    OVERALL="PARTIAL"
fi

echo "======================================"
echo ""

# Test Email Instructions
if [ "$MX_STATUS" = "OK" ]; then
    echo "📧 TEST EMAIL DELIVERY"
    echo "======================================"
    echo ""
    echo "To test if email is working:"
    echo ""
    echo "1. Send email from your personal account to:"
    echo "   admin@ailydian.com"
    echo ""
    echo "2. Check Zoho Mail panel:"
    echo "   https://mail.zoho.eu"
    echo ""
    echo "3. Log in and check inbox for admin@ailydian.com"
    echo ""
    echo "======================================"
    echo ""
fi

# Save report
REPORT_FILE="email-dns-check-report-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "EMAIL DNS CHECK REPORT"
    echo "======================"
    echo "Date: $(date)"
    echo "Domain: ailydian.com"
    echo ""
    echo "MX Records: $MX_STATUS"
    echo "TXT Records: $TXT_STATUS"
    echo "A Records: $A_STATUS"
    echo "SSL Status: $SSL_STATUS"
    echo "Dashboard: $DASHBOARD_STATUS_OK"
    echo ""
    echo "Overall: $OVERALL"
} > "$REPORT_FILE"

echo "📝 Report saved to: $REPORT_FILE"
echo ""

exit 0
