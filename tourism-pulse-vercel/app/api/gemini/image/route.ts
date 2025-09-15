import { NextRequest, NextResponse } from 'next/server'
import { createGeminiImageGeneration, geminiModels } from '@/lib/gemini-client'

interface GeminiImageRequest {
  prompt: string
  model?: string
  image?: string // Base64 encoded image for vision tasks
}

export async function POST(request: NextRequest) {
  try {
    const body: GeminiImageRequest = await request.json()

    if (!body.prompt?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
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

    // Check if model supports vision
    if (!modelInfo.capabilities.includes('vision') && !modelInfo.capabilities.includes('multimodal')) {
      return NextResponse.json({
        success: false,
        error: 'Selected model does not support image processing'
      }, { status: 400 })
    }

    const startTime = Date.now()
    const result = await createGeminiImageGeneration({
      model: modelInfo.modelId,
      prompt: body.prompt,
      image: body.image
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    return NextResponse.json({
      success: true,
      data: {
        id: `gemini_img_${Date.now()}`,
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
    console.error('Gemini Image API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Image processing failed',
      message: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}