# 🚀 SHARD_14 - Production Deployment Guide

## Overview

Ailydian Messaging E2EE platform deployment guide with zero-downtime strategy.

**White Hat Principles:**
- ✅ Security-first configuration
- ✅ Data privacy compliance
- ✅ Transparent monitoring
- ✅ User consent for all data collection
- ✅ Rollback procedures

---

## Pre-Deployment Checklist

### 1. Infrastructure Requirements

- [ ] **Server Specifications**
  - CPU: 2+ cores
  - RAM: 4GB minimum (8GB recommended)
  - Disk: 20GB SSD
  - OS: Ubuntu 22.04 LTS or similar

- [ ] **Network Requirements**
  - Domain name configured (messaging.ailydian.com)
  - SSL certificate (Let's Encrypt recommended)
  - Firewall rules configured
  - CDN configured (optional but recommended)

- [ ] **Dependencies Installed**
  - Node.js 18+ LTS
  - Redis 7+
  - PM2 process manager
  - Nginx/Caddy reverse proxy
  - Certbot (for SSL)

### 2. Environment Configuration

- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Generate secure secrets:
  ```bash
  # Generate 64-char random strings
  openssl rand -base64 48
  ```
- [ ] Configure Redis URL
- [ ] Set up TURN/STUN servers
- [ ] Configure monitoring (Sentry, etc.)
- [ ] Set production URL
- [ ] Review feature flags

### 3. Security Hardening

- [ ] **Secrets Management**
  - No secrets in git
  - Use environment variables
  - Rotate secrets regularly
  - Audit secret access

- [ ] **Network Security**
  - Enable HTTPS only
  - Configure HSTS headers
  - Set up WAF (Web Application Firewall)
  - Rate limiting enabled
  - DDoS protection

- [ ] **Application Security**
  - CSP headers configured
  - CORS whitelist set
  - Input validation active
  - SQL injection protection
  - XSS prevention

### 4. Performance Optimization

- [ ] **Caching Strategy**
  - Redis cache configured
  - Static asset caching (CDN)
  - Browser caching headers
  - Service worker enabled

- [ ] **Compression**
  - Gzip/Brotli enabled
  - Image optimization
  - Bundle size optimization
  - Lazy loading implemented

- [ ] **Monitoring**
  - Web Vitals tracking
  - Error monitoring (Sentry)
  - Performance monitoring
  - Uptime monitoring

---

## Deployment Steps

### Step 1: Pre-deployment Validation

```bash
# Run deployment script
cd /path/to/ailydian-ultra-pro/apps/messaging
./scripts/deploy.sh
```

This script will:
- ✅ Check Node.js version
- ✅ Verify Redis connection
- ✅ Check disk space
- ✅ Scan for hardcoded secrets
- ✅ Run security audit
- ✅ Install dependencies
- ✅ Build application
- ✅ Run tests
- ✅ Check performance budget

### Step 2: Database Setup

```bash
# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Verify Redis
redis-cli ping  # Should return "PONG"
```

### Step 3: Build Application

```bash
# Production build
NODE_ENV=production npm run build

# Verify build
ls -lh .next/
```

### Step 4: Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "ailydian-messaging" -- start

# Save PM2 configuration
pm2 save

# Enable PM2 startup
pm2 startup
```

### Step 5: Configure Reverse Proxy

**Nginx Configuration:**

```nginx
# /etc/nginx/sites-available/messaging.ailydian.com

upstream messaging_backend {
    server 127.0.0.1:3200;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name messaging.ailydian.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name messaging.ailydian.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/messaging.ailydian.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/messaging.ailydian.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Next.js
    location / {
        proxy_pass http://messaging_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location /_next/static {
        proxy_pass http://messaging_backend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

**Enable site:**

```bash
sudo ln -s /etc/nginx/sites-available/messaging.ailydian.com /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Step 6: SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d messaging.ailydian.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 7: Monitoring Setup

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 10

# View logs
pm2 logs ailydian-messaging

# Monitor metrics
pm2 monit
```

---

## Post-Deployment Validation

### 1. Health Checks

```bash
# Application health
curl https://messaging.ailydian.com/
# Should return 200 OK

# SSL check
curl -I https://messaging.ailydian.com/
# Should show SSL headers

# Performance test
curl -w "@curl-format.txt" -o /dev/null -s https://messaging.ailydian.com/
```

### 2. Functional Tests

- [ ] User registration works
- [ ] Login/logout works
- [ ] Message sending works (E2EE)
- [ ] File sharing works
- [ ] Video calls work (WebRTC)
- [ ] Location sharing works
- [ ] All demo pages load

### 3. Security Tests

- [ ] HTTPS enforced
- [ ] CSP headers present
- [ ] CORS working correctly
- [ ] Rate limiting active
- [ ] No sensitive data in logs

### 4. Performance Tests

- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Bundle size < 500KB
- [ ] Time to Interactive < 3.5s

---

## Rollback Procedure

If issues occur:

```bash
# Stop current version
pm2 stop ailydian-messaging

# Rollback to previous version
git checkout <previous-commit>
npm ci --production
npm run build
pm2 restart ailydian-messaging

# Verify rollback
pm2 logs ailydian-messaging
```

---

## Monitoring & Maintenance

### Daily

- [ ] Check PM2 status: `pm2 status`
- [ ] Review error logs: `pm2 logs ailydian-messaging --err --lines 50`
- [ ] Check disk usage: `df -h`

### Weekly

- [ ] Review performance metrics
- [ ] Check SSL certificate expiry
- [ ] Review security logs
- [ ] Update dependencies (security patches)

### Monthly

- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Backup verification
- [ ] Disaster recovery drill

---

## Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs ailydian-messaging --lines 100

# Check Node.js version
node -v

# Check dependencies
npm audit

# Rebuild
npm ci --production
npm run build
```

### Redis connection failed

```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli ping

# Check Redis logs
sudo journalctl -u redis
```

### SSL issues

```bash
# Test certificate
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check nginx config
sudo nginx -t
```

### Performance issues

```bash
# Check CPU/Memory
top

# Check Redis memory
redis-cli info memory

# Clear Redis cache
redis-cli FLUSHALL

# Restart PM2
pm2 restart ailydian-messaging
```

---

## Support

For deployment issues:
- GitHub Issues: https://github.com/ailydian/messaging/issues
- Documentation: https://messaging.ailydian.com/docs
- Security: security@ailydian.com

---

## Changelog

- **2025-10-11**: SHARD_14 deployment guide created
- Initial production deployment procedures
- White hat security principles applied

---

**White Hat Certification**: This deployment guide follows security best practices, privacy-first principles, and transparent operations. No dark patterns, no data collection without consent, no security through obscurity.
