import { NextRequest, NextResponse } from 'next/server'

interface SearchRequest {
  query: string
  model?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

interface SearchResponse {
  id: string
  response: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  timestamp: string
}

// Mock AI responses for different models
const generateMockResponse = (query: string, model: string): SearchResponse => {
  const responses = {
    'gpt-4-turbo': `GPT-4 Turbo yanıtı: ${query} hakkında kapsamlı analiz yapıyorum. Bu sorgunuz çok ilginç ve detaylı bir araştırma gerektiriyor.`,
    'claude-3-5-sonnet': `Claude 3.5 Sonnet yanıtı: ${query} konusunda size yardımcı olmaktan memnuniyet duyarım. Bu konuyu farklı açılardan değerlendirebiliriz.`,
    'gemini-2-0-flash': `Gemini 2.0 Flash yanıtı: ${query} hakkında hızlı ve doğru bilgi sağlayabilirim. Multimodal yeteneklerimle daha zengin içerik üretebilirim.`,
    'mistral-large-2': `Mistral Large 2 yanıtı: ${query} sorunuza çok dilli ve gelişmiş mantık yürütme ile yaklaşıyorum.`
  }

  const response = responses[model as keyof typeof responses] || `${model} modeli ile ${query} sorunuza yanıt veriyorum.`

  return {
    id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    response,
    model,
    usage: {
      promptTokens: Math.floor(Math.random() * 100) + 50,
      completionTokens: Math.floor(Math.random() * 200) + 100,
      totalTokens: 0
    },
    timestamp: new Date().toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json()

    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 })
    }

    const model = body.model || 'gpt-4-turbo'

    // Generate mock response (in production, this would call actual AI APIs)
    const searchResponse = generateMockResponse(body.query, model)
    searchResponse.usage.totalTokens = searchResponse.usage.promptTokens + searchResponse.usage.completionTokens

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

    return NextResponse.json({
      success: true,
      data: searchResponse
    })
  } catch (error) {
    console.error('Search API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Search request failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({
      success: false,
      error: 'Query parameter "q" is required'
    }, { status: 400 })
  }

  const model = searchParams.get('model') || 'gpt-4-turbo'
  const searchResponse = generateMockResponse(query, model)
  searchResponse.usage.totalTokens = searchResponse.usage.promptTokens + searchResponse.usage.completionTokens

  return NextResponse.json({
    success: true,
    data: searchResponse
  })
}