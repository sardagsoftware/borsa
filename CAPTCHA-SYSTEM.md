# 🔐 AiLydian Trader - Advanced CAPTCHA System

## Microsoft-Style Arrow Stepper + Multi-Provider CAPTCHA Integration

Bu proje, kurumsal düzeyde bir güvenlik sistemi içerir ve Microsoft tarzı arrow navigation ile kullanıcı dostu bir CAPTCHA deneyimi sunar.

## 🎯 CAPTCHA Sistemi Özellikleri

### ✅ Multi-Provider Support
- **Cloudflare Turnstile** (Primary) - Kullanıcı dostu, gizliliğe odaklı
- **hCaptcha** (Secondary) - GDPR uyumlu, açık kaynak alternatifi  
- **Google reCAPTCHA** (Tertiary) - Yaygın kullanılan geleneksel çözüm
- **Azure AD B2C** (Enterprise) - Kurumsal kimlik doğrulama entegrasyonu
- **MS-Style Stepper** (Interactive) - Özelleştirilmiş interaktif doğrulama

### 🛡️ Güvenlik Özellikleri
- **Rate Limiting**: IP + UserAgent tabanlı fingerprinting
- **CSRF Protection**: Origin validation ve secure headers
- **PII Masking**: Loglardan kişisel bilgilerin otomatik maskelenmesi
- **Error Normalization**: Tüm provider hatalarının normalize edilmesi
- **Timeout Handling**: 10 saniyelik timeout koruması
- **Memory-Based Store**: Yüksek performanslı hafıza tabanlı rate limiting

### 🎨 MS-Style Arrow Navigation
- **4-Step Workflow**: Intro → Challenge → Verification → Complete
- **Keyboard Navigation**: Arrow keys ile tam erişilebilirlik
- **ARIA Compliance**: Screen reader desteği
- **Responsive Design**: Tüm cihaz boyutlarında uyumlu
- **No-JS Fallback**: JavaScript olmadan da çalışma

## 🚀 Kurulum ve Konfigürasyon

### Environment Variables

```.env.local
# CAPTCHA Configuration
CAPTCHA_ENABLED=true
CAPTCHA_PROVIDER=turnstile  # stepper | turnstile | hcaptcha | recaptcha | azureb2c
CAPTCHA_RATE_LIMIT_ENABLED=true
CAPTCHA_RATE_LIMIT_MAX_ATTEMPTS=5
CAPTCHA_RATE_LIMIT_WINDOW_MINUTES=15

# Cloudflare Turnstile (Önerilen)
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=your-site-key
CLOUDFLARE_TURNSTILE_SECRET_KEY=your-secret-key

# hCaptcha (Alternatif)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your-hcaptcha-site-key  
HCAPTCHA_SECRET_KEY=your-hcaptcha-secret

# Google reCAPTCHA (Legacy)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site
RECAPTCHA_SECRET_KEY=your-recaptcha-secret

# Azure AD B2C (Enterprise)
AZURE_B2C_TENANT_NAME=your-tenant
AZURE_B2C_CLIENT_ID=your-client-id
AZURE_B2C_CLIENT_SECRET=your-client-secret
```

### Development Test Keys

**Cloudflare Turnstile Test Keys** (Her zaman geçer):
```
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
CLOUDFLARE_TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

**hCaptcha Test Keys** (Test amaçlı):
```
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
HCAPTCHA_SECRET_KEY=0x0000000000000000000000000000000000000000
```

## 🎯 Kullanım Örnekleri

### Login Sayfası Entegrasyonu

```typescript
// app/[locale]/auth/signin/page.tsx
import CaptchaArrowStepper from '@/components/security/CaptchaArrowStepper';
import CaptchaProviderMount, { CaptchaProvider } from '@/components/security/CaptchaProviderMount';

// State management
const [captchaEnabled, setCaptchaEnabled] = useState(true);
const [captchaProvider, setCaptchaProvider] = useState<CaptchaProvider>('turnstile');
const [captchaVerified, setCaptchaVerified] = useState(false);

// Handler functions
const handleCaptchaStepperComplete = (success: boolean, data?: any) => {
  if (success) {
    setCaptchaVerified(true);
    setShowCaptchaStepper(false);
  }
};

const handleCaptchaProviderSuccess = async (token: string, provider: CaptchaProvider) => {
  // Server-side verification
  const response = await fetch('/api/captcha/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, provider })
  });
  
  if (response.ok) {
    setCaptchaVerified(true);
  }
};
```

### API Route'ları

```typescript
// app/api/captcha/verify/route.ts
export async function GET() {
  return NextResponse.json({
    enabled: process.env.CAPTCHA_ENABLED === 'true',
    provider: process.env.CAPTCHA_PROVIDER || 'turnstile',
    rateLimit: {
      enabled: process.env.CAPTCHA_RATE_LIMIT_ENABLED === 'true',
      maxAttempts: parseInt(process.env.CAPTCHA_RATE_LIMIT_MAX_ATTEMPTS || '5'),
      windowMinutes: parseInt(process.env.CAPTCHA_RATE_LIMIT_WINDOW_MINUTES || '15')
    }
  });
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await withRateLimit(request, 'captcha-verify');
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Verification logic
  const { token, provider } = await request.json();
  const result = await CaptchaAdapter.verify(token, provider);
  
  return NextResponse.json({ success: result.success });
}
```

## 📁 Dosya Yapısı

```
components/security/
├── CaptchaArrowStepper.tsx     # MS-style arrow navigation UI
└── CaptchaProviderMount.tsx    # Multi-provider CAPTCHA widget

