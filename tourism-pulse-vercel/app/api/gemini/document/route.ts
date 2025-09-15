import { NextRequest, NextResponse } from 'next/server'
import { createGeminiDocumentProcessing, geminiModels } from '@/lib/gemini-client'

interface GeminiDocumentRequest {
  prompt: string
  model?: string
  document: string // Base64 encoded document
  mimeType?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GeminiDocumentRequest = await request.json()

    if (!body.prompt?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 })
    }

    if (!body.document) {
      return NextResponse.json({
        success: false,
        error: 'Document is required'
      }, { status: 400 })
    }

    const model = body.model || 'gemini-1.5-pro'

    // Find model info
    const modelInfo = geminiModels.find(m => m.modelId === model || m.id === model)
    if (!modelInfo) {
      return NextResponse.json({
        success: false,
        error: 'Model not found'
      }, { status: 400 })
    }

    // Check if model supports document processing
    if (!modelInfo.capabilities.includes('multimodal') && !modelInfo.capabilities.includes('analysis')) {
      return NextResponse.json({
        success: false,
        error: 'Selected model does not support document processing'
      }, { status: 400 })
    }

    const startTime = Date.now()
    const result = await createGeminiDocumentProcessing({
      model: modelInfo.modelId,
      prompt: body.prompt,
      document: body.document
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    return NextResponse.json({
      success: true,
      data: {
        id: `gemini_doc_${Date.now()}`,
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
    console.error('Gemini Document API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Document processing failed',
      message: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}