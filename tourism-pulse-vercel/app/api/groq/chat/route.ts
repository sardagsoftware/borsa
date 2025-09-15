import { NextRequest, NextResponse } from 'next/server'
import { createGroqChatCompletion, groqModels } from '@/lib/groq-client'

interface ChatRequest {
  message: string
  model?: string
  conversation?: { role: 'user' | 'assistant'; content: string }[]
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()

    if (!body.message?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 })
    }

    const model = body.model || 'llama-3.3-70b-versatile'
    const temperature = body.temperature || 0.7
    const maxTokens = body.maxTokens || 1024

    // Find model info
    const modelInfo = groqModels.find(m => m.id === model)
    if (!modelInfo) {
      return NextResponse.json({
        success: false,
        error: 'Model not found'
      }, { status: 400 })
    }

    // Build conversation history
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []

    // Add system prompt if provided
    if (body.systemPrompt) {
      messages.push({
        role: 'system',
        content: body.systemPrompt
      })
    } else {
      // Default system prompt for tourism/AI assistant
      messages.push({
        role: 'system',
        content: `Sen akıllı bir AI asistanısın. Türkçe ve İngilizce dillerinde yardımcı olabilirsin. Seyahat, teknoloji, genel bilgi ve her türlü konuda uzman bir asistan olarak davran. Yararlı, doğru ve detaylı bilgiler ver. Kullanıcı ile dostça ve profesyonel bir dil kullan.`
      })
    }

    // Add conversation history
    if (body.conversation && Array.isArray(body.conversation)) {
      messages.push(...body.conversation.slice(-10)) // Keep last 10 messages
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: body.message
    })

    // Create chat completion
    const startTime = Date.now()
    const completion = await createGroqChatCompletion({
      model,
      messages,
      temperature,
      maxTokens
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (!('choices' in completion) || !completion.choices || completion.choices.length === 0) {
      throw new Error('No response generated')
    }

    const response = completion.choices[0].message?.content || ''

    return NextResponse.json({
      success: true,
      data: {
        id: completion.id || `groq_${Date.now()}`,
        response,
        model: model,
        modelInfo: {
          name: modelInfo.name,
          provider: modelInfo.provider,
          icon: modelInfo.icon,
          speed: modelInfo.speed
        },
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        },
        performance: {
          responseTime,
          tokensPerSecond: completion.usage?.completion_tokens
            ? Math.round((completion.usage.completion_tokens / responseTime) * 1000)
            : 0
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Groq Chat API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Chat completion failed',
      message: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}