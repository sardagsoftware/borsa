import { NextRequest, NextResponse } from 'next/server'
import { createGeminiAudioProcessing, geminiModels } from '@/lib/gemini-client'

interface GeminiAudioRequest {
  prompt: string
  model?: string
  audio: string // Base64 encoded audio
  mimeType?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GeminiAudioRequest = await request.json()

    if (!body.prompt?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 })
    }

    if (!body.audio) {
      return NextResponse.json({
        success: false,
        error: 'Audio data is required'
      }, { status: 400 })
    }

    const model = body.model || 'gemini-1.5-flash'

    // Find model info
    const modelInfo = geminiModels.find(m => m.modelId === model || m.id === model)
    if (!modelInfo) {
      return NextResponse.json({
        success: false,
        error: 'Model not found'
      }, { status: 400 })
    }

    // Check if model supports audio processing
    if (!modelInfo.capabilities.includes('audio') && !modelInfo.capabilities.includes('multimodal')) {
      return NextResponse.json({
        success: false,
        error: 'Selected model does not support audio processing'
      }, { status: 400 })
    }

    const startTime = Date.now()
    const result = await createGeminiAudioProcessing({
      model: modelInfo.modelId,
      prompt: body.prompt,
      audio: body.audio
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    return NextResponse.json({
      success: true,
      data: {
        id: `gemini_audio_${Date.now()}`,
        text: result.text,
        model: modelInfo.id,
        modelInfo: {
          name: modelInfo.name,
          provider: modelInfo.provider,
          icon: modelInfo.icon,
          capabilities: modelInfo.capabilities
        },
        usage: {
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
          totalTokens: result.usage?.totalTokens || 0
        },
        performance: {
          responseTime,
          tokensPerSecond: result.usage?.completionTokens
            ? Math.round((result.usage.completionTokens / responseTime) * 1000)
            : 0
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Gemini Audio API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Audio processing failed',
      message: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}