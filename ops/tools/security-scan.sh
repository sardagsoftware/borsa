#!/bin/bash
###############################################################################
# 🔒 COMPREHENSIVE SECURITY SCAN
###############################################################################
# Purpose: Run DAST/SAST security scans, OWASP Top-10 checks, supply chain
# Policy: White-Hat • Zero Mock • Audit-Ready • Production-Ready
#
# Scans:
# 1. npm audit (dependency vulnerabilities)
# 2. String-guard scan (provider name leakage)
# 3. Secret scanning (API keys, tokens)
# 4. OWASP Top-10 checks (basic)
# 5. File permission checks
# 6. HTTP security headers validation
# 7. TLS/SSL configuration
#
# Usage: ./ops/tools/security-scan.sh [target_url]
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
REPORT_DIR="ops/reports"
REPORT_FILE="$REPORT_DIR/security-scan-$TIMESTAMP.md"
TARGET_URL="${1:-http://localhost:3100}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔒 COMPREHENSIVE SECURITY SCAN${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Target URL: $TARGET_URL"
echo "Report: $REPORT_FILE"
echo ""

# Create report directory
mkdir -p "$REPORT_DIR"

# Initialize report
cat > "$REPORT_FILE" << EOF
# 🔒 COMPREHENSIVE SECURITY SCAN REPORT

**Generated**: $(date)
**Target**: $TARGET_URL
**Scan ID**: security-scan-$TIMESTAMP

---

## Executive Summary

This report contains findings from comprehensive security scans including:
- Dependency vulnerability scanning (npm audit)
- Provider name leakage detection (string-guard)
- Secret scanning (API keys, tokens)
- OWASP Top-10 basic checks
- File permission validation
- HTTP security headers analysis
- TLS/SSL configuration review

---

EOF

###############################################################################
# 1. NPM AUDIT (Dependency Vulnerabilities)
###############################################################################
echo -e "${YELLOW}[1/7] Running npm audit...${NC}"

cat >> "$REPORT_FILE" << EOF
## 1. Dependency Vulnerability Scan (npm audit)

