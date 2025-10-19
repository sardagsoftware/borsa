#!/bin/bash
# ===============================================
# AILYDIAN SECURITY HEADERS HOTFIX
# Fixes: FINDING #1 - Missing Security Headers
# CVSS: 9.1 CRITICAL
# ===============================================

set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="ops/backups/security-headers-$TIMESTAMP"

echo "🔐 AILYDIAN SECURITY HEADERS DEPLOYMENT"
echo "========================================"
echo ""

# Create backup
echo "[1/5] Creating backup..."
mkdir -p "$BACKUP_DIR"
[ -f "server.js" ] && cp server.js "$BACKUP_DIR/"
[ -f "middleware/security.js" ] && cp middleware/security.js "$BACKUP_DIR/"
echo "✅ Backup created at: $BACKUP_DIR"
echo ""

# Create middleware directory
echo "[2/5] Creating middleware directory..."
mkdir -p middleware
echo "✅ Middleware directory ready"
echo ""

# Create security headers middleware
echo "[3/5] Deploying security headers middleware..."
cat > middleware/security-headers.js << 'EOF'
/**
 * AILYDIAN SECURITY HEADERS MIDDLEWARE
 * Implements OWASP secure headers best practices
 * https://owasp.org/www-project-secure-headers/
 */

function securityHeaders(req, res, next) {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME-sniffing attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Enforce HTTPS (when in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://unpkg.com https://cdn.jsdelivr.net https://d3js.org",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "media-src 'self' https://videos.pexels.com https://assets.mixkit.co https:",
    "connect-src 'self' https://vercel.live https://*.pusher.com https://*.ailydian.com https://tile.openstreetmap.org https://*.basemaps.cartocdn.com",
    "frame-src 'self' https://ailydian-messaging.vercel.app https://messaging.ailydian.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);

  // Permissions Policy (Feature Policy)
  const permissions = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');
  res.setHeader('Permissions-Policy', permissions);

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Additional security headers
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Download-Options', 'noopen');

  // Remove fingerprinting headers
  res.removeHeader('X-Powered-By');

  next();
}

module.exports = securityHeaders;
EOF
echo "✅ Security headers middleware created"
echo ""

# Update server.js
echo "[4/5] Updating server.js..."
if [ -f "server.js" ]; then
  # Check if security headers are already imported
  if grep -q "security-headers" server.js; then
    echo "⚠️  Security headers already configured in server.js"
  else
    # Add security headers middleware import
    sed -i.bak '/const express = require/a\
const securityHeaders = require('\''./middleware/security-headers'\'');
' server.js

    # Add security headers middleware usage
    sed -i.bak '/app.use(express/a\
\
// Security Headers Middleware\
app.use(securityHeaders);
' server.js

    echo "✅ server.js updated"
  fi
else
  echo "⚠️  server.js not found - skipping auto-update"
  echo "   Please manually add:"
  echo "   const securityHeaders = require('./middleware/security-headers');"
  echo "   app.use(securityHeaders);"
fi
echo ""

# Test configuration
echo "[5/5] Testing security headers..."
sleep 2  # Wait for server restart if needed

# Test if server is running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3100 | grep -q "200"; then
  echo ""
  echo "📊 SECURITY HEADERS TEST RESULTS:"
  echo "-----------------------------------"

  headers_test=$(curl -I -s http://localhost:3100)

  # Check each header
  for header in "X-Frame-Options" "X-Content-Type-Options" "X-XSS-Protection" "Content-Security-Policy" "Permissions-Policy" "Referrer-Policy"; do
    if echo "$headers_test" | grep -qi "$header"; then
      echo "✅ $header: PRESENT"
    else
      echo "❌ $header: MISSING"
    fi
  done
else
  echo "⚠️  Server not running on localhost:3100"
  echo "   Please start server and test manually:"
  echo "   curl -I http://localhost:3100"
fi

echo ""
echo "==============================================="
echo "✅ SECURITY HEADERS DEPLOYMENT COMPLETE"
echo "==============================================="
echo ""
echo "Next steps:"
echo "1. Restart your server: pm2 restart all"
echo "2. Verify headers: curl -I http://localhost:3100"
echo "3. Test application functionality"
echo "4. Deploy to production"
echo ""
echo "Rollback command:"
echo "  cp $BACKUP_DIR/server.js server.js"
echo ""
