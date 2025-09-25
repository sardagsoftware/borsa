import { NextRequest, NextResponse } from 'next/server';
import GlobalAITradingBot from '@/lib/ai/GlobalAITradingBot';
import CompactAIPipeline from '@/lib/ai/CompactAIPipeline';
import SentimentAnalysisEngine from '@/lib/ai/SentimentAnalysisEngine';

// Global instances
let tradingBot: GlobalAITradingBot;
let aiPipeline: CompactAIPipeline;
let sentimentEngine: SentimentAnalysisEngine;
let initialized = false;

async function initializeBot() {
  if (!initialized) {
    tradingBot = new GlobalAITradingBot();
    aiPipeline = new CompactAIPipeline();
    sentimentEngine = new SentimentAnalysisEngine();
    
    // Start sentiment monitoring
    await sentimentEngine.startMonitoring();
    
    initialized = true;
    console.log('🤖 AI Trading Bot initialized');
  }
}

export async function GET(request: NextRequest) {
  try {
    await initializeBot();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: tradingBot.getBotStatus()
        });
        
      case 'signals':
        const signals = tradingBot.getActiveSignals();
        return NextResponse.json({
          success: true,
          data: signals
        });
        
      case 'portfolio':
        const portfolio = tradingBot.getPortfolio();
        return NextResponse.json({
          success: true,
          data: portfolio
        });
        
      case 'sentiment':
        const sentiments = sentimentEngine.getAllSentiments();
        const sentimentArray = Array.from(sentiments.values());
        return NextResponse.json({
          success: true,
          data: sentimentArray
        });
        
      case 'performance':
        const performance = tradingBot.getModelPerformance();
        const performanceArray = Array.from(performance.entries()).map(([model, perf]) => ({
          model,
          ...perf
        }));
        return NextResponse.json({
          success: true,
          data: performanceArray
        });
        
      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'AI Trading Bot API is running',
            availableActions: ['status', 'signals', 'portfolio', 'sentiment', 'performance']
          }
        });
    }
  } catch (error) {
    console.error('❌ AI Trading Bot API error:', error);
    return NextResponse.json(
      { success: false, error: 'AI Trading Bot API failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeBot();
    
    const body = await request.json();
    const { action, data } = body;
    
    switch (action) {
      case 'start':
        await tradingBot.start();
        return NextResponse.json({
          success: true,
          message: 'AI Trading Bot started'
        });
        
      case 'stop':
        await tradingBot.stop();
        return NextResponse.json({
          success: true,
          message: 'AI Trading Bot stopped'
        });
        
      case 'pause':
        tradingBot.pause();
        return NextResponse.json({
          success: true,
          message: 'AI Trading Bot paused/resumed'
        });
        
      case 'emergency_stop':
        tradingBot.emergencyStopActivate();
        return NextResponse.json({
          success: true,
          message: 'Emergency stop activated'
        });
        
      case 'configure_exchange':
        if (data && data.exchangeId && data.credentials && data.settings) {
          await tradingBot.configureExchange(data.exchangeId, data.credentials, data.settings);
          return NextResponse.json({
            success: true,
            message: `Exchange ${data.exchangeId} configured`
          });
        }
        throw new Error('Invalid exchange configuration data');
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ AI Trading Bot POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}