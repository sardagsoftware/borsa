import { NextRequest, NextResponse } from 'next/server'
import { createGroqChatCompletion, groqModels } from '@/lib/groq-client'
import { createHuggingFaceCompletion, huggingfaceModels } from '@/lib/huggingface-client'
import { createGeminiCompletion, geminiModels } from '@/lib/gemini-client'
import { createAsi1Completion, asi1Models } from '@/lib/asi1-client'

interface UnifiedAIRequest {
  message: string
  provider: 'groq' | 'openai' | 'anthropic' | 'google' | 'mistral' | 'huggingface' | 'asi1'
  model: string
  conversation?: { role: 'user' | 'assistant'; content: string }[]
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  features?: {
    webSearch?: boolean
    codeExecution?: boolean
    imageGeneration?: boolean
    audioTranscription?: boolean
  }
}

// System prompts for different use cases
const systemPrompts = {
  tourism: `Sen TourismPulse AI'nin akıllı seyahat asistanısın. Seyahat planlaması, destinasyon önerileri, otel rezervasyonları, uçak biletleri, yerel aktiviteler ve seyahat ipuçları konularında uzmansın. Kullanıcılara kişiselleştirilmiş ve güncel seyahat tavsiyeleri ver. Türkçe ve İngilizce dillerinde yardımcı ol.`,

  general: `Sen çok yetenekli bir AI asistanısın. Her türlü konuda yardımcı olabilir, sorular cevaplayabilir, problem çözebilir ve yaratıcı görevleri yerine getirebilirsin. Türkçe ve İngilizce dillerinde akıcı şekilde iletişim kur. Doğru, yararlı ve etkili yanıtlar ver.`,

  technical: `Sen teknik konularda uzman bir AI asistanısın. Programlama, yazılım geliştirme, sistem yönetimi, veri analizi ve teknoloji konularında derinlemesine bilgi ver. Kod örnekleri, açıklamalar ve en iyi uygulamaları paylaş.`,

  creative: `Sen yaratıcı bir AI asistanısın. Hikaye yazma, şiir, içerik üretimi, pazarlama metinleri, blog yazıları ve yaratıcı projeler konularında yardımcı ol. İlham verici ve özgün içerikler üret.`,

  analysis: `Sen analitik düşünme konusunda uzman bir AI asistanısın. Veri analizi, rapor hazırlama, araştırma, karşılaştırma ve objektif değerlendirmeler yapma konularında uzmansın. Detaylı ve mantıklı analizler sun.`
}

export async function POST(request: NextRequest) {
  try {
    const body: UnifiedAIRequest = await request.json()

    if (!body.message?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 })
    }

    const provider = body.provider || 'groq'
    const model = body.model || 'llama-3.3-70b-versatile'
    const temperature = body.temperature || 0.7
    const maxTokens = body.maxTokens || 2048

    // Find model info from all providers
    let modelInfo: any
    let allModels: any[] = []

    if (provider === 'groq') {
      allModels = groqModels
    } else if (provider === 'huggingface') {
      allModels = huggingfaceModels
    } else if (provider === 'google') {
      allModels = geminiModels
    } else if (provider === 'asi1') {
      allModels = asi1Models
    } else {
      return NextResponse.json({
        success: false,
        error: `Provider "${provider}" not yet implemented. Currently supports: groq, huggingface, google, asi1.`
      }, { status: 400 })
    }

    modelInfo = allModels.find(m => m.id === model || m.modelId === model)
    if (!modelInfo) {
      return NextResponse.json({
        success: false,
        error: 'Model not found'
      }, { status: 400 })
    }

    // Detect intent and select appropriate system prompt
    let systemPrompt = body.systemPrompt
    if (!systemPrompt) {
      const message = body.message.toLowerCase()
      if (message.includes('seyahat') || message.includes('travel') || message.includes('otel') || message.includes('uçak')) {
        systemPrompt = systemPrompts.tourism
      } else if (message.includes('kod') || message.includes('program') || message.includes('geliştir')) {
        systemPrompt = systemPrompts.technical
      } else if (message.includes('hikaye') || message.includes('yaratıcı') || message.includes('şiir')) {
        systemPrompt = systemPrompts.creative
      } else if (message.includes('analiz') || message.includes('rapor') || message.includes('karşılaştır')) {
        systemPrompt = systemPrompts.analysis
      } else {
        systemPrompt = systemPrompts.general
      }
    }

    // Build conversation
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []

    messages.push({
      role: 'system',
      content: systemPrompt
    })

    // Add conversation history (limit to last 20 messages)
    if (body.conversation && Array.isArray(body.conversation)) {
      messages.push(...body.conversation.slice(-20))
    }

    // Add current message
    messages.push({
      role: 'user',
      content: body.message
    })

    const startTime = Date.now()

    // Create completion based on provider
    let completion: any
    if (provider === 'groq') {
      completion = await createGroqChatCompletion({
        model: modelInfo.id,
        messages,
        temperature,
        maxTokens
      })
    } else if (provider === 'huggingface') {
      completion = await createHuggingFaceCompletion({
        model: modelInfo.modelId,
        messages,
        temperature,
        maxTokens
      })
    } else if (provider === 'google') {
      completion = await createGeminiCompletion({
        model: modelInfo.modelId,
        messages,
        temperature,
        maxTokens
      })
    } else if (provider === 'asi1') {
      completion = await createAsi1Completion({
        model: modelInfo.modelId,
        messages,
        temperature,
        maxTokens
      })
    }

    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No response generated')
    }

    const response = completion.choices[0].message?.content || ''

    return NextResponse.json({
      success: true,
      data: {
        id: completion.id || `ai_${Date.now()}`,
        response,
        provider,
        model,
        modelInfo: {
          name: modelInfo.name,
          provider: modelInfo.provider,
          icon: modelInfo.icon,
          speed: modelInfo.speed,
          category: modelInfo.category
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
        metadata: {
          intentDetected: systemPrompt === systemPrompts.tourism ? 'tourism' :
                         systemPrompt === systemPrompts.technical ? 'technical' :
                         systemPrompt === systemPrompts.creative ? 'creative' :
                         systemPrompt === systemPrompts.analysis ? 'analysis' : 'general',
          conversationLength: messages.length - 1,
          hasContext: Boolean(body.conversation && body.conversation.length > 0)
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Unified AI API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'AI completion failed',
      message: error.message || 'Unknown error occurred',
      provider: 'unknown'
    }, { status: 500 })
  }
}