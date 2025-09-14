import { NextRequest, NextResponse } from 'next/server';
import { AlexaResponseBuilder, ALEXA_RESPONSES_TR, ALEXA_RESPONSES_EN } from '@/lib/alexa';

// Alexa Skill Handler
export async function POST(request: NextRequest) {
  try {
    const alexaRequest = await request.json();
    
    // Request validation
    if (!alexaRequest.request || !alexaRequest.session) {
      return NextResponse.json({ error: 'Invalid Alexa request' }, { status: 400 });
    }

    const { request: alexaReq, session } = alexaRequest;
    const locale = alexaReq.locale || 'tr-TR';
    const responses = locale.startsWith('tr') ? ALEXA_RESPONSES_TR : ALEXA_RESPONSES_EN;
    
    const responseBuilder = new AlexaResponseBuilder();
    
    // Intent handling
    switch (alexaReq.type) {
      case 'LaunchRequest':
        return NextResponse.json(
          responseBuilder
            .speak(responses.welcome)
            .withCard('AILYDIAN AI Lens Pro', responses.welcome)
            .reprompt(responses.helpText)
            .endSession(false)
            .build()
        );

      case 'IntentRequest':
        return handleIntent(alexaReq, responseBuilder, responses);

      case 'SessionEndedRequest':
        return NextResponse.json(
          responseBuilder
            .speak(responses.goodbye)
            .endSession(true)
            .build()
        );

      default:
        return NextResponse.json(
          responseBuilder
            .speak(responses.error)
            .endSession(true)
            .build()
        );
    }
  } catch (error) {
    console.error('Alexa handler error:', error);
    
    return NextResponse.json(
      new AlexaResponseBuilder()
        .speak('Üzgünüm, sistemde bir hata oluştu.')
        .endSession(true)
        .build()
    );
  }
}

async function handleIntent(alexaReq: any, responseBuilder: AlexaResponseBuilder, responses: any) {
  const intentName = alexaReq.intent?.name;
  
  switch (intentName) {
    case 'GetCryptoPriceIntent':
      return handleCryptoPriceIntent(alexaReq, responseBuilder, responses);
      
    case 'GetPortfolioIntent':
      return handlePortfolioIntent(responseBuilder, responses);
      
    case 'PlaceTradeOrderIntent':
      return handleTradeOrderIntent(responseBuilder, responses);
      
    case 'GetMarketAnalysisIntent':
      return handleMarketAnalysisIntent(responseBuilder, responses);
      
    case 'AMAZON.HelpIntent':
      return NextResponse.json(
        responseBuilder
          .speak(responses.helpText)
          .reprompt(responses.helpText)
          .endSession(false)
          .build()
      );
      
    case 'AMAZON.CancelIntent':
    case 'AMAZON.StopIntent':
      return NextResponse.json(
        responseBuilder
          .speak(responses.goodbye)
          .endSession(true)
          .build()
      );
      
    default:
      return NextResponse.json(
        responseBuilder
          .speak(responses.error)
          .reprompt(responses.helpText)
          .endSession(false)
          .build()
      );
  }
}

async function handleCryptoPriceIntent(alexaReq: any, responseBuilder: AlexaResponseBuilder, responses: any) {
  try {
    const coinSlot = alexaReq.intent?.slots?.coin?.value;
    const coin = coinSlot || 'bitcoin';
    
    // API'den canlı fiyat al
    const response = await fetch('http://localhost:3003/api/crypto/coinmarketcap?limit=100');
    const data = await response.json();
    
    if (data.success && data.data) {
      const foundCoin = data.data.find((c: any) => 
        c.name.toLowerCase().includes(coin.toLowerCase()) || 
        c.symbol.toLowerCase() === coin.toLowerCase()
      );
      
      if (foundCoin) {
        const speechText = responses.priceFormat(foundCoin.name, foundCoin.price);
        const cardText = `${foundCoin.name} (${foundCoin.symbol})\nFiyat: $${foundCoin.price.toFixed(2)}\n24s Değişim: ${foundCoin.price_change_24h.toFixed(2)}%`;
        
        return NextResponse.json(
          responseBuilder
            .speak(speechText)
            .withCard(`${foundCoin.name} Fiyatı`, cardText)
            .endSession(false)
            .build()
        );
      }
    }
    
    // Coin bulunamadı
    return NextResponse.json(
      responseBuilder
        .speak(`Üzgünüm, ${coin} için fiyat bilgisini bulamadım.`)
        .endSession(false)
        .build()
    );
    
  } catch (error) {
    return NextResponse.json(
      responseBuilder
        .speak('Fiyat bilgisi alırken bir hata oluştu.')
        .endSession(false)
        .build()
    );
  }
}

async function handlePortfolioIntent(responseBuilder: AlexaResponseBuilder, responses: any) {
  // Güvenlik nedeniyle portföy bilgisi sesli olarak verilmiyor
  return NextResponse.json(
    responseBuilder
      .speak('Güvenlik nedeniyle portföy bilgilerinizi sesli olarak paylaşamıyorum. Lütfen web panelinden kontrol edin.')
      .withCard('Güvenlik Bildirimi', 'Portföy bilgileri sadece web panelinden görüntülenebilir.')
      .endSession(false)
      .build()
  );
}

async function handleTradeOrderIntent(responseBuilder: AlexaResponseBuilder, responses: any) {
  return NextResponse.json(
    responseBuilder
      .speak(responses.tradingNotAvailable)
      .withCard('Trading Bildirimi', 'Sesli trading henüz aktif değil. Web panelini kullanın.')
      .endSession(false)
      .build()
  );
}

async function handleMarketAnalysisIntent(responseBuilder: AlexaResponseBuilder, responses: any) {
  try {
    // Basit piyasa analizi
    const response = await fetch('http://localhost:3003/api/crypto/coinmarketcap?limit=5');
    const data = await response.json();
    
    if (data.success && data.data) {
      const topCoins = data.data.slice(0, 3);
      const analysis = topCoins.map((coin: any) => 
        `${coin.name} ${coin.price_change_24h > 0 ? 'yükselişte' : 'düşüşte'}, yüzde ${Math.abs(coin.price_change_24h).toFixed(1)}`
      ).join(', ');
      
      const speechText = `Piyasa analizi: ${analysis}. Detaylı analiz için web panelini ziyaret edin.`;
      
      return NextResponse.json(
        responseBuilder
          .speak(speechText)
          .withCard('Piyasa Analizi', speechText)
          .endSession(false)
          .build()
      );
    }
    
  } catch (error) {
    // Fallback analiz
  }
  
  return NextResponse.json(
    responseBuilder
      .speak('Piyasa değişken. Detaylı analiz için AILYDIAN web panelini kullanın.')
      .endSession(false)
      .build()
  );
}
