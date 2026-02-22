# Z.AI Monitor Kullanım Kılavuzu

Bu kılavuz, `scripts/zai-monitor.js` betiğini kullanarak Ailydian Ultra Pro projesinde otomatik lint/test/smoke kontrolleri yürütmeyi ve Z.AI modellerinden hata analizi almayı açıklar.

## 1. Önkoşullar
- Node.js 20+ ve pnpm 9.x
- `Desktop/ailydian-ultra-pro` kökünde `pnpm install`
- Z.AI hesabınız varsa `Z_AI_API_KEY` ortam değişkeni (opsiyonel – olmadan da çalışır)
- CI/CD veya cron çalıştırma yetkisi

## 2. Konfigürasyon
`config/zai-monitor.config.json` dosyası aşağıdaki alanları içerir:

```json
{
  "reportDir": "logs/zai-monitor",
  "maxPromptChars": 6000,
  "maskPatterns": ["(sk-[A-Za-z0-9\\-_]{10,})"],
  "commands": [
    { "name": "lint", "cmd": "pnpm", "args": ["lint"], "critical": true },
    { "name": "smoke", "cmd": "pnpm", "args": ["test", "--", "tests/production-smoke.spec.ts"], "critical": false }
  ],
  "promptTemplate": "Hataları bul ve aksiyon öner.",
  "webhook": { "enabled": false, "url": "", "headers": {} }
}
```

- `commands`: Sıralı çalışacak komutlar. `critical: true` hata aldığında kalan komutları atlar.
- `maskPatterns`: Çıktılardaki hassas değerleri `[MASKED]` ile değiştirir.
- `promptTemplate`: Z.AI’ye gönderilen özet isteğinin yönergesi.
- `webhook`: Sonuçları Slack/Teams gibi uçlara POST etmek için etkinleştirilebilir.

## 3. Çalıştırma

```bash
cd ~/Desktop/ailydian-ultra-pro
pnpm install   # henüz yapılmadıysa
node scripts/zai-monitor.js
```

Betik, her komutu çalıştırır, sonuçları konsola yazar ve `logs/zai-monitor/report-<timestamp>.json` dosyasına kaydeder. `Z_AI_API_KEY` tanımlıysa GLM‑4.6’dan özet rapor ekler.

## 4. Cron Örneği (30 dakikada bir)

```cron
*/30 * * * * cd /home/lydian/Desktop/ailydian-ultra-pro && Z_AI_API_KEY=xxx node scripts/zai-monitor.js >> /var/log/zai-monitor.log 2>&1
```

- Eğer macOS launchd veya Linux systemd kullanıyorsanız ilgili unit dosyalarında aynı komut tanımlanabilir.

## 5. CI/CD Entegrasyonu
- **GitHub Actions:** `.github/workflows/zai-monitor.yml` oluşturup `run: node scripts/zai-monitor.js` komutu eklenebilir.
- **GitLab CI:** `.gitlab-ci.yml` içinde `script:` adımına ekleyebilirsiniz.
- Hata durumunda betik `exit 1` döner; pipeline kırılır.

## 6. Webhook/SLA Uyarıları
- `config/zai-monitor.config.json` içinde `webhook.enabled` true yapılır ve `url` belirtirsiniz.
- Payload: JSON rapor nesnesi (komut sonuçları + Z.AI özeti).
- Slack örneği için `headers.Authorization` ve `url` olarak Slack Incoming Webhook kullanın.

## 7. Tasarım/Görsel Regresyon
- Şimdilik Playwright smoke testi çalıştırılıyor.
- E2E görsel testler için `pnpm test:ui` veya `playwright test --update-snapshots` gibi komutları `commands` listesine ekleyebilirsiniz.

## 8. Günlükler & Log Rotasyonu
- Raporlar `logs/zai-monitor` altında birikir. Log yönetimi için `find logs/zai-monitor -mtime +7 -delete` gibi periyodik temizleme önerilir.
- Z.AI özetleri hassas içerik içerebilir, bu yüzden dosya izinlerini sınırlayın (`chmod 700 logs/zai-monitor`).

## 9. Sorun Giderme
- `tsc`, `eslint`, `playwright` gibi komutlar bulunamadığında önce `pnpm install` çalıştırın.
- Port 3100’e bağlanma hatası alınırsa (Playwright web server), test yapılacak ortamda portu serbest bırakın veya `config` dosyasında test komutunu güncelleyin.
- Z.AI isteği başarısız olursa rapora `zaiSummary.error` alanı eklenir; genellikle API anahtarı veya ağ sorunudur.

Bu yapı, Z.AI ile desteklenen sürekli kalite kontrol döngüsünün temelini sağlar. Gelişmiş otomasyon (Slack alert, otomatik düzeltme PR’ları) eklemek için bu betik kolayca genişletilebilir.
