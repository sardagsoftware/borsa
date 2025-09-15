import { NextRequest, NextResponse } from 'next/server'
import { createHuggingFaceCompletion, huggingfaceModels } from '@/lib/huggingface-client'

interface HuggingFaceChatRequest {
  message: string
  model?: string
  conversation?: { role: 'user' | 'assistant'; content: string }[]
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: HuggingFaceChatRequest = await request.json()

    if (!body.message?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 })
    }

    const model = body.model || 'facebook/MobileLLM-R1-950M'
    const temperature = body.temperature || 0.7
    const maxTokens = body.maxTokens || 1024

    // Find model info
    const modelInfo = huggingfaceModels.find(m => m.modelId === model || m.id === model)
    if (!modelInfo) {
      return NextResponse.json({
        success: false,
        error: 'Model not found'
      }, { status: 400 })
    }

    // Build conversation history
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []

    // Add system prompt
    if (body.systemPrompt) {
      messages.push({
        role: 'system',
        content: body.systemPrompt
      })
    } else {
      messages.push({
        role: 'system',
        content: `Sen akıllı bir AI asistanısın. ${modelInfo.name} modelini kullanarak kullanıcılara yardımcı oluyorsun. Türkçe ve İngilizce dillerinde akıcı şekilde iletişim kurabilirsin. Yararlı, doğru ve detaylı yanıtlar ver.`
      })
    }

    // Add conversation history (limit to last 10 messages)
    if (body.conversation && Array.isArray(body.conversation)) {
      messages.push(...body.conversation.slice(-10))
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: body.message
    })

    // Create chat completion
    const startTime = Date.now()
    const completion = await createHuggingFaceCompletion({
      model: modelInfo.modelId,
      messages,
      temperature,
      maxTokens
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No response generated')
    }

    const response = completion.choices[0].message?.content || ''

    return NextResponse.json({
      success: true,
      data: {
        id: completion.id || `hf_${Date.now()}`,
        response,
        model: modelInfo.id,
        modelInfo: {
          name: modelInfo.name,
          provider: modelInfo.provider,
          icon: modelInfo.icon,
          speed: modelInfo.speed,
          parameters: modelInfo.parameters
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
    console.error('HuggingFace Chat API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Chat completion failed',
      message: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}