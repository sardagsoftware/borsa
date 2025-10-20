# CERTIFICATION CHECKLISTS

## Platform Certification Requirements

### Steam Platform Checklist

- [ ] **Steamworks SDK Integration**
  - [ ] Steam Authentication implemented
  - [ ] Steam Achievements configured
  - [ ] Steam Cloud Saves enabled
  - [ ] Steam Overlay functional

- [ ] **Content Requirements**
  - [ ] Store page assets uploaded (capsule images, screenshots, trailers)
  - [ ] Age rating obtained (ESRB/PEGI)
  - [ ] Privacy policy URL provided
  - [ ] EULA/Terms of Service provided

- [ ] **Technical Requirements**
  - [ ] Game launches without admin privileges
  - [ ] Game runs in windowed mode
  - [ ] Controller support (if applicable)
  - [ ] No hardcoded file paths
  - [ ] Proper shutdown handling

### Epic Games Store Checklist

- [ ] **EOS SDK Integration**
  - [ ] Epic Account Services implemented
  - [ ] Epic Achievements system
  - [ ] Cloud save synchronization
  - [ ] Social features (friends, presence)

- [ ] **Content Requirements**
  - [ ] Store assets prepared (key art, screenshots, video trailer)
  - [ ] Age ratings submitted
  - [ ] Regional pricing configured
  - [ ] Localization completeness report

- [ ] **Technical Requirements**
  - [ ] EAC (Easy Anti-Cheat) integration (if multiplayer)
  - [ ] Crash reporting enabled
  - [ ] Analytics instrumentation
  - [ ] Performance benchmarks submitted

### PlayStation 5 (PS5) TRC Checklist

- [ ] **Technical Requirements Checklist (TRC)**
  - [ ] PS5 SDK version compliance
  - [ ] Trophy system implementation
  - [ ] Activity Cards configured
  - [ ] Game Help integrated
  - [ ] Quick Resume support

- [ ] **Submission Requirements**
  - [ ] Age rating certificate (IARC)
  - [ ] Build signed with Sony certificates
  - [ ] Localization QA completed
  - [ ] Accessibility features documented

- [ ] **Performance Requirements**
  - [ ] Minimum 60fps in performance mode
  - [ ] 4K resolution support (quality mode)
  - [ ] HDR implementation verified
  - [ ] Load time optimization (< 5s from dashboard)
  - [ ] Memory usage within limits

- [ ] **User Experience**
  - [ ] Controller haptics implementation
  - [ ] Adaptive triggers support
  - [ ] 3D audio integration
  - [ ] UI scaling for different display modes

### Xbox Series X|S XR Checklist

- [ ] **Xbox Requirements (XR)**
  - [ ] Xbox SDK compliance
  - [ ] Xbox Live services integration
  - [ ] Achievements system
  - [ ] Game DVR support
  - [ ] Quick Resume compatibility

- [ ] **Content Requirements**
  - [ ] Age rating (ESRB for NA, PEGI for EU)
  - [ ] Privacy policy compliance
  - [ ] Accessibility features declared

- [ ] **Performance Requirements**
  - [ ] Smart Delivery support (Series X vs Series S)
  - [ ] Ray tracing (if applicable)
  - [ ] Variable refresh rate support
  - [ ] HDR10 compliance

### Web Platform (PWA) Checklist

- [ ] **Progressive Web App (PWA) Requirements**
  - [ ] Service worker registered
  - [ ] Manifest.json configured
  - [ ] HTTPS enabled on all pages
  - [ ] Offline functionality
  - [ ] Add to Home Screen prompt

- [ ] **Performance Requirements**
  - [ ] Lighthouse score > 90
  - [ ] Core Web Vitals passing
    - [ ] LCP < 2.5s
    - [ ] FID < 100ms
    - [ ] CLS < 0.1
  - [ ] Bundle size optimized

- [ ] **Security Requirements**
  - [ ] CSP headers configured
  - [ ] CORS policies implemented
  - [ ] API rate limiting
  - [ ] Input validation and sanitization

- [ ] **Compliance**
  - [ ] GDPR compliance (EU)
  - [ ] CCPA compliance (California)
  - [ ] Cookie consent banner
  - [ ] Privacy policy accessible
  - [ ] Terms of service accessible

### Mobile (iOS/Android) Checklist

#### iOS App Store

- [ ] **App Store Guidelines Compliance**
  - [ ] App uses Apple's Human Interface Guidelines
  - [ ] No private API usage
  - [ ] App Store assets prepared
  - [ ] Privacy nutrition labels completed

- [ ] **Technical Requirements**
  - [ ] Supports latest iOS version
  - [ ] Universal app (iPhone/iPad)
  - [ ] Sign in with Apple (if authentication required)
  - [ ] App Transport Security (ATS) compliance

#### Google Play Store

- [ ] **Google Play Requirements**
  - [ ] Target API level compliance
  - [ ] 64-bit architecture support
  - [ ] Play Store assets uploaded
  - [ ] Data safety form completed

- [ ] **Technical Requirements**
  - [ ] Google Play Services integration
  - [ ] In-app updates support
  - [ ] Crash reporting (Firebase Crashlytics)
  - [ ] ANR (Application Not Responding) handling

### General Pre-Launch Checklist

- [ ] **Quality Assurance**
  - [ ] All critical bugs resolved
  - [ ] Playtesting completed
  - [ ] Performance profiling done
  - [ ] Memory leak testing
  - [ ] Security audit passed

- [ ] **Legal & Compliance**
  - [ ] Third-party licenses documented
  - [ ] Age rating obtained for all regions
  - [ ] Data protection compliance verified
  - [ ] Music/audio rights cleared

- [ ] **Localization Quality Assurance (LQA)**
  - [ ] All strings translated
  - [ ] UI text fits in all languages
  - [ ] RTL (Right-to-Left) language support tested
  - [ ] Cultural appropriateness verified

- [ ] **Live Ops Readiness**
  - [ ] Analytics instrumentation complete
  - [ ] A/B testing framework ready
  - [ ] Feature flags configured
  - [ ] Monitoring and alerting set up

**Last Updated**: October 11, 2025
