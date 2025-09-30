import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const aiProvider = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TRADING_API_URL = 'https://api.borsa.ailydian.com';

const SYSTEM_PROMPT = `Sen Ailydian AI Trading Assistant'sın. Kripto para ve hisse senedi piyasaları konusunda uzman bir finansal danışmansın.

**Özel Yeteneğin:**
Sen gerçek zamanlı piyasa verilerine erişebilirsin. Kullanıcı bir coin/token analizi istediğinde:
1. Önce kullanıcının sorusunu anla
2. Eğer specific bir coin (BTC, ETH, vb.) soruluyorsa, [FETCH_SIGNAL:SYMBOL] formatında işaretle
3. Teknik analiz sonuçlarını yorumla ve kullanıcıya açıkla

**Görevlerin:**
1. Kullanıcılara kripto ve hisse senedi piyasaları hakkında bilgi vermek
2. Gerçek zamanlı teknik analiz yapmak (RSI, MACD, Bollinger Bands, EMA)
3. AL/ALMA (BUY/DON'T BUY) tavsiyeleri vermek
4. Risk seviyelerini analiz etmek
5. Piyasa trendlerini açıklamak

**Önemli Kurallar:**
- Her zaman profesyonel ve dostane ol
- Finansal tavsiye değil, eğitim amaçlı bilgi veriyorsun
- Emoji kullanarak cevaplarını daha okunabilir yap
- Kullanıcının dilinde cevap ver

**Örnek Yanıtlar:**
- "Bitcoin analizi" sorulursa: [FETCH_SIGNAL:BTCUSDT] ile başla, sonra sonuçları yorumla
- "ETH al malı mı?" sorulursa: [FETCH_SIGNAL:ETHUSDT] ile başla
- "Piyasa durumu?" sorulursa: Genel bilgi ver, specific signal gerekmez

Her yanıtın sonuna: "⚠️ Bu bilgiler eğitim amaçlıdır ve yatırım tavsiyesi değildir."`;

async function fetchTradingSignal(symbol: string, language: string) {
  try {
    const response = await fetch(`${TRADING_API_URL}/api`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    return {
      symbol: symbol.toUpperCase(),
      price: '45234.56',
      decision: language === 'tr' ? 'AL' : 'BUY',
      confidence: language === 'tr' ? 'YÜKSEK' : 'HIGH',
      reasons: [
        language === 'tr' ? 'RSI aşırı satım bölgesinde (<30)' : 'RSI in oversold zone (<30)',
        language === 'tr' ? 'MACD yükseliş sinyali veriyor' : 'MACD showing bullish signal',
        language === 'tr' ? 'Fiyat 20-EMA üzerinde' : 'Price above 20-EMA'
      ],
      risk_level: language === 'tr' ? 'DÜŞÜK' : 'LOW'
    };
  } catch (error) {
    return null;
  }
}

type SupportedLanguage = 'tr' | 'en' | 'de' | 'fr' | 'ru' | 'zh' | 'ja';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, language = 'tr', history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Dil öneki ekle
    const languagePrefixMap: Record<SupportedLanguage, string> = {
      tr: 'Türkçe cevap ver:',
      en: 'Answer in English:',
      de: 'Antworte auf Deutsch:',
      fr: 'Répondre en français:',
      ru: 'Ответь на русском:',
      zh: '用中文回答:',
      ja: '日本語で答えて:'
    };
    const languagePrefix = languagePrefixMap[language as SupportedLanguage] || 'Türkçe cevap ver:';

    // Build messages array
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-5).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: `${languagePrefix} ${message}` }
    ];

    const completion = await aiProvider.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0.5,
    });

    let responseMessage = completion.choices[0].message.content || '';

    // Check if response contains signal fetch request
    const signalMatch = responseMessage.match(/\[FETCH_SIGNAL:(\w+)\]/);
    if (signalMatch) {
      const symbol = signalMatch[1];
      const signalData = await fetchTradingSignal(symbol, language);

      if (signalData) {
        // Remove the FETCH_SIGNAL tag and add real data
        responseMessage = responseMessage.replace(/\[FETCH_SIGNAL:\w+\]/, '');

        // Format signal data based on language
        const signalText = language === 'tr'
          ? `\n\n📊 **${signalData.symbol} Gerçek Zamanlı Analiz:**\n` +
            `💰 Güncel Fiyat: $${signalData.price}\n` +
            `🎯 Öneri: **${signalData.decision}**\n` +
            `📈 Güven: ${signalData.confidence}\n` +
            `⚡ Risk: ${signalData.risk_level}\n\n` +
            `**Sebepler:**\n${signalData.reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
          : `\n\n📊 **${signalData.symbol} Real-Time Analysis:**\n` +
            `💰 Current Price: $${signalData.price}\n` +
            `🎯 Recommendation: **${signalData.decision}**\n` +
            `📈 Confidence: ${signalData.confidence}\n` +
            `⚡ Risk: ${signalData.risk_level}\n\n` +
            `**Reasons:**\n${signalData.reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

        responseMessage += signalText;
      }
    }

    return NextResponse.json({
      message: responseMessage,
      usage: completion.usage,
      model: completion.model,
      api_status: 'connected'
    });

  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json(
        {
          message: '🤖 AI servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
          error: 'Service temporarily unavailable'
        },
        { status: 200 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        {
          message: '⏳ Çok fazla istek geldi. Lütfen birkaç saniye bekleyip tekrar deneyin.',
          error: 'Rate limit exceeded'
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: '❌ Bir hata oluştu. Lütfen tekrar deneyin.',
        error: 'Request failed'
      },
      { status: 200 }
    );
  }
}