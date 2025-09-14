# AILYDIAN — AI LENS • PRO CRYPTO TRADER

> **Enterprise-Grade AI-Powered Cryptocurrency Trading Platform**

A comprehensive, production-ready cryptocurrency trading platform with advanced AI analytics, multi-account portfolio management, and enterprise operations capabilities.

## 🚀 PRO+ Features

### 🔐 Enterprise Security
- **Secure Vault System**: AES-256-CBC encrypted API key storage
- **Multi-Account Management**: Centralized credential management across exchanges
- **Role-Based Access Control**: Fine-grained permissions and audit logging
- **Compliance Ready**: SOC2, GDPR, and financial regulations compliance

### 📱 Cross-Platform Access
- **Web Application**: Next.js 14 with server-side rendering
- **Mobile Native**: React Native/Expo app with deep links
- **PWA Support**: Offline-capable progressive web app
- **Real-time Sync**: Cross-device state synchronization

### 🎯 Advanced Trading
- **AI-Powered Analytics**: Machine learning price prediction
- **Multi-Exchange Support**: Binance, Coinbase, Kraken, KuCoin, Bybit, OKX
- **Portfolio OMS**: Order Management System with exposure tracking
- **Automated Rebalancing**: Risk-managed portfolio optimization
- **Paper Trading**: Risk-free strategy testing

### 📊 Enterprise Operations
- **OpenTelemetry Integration**: Distributed tracing and metrics
- **Prometheus Metrics**: Real-time performance monitoring
- **Alerting Engine**: Slack/Telegram/Email notifications
- **Health Dashboards**: System monitoring and diagnostics
- **Disaster Recovery**: Automated backups and restoration

### 🚀 DevOps & Deployment
- **Feature Flags**: Gradual feature rollout control
- **Canary Deployment**: Safe production deployments
- **Blue-Green Strategy**: Zero-downtime deployments
- **Auto-Rollback**: Automatic failure recovery
- **CI/CD Ready**: GitHub Actions integration

## 🏗️ Technical Architecture

### Backend Infrastructure
```
lib/pro/
├── vault.ts          # Secure credential storage
├── accounts.ts       # Multi-account management
├── oms.ts           # Portfolio Order Management
├── telemetry.ts     # Metrics and monitoring
├── alerts.ts        # Alert rules engine
├── flags.ts         # Feature flags system
├── canary.ts        # Deployment management
├── dr.ts            # Disaster recovery
└── admin.ts         # Admin tools
```

### Frontend Components
```
components/pro/
├── AdminDashboard.tsx    # System health monitoring
├── VaultManager.tsx      # Credential management UI
├── PortfolioOMS.tsx      # Portfolio overview
└── AlertsMetrics.tsx     # Alerts configuration
```

### Mobile Application
```
mobile/
├── app/              # Expo Router pages
├── components/       # Shared React Native components
└── store/           # Redux state management
```

### API Endpoints
```
app/api/pro/
├── vault/           # Credential management
├── portfolio/       # Portfolio operations
├── alerts/          # Alert management
├── admin/           # System administration
├── deployment/      # Feature flags & deployment
└── dr/              # Disaster recovery
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+ (for caching)
- Docker & Docker Compose (optional)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository>
cd ailydian-trader
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup database**
```bash
npx prisma generate
npx prisma db push
```

4. **Run development server**
```bash
npm run dev
```

5. **Build for production**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Mobile App Setup
```bash
cd mobile
npm install
npx expo start
```

## 📋 Environment Configuration

### Core Settings
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ailydian"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Encryption
VAULT_ENCRYPTION_KEY="32-byte-hex-key"
VAULT_HMAC_KEY="32-byte-hex-key"
```

### PRO+ Extensions
```env
# Monitoring
PROMETHEUS_URL="http://localhost:9090"
OPENTELEMETRY_ENDPOINT="http://localhost:4318"

# Alerts
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"

# Deployment
DEPLOY_STRATEGY="canary"
CANARY_PERCENT="10"
FEATURE_FLAGS_ENABLED="true"

# Backup
BACKUP_DIR="./backups"
DR_SIGNING_KEY="disaster-recovery-signing-key"
DR_ENCRYPTION_KEY="disaster-recovery-encryption-key"
```

## 🧪 Testing

### Run Test Suite
```bash
npm test                 # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end tests
npm run test:coverage   # Coverage report
```

### Load Testing
```bash
npm run test:load       # Performance testing
npm run test:stress     # Stress testing
```

## 📊 Monitoring & Operations

### Health Checks
- **System Health**: `/api/pro/admin?action=health`
- **Metrics**: Available via Prometheus endpoints
- **Alerts**: Configured via admin dashboard

