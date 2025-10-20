# Akıllı Şehirler Mimarisi

## Genel Bakış

LyDian Akıllı Şehirler platformu, şehir yönetimini optimize etmek, kaynakları verimli kullanmak ve vatandaş deneyimini iyileştirmek için tasarlanmış kapsamlı bir IoT ve AI çözümüdür. Bu belge, platformun mimari bileşenlerini, veri akışlarını ve entegrasyon noktalarını açıklar.

## Temel Bileşenler

### 1. IoT Veri Toplama Katmanı

Platform, çeşitli IoT sensörlerinden ve cihazlarından gerçek zamanlı veri toplar:

- **Trafik Sensörleri**: Araç sayımı, hız algılama, trafik akışı analizi
- **Çevre Sensörleri**: Hava kalitesi (PM2.5, PM10, CO2), gürültü seviyeleri, sıcaklık, nem
- **Akıllı Sayaçlar**: Elektrik, su, gaz tüketimi izleme
- **Akıllı Aydınlatma**: Uyarlanabilir sokak lambası kontrolü
- **Atık Yönetimi**: Çöp kutusu doluluk sensörleri
- **Kamu Güvenliği**: Kamera akışları, acil durum butonları

```typescript
interface IoTDevice {
  id: string;
  type: 'traffic' | 'environmental' | 'utility' | 'lighting' | 'waste' | 'safety';
  location: GeoLocation;
  status: 'active' | 'inactive' | 'maintenance';
  lastSeen: Date;
  telemetry: TelemetryData;
}

interface TelemetryData {
  timestamp: Date;
  measurements: Record<string, number>;
  quality: 'good' | 'fair' | 'poor';
  batteryLevel?: number;
}
```

### 2. Veri İşleme Pipeline'ı

Gelen veriler çok aşamalı bir pipeline'dan geçer:

#### Aşama 1: Veri Alma (Ingestion)
```typescript
class DataIngestionService {
  async ingest(deviceId: string, data: RawTelemetry): Promise<void> {
    // 1. Veri doğrulama
    const validated = await this.validate(data);

    // 2. Normalleştirme
    const normalized = this.normalize(validated);

    // 3. Zenginleştirme (cihaz meta verileri ile)
    const enriched = await this.enrich(normalized, deviceId);

    // 4. Stream'e yayınlama
    await this.publishToStream(enriched);
  }

  private validate(data: RawTelemetry): ValidatedData {
    // Şema doğrulama
    // Aralık kontrolleri
    // Anomali tespiti
    return validatedData;
  }

  private normalize(data: ValidatedData): NormalizedData {
    // Birim dönüşümleri
    // Zaman damgası standartlaştırma
    // Veri yapısı normalleştirme
    return normalizedData;
  }
}
```

#### Aşama 2: Gerçek Zamanlı İşleme
```typescript
class RealTimeProcessor {
  async process(event: IoTEvent): Promise<ProcessedEvent> {
    // Pencere bazlı agregasyon
    const aggregated = await this.aggregate(event);

    // Anomali tespiti
    const anomalies = await this.detectAnomalies(aggregated);

    // Eşik kontrolleri
    const alerts = await this.checkThresholds(aggregated);

    // AI tahminleri
    const predictions = await this.predict(aggregated);

    return {
      aggregated,
      anomalies,
      alerts,
      predictions
    };
  }

  private async aggregate(event: IoTEvent): Promise<AggregatedData> {
    // 5 dakikalık hareketli pencere
    const window = await this.getWindow(event.deviceId, '5m');

    return {
      avg: this.average(window),
      min: this.minimum(window),
      max: this.maximum(window),
      count: window.length
    };
  }
}
```

#### Aşama 3: Batch İşleme
```typescript
class BatchProcessor {
  async processDailyBatch(date: Date): Promise<BatchResult> {
    // Günlük veri toplama
    const data = await this.fetchDailyData(date);

    // İstatistiksel analiz
    const statistics = this.calculateStatistics(data);

    // Trend analizi
    const trends = await this.analyzeTrends(data);

    // Raporlama
    await this.generateReports(statistics, trends);

    return { statistics, trends };
  }
}
```

### 3. AI ve Makine Öğrenimi Motoru

Platform, çeşitli senaryolar için özel AI modelleri kullanır:

