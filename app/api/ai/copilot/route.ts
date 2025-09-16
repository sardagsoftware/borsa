/**
 * AILYDIAN GLOBAL TRADER - AI Trading Copilot API
 * Natural language trading commands with OpenAI function calling
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TradingContext {
  userId: string;
  activePortfolio: {
    balance: number;
    positions: Array<{
      symbol: string;
      quantity: number;
      avgPrice: number;
      marketValue: number;
      pnl: number;
      pnlPercent: number;
    }>;
    totalValue: number;
    availableFunds: number;
  };
  riskSettings: {
    maxDailyLoss: number;
    maxPositionSize: number;
    maxLeverage: number;
    stopLossPercent: number;
    takeProfitPercent: number;
  };
  marketData: {
    [symbol: string]: {
      price: number;
      change: number;
      changePercent: number;
      volume: number;
    };
  };
}

// Trading Functions that the AI can call
const tradingFunctions = [
  {
    name: 'get_market_data',
    description: 'Get current market data for one or more symbols',
    parameters: {
      type: 'object',
      properties: {
        symbols: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of trading symbols (e.g., ["AAPL", "BTC/USD", "EUR/USD"])'
        }
      },
      required: ['symbols']
    }
  },
  {
    name: 'analyze_symbol',
    description: 'Perform technical and fundamental analysis on a trading symbol',
    parameters: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading symbol to analyze (e.g., "AAPL", "BTC/USD")'
        },
        timeframe: {
          type: 'string',
          enum: ['1m', '5m', '15m', '1h', '4h', '1d', '1w'],
          description: 'Analysis timeframe'
        }
      },
      required: ['symbol']
    }
  },
  {
    name: 'place_order',
    description: 'Place a trading order (requires confirmation for real trades)',
    parameters: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading symbol'
        },
        side: {
          type: 'string',
          enum: ['buy', 'sell'],
          description: 'Order side'
        },
        type: {
          type: 'string',
          enum: ['market', 'limit', 'stop', 'stop_limit'],
          description: 'Order type'
        },
        quantity: {
          type: 'number',
          description: 'Order quantity'
        },
        price: {
          type: 'number',
          description: 'Order price (for limit orders)'
        },
        stopPrice: {
          type: 'number',
          description: 'Stop price (for stop orders)'
        },
        reduceOnly: {
          type: 'boolean',
          description: 'Reduce only flag for futures'
        }
      },
      required: ['symbol', 'side', 'type', 'quantity']
    }
  },
  {
    name: 'get_portfolio_status',
    description: 'Get current portfolio status including positions and P&L',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'calculate_position_size',
    description: 'Calculate optimal position size based on risk management',
    parameters: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading symbol'
        },
        riskPercent: {
          type: 'number',
          description: 'Risk percentage of portfolio (1-5)'
        },
        stopLossPercent: {
          type: 'number',
          description: 'Stop loss percentage'
        }
      },
      required: ['symbol', 'riskPercent']
    }
  },
  {
    name: 'set_risk_parameters',
    description: 'Update risk management parameters',
    parameters: {
      type: 'object',
      properties: {
        maxDailyLoss: {
          type: 'number',
          description: 'Maximum daily loss in dollars'
        },
        maxPositionSize: {
          type: 'number',
          description: 'Maximum position size in dollars'
        },
        stopLossPercent: {
          type: 'number',
          description: 'Default stop loss percentage'
        }
      },
      required: []
    }
  },
  {
    name: 'get_sentiment_analysis',
    description: 'Get sentiment analysis for a symbol from social media and news',
    parameters: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading symbol for sentiment analysis'
        }
      },
      required: ['symbol']
    }
  }
];

// Function implementations
async function executeFunction(name: string, args: any, context: TradingContext): Promise<any> {
  switch (name) {
    case 'get_market_data':
      return await getMarketData(args.symbols);
      
    case 'analyze_symbol':
      return await analyzeSymbol(args.symbol, args.timeframe);
      
    case 'place_order':
      return await placeOrder(args, context);
      
    case 'get_portfolio_status':
      return getPortfolioStatus(context);
      
    case 'calculate_position_size':
      return calculatePositionSize(args, context);
      
    case 'set_risk_parameters':
      return setRiskParameters(args, context);
      
    case 'get_sentiment_analysis':
      return await getSentimentAnalysis(args.symbol);
      
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

async function getMarketData(symbols: string[]) {
  try {
    const marketData = {};
    
    // Mock implementation - in production, fetch from your market data API
    for (const symbol of symbols) {
      const basePrice = 100 + Math.random() * 1000;
      const change = (Math.random() - 0.5) * 20;
      
      marketData[symbol] = {
        price: basePrice,
        change: change,
        changePercent: (change / basePrice) * 100,
        volume: Math.floor(Math.random() * 10000000),
        bid: basePrice - 0.01,
        ask: basePrice + 0.01,
        high24h: basePrice + Math.random() * 50,
        low24h: basePrice - Math.random() * 50,
        timestamp: Date.now()
      };
    }
    
    return {
      success: true,
      data: marketData,
      message: `Retrieved market data for ${symbols.length} symbols`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve market data'
    };
  }
}

async function analyzeSymbol(symbol: string, timeframe: string = '1h') {
  // Mock technical analysis - in production, use your analysis engine
  const analysis = {
    symbol,
    timeframe,
    technicalIndicators: {
      rsi: 45 + Math.random() * 40, // RSI between 45-85
      macd: {
        macd: (Math.random() - 0.5) * 2,
        signal: (Math.random() - 0.5) * 2,
        histogram: (Math.random() - 0.5) * 1
      },
      sma: {
        sma20: 100 + Math.random() * 50,
        sma50: 95 + Math.random() * 60,
        sma200: 90 + Math.random() * 70
      },
      bollingerBands: {
        upper: 110 + Math.random() * 20,
        middle: 100 + Math.random() * 10,
        lower: 90 + Math.random() * 10
      }
    },
    signals: {
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      strength: Math.random(),
      recommendation: ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'][Math.floor(Math.random() * 5)]
    },
    fundamentals: {
      marketCap: Math.floor(Math.random() * 1000000000000),
      pe: 15 + Math.random() * 20,
      volume: Math.floor(Math.random() * 100000000)
    }
  };

  return {
    success: true,
    data: analysis,
    message: `Technical analysis completed for ${symbol} on ${timeframe} timeframe`
  };
}

async function placeOrder(orderParams: any, context: TradingContext) {
  const { symbol, side, type, quantity, price, stopPrice } = orderParams;
  
  // Risk checks
  const positionValue = quantity * (price || context.marketData[symbol]?.price || 100);
  
  if (positionValue > context.riskSettings.maxPositionSize) {
    return {
      success: false,
      error: 'Position size exceeds maximum allowed',
      message: `Position size $${positionValue.toFixed(2)} exceeds limit of $${context.riskSettings.maxPositionSize}`
    };
  }
  
  if (positionValue > context.activePortfolio.availableFunds) {
    return {
      success: false,
      error: 'Insufficient funds',
      message: `Insufficient funds. Required: $${positionValue.toFixed(2)}, Available: $${context.activePortfolio.availableFunds.toFixed(2)}`
    };
  }
  
  // Mock order execution - in production, route to exchange API
  const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    success: true,
    data: {
      orderId,
      symbol,
      side,
      type,
      quantity,
      price: price || context.marketData[symbol]?.price,
      status: 'pending',
      timestamp: Date.now()
    },
    message: `${side.toUpperCase()} order placed for ${quantity} ${symbol}`,
    requiresConfirmation: true // In production, require user confirmation for real trades
  };
}

function getPortfolioStatus(context: TradingContext) {
  return {
    success: true,
    data: context.activePortfolio,
    message: 'Portfolio status retrieved successfully'
  };
}

function calculatePositionSize(params: any, context: TradingContext) {
  const { symbol, riskPercent, stopLossPercent } = params;
  const { totalValue } = context.activePortfolio;
  const currentPrice = context.marketData[symbol]?.price || 100;
  
  const riskAmount = (totalValue * riskPercent) / 100;
  const stopLossPrice = currentPrice * (1 - (stopLossPercent || context.riskSettings.stopLossPercent) / 100);
  const riskPerShare = currentPrice - stopLossPrice;
  const positionSize = riskAmount / riskPerShare;
  const positionValue = positionSize * currentPrice;
  
  return {
    success: true,
    data: {
      symbol,
      recommendedQuantity: Math.floor(positionSize),
      positionValue,
      riskAmount,
      riskPercent,
      stopLossPrice,
      currentPrice,
      maxLoss: riskAmount
    },
    message: `Position size calculated for ${symbol}: ${Math.floor(positionSize)} shares`
  };
}

function setRiskParameters(params: any, context: TradingContext) {
  Object.keys(params).forEach(key => {
    if (context.riskSettings[key] !== undefined) {
      context.riskSettings[key] = params[key];
    }
  });
  
  return {
    success: true,
    data: context.riskSettings,
    message: 'Risk parameters updated successfully'
  };
}

async function getSentimentAnalysis(symbol: string) {
  // Mock sentiment analysis - in production, use your sentiment API
  const sentiment = {
    symbol,
    overall_sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
    confidence: Math.random(),
    sentiment_score: (Math.random() - 0.5) * 2, // -1 to 1
    sources: {
      twitter: {
        sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
        mentions: Math.floor(Math.random() * 10000),
        engagement: Math.random()
      },
      reddit: {
        sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
        mentions: Math.floor(Math.random() * 1000),
        upvote_ratio: Math.random()
      },
      news: {
        sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
        articles: Math.floor(Math.random() * 100),
        avg_sentiment: (Math.random() - 0.5) * 2
      }
    },
    timestamp: Date.now()
  };

  return {
    success: true,
    data: sentiment,
    message: `Sentiment analysis completed for ${symbol}`
  };
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, sessionId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // Mock trading context - in production, fetch from database
    const tradingContext: TradingContext = {
      userId,
      activePortfolio: {
        balance: 50000,
        positions: [
          {
            symbol: 'AAPL',
            quantity: 10,
            avgPrice: 150,
            marketValue: 1520,
            pnl: 20,
            pnlPercent: 1.33
          },
          {
            symbol: 'BTC/USD',
            quantity: 0.5,
            avgPrice: 45000,
            marketValue: 23000,
            pnl: 1000,
            pnlPercent: 4.55
          }
        ],
        totalValue: 74520,
        availableFunds: 25480
      },
      riskSettings: {
        maxDailyLoss: 2500,
        maxPositionSize: 10000,
        maxLeverage: 5,
        stopLossPercent: 2,
        takeProfitPercent: 6
      },
      marketData: {
        'AAPL': { price: 152, change: 2, changePercent: 1.33, volume: 54230000 },
        'BTC/USD': { price: 46000, change: 1000, changePercent: 2.22, volume: 28450000000 }
      }
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are AILYDIAN, an advanced AI trading copilot for global financial markets. You have access to real-time market data, portfolio information, and trading functions.

Your capabilities include:
- Real-time market data analysis for stocks, crypto, forex, commodities
- Technical and fundamental analysis
- Risk management and position sizing
- Portfolio management and P&L tracking
- Sentiment analysis from social media and news
- Order execution with risk controls

Always prioritize risk management and provide clear explanations for your recommendations. Ask for confirmation before placing real trades. Be conversational but professional.

Current user portfolio value: $${tradingContext.activePortfolio.totalValue.toLocaleString()}
Available funds: $${tradingContext.activePortfolio.availableFunds.toLocaleString()}
Max daily loss limit: $${tradingContext.riskSettings.maxDailyLoss.toLocaleString()}

Respond in a helpful, knowledgeable manner while being mindful of trading risks.`
        },
        {
          role: "user",
          content: message
        }
      ],
      functions: tradingFunctions,
      function_call: "auto",
      temperature: 0.7,
      max_tokens: 1500
    });

    const response = completion.choices[0].message;

    // Handle function calls
    if (response.function_call) {
      const functionName = response.function_call.name;
      const functionArgs = JSON.parse(response.function_call.arguments || '{}');
      
      try {
        const functionResult = await executeFunction(functionName, functionArgs, tradingContext);
        
        // Get AI response to function result
        const followUpCompletion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are AILYDIAN AI trading copilot. Interpret the function result and provide a helpful response to the user."
            },
            {
              role: "user",
              content: message
            },
            {
              role: "assistant",
              content: null,
              function_call: response.function_call
            },
            {
              role: "function",
              name: functionName,
              content: JSON.stringify(functionResult)
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        return NextResponse.json({
          success: true,
          message: followUpCompletion.choices[0].message.content,
          functionCalled: functionName,
          functionResult,
          sessionId,
          timestamp: Date.now()
        });

      } catch (functionError) {
        return NextResponse.json({
          success: false,
          message: `I encountered an error while executing the ${functionName} function: ${functionError.message}`,
          sessionId,
          timestamp: Date.now()
        });
      }
    }

    // Regular chat response
    return NextResponse.json({
      success: true,
      message: response.content,
      sessionId,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('AI Copilot error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process AI copilot request',
        message: 'I apologize, but I encountered an error processing your request. Please try again.'
      },
      { status: 500 }
    );
  }
}