\`\`\`bash
npm audit
\`\`\`

EOF

npm audit --json > "$REPORT_DIR/npm-audit-$TIMESTAMP.json" 2>&1 || true

# Parse npm audit results
AUDIT_CRITICAL=$(jq -r '.metadata.vulnerabilities.critical // 0' "$REPORT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || echo "0")
AUDIT_HIGH=$(jq -r '.metadata.vulnerabilities.high // 0' "$REPORT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || echo "0")
AUDIT_MODERATE=$(jq -r '.metadata.vulnerabilities.moderate // 0' "$REPORT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || echo "0")
AUDIT_LOW=$(jq -r '.metadata.vulnerabilities.low // 0' "$REPORT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || echo "0")

cat >> "$REPORT_FILE" << EOF
### Findings:
- **Critical**: $AUDIT_CRITICAL
- **High**: $AUDIT_HIGH
- **Moderate**: $AUDIT_MODERATE
- **Low**: $AUDIT_LOW

**Status**: $( [ "$AUDIT_CRITICAL" -eq 0 ] && [ "$AUDIT_HIGH" -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL" )

**Details**: See \`npm-audit-$TIMESTAMP.json\`

EOF

if [ "$AUDIT_CRITICAL" -eq 0 ] && [ "$AUDIT_HIGH" -eq 0 ]; then
  echo -e "${GREEN}  ✅ npm audit: PASS${NC}"
else
  echo -e "${RED}  ❌ npm audit: FAIL ($AUDIT_CRITICAL critical, $AUDIT_HIGH high)${NC}"
fi

###############################################################################
# 2. STRING-GUARD SCAN (Provider Name Leakage)
###############################################################################
echo -e "${YELLOW}[2/7] Running string-guard scan...${NC}"

cat >> "$REPORT_FILE" << EOF

---

## 2. Provider Name Leakage Detection (string-guard)

\`\`\`bash
node ops/tools/string-guard.js scan
\`\`\`

EOF

if [ -f "ops/tools/string-guard.js" ]; then
  node ops/tools/string-guard.js scan > "$REPORT_DIR/string-guard-$TIMESTAMP.txt" 2>&1 || true

  # Parse string-guard results (simple grep for violations)
  STRING_VIOLATIONS=$(grep -c "violation" "$REPORT_DIR/string-guard-$TIMESTAMP.txt" 2>/dev/null || echo "0")

  cat >> "$REPORT_FILE" << EOF
### Findings:
- **Total Violations**: $STRING_VIOLATIONS

**Status**: $( [ "$STRING_VIOLATIONS" -eq 0 ] && echo "✅ PASS" || echo "⚠️ NEEDS ATTENTION" )

**Details**: See \`string-guard-$TIMESTAMP.txt\`

EOF

  if [ "$STRING_VIOLATIONS" -eq 0 ]; then
    echo -e "${GREEN}  ✅ string-guard: PASS${NC}"
  else
    echo -e "${YELLOW}  ⚠️  string-guard: $STRING_VIOLATIONS violations found${NC}"
  fi
else
  echo -e "${YELLOW}  ⚠️  string-guard.js not found, skipping${NC}"
  cat >> "$REPORT_FILE" << EOF
### Findings:
**Status**: ⚠️ SKIPPED (tool not found)

EOF
fi

###############################################################################
# 3. SECRET SCANNING (API Keys, Tokens)
###############################################################################
echo -e "${YELLOW}[3/7] Scanning for secrets...${NC}"

cat >> "$REPORT_FILE" << EOF

---

## 3. Secret Scanning (API Keys, Tokens)

EOF

# Search for potential secrets in codebase (excluding node_modules, .git)
SECRET_PATTERNS=(
  "sk-[a-zA-Z0-9]{48}"                    # OpenAI API keys
  "sk-ant-[a-zA-Z0-9-]{95}"               # Anthropic API keys
  "AIza[0-9A-Za-z\\-_]{35}"              # Google API keys
  "AKIA[0-9A-Z]{16}"                      # AWS access keys
  "ghp_[a-zA-Z0-9]{36}"                   # GitHub personal access tokens
  "glpat-[a-zA-Z0-9\\-_]{20,40}"         # GitLab tokens
)

SECRET_FOUND=0
for pattern in "${SECRET_PATTERNS[@]}"; do
  matches=$(grep -r -E "$pattern" --exclude-dir={node_modules,.git,.next,test-results,playwright-report} --exclude="*.{log,json}" . 2>/dev/null | wc -l || echo "0")
  SECRET_FOUND=$((SECRET_FOUND + matches))
done

cat >> "$REPORT_FILE" << EOF
### Findings:
- **Potential Secrets Found**: $SECRET_FOUND

**Status**: $( [ "$SECRET_FOUND" -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL" )

**Recommendation**: Review all matches and move secrets to environment variables.

EOF

if [ "$SECRET_FOUND" -eq 0 ]; then
  echo -e "${GREEN}  ✅ Secret scan: PASS${NC}"
else
  echo -e "${RED}  ❌ Secret scan: FAIL ($SECRET_FOUND potential secrets found)${NC}"
fi

###############################################################################
# 4. OWASP TOP-10 BASIC CHECKS
###############################################################################
echo -e "${YELLOW}[4/7] Running OWASP Top-10 checks...${NC}"

cat >> "$REPORT_FILE" << EOF

---

## 4. OWASP Top-10 Basic Checks

EOF

OWASP_ISSUES=0

# A01:2021 – Broken Access Control
# Check for exposed admin routes
if grep -r "app.use('/admin" --include="*.js" --exclude-dir=node_modules . 2>/dev/null | grep -v "middleware" > /dev/null; then
  OWASP_ISSUES=$((OWASP_ISSUES + 1))
  cat >> "$REPORT_FILE" << EOF
### A01:2021 – Broken Access Control
**Status**: ⚠️ POTENTIAL ISSUE
**Finding**: Admin routes detected without clear middleware protection
**Recommendation**: Ensure all admin routes have authentication/authorization middleware

EOF
fi

# A02:2021 – Cryptographic Failures
# Check for hardcoded secrets in code
if grep -r -E "(password|secret|key)\s*=\s*['\"]" --include="*.js" --exclude-dir=node_modules . 2>/dev/null | grep -v "process.env" | head -1 > /dev/null; then
  OWASP_ISSUES=$((OWASP_ISSUES + 1))
  cat >> "$REPORT_FILE" << EOF
### A02:2021 – Cryptographic Failures
**Status**: ⚠️ POTENTIAL ISSUE
**Finding**: Hardcoded credentials detected
**Recommendation**: Move all secrets to environment variables

EOF
fi

# A03:2021 – Injection
# Check for unsafe eval or Function usage
if grep -r -E "\beval\(|new Function\(" --include="*.js" --exclude-dir=node_modules . 2>/dev/null | head -1 > /dev/null; then
  OWASP_ISSUES=$((OWASP_ISSUES + 1))
  cat >> "$REPORT_FILE" << EOF
### A03:2021 – Injection
**Status**: ⚠️ POTENTIAL ISSUE
**Finding**: Use of eval() or new Function() detected
**Recommendation**: Avoid dynamic code execution

EOF
fi

cat >> "$REPORT_FILE" << EOF
### Summary:
- **Total OWASP Issues**: $OWASP_ISSUES

**Status**: $( [ "$OWASP_ISSUES" -eq 0 ] && echo "✅ PASS" || echo "⚠️ NEEDS REVIEW" )

EOF

if [ "$OWASP_ISSUES" -eq 0 ]; then
  echo -e "${GREEN}  ✅ OWASP checks: PASS${NC}"
else
  echo -e "${YELLOW}  ⚠️  OWASP checks: $OWASP_ISSUES potential issues${NC}"
fi

###############################################################################
# 5. FILE PERMISSION CHECKS
###############################################################################
echo -e "${YELLOW}[5/7] Checking file permissions...${NC}"

cat >> "$REPORT_FILE" << EOF

---

## 5. File Permission Validation

EOF

# Check for world-writable files
WRITABLE_FILES=$(find . -type f -perm -002 ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null | wc -l || echo "0")

# Check for executable scripts without proper shebang
SUSPICIOUS_EXEC=$(find . -type f -perm -111 ! -name "*.sh" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/bin/*" 2>/dev/null | wc -l || echo "0")

cat >> "$REPORT_FILE" << EOF
### Findings:
- **World-Writable Files**: $WRITABLE_FILES
- **Suspicious Executables**: $SUSPICIOUS_EXEC

**Status**: $( [ "$WRITABLE_FILES" -eq 0 ] && [ "$SUSPICIOUS_EXEC" -eq 0 ] && echo "✅ PASS" || echo "⚠️ NEEDS REVIEW" )

EOF

if [ "$WRITABLE_FILES" -eq 0 ] && [ "$SUSPICIOUS_EXEC" -eq 0 ]; then
  echo -e "${GREEN}  ✅ File permissions: PASS${NC}"
else
  echo -e "${YELLOW}  ⚠️  File permissions: $WRITABLE_FILES writable, $SUSPICIOUS_EXEC suspicious${NC}"
fi

###############################################################################
# 6. HTTP SECURITY HEADERS
###############################################################################
echo -e "${YELLOW}[6/7] Checking HTTP security headers...${NC}"

cat >> "$REPORT_FILE" << EOF

---

## 6. HTTP Security Headers Analysis

**Target**: $TARGET_URL

EOF

# Test security headers
HEADERS_RESPONSE=$(curl -s -I "$TARGET_URL" 2>/dev/null || echo "")

REQUIRED_HEADERS=(
  "Strict-Transport-Security"
  "X-Content-Type-Options"
  "X-Frame-Options"
  "Content-Security-Policy"
  "X-XSS-Protection"
)

MISSING_HEADERS=0
for header in "${REQUIRED_HEADERS[@]}"; do
  if echo "$HEADERS_RESPONSE" | grep -i "^$header:" > /dev/null; then
    cat >> "$REPORT_FILE" << EOF
- ✅ **$header**: Present
EOF
  else
    MISSING_HEADERS=$((MISSING_HEADERS + 1))
    cat >> "$REPORT_FILE" << EOF
- ❌ **$header**: Missing
EOF
  fi
done

cat >> "$REPORT_FILE" << EOF

**Status**: $( [ "$MISSING_HEADERS" -eq 0 ] && echo "✅ PASS" || echo "⚠️ $MISSING_HEADERS headers missing" )

EOF

if [ "$MISSING_HEADERS" -eq 0 ]; then
  echo -e "${GREEN}  ✅ Security headers: PASS${NC}"
else
  echo -e "${YELLOW}  ⚠️  Security headers: $MISSING_HEADERS missing${NC}"
fi

###############################################################################
# 7. TLS/SSL CONFIGURATION
###############################################################################
echo -e "${YELLOW}[7/7] Checking TLS/SSL configuration...${NC}"

cat >> "$REPORT_FILE" << EOF

---

## 7. TLS/SSL Configuration

EOF

if [[ "$TARGET_URL" == https://* ]]; then
  # Extract hostname
  HOSTNAME=$(echo "$TARGET_URL" | sed -E 's|https://([^/]+).*|\1|')

  # Test SSL configuration (requires openssl)
  SSL_INFO=$(echo | openssl s_client -connect "$HOSTNAME:443" -servername "$HOSTNAME" 2>/dev/null || echo "")

  if echo "$SSL_INFO" | grep -q "TLS"; then
    TLS_VERSION=$(echo "$SSL_INFO" | grep "Protocol" | awk '{print $NF}')
    CIPHER=$(echo "$SSL_INFO" | grep "Cipher" | head -1 | awk '{print $NF}')

    cat >> "$REPORT_FILE" << EOF
**Status**: ✅ TLS Enabled

- **Protocol**: $TLS_VERSION
- **Cipher**: $CIPHER

EOF
    echo -e "${GREEN}  ✅ TLS/SSL: Enabled ($TLS_VERSION)${NC}"
  else
    cat >> "$REPORT_FILE" << EOF
**Status**: ⚠️ Could not verify TLS configuration

EOF
    echo -e "${YELLOW}  ⚠️  TLS/SSL: Could not verify${NC}"
  fi
else
  cat >> "$REPORT_FILE" << EOF
**Status**: ⚠️ SKIPPED (HTTP target, TLS not applicable)

**Recommendation**: Deploy with HTTPS in production

EOF
  echo -e "${YELLOW}  ⚠️  TLS/SSL: SKIPPED (HTTP target)${NC}"
fi

###############################################################################
# FINAL SUMMARY
###############################################################################
cat >> "$REPORT_FILE" << EOF

---

## Overall Assessment

| Category | Status |
|----------|--------|
| Dependency Vulnerabilities | $( [ "$AUDIT_CRITICAL" -eq 0 ] && [ "$AUDIT_HIGH" -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL" ) |
| Provider Name Leakage | $( [ "$STRING_VIOLATIONS" -eq 0 ] && echo "✅ PASS" || echo "⚠️ NEEDS ATTENTION" ) |
| Secret Scanning | $( [ "$SECRET_FOUND" -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL" ) |
| OWASP Top-10 | $( [ "$OWASP_ISSUES" -eq 0 ] && echo "✅ PASS" || echo "⚠️ NEEDS REVIEW" ) |
| File Permissions | $( [ "$WRITABLE_FILES" -eq 0 ] && [ "$SUSPICIOUS_EXEC" -eq 0 ] && echo "✅ PASS" || echo "⚠️ NEEDS REVIEW" ) |
| HTTP Security Headers | $( [ "$MISSING_HEADERS" -eq 0 ] && echo "✅ PASS" || echo "⚠️ NEEDS REVIEW" ) |

### Recommendations

1. **Immediate Actions**:
   - Fix critical and high severity dependency vulnerabilities
   - Remove all hardcoded secrets and move to environment variables
   - Add missing security headers

2. **Short-term Actions**:
   - Address provider name leakage with anonymization layer
   - Review and fix OWASP Top-10 issues
   - Implement automated security scanning in CI/CD

3. **Long-term Actions**:
   - Set up continuous security monitoring
   - Implement Web Application Firewall (WAF)
   - Regular penetration testing
   - Security training for development team

---

**Report Generated**: $(date)
**Scan Duration**: N/A
**Next Scan**: Recommended within 30 days
EOF

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Security scan complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Report saved to: $REPORT_FILE"
echo ""

# Exit with appropriate code
if [ "$AUDIT_CRITICAL" -gt 0 ] || [ "$SECRET_FOUND" -gt 0 ]; then
  exit 1  # Critical issues found
else
  exit 0  # No critical issues
fi
