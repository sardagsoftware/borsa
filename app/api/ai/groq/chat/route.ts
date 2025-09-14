import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGroqService } from '@/lib/ai/groq-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json({ 
        error: 'Message is required' 
      }, { status: 400 });
    }

    const groqService = getGroqService();
    const response = await groqService.chatWithAssistant(message, context);

    // Log chat interaction for monitoring
    console.log(`AiLydian Chat for ${session.user.email}:`, {
      messageLength: message.length,
      responseLength: response.length,
      hasContext: !!context
    });

    return NextResponse.json({
      success: true,
      response,
      suggestions: [],
      context: context || {},
      timestamp: new Date().toISOString(),
      model: 'groq-llama-3.1-70b'
    });

  } catch (error) {
    console.error('Groq Chat Assistant Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');
    const sources = searchParams.get('sources')?.split(',') || ['news', 'social'];

    if (!text) {
      return NextResponse.json({ 
        error: 'Text parameter is required for sentiment analysis' 
      }, { status: 400 });
    }

    const groqService = getGroqService();
    const sentiment = await groqService.analyzeNewsSentiment([text]);

    return NextResponse.json({
      success: true,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      sentiment,
      sources,
      timestamp: new Date().toISOString(),
      model: 'groq-llama-3.1-8b-instant'
    });

  } catch (error) {
    console.error('Groq Sentiment Analysis Error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze sentiment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
