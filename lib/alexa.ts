// Alexa Skills Kit Integration for AILYDIAN AI Lens Pro
import { COPYRIGHT_NOTICE } from './copyright';

// Alexa Skill Configuration
export const ALEXA_SKILL_CONFIG = {
  skillId: 'amzn1.ask.skill.AILYDIAN-AI-LENS-PRO',
  invocationName: 'ailydian trader',
  description: `${COPYRIGHT_NOTICE.project} - AI destekli kripto para trading asistanı`,
  keywords: ['kripto', 'bitcoin', 'ethereum', 'trading', 'ai', 'blockchain'],
  category: 'FINANCE_AND_ACCOUNTING',
  distributionCountries: ['TR', 'US', 'GB', 'DE', 'FR', 'CA'],
  locales: ['tr-TR', 'en-US', 'en-GB', 'de-DE', 'fr-FR'],
  privacyPolicyUrl: 'https://ailydian.com/privacy',
  termsOfUseUrl: 'https://ailydian.com/terms'
};

// Alexa Intent Handlers
export const ALEXA_INTENTS = {
  // Kripto fiyat sorgulama
  GetCryptoPriceIntent: {
    name: 'GetCryptoPriceIntent',
    samples: [
      'bitcoin fiyatı nedir',
      'ethereum ne kadar',
      '{coin} fiyatını söyle',
      '{coin} kaç dolar',
      'fiyatları göster'
    ],
    slots: [
      {
        name: 'coin',
        type: 'AMAZON.SearchQuery',
        samples: ['bitcoin', 'ethereum', 'binance coin', 'solana']
      }
    ]
  },

  // Portfolio sorguları
  GetPortfolioIntent: {
    name: 'GetPortfolioIntent', 
    samples: [
      'portföyümü göster',
      'bakiye durumum nedir',
      'toplam değerim ne kadar',
      'kar zarar durumu'
    ]
  },

  // Trading emirleri
  PlaceTradeOrderIntent: {
    name: 'PlaceTradeOrderIntent',
    samples: [
      '{amount} {coin} al',
      '{coin} sat',
      '{amount} dolar bitcoin al',
      'limit emri ver'
    ],
    slots: [
      { name: 'amount', type: 'AMAZON.NUMBER' },
      { name: 'coin', type: 'AMAZON.SearchQuery' }
    ]
  },

  // Market analizi
  GetMarketAnalysisIntent: {
    name: 'GetMarketAnalysisIntent',
    samples: [
      'piyasa analizi yap',
      'trend nasıl',
      'hangi coin yükseliyor',
      'ai önerisi ver'
    ]
  }
};

// Alexa Response Builder
export class AlexaResponseBuilder {
  private response: any;
  
  constructor() {
    this.response = {
      version: '1.0',
      response: {
        outputSpeech: {
          type: 'SSML',
          ssml: ''
        },
        card: {
          type: 'Standard',
          title: COPYRIGHT_NOTICE.project,
          text: ''
        },
        shouldEndSession: false
      }
    };
  }

  speak(text: string, isSSML = false) {
    if (isSSML) {
      this.response.response.outputSpeech.ssml = `<speak>${text}</speak>`;
    } else {
      this.response.response.outputSpeech.ssml = `<speak>${this.escapeSSML(text)}</speak>`;
    }
    return this;
  }

  withCard(title: string, content: string, imageUrl?: string) {
    this.response.response.card = {
      type: imageUrl ? 'Standard' : 'Simple',
      title,
      content,
      ...(imageUrl && {
        image: {
          smallImageUrl: imageUrl,
          largeImageUrl: imageUrl
        }
      })
    };
    return this;
  }

