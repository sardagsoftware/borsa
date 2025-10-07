# LyDian IQ Hızlı Başlangıç Rehberi

## Giriş

Bu rehber, LyDian IQ hukuki yapay zeka platformunu kullanmaya başlamanız için gereken tüm adımları içerir. İlk belge analizinizi yapmayı, hukuki araştırma yapmayı ve uyumluluk kontrolü yapmayı öğreneceksiniz.

**Tamamlanma süresi**: 30-45 dakika

**Ön koşullar**:
- Node.js 18+ veya Python 3.9+
- API erişimi olan LyDian hesabı
- Temel JavaScript/TypeScript veya Python bilgisi

## Ne Yapacaksınız

Bu rehberin sonunda:
- LyDian IQ entegrasyonunu çalıştıracaksınız
- Bir hukuki belgeyi analiz edeceksiniz
- Uyumluluk kontrolü yapacaksınız
- Hukuki varlıkları ve yükümlülükleri çıkaracaksınız
- Hukuki özetler üreteceksiniz

## Adım 1: Kurulum ve Başlangıç

### SDK'yı Yükleyin

**Node.js/TypeScript için:**
```bash
npm install @lydian/lydian-iq
# veya
yarn add @lydian/lydian-iq
# veya
pnpm add @lydian/lydian-iq
```

**Python için:**
```bash
pip install lydian-iq
```

### API Anahtarınızı Alın

