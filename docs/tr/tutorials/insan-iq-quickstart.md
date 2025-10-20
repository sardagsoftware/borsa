# İnsan IQ Hızlı Başlangıç

## Giriş

Bu rehber, LyDian İnsan IQ platformunu kullanmaya başlamanız için gereken tüm adımları içerir. Duygu analizi, empatik yanıtlar ve doğal konuşma akışları oluşturmayı öğreneceksiniz.

**Tamamlanma süresi**: 30-45 dakika

**Ön koşullar**:
- Node.js 18+ veya Python 3.9+
- API erişimi olan LyDian hesabı
- Temel JavaScript/TypeScript veya Python bilgisi

## Adım 1: Kurulum ve İlk Bağlantı

### SDK'yı Yükleyin

**Node.js/TypeScript:**
```bash
npm install @lydian/insan-iq
```

**Python:**
```bash
pip install lydian-insan-iq
```

### İstemciyi Başlatın

**TypeScript:**
```typescript
import { InsanIQ } from '@lydian/insan-iq';

const client = new InsanIQ({
  apiKey: process.env.LYDIAN_API_KEY,
  model: 'insan-iq-v2', // veya 'insan-iq-lite'
  language: 'tr' // Türkçe için
});

// Bağlantıyı test et
async function verifySetup() {
  try {
    const info = await client.getModelInfo();
    console.log('✅ Başarıyla bağlandı');
    console.log('Model:', info.model);
    console.log('Diller:', info.supportedLanguages);
  } catch (error) {
    console.error('❌ Bağlantı hatası:', error.message);
  }
}

verifySetup();
```

## Adım 2: Temel Duygu Analizi

### Metinden Duygu Tespiti

```typescript
async function detectEmotion(text: string) {
  const result = await client.emotions.detect({
    text,
    includeIntensity: true,
    includeValence: true
  });

  console.log('Algılanan Duygu:', result.primary);
  console.log('Yoğunluk:', result.intensity); // 0-1 arası
  console.log('Valans:', result.valence); // -1 (negatif) ile +1 (pozitif) arası

  // Tüm algılanan duygular
  console.log('\nTüm Duygular:');
  for (const emotion of result.emotions) {
    console.log(`  ${emotion.name}: %${(emotion.score * 100).toFixed(1)}`);
  }

  return result;
}

// Örnekler
await detectEmotion('Bugün harika bir gün geçirdim!');
// Çıktı: primary: 'joy', intensity: 0.85, valence: 0.92

await detectEmotion('Çok üzgünüm, işler yolunda gitmiyor.');
// Çıktı: primary: 'sadness', intensity: 0.78, valence: -0.73
```

### Konuşma Geçmişi ile Bağlamsal Duygu Analizi

```typescript
async function analyzeConversation() {
  const conversation = [
    { role: 'user', text: 'Merhaba, bugün çok yorgunum' },
    { role: 'assistant', text: 'Anladım, uzun bir gün mü geçirdiniz?' },
    { role: 'user', text: 'Evet, işler çok yoğundu ve kafam karışık' }
  ];

  const analysis = await client.emotions.analyzeConversation({
    messages: conversation,
    detectShifts: true, // Duygu değişimlerini tespit et
    includeContext: true
  });

  console.log('Genel Ruh Hali:', analysis.overallMood);
  console.log('Duygu Değişimleri:', analysis.emotionalShifts);

  // Kullanıcının duygusal yolculuğu
  console.log('\nDuygusal Yolculuk:');
  for (const point of analysis.journey) {
    console.log(`  ${point.turn}: ${point.emotion} (${point.intensity})`);
  }

  return analysis;
}
```

## Adım 3: Empatik Yanıtlar Üretme

### Duygu Doğrulama

```typescript
async function generateEmpatheticResponse(userMessage: string) {
  // Önce duyguyu algıla
  const emotion = await client.emotions.detect({ text: userMessage });

  // Empatik yanıt oluştur
  const response = await client.empathy.generateResponse({
    userMessage,
    detectedEmotion: emotion.primary,
    style: 'validating', // 'supportive', 'understanding', 'encouraging'
    avoidMinimizing: true // "Sorun değil", "Kafana takma" gibi ifadeler kullanma
  });

  console.log('Kullanıcı:', userMessage);
  console.log('Algılanan Duygu:', emotion.primary);
  console.log('Empatik Yanıt:', response.text);
  console.log('Empati Skoru:', (response.empathyScore * 100).toFixed(0) + '%');

  return response;
}

// Örnekler
await generateEmpatheticResponse('İşimi kaybettim ve ne yapacağımı bilmiyorum');
// Yanıt: "Bu gerçekten zor bir durum ve böyle hissetmeniz çok doğal.
//         İşinizi kaybetmek belirsizlik ve endişe yaratabilir..."

await generateEmpatheticResponse('Bugün terfi aldım!');
// Yanıt: "Ne harika bir haber! Terfi almak için çok çalışmış olmalısınız.
//         Bu başarınız için sizi tebrik ederim..."
```

### Perspektif Alma