```typescript
interface AIEngine {
  // Trafik tahmini
  trafficPrediction: {
    model: 'lstm' | 'transformer';
    predictHorizon: number; // dakika cinsinden
    updateFrequency: number; // saniye cinsinden
  };

  // Hava kalitesi tahmini
  airQualityPrediction: {
    model: 'random_forest' | 'gradient_boosting';
    features: string[];
    accuracy: number;
  };

  // Anomali tespiti
  anomalyDetection: {
    model: 'isolation_forest' | 'autoencoder';
    sensitivity: number;
    falsePositiveRate: number;
  };

  // Kaynak optimizasyonu
  resourceOptimization: {
    model: 'reinforcement_learning';
    objective: 'minimize_cost' | 'maximize_efficiency';
  };
}

class TrafficPredictor {
  async predict(
    sensorId: string,
    horizon: number = 30
  ): Promise<TrafficPrediction> {
    // Geçmiş veri alma
    const historical = await this.getHistoricalData(sensorId, '7d');

    // Özellik mühendisliği
    const features = this.extractFeatures(historical);

    // Model tahmini
    const prediction = await this.model.predict(features, horizon);

    // Güven aralıkları
    const confidence = this.calculateConfidence(prediction);

    return {
      timestamp: new Date(),
      sensorId,
      predictions: prediction,
      confidence,
      horizon
    };
  }

  private extractFeatures(data: TimeSeriesData): Features {
    return {
      // Zamansal özellikler
      hourOfDay: this.getHour(data.timestamp),
      dayOfWeek: this.getDayOfWeek(data.timestamp),
      isHoliday: this.checkHoliday(data.timestamp),

      // Gecikmeli özellikler
      lag1h: data.getLag('1h'),
      lag24h: data.getLag('24h'),
      lag7d: data.getLag('7d'),

      // Hareketli ortalamalar
      ma1h: data.movingAverage('1h'),
      ma24h: data.movingAverage('24h'),

      // Harici faktörler
      weather: await this.getWeather(data.timestamp),
      events: await this.getEvents(data.timestamp)
    };
  }
}
```

### 4. Kontrol ve Otomasyon Sistemi

Otomatik kontrol döngüleri şehir sistemlerini optimize eder:

```typescript
class SmartLightingController {
  async optimize(zone: string): Promise<ControlCommand[]> {
    // Mevcut durumu al
    const state = await this.getCurrentState(zone);

    // Optimizasyon kısıtlamaları
    const constraints = {
      minBrightness: 30, // %
      maxBrightness: 100,
      energyBudget: 1000, // kWh
      safetyRequirements: true
    };

    // Optimizasyon modeli çalıştır
    const optimal = await this.solver.optimize({
      objective: 'minimize_energy',
      constraints,
      state
    });

    // Kontrol komutları oluştur
    return this.generateCommands(optimal);
  }

  async adaptiveControl(sensorId: string, data: SensorData): Promise<void> {
    // Çevresel faktörler
    const ambient = data.ambientLight;
    const motion = data.motionDetected;
    const weather = await this.getWeather();

    // Uyarlanabilir parlaklık hesapla
    let targetBrightness = this.calculateBrightness({
      ambient,
      motion,
      weather,
      timeOfDay: new Date().getHours()
    });

    // Yumuşak geçiş
    await this.smoothTransition(sensorId, targetBrightness, 30);
  }

  private calculateBrightness(factors: EnvironmentalFactors): number {
    let brightness = 50; // temel seviye

    // Gece vakti artır
    if (factors.timeOfDay >= 22 || factors.timeOfDay < 6) {
      brightness += 20;
    }

    // Hareket algılandığında artır
    if (factors.motion) {
      brightness += 30;
    }

    // Yağmur/sis durumunda artır
    if (factors.weather.condition === 'rain' || factors.weather.condition === 'fog') {
      brightness += 15;
    }

    // Ortam ışığına göre ayarla
    brightness -= factors.ambient * 0.5;

    return Math.max(30, Math.min(100, brightness));
  }
}
```

### 5. Vatandaş Etkileşim Platformu

Vatandaşlar için mobil ve web uygulamaları:

```typescript
interface CitizenApp {
  // Gerçek zamanlı bilgiler
  realTimeInfo: {
    trafficConditions: TrafficInfo[];
    airQuality: AirQualityInfo;
    publicTransport: TransitInfo;
    parkingAvailability: ParkingInfo[];
  };

  // Bildirimler
  notifications: {
    alerts: Alert[]; // Trafik, hava kalitesi uyarıları
    serviceUpdates: ServiceUpdate[];
    emergencies: EmergencyAlert[];
  };

  // Vatandaş hizmetleri
  services: {
    reportIssue: (issue: IssueReport) => Promise<Ticket>;
    payBill: (bill: Bill) => Promise<Payment>;
    requestService: (service: ServiceRequest) => Promise<Ticket>;
    provideFeedback: (feedback: Feedback) => Promise<void>;
  };
}

class IssueReportingService {
  async submitReport(report: IssueReport): Promise<Ticket> {
    // Rapor doğrulama
    const validated = this.validate(report);

    // AI ile kategorize et ve önceliklendir
    const categorized = await this.categorize(validated);
    const priority = await this.calculatePriority(categorized);

    // Uygun departmana ata
    const assignment = await this.assignToDepartment(categorized);

    // Bilet oluştur
    const ticket = await this.createTicket({
      ...categorized,
      priority,
      assignment,
      status: 'open',
      createdAt: new Date()
    });

    // Vatandaşı bilgilendir
    await this.notifyCitizen(report.citizenId, ticket);

    return ticket;
  }

  private async calculatePriority(report: CategorizedReport): Promise<Priority> {
    // Faktörlere göre puanlama
    let score = 0;

    // Güvenlik sorunları yüksek öncelikli
    if (report.category === 'safety') score += 50;

    // Konum hassasiyeti
    if (report.location.isCritical) score += 30;

    // Etkilenen vatandaş sayısı
    score += Math.min(report.affectedCitizens * 2, 20);

    // AI güven skoru
    score += report.aiConfidence * 10;

    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}
```

