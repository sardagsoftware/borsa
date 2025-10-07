# Akıllı Şehirler Hızlı Başlangıç

## Giriş

Bu rehber, LyDian Akıllı Şehirler platformunu kullanmaya başlamanız için gereken tüm adımları içerir. IoT sensörlerini bağlamayı, veri toplamayı ve ilk akıllı şehir uygulamanızı oluşturmayı öğreneceksiniz.

**Tamamlanma süresi**: 30-45 dakika

**Ön koşullar**:
- Node.js 18+ veya Python 3.9+
- API erişimi olan LyDian hesabı
- Temel JavaScript/TypeScript veya Python bilgisi

## Adım 1: Kurulum

### SDK'yı Yükleyin

**Node.js/TypeScript için:**
```bash
npm install @lydian/smart-cities
# veya
yarn add @lydian/smart-cities
```

**Python için:**
```bash
pip install lydian-smart-cities
```

### API Anahtarınızı Alın

1. [https://dashboard.lydian.com](https://dashboard.lydian.com) adresine gidin
2. **Ayarlar** → **API Anahtarları** bölümüne gidin
3. **Yeni API Anahtarı Oluştur**'a tıklayın
4. Anahtarınızı kopyalayın ve güvenli bir yerde saklayın

### İstemciyi Başlatın

**TypeScript:**
```typescript
import { SmartCityClient } from '@lydian/smart-cities';

const client = new SmartCityClient({
  apiKey: process.env.LYDIAN_API_KEY,
  cityId: 'ankara', // veya şehir ID'niz
  region: 'tr-central'
});

// Bağlantıyı doğrula
async function verifySetup() {
  try {
    const status = await client.getStatus();
    console.log('✅ Başarıyla bağlandı');
    console.log('Şehir:', status.cityName);
    console.log('Aktif Cihazlar:', status.activeDevices);
  } catch (error) {
    console.error('❌ Bağlantı hatası:', error.message);
  }
}

verifySetup();
```

**Python:**
```python
from lydian_smart_cities import SmartCityClient
import os

client = SmartCityClient(
    api_key=os.environ.get('LYDIAN_API_KEY'),
    city_id='ankara',
    region='tr-central'
)

# Bağlantıyı doğrula
try:
    status = client.get_status()
    print('✅ Başarıyla bağlandı')
    print(f'Şehir: {status.city_name}')
    print(f'Aktif Cihazlar: {status.active_devices}')
except Exception as e:
    print(f'❌ Bağlantı hatası: {e}')
```

## Adım 2: İlk IoT Cihazınızı Kaydedin

### Trafik Sensörü Ekleme

```typescript
async function registerTrafficSensor() {
  const sensor = await client.devices.register({
    type: 'traffic',
    name: 'Atatürk Bulvarı - Kızılay Kavşağı',
    location: {
      latitude: 39.9208,
      longitude: 32.8541,
      address: 'Kızılay, Ankara'
    },
    configuration: {
      samplingInterval: 60, // saniye
      metrics: ['vehicle_count', 'average_speed', 'congestion_level']
    }
  });

  console.log('✅ Sensör kaydedildi:', sensor.id);
  return sensor;
}
```

### Hava Kalitesi Sensörü Ekleme

```typescript
async function registerAirQualitySensor() {
  const sensor = await client.devices.register({
    type: 'environmental',
    name: 'Çankaya Hava Kalitesi İstasyonu',
    location: {
      latitude: 39.9180,
      longitude: 32.8597,
      address: 'Çankaya, Ankara'
    },
    configuration: {
      samplingInterval: 300, // 5 dakika
      metrics: ['pm25', 'pm10', 'co2', 'temperature', 'humidity']
    }
  });

  console.log('✅ Hava kalitesi sensörü kaydedildi:', sensor.id);
  return sensor;
}
```

## Adım 3: Gerçek Zamanlı Veri Toplama

### Telemetri Verisi Gönderme

```typescript
async function sendTelemetry(deviceId: string) {
  const telemetry = {
    timestamp: new Date(),
    measurements: {
      vehicle_count: 245,
      average_speed: 35.5, // km/s
      congestion_level: 0.6 // 0-1 arası
    }
  };

  await client.telemetry.send(deviceId, telemetry);
  console.log('📊 Telemetri verisi gönderildi');
}

// Her dakika veri gönder
setInterval(async () => {
  await sendTelemetry(sensor.id);
}, 60000);
```

### Veri Akışını Dinleme

```typescript
async function subscribeToRealTimeData() {
  // Belirli bir cihazı dinle
  client.telemetry.subscribe(sensor.id, (data) => {
    console.log('Yeni veri:', data);
    console.log('  Araç Sayısı:', data.measurements.vehicle_count);
    console.log('  Ortalama Hız:', data.measurements.average_speed, 'km/s');
    console.log('  Tıkanıklık:', (data.measurements.congestion_level * 100).toFixed(0) + '%');
  });

  // Veya tüm trafik sensörlerini dinle
  client.telemetry.subscribeByType('traffic', (data) => {
    console.log(`${data.deviceName}: ${data.measurements.vehicle_count} araç`);
  });
}
```

## Adım 4: Geçmiş Veri Analizi

### Veri Sorgulama

```typescript
async function analyzeHistoricalData(deviceId: string) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 gün önce

  const data = await client.analytics.query({
    deviceIds: [deviceId],
    startDate,
    endDate,
    metrics: ['vehicle_count', 'congestion_level'],
    aggregation: 'hourly'
  });

  console.log(`📊 ${data.dataPoints.length} veri noktası alındı`);

  // İstatistikler
  const stats = {
    avgVehicles: data.average('vehicle_count'),
    peakHour: data.findPeak('vehicle_count'),
    avgCongestion: data.average('congestion_level')
  };

  console.log('\nİstatistikler:');
  console.log('  Ortalama Araç Sayısı:', stats.avgVehicles.toFixed(0));
  console.log('  Yoğun Saat:', stats.peakHour.hour + ':00');
  console.log('  Ortalama Tıkanıklık:', (stats.avgCongestion * 100).toFixed(1) + '%');

  return data;
}
```

### Trend Analizi

```typescript
async function analyzeTrends(deviceId: string) {
  const trends = await client.analytics.analyzeTrends({
    deviceId,
    metric: 'vehicle_count',
    period: '30d',
    analysis: ['trend', 'seasonality', 'anomalies']
  });

  console.log('\n📈 Trend Analizi:');
  console.log('  Genel Eğilim:', trends.trend.direction); // 'increasing', 'decreasing', 'stable'
  console.log('  Değişim Oranı:', (trends.trend.changeRate * 100).toFixed(1) + '%');

  if (trends.seasonality.detected) {
    console.log('  Mevsimsellik Tespit Edildi!');
    console.log('  Dönem:', trends.seasonality.period);
    console.log('  Yoğun Saatler:', trends.seasonality.peakHours.join(', '));
  }

  if (trends.anomalies.length > 0) {
    console.log(`  ⚠️  ${trends.anomalies.length} anomali tespit edildi`);
  }

  return trends;
}
```

## Adım 5: AI Tahminleri

### Trafik Tahmini

```typescript
async function predictTraffic(deviceId: string) {
  // Önümüzdeki 2 saat için tahmin
  const prediction = await client.ai.predict({
    deviceId,
    metric: 'vehicle_count',
    horizon: 120, // dakika
    includeConfidence: true
  });

  console.log('\n🔮 Trafik Tahmini (Önümüzdeki 2 Saat):');

  for (const point of prediction.points) {
    const time = new Date(point.timestamp).toLocaleTimeString('tr-TR');
    const confidence = (point.confidence * 100).toFixed(0);

    console.log(`  ${time}: ${point.value} araç (Güven: %${confidence})`);
  }

  // En yoğun saati bul
  const peakPoint = prediction.points.reduce((max, p) =>
    p.value > max.value ? p : max
  );

  console.log('\n⚠️  En yoğun olacak saat:',
    new Date(peakPoint.timestamp).toLocaleTimeString('tr-TR'));
}
```

### Hava Kalitesi Tahmini

```typescript
async function predictAirQuality(deviceId: string) {
  const prediction = await client.ai.predict({
    deviceId,
    metric: 'pm25',
    horizon: 24 * 60, // 24 saat
    includeAlerts: true
  });

  console.log('\n🌫️ Hava Kalitesi Tahmini:');

  // Uyarı kontrolü
  const alerts = prediction.points.filter(p => p.value > 35); // PM2.5 limiti

  if (alerts.length > 0) {
    console.log('⚠️  UYARI: Önümüzdeki 24 saatte hava kalitesi kötüleşecek!');
    console.log(`   ${alerts.length} saat boyunca limit aşılacak`);

    const worstHour = alerts.reduce((max, p) => p.value > max.value ? p : max);
    console.log(`   En kötü saat: ${new Date(worstHour.timestamp).toLocaleTimeString('tr-TR')}`);
    console.log(`   PM2.5: ${worstHour.value.toFixed(1)} µg/m³`);
  } else {
    console.log('✅ Hava kalitesi önümüzdeki 24 saat iyi olacak');
  }
}
```

## Adım 6: Akıllı Uyarılar Oluşturma

### Eşik Bazlı Uyarı

```typescript
async function createAlerts() {
  // Trafik tıkanıklığı uyarısı
  const trafficAlert = await client.alerts.create({
    name: 'Yoğun Trafik Uyarısı',
    deviceId: trafficSensorId,
    condition: {
      metric: 'congestion_level',
      operator: 'greater_than',
      threshold: 0.8
    },
    actions: [
      {
        type: 'notification',
        channels: ['email', 'sms'],
        recipients: ['traffic@ankara.gov.tr']
      },
      {
        type: 'webhook',
        url: 'https://trafficmanagement.ankara.gov.tr/api/alerts'
      }
    ]
  });

  // Hava kalitesi uyarısı
  const airQualityAlert = await client.alerts.create({
    name: 'Kötü Hava Kalitesi',
    deviceId: airQualitySensorId,
    condition: {
      metric: 'pm25',
      operator: 'greater_than',
      threshold: 35 // µg/m³
    },
    actions: [
      {
        type: 'notification',
        channels: ['push', 'email'],
        message: 'UYARI: Hava kalitesi kötüleşti. Dışarı çıkarken dikkatli olun.'
      }
    ]
  });

  console.log('✅ Uyarılar oluşturuldu');
}
```

## Adım 7: Dashboard Oluşturma

### Basit Web Dashboard

```typescript
// Express.js ile basit dashboard API
import express from 'express';

const app = express();

app.get('/api/dashboard', async (req, res) => {
  const dashboard = {
    // Gerçek zamanlı durum
    currentStatus: await client.getStatus(),

    // Aktif cihazlar
    devices: await client.devices.list({ status: 'active' }),

    // Güncel metrikler
    metrics: {
      traffic: await client.metrics.getCurrent('traffic'),
      airQuality: await client.metrics.getCurrent('environmental'),
      parking: await client.metrics.getCurrent('parking')
    },

    // Aktif uyarılar
    activeAlerts: await client.alerts.getActive(),

    // Bugünün özeti
    dailySummary: await client.analytics.getDailySummary(new Date())
  };

  res.json(dashboard);
});

app.listen(3000, () => {
  console.log('📊 Dashboard API çalışıyor: http://localhost:3000');
});
```

## Sonraki Adımlar

Tebrikler! LyDian Akıllı Şehirler platformunu kullanmaya başladınız. İşte keşfedebileceğiniz ileri seviye konular:

### İleri Seviye Konular

1. **Akıllı Trafik Optimizasyonu** - Sinyalizasyon kontrolü ve yönlendirme
   - Bkz: [Trafik Optimizasyonu Rehberi](/docs/tr/guides/smart-cities-traffic-optimization.md)

2. **Enerji Yönetimi** - Akıllı aydınlatma ve enerji tasarrufu
   - Bkz: [Enerji Yönetimi Rehberi](/docs/tr/guides/smart-cities-energy-management.md)

3. **Kamu Güvenliği** - Kamera entegrasyonu ve olay tespiti
   - Bkz: [Güvenlik Sistemleri Rehberi](/docs/tr/guides/smart-cities-public-safety.md)

4. **Vatandaş Uygulaması** - Mobil uygulama geliştirme
   - Bkz: [Mobil Uygulama Rehberi](/docs/tr/guides/smart-cities-mobile-app.md)

### Üretim Ortamı Hususları

- **Ölçekleme**: Yüksek trafikte yatay ölçekleme yapılandırması
- **Güvenlik**: IoT cihaz kimlik doğrulaması ve şifreleme
- **Yedekleme**: Veri yedekleme ve felaket kurtarma planı
- **İzleme**: Sistem sağlığı ve performans izleme

### Kaynaklar

- [API Referansı](/docs/tr/api-reference/smart-cities.md)
- [Akıllı Şehirler Cookbook](/docs/tr/cookbooks/smart-cities-recipes.md)
- [Topluluk Forumu](https://community.lydian.com/smart-cities)
- [Destek](mailto:smart-cities@lydian.com)

## Sorun Giderme

### Yaygın Sorunlar

**Sorun**: `Authentication failed` hatası
- **Çözüm**: API anahtarınızın doğru olduğunu ve süresinin dolmadığını kontrol edin.

**Sorun**: Cihaz veri göndermiyor
- **Çözüm**: Cihaz konfigürasyonunu ve ağ bağlantısını kontrol edin. `client.devices.testConnection(deviceId)` kullanın.

**Sorun**: Tahminler doğru değil
- **Çözüm**: En az 7 günlük geçmiş veri olduğundan emin olun. Model eğitimi biraz zaman alabilir.

## Geri Bildirim

Deneyiminizi bizimle paylaşın:
- E-posta: smart-cities@lydian.com
- Topluluk: https://community.lydian.com/smart-cities
- GitHub: https://github.com/lydian-ai/smart-cities-sdk

---

**Rehber Versiyonu**: 1.0.0
**Son Güncelleme**: 2025-01-07
**Platform Versiyonu**: 2.1.0+