```typescript
async function generatePerspectiveTaking(situation: string) {
  const response = await client.empathy.takePerspective({
    situation,
    depth: 'deep', // 'shallow', 'moderate', 'deep'
    includeValidation: true
  });

  console.log('Durum:', situation);
  console.log('\nPerspektif:');
  console.log(response.perspective);
  console.log('\nDoğrulama:');
  console.log(response.validation);

  return response;
}

// Örnek
await generatePerspectiveTaking(
  'Arkadaşım benimle planlarını iptal etti ve çok kırgınım'
);
// Çıktı: Kullanıcının duygularını anlayan, durumu onun bakış açısından
// yorumlayan ve duygularını normalize eden bir yanıt
```

## Adım 4: Akıllı Konuşma Yönetimi

### Çok Turlu Konuşma

```typescript
class ConversationManager {
  private context: Message[] = [];
  private summary: string = '';

  async addMessage(role: 'user' | 'assistant', text: string) {
    this.context.push({ role, text, timestamp: new Date() });

    // Konuşma çok uzarsa özetle
    if (this.context.length > 10) {
      await this.summarizeAndCompress();
    }
  }

  async generateResponse(userMessage: string) {
    // Mesajı contexte ekle
    await this.addMessage('user', userMessage);

    // Duygu analizi yap
    const emotion = await client.emotions.detect({ text: userMessage });

    // Bağlamsal yanıt oluştur
    const response = await client.conversations.generate({
      messages: this.context,
      currentEmotion: emotion.primary,
      summary: this.summary,
      options: {
        empathetic: true,
        natural: true,
        contextAware: true
      }
    });

    // Yanıtı contexte ekle
    await this.addMessage('assistant', response.text);

    return {
      text: response.text,
      emotion: emotion.primary,
      contextUsed: response.contextTokensUsed
    };
  }

  private async summarizeAndCompress() {
    // İlk 5 mesajı özetle
    const toSummarize = this.context.slice(0, 5);

    const summary = await client.conversations.summarize({
      messages: toSummarize,
      preserve: ['key_facts', 'emotional_state', 'user_goals']
    });

    this.summary = summary.text;
    this.context = this.context.slice(5); // İlk 5 mesajı kaldır
  }
}

// Kullanım
const conv = new ConversationManager();

await conv.generateResponse('Merhaba, bugün çok stresli bir gün geçirdim');
await conv.generateResponse('İş yerinde büyük bir sunum yapmam gerekiyor');
await conv.generateResponse('Nasıl sakinleşebilirim?');
```

### Niyet Tespiti ve Yönlendirme

```typescript
async function detectIntentAndRoute(userMessage: string) {
  const intent = await client.conversations.detectIntent({
    text: userMessage,
    possibleIntents: [
      'emotional_support',
      'advice_seeking',
      'casual_chat',
      'complaint',
      'question',
      'farewell'
    ]
  });

  console.log('Algılanan Niyet:', intent.primary);
  console.log('Güven:', (intent.confidence * 100).toFixed(0) + '%');

  // Niyete göre farklı yanıt stratejileri
  switch (intent.primary) {
    case 'emotional_support':
      return client.empathy.generateResponse({
        userMessage,
        style: 'supportive'
      });

    case 'advice_seeking':
      return client.conversations.generate({
        messages: [{ role: 'user', text: userMessage }],
        options: { provideSuggestions: true }
      });

    case 'casual_chat':
      return client.conversations.generate({
        messages: [{ role: 'user', text: userMessage }],
        options: { casual: true, friendly: true }
      });

    default:
      return client.conversations.generate({
        messages: [{ role: 'user', text: userMessage }]
      });
  }
}
```

## Adım 5: Kriz Durumu Tespiti

### Güvenlik ve Kriz Farkındalığı

```typescript
async function checkForCrisis(userMessage: string) {
  const crisisCheck = await client.safety.checkCrisis({
    text: userMessage,
    sensitivity: 'high' // 'low', 'medium', 'high'
  });

  if (crisisCheck.isCrisis) {
    console.log('⚠️ KRİZ TESPİT EDİLDİ!');
    console.log('Seviye:', crisisCheck.severity); // 'low', 'medium', 'high', 'critical'
    console.log('Göstergeler:', crisisCheck.indicators);

    // Kriz yanıtı oluştur
    const response = await client.empathy.generateCrisisResponse({
      message: userMessage,
      crisisType: crisisCheck.type,
      severity: crisisCheck.severity
    });

    console.log('\nKriz Yanıtı:', response.text);
    console.log('Acil Kaynaklar:', response.resources);

    // Acil durum kaynaklarını göster
    if (crisisCheck.severity === 'high' || crisisCheck.severity === 'critical') {
      console.log('\n🆘 ACİL YARDIM HATLARI:');
      console.log('  • Yaşam Hattı: 182');
      console.log('  • Psikolojik Danışma: 444 0 182');
      console.log('  • Acil Yardım: 112');
    }

    return {
      isCrisis: true,
      response: response.text,
      resources: response.resources
    };
  }

  return { isCrisis: false };
}

// Örnekler
await checkForCrisis('Artık dayanamıyorum, her şeyi bitirmek istiyorum');
// Kriz tespit edilir, destekleyici yanıt ve acil kaynaklar sağlanır

await checkForCrisis('Bugün çok yorgunum');
// Kriz tespit edilmez, normal konuşma devam eder
```

