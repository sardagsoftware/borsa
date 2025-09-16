/**
 * AI Query API - Z.AI GLM-4.5 Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { ratelimit } from '@/lib/ratelimit';
import { withCors } from '@/lib/cors';
import ZAIService from '@/lib/services/zai-service';

const zaiService = new ZAIService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Rate limiting
    const ip = headers().get('x-forwarded-for') || 'localhost';
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Process query with ZAI
    const response = await zaiService.queryAI(query, context || {});
    
    // Extract trading actions from response
    const actions = extractActions(response);

    return NextResponse.json({
      success: true,
      data: {
        response: response,
        actions: actions,
        metadata: {
          model: 'glm-4',
          timestamp: new Date().toISOString(),
          query_length: query.length,
          response_length: response.length
        }
      }
    });

  } catch (error) {
    console.error('AI Query error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function extractActions(response: string) {
  const actions: Array<any> = [];
  const lowerResponse = response.toLowerCase();

  // "al" veya "buy" içeren yanıtlardan BUY action'ı çıkar
  if (lowerResponse.includes('al') || lowerResponse.includes('buy')) {
    const symbols = extractSymbols(response);
    symbols.forEach(symbol => {
      actions.push({
        type: 'BUY',
        symbol,
        parameters: { source: 'ai_recommendation' },
        executed: false
      });
    });
  }

  // "sat" veya "sell" içeren yanıtlardan SELL action'ı çıkar
  if (lowerResponse.includes('sat') || lowerResponse.includes('sell')) {
    const symbols = extractSymbols(response);
    symbols.forEach(symbol => {
      actions.push({
        type: 'SELL',
        symbol,
        parameters: { source: 'ai_recommendation' },
        executed: false
      });
    });
  }

  // "takip" veya "monitor" içeren yanıtlardan MONITOR action'ı çıkar
  if (lowerResponse.includes('takip') || lowerResponse.includes('monitor')) {
    const symbols = extractSymbols(response);
    symbols.forEach(symbol => {
      actions.push({
        type: 'MONITOR',
        symbol,
        parameters: { source: 'ai_recommendation' },
        executed: false
      });
    });
  }

  return actions;
}

function extractSymbols(text: string) {
  const cryptoSymbols = ['BTC', 'ETH', 'ADA', 'SOL', 'MATIC', 'DOT', 'AVAX', 'LINK', 'UNI', 'ATOM'];
  const found: string[] = [];
  
  const upperText = text.toUpperCase();
  
  for (const symbol of cryptoSymbols) {
    if (upperText.includes(symbol) || upperText.includes(symbol.toLowerCase())) {
      found.push(symbol);
    }
  }

  // Coin isimlerini de kontrol et
  const coinNames = {
    'BITCOIN': 'BTC',
    'ETHEREUM': 'ETH',
    'CARDANO': 'ADA',
    'SOLANA': 'SOL',
    'POLYGON': 'MATIC',
    'POLKADOT': 'DOT',
    'AVALANCHE': 'AVAX',
    'CHAINLINK': 'LINK',
    'UNISWAP': 'UNI',
    'COSMOS': 'ATOM'
  };

  for (const [name, symbol] of Object.entries(coinNames)) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes(name.toLowerCase()) && !found.includes(symbol)) {
      found.push(symbol);
    }
  }

  return found;
}

export const GET = withCors(async () => {
  return NextResponse.json({
    service: 'AI Query API',
    status: 'healthy',
    version: '1.0.0'
  });
});
