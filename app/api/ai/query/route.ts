/**
 * AI Query API - Z.AI GLM-4.5 Integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { ratelimit } from '@/lib/ratelimit';
import { withCors } from '@/lib/cors';
// import ZAIService from '@/lib/services/zai-service';

let zaiService: ZAIService;

if (!zaiService) {
  zaiService = new ZAIService();
}

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

    // Z.AI ile query'yi işle
    const response = await zaiService.queryAI(query, context);

    // Response'dan action'ları parse et
    const actions = extractActions(response);

    return NextResponse.json({
      response,
      actions,
      confidence: calculateConfidence(response),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Query error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI query: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

function extractActions(response: string) {
  const actions = [];
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

  // "izle" veya "monitor" içeren yanıtlardan MONITOR action'ı çıkar
  if (lowerResponse.includes('izle') || lowerResponse.includes('monitor') || lowerResponse.includes('takip')) {
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

function extractSymbols(text: string): string[] {
  const cryptoSymbols = ['BTC', 'ETH', 'ADA', 'SOL', 'MATIC', 'DOT', 'AVAX', 'LINK', 'UNI', 'ATOM'];
  const found = [];
  
  const upperText = text.toUpperCase();
  
  for (const symbol of cryptoSymbols) {
    if (upperText.includes(symbol) || upperText.includes(symbol.toLowerCase())) {
      found.push(symbol);
    }
  }

  // Bitcoin, Ethereum gibi tam isimleri de kontrol et
  const nameMap: Record<string, string> = {
    'bitcoin': 'BTC',
    'ethereum': 'ETH',
    'cardano': 'ADA',
    'solana': 'SOL',
    'polygon': 'MATIC',
    'polkadot': 'DOT'
  };

  const lowerText = text.toLowerCase();
  for (const [name, symbol] of Object.entries(nameMap)) {
    if (lowerText.includes(name) && !found.includes(symbol)) {
      found.push(symbol);
    }
  }

  return found;
}

function calculateConfidence(response: string): number {
  // Simple confidence calculation based on response content
  let confidence = 50; // Base confidence
  
  const positiveWords = ['güçlü', 'iyi', 'yüksek', 'pozitif', 'fırsat', 'önerim'];
  const negativeWords = ['zayıf', 'düşük', 'risk', 'dikkat', 'belirsiz'];
  
  const lowerResponse = response.toLowerCase();
  
  positiveWords.forEach(word => {
    if (lowerResponse.includes(word)) confidence += 10;
  });
  
  negativeWords.forEach(word => {
    if (lowerResponse.includes(word)) confidence -= 10;
  });
  
  // Specific analysis indicators
  if (lowerResponse.includes('analiz') || lowerResponse.includes('veriler')) confidence += 15;
  if (lowerResponse.includes('öneriyorum') || lowerResponse.includes('tavsiye')) confidence += 20;
  
  return Math.max(0, Math.min(100, confidence));
}