## Adım 6: Kültürel Farkındalık

### Kültüre Özgü Empati

```typescript
async function culturallyAwareResponse(userMessage: string, culture: string) {
  const response = await client.empathy.generateCulturalResponse({
    userMessage,
    culture, // 'tr', 'us', 'jp', 'de', vb.
    considerNorms: true,
    considerCommunicationStyle: true
  });

  console.log('Kültür:', culture);
  console.log('Yanıt:', response.text);
  console.log('Kültürel Uyumluluk:', (response.culturalFit * 100).toFixed(0) + '%');

  return response;
}

// Türk kültürüne özgü yaklaşım
await culturallyAwareResponse(
  'Ailem benim için bir şeyler ayarlamak istiyor ama ben farklı düşünüyorum',
  'tr'
);
// Aile bağlarının önemini ve toplulukçu değerleri dikkate alan bir yanıt

// Amerikan kültürüne özgü yaklaşım
await culturallyAwareResponse(
  'My family wants to arrange something for me but I think differently',
  'us'
);
// Bireysel özerkliği ve kişisel tercihi vurgulayan bir yanıt
```

## Adım 7: Empati Ölçümü ve İyileştirme

### Yanıt Kalitesini Değerlendirme

```typescript
async function evaluateEmpathy(
  userMessage: string,
  assistantResponse: string
) {
  const evaluation = await client.empathy.evaluate({
    userMessage,
    response: assistantResponse,
    criteria: [
      'emotional_validation',
      'perspective_taking',
      'warmth',
      'authenticity',
      'helpfulness'
    ]
  });

  console.log('Empati Değerlendirmesi:');
  console.log('  Genel Skor:', (evaluation.overallScore * 100).toFixed(0) + '%');
  console.log('\nKriterler:');
  for (const criterion of evaluation.criteria) {
    console.log(`  ${criterion.name}: ${(criterion.score * 100).toFixed(0)}%`);
  }

  // İyileştirme önerileri
  if (evaluation.overallScore < 0.7) {
    console.log('\n💡 İyileştirme Önerileri:');
    for (const suggestion of evaluation.suggestions) {
      console.log(`  • ${suggestion}`);
    }
  }

  return evaluation;
}
```

## Adım 8: Gerçek Zamanlı Konuşma Analizi

### Canlı Konuşma İzleme

```typescript
class LiveConversationAnalyzer {
  async startAnalyzing() {
    // Gerçek zamanlı dinleme
    client.conversations.streamAnalyze((analysis) => {
      console.log('\n📊 Canlı Analiz:');
      console.log('  Mevcut Duygu:', analysis.currentEmotion);
      console.log('  Empati Seviyesi:', (analysis.empathyLevel * 100).toFixed(0) + '%');
      console.log('  Bağlılık:', (analysis.engagement * 100).toFixed(0) + '%');

      // Öneriler
      if (analysis.suggestions.length > 0) {
        console.log('  💡 Öneriler:');
        for (const suggestion of analysis.suggestions) {
          console.log(`    • ${suggestion}`);
        }
      }

      // Uyarılar
      if (analysis.warnings.length > 0) {
        console.log('  ⚠️  Uyarılar:');
        for (const warning of analysis.warnings) {
          console.log(`    • ${warning}`);
        }
      }
    });
  }
}
```

## Sonraki Adımlar

Tebrikler! İnsan IQ platformunu kullanmaya başladınız. İşte keşfedebileceğiniz ileri seviye konular:

### İleri Seviye Özellikler

1. **Kişiselleştirilmiş Empati** - Kullanıcı profiline göre uyarlanmış yanıtlar
2. **Duygusal Zeka Eğitimi** - Chatbot'unuzu eğitin
3. **Çok Dilli Destek** - 50+ dilde empatik iletişim
4. **Ses ve Video Analizi** - Ses tonundan duygu analizi

### Üretim Ortamı İpuçları

- **Yanıt Süresi**: ~200-500ms (empati üretimi için)
- **Ölçekleme**: 10,000+ req/s desteklenir
- **Önbellekleme**: Sık kullanılan kalıplar için
- **İzleme**: Empati metriklerini takip edin

### Kaynaklar

- [API Referansı](/docs/tr/api-reference/insan-iq.md)
- [Empati Cookbook](/docs/tr/cookbooks/insan-iq-empathy.md)
- [Topluluk](https://community.lydian.com/insan-iq)

## Destek

- E-posta: insan-iq@lydian.com
- Dokümantasyon: https://docs.lydian.com/insan-iq
- Topluluk: https://community.lydian.com/insan-iq

---

**Rehber Versiyonu**: 1.0.0
**Son Güncelleme**: 2025-01-07
**Platform Versiyonu**: 2.1.0+