lib/security/
├── rate-limit.ts               # Memory-based rate limiting
└── captcha/
    └── adapter.ts              # Provider abstraction layer

app/api/captcha/
└── verify/
    └── route.ts               # Verification endpoint
```

## 🎨 Component Özellikleri

### CaptchaArrowStepper

```typescript
interface CaptchaArrowStepperProps {
  onComplete: (success: boolean, data?: any) => void;
  onStepChange?: (step: number) => void;
  onClose?: () => void;
  disabled?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}
```

**Özellikler:**
- 4 adımlı workflow (intro, challenge, verification, complete)
- Arrow key navigation (←→)
- Enter key confirmation
- Tab navigation support
- ARIA labels ve live regions
- Responsive mobile design
- Custom CSS animations

### CaptchaProviderMount

```typescript
interface CaptchaProviderMountProps {
  provider: CaptchaProvider;
  onSuccess: (token: string, provider: CaptchaProvider) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  disabled?: boolean;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
}
```

**Özellikler:**
- Dynamic script loading
- Provider-specific error handling
- Widget lifecycle management
- Retry mechanisms
- Loading states
- Error boundaries

## 🔧 Rate Limiting Sistemi

```typescript
// lib/security/rate-limit.ts
export const defaultKeyGenerator = (request: NextRequest): string => {
  const ip = request.ip || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const hashedUA = crypto.createHash('md5').update(userAgent).digest('hex').slice(0, 8);
  return `${ip}:${hashedUA}`;
};

// Pre-configured limiters
export const captchaVerifyLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  keyGenerator: defaultKeyGenerator
});
```

**Özellikler:**
- IP + UserAgent fingerprinting
- Memory-based store (production için Redis önerilir)
- Configurable windows ve limits
- Automatic cleanup
- Multiple limiter instances

## 🛡️ Güvenlik En İyi Uygulamaları

### 1. Origin Validation
```typescript
const origin = request.headers.get('origin');
const referer = request.headers.get('referer');
const expectedOrigin = new URL(process.env.NEXTAUTH_URL!).origin;

if (origin && origin !== expectedOrigin) {
  return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
}
```

### 2. Security Headers
```typescript
const headers = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

### 3. PII Masking
```typescript
const logData = {
  ...data,
  ip: maskIP(clientIP),
  userAgent: maskUserAgent(userAgent)
};
```

## 🧪 Test Senaryoları

### 1. CAPTCHA Configuration Test
```bash
curl -X GET http://localhost:3000/api/captcha/verify
```

### 2. Token Verification Test
```bash
curl -X POST http://localhost:3000/api/captcha/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token","provider":"turnstile"}'
```

### 3. Rate Limiting Test
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/captcha/verify \
    -H "Content-Type: application/json" \
    -d '{"token":"test-'$i'","provider":"turnstile"}'
  sleep 1
done
```

## 🚀 Production Deployment

### Vercel Environment Variables
```
CAPTCHA_ENABLED=true
CAPTCHA_PROVIDER=turnstile
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=your-production-key
CLOUDFLARE_TURNSTILE_SECRET_KEY=your-production-secret
CAPTCHA_RATE_LIMIT_ENABLED=true
```

### Performance Optimizations
- CDN için static assets
- Script lazy loading
- Memory cache cleanup
- Error boundary wrapping
- Timeout handling

## 🔍 Monitoring ve Analytics

### Metrics Tracking
- CAPTCHA completion rates
- Provider success rates
- Rate limit triggers
- Error frequencies
- User experience metrics

### Logging Structure
```typescript
{
  timestamp: new Date().toISOString(),
  event: 'captcha_verification',
  provider: 'turnstile',
  success: true,
  duration: 234, // ms
  metadata: {
    rateLimit: { remaining: 4, resetTime: 1642344523 }
  }
}
```

## 🎯 İleriye Dönük Geliştirmeler

- [ ] **Redis Integration**: Production için dağıtık rate limiting
- [ ] **Advanced Analytics**: Grafana dashboard entegrasyonu
- [ ] **A/B Testing**: Provider performance karşılaştırması
- [ ] **Custom Challenges**: Özelleştirilmiş güvenlik soruları
- [ ] **Biometric Integration**: TouchID/FaceID desteği
- [ ] **Machine Learning**: Anomaly detection
- [ ] **Internationalization**: Çoklu dil desteği
- [ ] **Accessibility Enhancement**: WCAG 2.1 AA uyumluluğu

## 📞 Destek ve Katkı

Bu CAPTCHA sistemi **Emrah Şardağ** tarafından **AiLydian Trader** projesi için geliştirilmiştir.

- **Legal**: legal@ailydian.com
- **Support**: support@ailydian.com
- **Documentation**: [GitHub Wiki](https://github.com/sardagsoftware/ailydian-borsa-trader/wiki)

---

**© 2025 Emrah Şardağ - All Rights Reserved**

Bu sistem, kurumsal düzeyde güvenlik ve kullanıcı deneyimi sunmak için tasarlanmıştır. Production ortamında kullanmadan önce tüm environment variable'ları doğru şekilde yapılandırdığınızdan emin olun.