### Admin Operations
- **Setup Wizard**: Automated system configuration
- **Auto-Fix**: Automatic issue resolution
- **Maintenance Mode**: Safe system maintenance
- **Backup Management**: Scheduled snapshots

### Feature Management
- **Feature Flags**: Runtime feature control
- **Canary Deployments**: Gradual rollouts
- **A/B Testing**: Feature experimentation

## 🔒 Security Features

### Data Protection
- **Encryption at Rest**: AES-256-CBC for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **Key Management**: Hardware security module support
- **Data Residency**: Configurable geographic storage

### Access Control
- **Multi-Factor Authentication**: TOTP, SMS, hardware keys
- **Session Management**: Secure token handling
- **API Rate Limiting**: DDoS protection
- **Audit Logging**: Complete action tracking

### Compliance
- **GDPR Ready**: Data privacy compliance
- **SOC2 Compatible**: Enterprise security standards
- **Financial Regulations**: Trading compliance support
- **Regular Security Audits**: Vulnerability assessments

## 🌐 Exchange Support

### Supported Exchanges
- ✅ **Binance** - Spot, Futures, Options
- ✅ **Coinbase Pro** - Spot trading
- ✅ **Kraken** - Spot, Futures
- ✅ **KuCoin** - Spot, Futures
- ✅ **Bybit** - Derivatives
- ✅ **OKX** - Spot, Derivatives

### Integration Features
- **Unified API**: Consistent interface across exchanges
- **Real-time Data**: WebSocket feeds
- **Order Management**: Advanced order types
- **Risk Management**: Position limits and controls

## 📱 Mobile Features

### Native Capabilities
- **Face ID/Touch ID**: Biometric authentication
- **Push Notifications**: Real-time alerts
- **Offline Mode**: Limited functionality without internet
- **Deep Links**: Direct navigation from external apps

### Trading Features
- **Portfolio View**: Real-time balance updates
- **Quick Orders**: One-tap trading
- **Price Alerts**: Custom notifications
- **Market Analysis**: Charts and indicators

## 🚀 Deployment Options

### Cloud Providers
- **AWS**: ECS, EKS, Lambda deployment
- **Google Cloud**: GKE, Cloud Run
- **Azure**: AKS, Container Instances
- **DigitalOcean**: App Platform, Kubernetes

### Docker Deployment
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

## 📈 Performance Optimization

### Backend Optimizations
- **Connection Pooling**: Database performance
- **Caching Strategy**: Redis-based caching
- **Load Balancing**: Horizontal scaling
- **CDN Integration**: Static asset delivery

### Frontend Optimizations
- **Code Splitting**: Lazy loading
- **Image Optimization**: WebP, responsive images
- **Service Worker**: Offline functionality
- **Bundle Analysis**: Size optimization

## 🆘 Support & Documentation

### Documentation
- **API Reference**: Complete endpoint documentation
- **Integration Guides**: Exchange setup tutorials
- **Troubleshooting**: Common issues and solutions
- **Best Practices**: Security and performance guides

### Support Channels
- **GitHub Issues**: Bug reports and feature requests
- **Discord Community**: Real-time support
- **Email Support**: Enterprise customers
- **Documentation Wiki**: Comprehensive guides

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code quality rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality gates

## 📄 License

**Enterprise License** - See LICENSE file for details.

For commercial use, please contact licensing@ailydian.com

---

<div align="center">

**Built with ❤️ by the AILYDIAN Team**

[Website](https://ailydian.com) • [Documentation](https://docs.ailydian.com) • [Support](mailto:support@ailydian.com)

</div>

AI Destekli Profesyonel Kripto Trading Terminal

## Özellikler
- Binance renk paletiyle profesyonel ve güvenli UI
- Tüm modüller: SOR, Hedge, Risk, Portfolio, Options, ExecSim, Greeks Hedge, RL, XAI, Playbooks, Journal
- Tüm borsa API’leri (Binance, Bybit, OKX, Kraken, Coinbase, Deribit) gerçek veriyle entegre
- Varsayılan Paper/Testnet, live için opt-in + kill-switch
- AI bot: Composite Signal + Policy Engine + Guarded Autonomy
- Risk preview, compliance check, audit/journal, healthz
- Prod deploy’a hazır, hatasız teslim

## Kurulum
1. `pnpm i`
2. `pnpm prisma migrate deploy`
3. `.env` değerlerini Vercel’e ekle
4. `pnpm lint && pnpm typecheck && pnpm build`
5. `vercel --prod` → borsa.ailydian.com

## Renk Paleti
- Koyu: #12161C
- Panel: #181A20
- Text: #EAECEF
- Yeşil: #0ECB81
- Kırmızı: #F6465D
- Sarı: #F0B90B
