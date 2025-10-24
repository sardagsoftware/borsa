# Z.AI Destekli Sürekli İzleme ve Düzeltme Stratejisi

Bu plan, Ailydian Ultra Pro uygulaması için Z.AI (GLM-4.6/4.5v) modellerini kullanarak hata tespiti, kod analizi ve arayüz regresyonlarına karşı otomatik bir kontrol mekanizması kurmayı amaçlar. Amaç 24/7 çalışan, gerçek veriye dayalı gözlem ve iteratif düzeltme döngülerine temel hazırlamaktır.

## 1. Hedefler
- Backend & frontend hatalarını düzenli olarak tespit etmek (lint, test, smoke).
- Z.AI modellerinden alınan özet ve düzeltme önerilerini kayıt altına almak.
- Tasarım regresyonlarını Playwright ve görsel testler ile yakalamak.
- Geliştiricilere veya ops ekiplerine raporlamak (Slack/Webhook entegrasyonuna hazır yapı).

## 2. Akış Özeti
1. **Zamanlayıcı (cron / scheduler)** belirlenen aralıklarda `scripts/zai-monitor.js` betiğini çalıştırır.
2. Betik sırasıyla:
   - `pnpm lint`, `pnpm test -- tests/production-smoke.spec.ts`, `pnpm test:ui` gibi komutları yürütür.
   - Komut çıktılarını toparlayıp JSON log dosyasına kaydeder.
   - `Z_AI_API_KEY` tanımlıysa sonuçları GLM-4.6’ya gönderir ve özet/düzeltme önerisi ister.
   - Opsiyonel: Elde edilen önerileri Slack veya e‑posta webhook’una iletir (yapı hazır bırakılır).
3. Hata saptanırsa betik çıkış kodunu `1` yapar ve CI/CD veya gözlem sistemi uyarı üretir.

## 3. Bileşenler
- `scripts/zai-monitor.js`: Lint/test/smoke çalıştırıp Z.AI özetleri oluşturan Node betiği.
- `config/zai-monitor.config.json`: İzlenecek komutlar, rapor formatı ve entegrasyon uçlarını tanımlar.
- `logs/zai-monitor/` dizini: Tarih bazlı raporlar ve GLM özetlerini saklar.
- `docs/zai-monitor-usage.md`: Kurulum, cron/CI entegrasyonu ve özelleştirme talimatları.

## 4. Zamanlama Önerisi
- **Geliştirme ortamı:** `*/30 * * * *` (her 30 dk) ya da Git hook ile `pre-push`.
- **Ön-prod / prod:** GitOps pipeline’larında release öncesi, ardından dakikada bir health-check (armut).
- **Frontend regresyonu:** Gecelik Playwright UI koşusu + görsel test (uygun olduğunda).

## 5. Güvenlik & Gizlilik
- `Z_AI_API_KEY` yalnızca CI/CD gizli değişkenlerinde saklanmalı.
- Log dosyalarında hassas içeriklerin maskelemek için `maskPatterns` yapılandırması desteklenecek.
- Z.AI ile paylaşılan içeriklerde PII/PHI bulunmadığından emin olmak için `sanitizeOutput` opsiyonu.

## 6. Açık Kalemler
- Tasarım bozulmalarını görsel olarak yakalamak için `@playwright/test` ile screenshot diff pipeline’ı.
- Slack / Teams webhook entegrasyonu (betikte placeholder var, anahtar sağlandığında aktif).
- Uptime/gözlem için Prometheus veya SaaS (Datadog, New Relic) ile log ingest.

Bu plan doğrultusunda gerekli script ve konfigürasyon dosyaları eklenerek otomasyon temeli oluşturulacaktır. CI/CD veya cron entegrasyonları için `docs/zai-monitor-usage.md`’de ayrıntılı talimat sağlanacaktır.