1. [https://dashboard.lydian.com](https://dashboard.lydian.com) adresine gidin
2. **Ayarlar** → **API Anahtarları**'na gidin
3. **Yeni API Anahtarı Oluştur**'a tıklayın
4. Anahtarınızı kopyalayın ve güvenli bir yerde saklayın

### İstemciyi Başlatın

**TypeScript:**
```typescript
import { LyDianIQ } from '@lydian/lydian-iq';

const client = new LyDianIQ({
  apiKey: process.env.LYDIAN_API_KEY,
  // İsteğe bağlı: bölge belirtin
  region: 'tr-central', // veya 'eu-west', 'us-east'
});

// Bağlantıyı doğrulayın
async function verifySetup() {
  try {
    const status = await client.status();
    console.log('✅ LyDian IQ'ya bağlandı');
    console.log('Bölge:', status.region);
    console.log('Versiyon:', status.version);
  } catch (error) {
    console.error('❌ Bağlantı hatası:', error.message);
  }
}

verifySetup();
```

**Python:**
```python
from lydian_iq import LyDianIQ
import os

client = LyDianIQ(
    api_key=os.environ.get('LYDIAN_API_KEY'),
    region='tr-central'  # veya 'eu-west', 'us-east'
)

# Bağlantıyı doğrulayın
try:
    status = client.status()
    print('✅ LyDian IQ\'ya bağlandı')
    print(f'Bölge: {status.region}')
    print(f'Versiyon: {status.version}')
except Exception as e:
    print(f'❌ Bağlantı hatası: {e}')
```

## Adım 2: İlk Belgenizi Analiz Edin

İş sözleşmesi örneğini analiz edelim.

### Belge Yükleme ve Analiz

**TypeScript:**
```typescript
import * as fs from 'fs';

async function analyzeContract() {
  // Sözleşme dosyasını okuyun
  const contractBuffer = fs.readFileSync('./ornek-sozlesme.pdf');

  // Analizi başlatın
  const analysis = await client.documents.analyze({
    file: contractBuffer,
    filename: 'ornek-sozlesme.pdf',
    type: 'contract',
    jurisdiction: 'TR', // Türkiye
    options: {
      extractEntities: true,
      classifyClauses: true,
      identifyRisks: true,
      generateSummary: true
    }
  });

  console.log('📄 Belge Analizi Tamamlandı');
  console.log('═══════════════════════════════\n');

  // Belge bilgileri
  console.log('Belge Türü:', analysis.documentType);
  console.log('Sayfa Sayısı:', analysis.pageCount);
  console.log('Dil:', analysis.language);
  console.log('Güven:', (analysis.confidence * 100).toFixed(1) + '%\n');

  // Çıkarılan taraflar
  console.log('Taraflar:');
  for (const party of analysis.entities.parties) {
    console.log(`  - ${party.name} (${party.role})`);
  }
  console.log();

  // Önemli tarihler
  console.log('Önemli Tarihler:');
  for (const date of analysis.entities.dates.slice(0, 5)) {
    console.log(`  - ${date.type}: ${date.value}`);
  }
  console.log();

  // Bulunan yükümlülükler
  console.log('Bulunan Yükümlülükler:', analysis.entities.obligations.length);
  for (const obl of analysis.entities.obligations.slice(0, 3)) {
    console.log(`  - ${obl.obligor}, ${obl.action} yapmalıdır`);
    if (obl.deadline) {
      console.log(`    Son Tarih: ${obl.deadline}`);
    }
  }
  console.log();

  // Tespit edilen riskler
  if (analysis.risks && analysis.risks.length > 0) {
    console.log('⚠️  Tespit Edilen Riskler:');
    for (const risk of analysis.risks) {
      console.log(`  - [${risk.severity.toUpperCase()}] ${risk.description}`);
      console.log(`    Öneri: ${risk.recommendation}\n`);
    }
  }

  // Özet
  console.log('Özet:');
  console.log(analysis.summary);

  return analysis;
}

// Analizi çalıştırın
analyzeContract().catch(console.error);
```

### Beklenen Çıktı

```
📄 Belge Analizi Tamamlandı
═══════════════════════════════

Belge Türü: employment_contract
Sayfa Sayısı: 12
Dil: tr
Güven: %94.3

Taraflar:
  - ABC Teknoloji A.Ş. (işveren)
  - Ahmet Yılmaz (çalışan)

Önemli Tarihler:
  - yürürlük_tarihi: 15.01.2024
  - fesih_bildirimi: 30 gün
  - deneme_süresi_bitişi: 15.04.2024

Bulunan Yükümlülükler: 18
  - Çalışan, gizliliği korumalıdır
    Son Tarih: sözleşme_süresi
  - İşveren, sağlık sigortası sağlamalıdır
    Son Tarih: 01.02.2024

⚠️  Tespit Edilen Riskler:
  - [ORTA] Rekabet yasağı maddesi standart 6 aylık süreyi aşıyor
    Öneri: Rekabet yasağı süresini hukuk danışmanı ile gözden geçirin

Özet:
Bu, ABC Teknoloji A.Ş. ile Ahmet Yılmaz arasında Yazılım Mühendisi pozisyonu
için standart bir Türk iş sözleşmesidir. Sözleşme ücret (aylık 25.000 TL),
çalışma saatleri (haftada 40 saat), yan haklar ve fesih koşulları için
standart hükümler içermektedir...
```

## Adım 3: İçtihat Araştırması

İlgili içtihatları arayın.

**TypeScript:**
```typescript
async function searchCaseLaw() {
  const results = await client.caselaw.search({
    query: 'iş sözleşmesi haklı sebep olmadan feshi',
    jurisdiction: 'TR',
    courts: ['yargitay'], // Yargıtay
    dateRange: {
      start: new Date('2020-01-01'),
      end: new Date()
    },
    limit: 5
  });

  console.log('📚 İçtihat Arama Sonuçları');
  console.log('═══════════════════════════════\n');

  for (const case_ of results.cases) {
    console.log(`${case_.citation}`);
    console.log(`Mahkeme: ${case_.court}`);
    console.log(`Tarih: ${case_.date}`);
    console.log(`İlgililik: %${(case_.relevanceScore * 100).toFixed(1)}`);
    console.log(`Özet: ${case_.summary.substring(0, 200)}...`);
    console.log();
  }

  return results;
}

searchCaseLaw().catch(console.error);
```

## Adım 4: Uyumluluk Kontrolü

KVKK uyumluluğunu kontrol edelim.

**TypeScript:**
```typescript
async function checkKVKKCompliance() {
  // Gizlilik politikası belgesi olduğunu varsayalım
  const policyBuffer = fs.readFileSync('./gizlilik-politikasi.pdf');

  const complianceCheck = await client.compliance.check({
    document: policyBuffer,
    framework: 'KVKK', // Kişisel Verilerin Korunması Kanunu
    jurisdiction: 'TR',
    options: {
      detailedAnalysis: true,
      generateReport: true,
      suggestRemediation: true
    }
  });

  console.log('🔒 KVKK Uyumluluk Kontrolü');
  console.log('═══════════════════════════════\n');

  console.log(`Genel Durum: ${complianceCheck.status.toUpperCase()}`);
  console.log(`Uyumluluk Skoru: %${(complianceCheck.score * 100).toFixed(1)}`);
  console.log(`Kontrol Edilen Gereklilikler: ${complianceCheck.results.length}\n`);

  // Uyumlu gereklilikleri göster
  const compliant = complianceCheck.results.filter(r => r.status === 'compliant');
  console.log(`✅ Uyumlu: ${compliant.length}`);

  // Eksiklikleri göster
  const gaps = complianceCheck.results.filter(r => r.status !== 'compliant');
  if (gaps.length > 0) {
    console.log(`\n⚠️  Bulunan Eksiklikler: ${gaps.length}\n`);

    for (const gap of gaps) {
      console.log(`${gap.requirement.reference}: ${gap.requirement.title}`);
      console.log(`Durum: ${gap.status}`);
      console.log(`Sorun: ${gap.finding}`);

      if (gap.remediation) {
        console.log(`Çözüm: ${gap.remediation.description}`);
        console.log(`Çaba: ${gap.remediation.estimatedEffort}`);
        console.log(`Öncelik: ${gap.remediation.priority}`);
      }
      console.log();
    }
  }

  // Raporu dışa aktar
  const reportPath = './uyumluluk-raporu.pdf';
  await fs.promises.writeFile(reportPath, complianceCheck.report);
  console.log(`\n📄 Detaylı rapor kaydedildi: ${reportPath}`);

  return complianceCheck;
}

checkKVKKCompliance().catch(console.error);
```

## Adım 5: Hukuki Soru Yanıtlama

Kaynaklarla birlikte hukuki sorular sorun.

**TypeScript:**
```typescript
async function askLegalQuestion() {
  const question = `
    Türkiye'de işveren, deneme süresi içinde haklı sebep olmadan
    iş sözleşmesini feshedebilir mi?
  `;

  const answer = await client.reasoning.answer({
    question,
    jurisdiction: 'TR',
    context: {
      documentType: 'employment_contract',
      relevantLaws: ['4857 Sayılı İş Kanunu']
    },
    options: {
      includeCitations: true,
      includeAnalysis: true,
      confidence: 'high' // sadece emin olunduğunda yanıtla
    }
  });

  console.log('⚖️  Hukuki Soru & Yanıt');
  console.log('═══════════════════════════════\n');

  console.log('Soru:');
  console.log(question.trim());
  console.log();

  console.log('Yanıt:');
  console.log(answer.answer);
  console.log();

  console.log(`Güven: %${(answer.confidence * 100).toFixed(1)}\n`);

  if (answer.citations && answer.citations.length > 0) {
    console.log('Hukuki Dayanak:');
    for (const citation of answer.citations) {
      console.log(`  - ${citation.reference}: ${citation.text}`);
    }
    console.log();
  }

  if (answer.analysis) {
    console.log('Analiz:');
    console.log(answer.analysis);
  }

  return answer;
}

askLegalQuestion().catch(console.error);
```

**Beklenen Çıktı:**
```
⚖️  Hukuki Soru & Yanıt
═══════════════════════════════

Soru:
Türkiye'de işveren, deneme süresi içinde haklı sebep olmadan
iş sözleşmesini feshedebilir mi?

Yanıt:
Evet, İş Kanunu'na göre işverenler deneme süresi içinde haklı sebep göstermeden
ve tazminat ödemeden iş sözleşmesini feshedebilir. Ancak, işverenin yine de
yazılı bildirimde bulunması gerekir ve deneme süresi normal çalışanlar için
2 ayı, teknik uzmanlık gerektiren pozisyonlar için 4 ayı geçemez (Madde 15).

Güven: %92.3

Hukuki Dayanak:
  - 4857 Sayılı İş Kanunu, Madde 15: Deneme süreleri ve fesih
  - 4857 Sayılı İş Kanunu, Madde 17: Fesih bildirimi gereklilikleri
  - Yargıtay 9. HD, 2019/5432: Deneme süresi fesih davası

Analiz:
Bu, Türk iş hukukunda yerleşik bir ilkedir. Deneme süresi, her iki tarafın da
iş ilişkisini değerlendirmesine olanak tanır. Bu süre içinde her iki taraf da
sebep göstermeden feshedebilir, ancak temel bildirim gereklilikleri geçerlidir...
```

## Adım 6: Toplu İşlem

Birden fazla belgeyi verimli bir şekilde işleyin.

**TypeScript:**
```typescript
async function batchProcessContracts() {
  const contractFiles = [
    './sozlesmeler/sozlesme-1.pdf',
    './sozlesmeler/sozlesme-2.pdf',
    './sozlesmeler/sozlesme-3.pdf',
    './sozlesmeler/sozlesme-4.pdf',
    './sozlesmeler/sozlesme-5.pdf'
  ];

  // Toplu işlemi başlat
  const batch = await client.documents.analyzeBatch({
    files: contractFiles.map(path => ({
      file: fs.readFileSync(path),
      filename: path.split('/').pop()!,
      type: 'contract'
    })),
    options: {
      jurisdiction: 'TR',
      extractEntities: true,
      identifyRisks: true,
      parallel: true // Paralel işlem
    }
  });

  console.log('📦 Toplu İşlem');
  console.log('═══════════════════════════════\n');
  console.log(`Toplu İşlem ID: ${batch.id}`);
  console.log(`Toplam Belge: ${batch.total}`);
  console.log(`Durum: ${batch.status}\n`);

  // Tamamlanma için yokla
  let result = batch;
  while (result.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    result = await client.documents.getBatchStatus(batch.id);

    console.log(`İlerleme: ${result.completed}/${result.total} (%${Math.round(result.completed / result.total * 100)})`);
  }

  console.log('\n✅ Toplu İşlem Tamamlandı!\n');

  // Sonuçları al
  const analyses = await client.documents.getBatchResults(batch.id);

  // İstatistikleri topla
  const stats = {
    totalPages: 0,
    totalObligations: 0,
    highRisks: 0,
    mediumRisks: 0,
    lowRisks: 0
  };

  for (const analysis of analyses) {
    stats.totalPages += analysis.pageCount;
    stats.totalObligations += analysis.entities.obligations.length;

    for (const risk of analysis.risks || []) {
      if (risk.severity === 'high') stats.highRisks++;
      else if (risk.severity === 'medium') stats.mediumRisks++;
      else stats.lowRisks++;
    }
  }

  console.log('Özet İstatistikler:');
  console.log(`  Analiz Edilen Toplam Sayfa: ${stats.totalPages}`);
  console.log(`  Bulunan Toplam Yükümlülük: ${stats.totalObligations}`);
  console.log(`  Yüksek Riskler: ${stats.highRisks}`);
  console.log(`  Orta Riskler: ${stats.mediumRisks}`);
  console.log(`  Düşük Riskler: ${stats.lowRisks}`);

  return analyses;
}

batchProcessContracts().catch(console.error);
```

## Sonraki Adımlar

Tebrikler! LyDian IQ hızlı başlangıç rehberini tamamladınız. İşte keşfedebileceğiniz konular:

### İleri Seviye Konular

1. **Belge Karşılaştırma** - Sözleşme versiyonlarını karşılaştırın ve değişiklikleri takip edin
   - Bkz: [Belge Karşılaştırma Rehberi](/docs/tr/tutorials/lydian-iq-document-comparison.md)

2. **Özel Uyumluluk Çerçeveleri** - Kendi uyumluluk gerekliliklerinizi tanımlayın
   - Bkz: [Özel Uyumluluk Rehberi](/docs/tr/guides/lydian-iq-custom-compliance.md)

3. **Bilgi Grafiği Entegrasyonu** - Hukuki bilgi grafikleri oluşturun
   - Bkz: [Bilgi Grafiği Cookbook](/docs/tr/cookbooks/lydian-iq-knowledge-graphs.md)

4. **Çok Yargı Alanı Analizi** - Sınır ötesi hukuki sorunları ele alın
   - Bkz: [Çok Yargı Alanı Rehberi](/docs/tr/guides/lydian-iq-multi-jurisdiction.md)

### Üretim Ortamı Hususları

- **Hız Limitleri**: Ücretsiz katman saatte 100 istek. Daha yüksek limitler için [fiyatlandırma sayfası](https://lydian.com/pricing)na bakın.
- **Önbellekleme**: Sık erişilen belgeler ve arama sonuçlarını önbelleğe alın.
- **Hata İşleme**: Üstel geri çekilme ile yeniden deneme mantığı uygulayın.
- **İzleme**: Uzun süren analizleri takip etmek için webhook'lar kullanın.

### Kaynaklar

- [API Referansı](/docs/tr/api-reference/lydian-iq.md)
- [LyDian IQ Cookbook](/docs/tr/cookbooks/lydian-iq-recipes.md)
- [Topluluk Forumu](https://community.lydian.com/lydian-iq)
- [Destek](mailto:legal-ai@lydian.com)

## Sorun Giderme

### Yaygın Sorunlar

**Sorun**: `Authentication failed` hatası
- **Çözüm**: API anahtarınızın doğru olduğunu ve süresinin dolmadığını doğrulayın.

**Sorun**: Belge analizi çok uzun sürüyor
- **Çözüm**: Büyük belgeler (>50 sayfa) 30-60 saniye sürebilir. Daha iyi deneyim için toplu işlem veya webhook'lar kullanın.

**Sorun**: Desteklenmeyen yargı alanı
- **Çözüm**: [Desteklenen yargı alanları](https://docs.lydian.com/lydian-iq/jurisdictions)nı kontrol edin. Ek yargı alanı talepleri için desteğe başvurun.

## Geri Bildirim

Deneyiminizi paylaşın:
- E-posta: legal-ai@lydian.com
- Topluluk: https://community.lydian.com/lydian-iq
- GitHub: https://github.com/lydian-ai/lydian-iq-sdk

---

**Rehber Versiyonu**: 1.0.0
**Son Güncelleme**: 2025-01-07
**LyDian IQ Versiyonu**: 2.1.0+