  reprompt(text: string) {
    this.response.response.reprompt = {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${this.escapeSSML(text)}</speak>`
      }
    };
    return this;
  }

  endSession(shouldEnd = true) {
    this.response.response.shouldEndSession = shouldEnd;
    return this;
  }

  build() {
    return this.response;
  }

  private escapeSSML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Skill Manifest Generator
export const generateSkillManifest = () => {
  return {
    manifest: {
      publishingInformation: {
        locales: {
          'tr-TR': {
            name: COPYRIGHT_NOTICE.project,
            summary: 'AI destekli kripto para trading asistanı',
            description: `${COPYRIGHT_NOTICE.project} ile ses komutuyla kripto para fiyatlarını öğrenin, portföyünüzü yönetin ve trading yapın. ${COPYRIGHT_NOTICE.owner} tarafından geliştirilmiştir.`,
            keywords: ALEXA_SKILL_CONFIG.keywords,
            examplePhrases: [
              'Alexa, ailydian trader\'ı aç',
              'bitcoin fiyatı nedir',
              'portföyümü göster'
            ]
          },
          'en-US': {
            name: `${COPYRIGHT_NOTICE.project} EN`,
            summary: 'AI-powered crypto trading assistant',
            description: `${COPYRIGHT_NOTICE.project} - Voice-controlled crypto trading with live prices, portfolio management, and AI insights. Developed by ${COPYRIGHT_NOTICE.owner}.`,
            keywords: ['crypto', 'bitcoin', 'ethereum', 'trading', 'ai', 'blockchain'],
            examplePhrases: [
              'Alexa, open ailydian trader',
              'what is bitcoin price',
              'show my portfolio'
            ]
          }
        },
        distributionCountries: ALEXA_SKILL_CONFIG.distributionCountries,
        isAvailableWorldwide: false,
        testingInstructions: 'Test with crypto price queries and portfolio commands',
        category: ALEXA_SKILL_CONFIG.category,
        distributionMode: 'PUBLIC'
      },
      apis: {
        custom: {
          endpoint: {
            uri: 'https://api.ailydian.com/alexa'
          },
          interfaces: [
            { type: 'AUDIO_PLAYER' },
            { type: 'DISPLAY' }
          ],
          locales: {
            'tr-TR': {
              interactionModel: {
                languageModel: {
                  invocationName: ALEXA_SKILL_CONFIG.invocationName,
                  intents: Object.values(ALEXA_INTENTS).map(intent => ({
                    name: intent.name,
                    samples: intent.samples,
                    ...('slots' in intent && intent.slots ? { slots: intent.slots } : {})
                  }))
                }
              }
            }
          }
        }
      },
      manifestVersion: '1.0',
      privacyAndCompliance: {
        allowsPurchases: false,
        usesPersonalInfo: false,
        isChildDirected: false,
        isExportCompliant: true,
        containsAds: false,
        privacyPolicyUrl: ALEXA_SKILL_CONFIG.privacyPolicyUrl,
        termsOfUseUrl: ALEXA_SKILL_CONFIG.termsOfUseUrl
      }
    }
  };
};

// Voice User Interface Responses (Türkçe)
export const ALEXA_RESPONSES_TR = {
  welcome: `Hoş geldiniz! ${COPYRIGHT_NOTICE.project} AI kripto trading asistanınız. Bitcoin fiyatını sorabilir, portföyünüzü kontrol edebilir veya piyasa analizini dinleyebilirsiniz.`,
  helpText: 'Bitcoin fiyatı nedir, portföyümü göster, veya piyasa analizi yap diyebilirsiniz.',
  goodbye: 'AILYDIAN AI Lens Pro\'yu kullandığınız için teşekkürler. İyi tradinglar!',
  error: 'Üzgünüm, bir sorun oluştu. Lütfen tekrar deneyin.',
  priceFormat: (coin: string, price: number) => 
    `${coin} şu anda ${price.toFixed(2)} dolar seviyesinde işlem görüyor.`,
  portfolioEmpty: 'Henüz portföyünüzde kripto para bulunmuyor.',
  tradingNotAvailable: 'Güvenlik nedeniyle ses komutuyla trading henüz aktif değil. Lütfen web panelini kullanın.'
};

// Voice User Interface Responses (English)
export const ALEXA_RESPONSES_EN = {
  welcome: `Welcome to ${COPYRIGHT_NOTICE.project}, your AI crypto trading assistant. You can ask about Bitcoin prices, check your portfolio, or get market analysis.`,
  helpText: 'You can say things like: What is Bitcoin price, show my portfolio, or give me market analysis.',
  goodbye: 'Thank you for using AILYDIAN AI Lens Pro. Happy trading!',
  error: 'Sorry, something went wrong. Please try again.',
  priceFormat: (coin: string, price: number) => 
    `${coin} is currently trading at ${price.toFixed(2)} dollars.`,
  portfolioEmpty: 'You don\'t have any cryptocurrency in your portfolio yet.',
  tradingNotAvailable: 'For security reasons, voice trading is not yet available. Please use the web panel.'
};
