import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { coinMarketCapService } from '@/lib/services/coinmarketcap';
import { PrismaClient } from '@prisma/client';

// Make this route dynamic
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'top100';
    const symbols = searchParams.get('symbols');
    const query = searchParams.get('query');

    let data;

    switch (action) {
      case 'top100':
        data = await coinMarketCapService.getTop100();
        break;

      case 'symbols':
        if (!symbols) {
          return NextResponse.json(
            { error: 'Symbols parameter required' },
            { status: 400 }
          );
        }
        data = await coinMarketCapService.getCryptoData(symbols.split(','));
        break;

      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Query parameter required' },
            { status: 400 }
          );
        }
        data = await coinMarketCapService.searchCrypto(query);
        break;

      case 'trending':
        data = await coinMarketCapService.getTrending();
        break;

      case 'losers':
        data = await coinMarketCapService.getBiggestLosers();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

    // Update MarketData cache in background
    if (action === 'top100' && data) {
      updateMarketDataCache(data).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: Date.now(),
      cached: false,
    });

  } catch (error) {
    console.error('CoinMarketCap API error:', error);
    
    // Try to return cached data from database
    try {
      const cachedData = await prisma.marketData.findMany({
        where: {
          rank: { lte: 100 }
        },
        orderBy: {
          rank: 'asc'
        },
        take: 100
      });

      if (cachedData.length > 0) {
        return NextResponse.json({
          success: true,
          data: cachedData,
          timestamp: Date.now(),
          cached: true,
          cacheAge: Date.now() - cachedData[0].updatedAt.getTime(),
        });
      }
    } catch (dbError) {
      console.error('Database cache error:', dbError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch cryptocurrency data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Background function to update market data cache
async function updateMarketDataCache(cryptoData: any[]) {
  try {
    for (const crypto of cryptoData) {
      await prisma.marketData.upsert({
        where: { symbol: crypto.symbol },
        update: {
          name: crypto.name,
          price: crypto.price,
          change24h: crypto.percent_change_24h,
          volume24h: crypto.volume_24h,
          marketCap: crypto.market_cap,
          rank: crypto.cmc_rank,
          updatedAt: new Date(),
        },
        create: {
          symbol: crypto.symbol,
          name: crypto.name,
          price: crypto.price,
          change24h: crypto.percent_change_24h,
          volume24h: crypto.volume_24h,
          marketCap: crypto.market_cap,
          rank: crypto.cmc_rank,
        }
      });
    }
    console.log(`Updated ${cryptoData.length} market data entries`);
  } catch (error) {
    console.error('Failed to update market data cache:', error);
  }
}