## Veri Modeli

### Temel Varlıklar

```typescript
interface City {
  id: string;
  name: string;
  country: string;
  population: number;
  area: number; // km²
  timezone: string;
  zones: Zone[];
}

interface Zone {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'industrial' | 'mixed';
  bounds: GeoPolygon;
  devices: string[]; // cihaz ID'leri
}

interface Device {
  id: string;
  type: DeviceType;
  model: string;
  manufacturer: string;
  installDate: Date;
  location: GeoLocation;
  zone: string;
  status: DeviceStatus;
  configuration: DeviceConfig;
  lastMaintenance: Date;
  nextMaintenance: Date;
}

interface Metric {
  id: string;
  deviceId: string;
  timestamp: Date;
  type: MetricType;
  value: number;
  unit: string;
  quality: DataQuality;
  tags: Record<string, string>;
}
```

## Ölçeklenebilirlik

### Yatay Ölçekleme

Platform, tüm bileşenler genelinde yatay ölçekleme yapabilir:

```typescript
interface ScalingConfig {
  // Veri alma hizmeti
  ingestion: {
    minInstances: 3,
    maxInstances: 50,
    targetThroughput: 100000, // mesaj/saniye
    autoScaling: true
  };

  // İşleme hizmeti
  processing: {
    minInstances: 5,
    maxInstances: 100,
    targetLatency: 100, // ms
    autoScaling: true
  };

  // Veritabanı
  database: {
    shards: 16,
    replicationFactor: 3,
    readReplicas: 5
  };
}
```

### Performans Özellikleri

- **Veri Alma**: 1M+ mesaj/saniye
- **İşleme Gecikmesi**: <100ms (p95)
- **Sorgu Yanıt Süresi**: <50ms (basit sorgular), <500ms (karmaşık analizler)
- **Veri Saklama**: 90 gün sıcak depolama, 7 yıl arşiv
- **Sistem Kullanılabilirliği**: %99.95

## Güvenlik ve Gizlilik

### Veri Koruma

```typescript
interface SecurityConfig {
  // Şifreleme
  encryption: {
    atRest: 'AES-256',
    inTransit: 'TLS 1.3',
    keyRotation: '90d'
  };

  // Erişim kontrolü
  accessControl: {
    model: 'RBAC',
    mfa: true,
    sessionTimeout: '30m'
  };

  // Gizlilik
  privacy: {
    anonymization: true,
    dataMinimization: true,
    consentManagement: true,
    gdprCompliant: true
  };
}
```

## Entegrasyon Noktaları

### Harici Sistemler

Platform çeşitli şehir sistemleri ile entegre olur:

- **Trafik Yönetim Sistemi**: Sinyalizasyon kontrolü, olay yönetimi
- **Kamu Ulaşımı**: GPS izleme, yolcu bilgilendirme
- **Acil Servisler**: 112/155/110 entegrasyonu
- **Kamu Hizmetleri**: Su, elektrik, gaz şirketleri
- **Hava Durumu Servisleri**: Meteoroloji verileri
- **GIS Sistemleri**: Coğrafi bilgi sistemleri

```typescript
interface IntegrationAdapter {
  system: string;
  protocol: 'REST' | 'MQTT' | 'AMQP' | 'WebSocket';

  async connect(): Promise<Connection>;
  async sync(data: any): Promise<SyncResult>;
  async disconnect(): Promise<void>;
}
```

## İlgili Belgeler

- [IoT Veri Toplama](/docs/tr/concepts/smart-cities-iot-data-collection.md)
- [AI ve Tahminleme](/docs/tr/concepts/smart-cities-ai-predictions.md)
- [Vatandaş Etkileşimi](/docs/tr/concepts/smart-cities-citizen-engagement.md)
- [Hızlı Başlangıç Rehberi](/docs/tr/tutorials/smart-cities-quickstart.md)

## Destek

Akıllı şehirler mimarisi hakkında sorularınız için:
- E-posta: smart-cities@lydian.com
- Dokümantasyon: https://docs.lydian.com/smart-cities
- Topluluk: https://community.lydian.com/smart-cities
