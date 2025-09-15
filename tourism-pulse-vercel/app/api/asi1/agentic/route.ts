import { NextRequest, NextResponse } from 'next/server'
import { createAsi1AgenticTask, asi1Models } from '@/lib/asi1-client'

interface Asi1AgenticRequest {
  task: string
  model?: string
  context?: string
  steps?: string[]
  temperature?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: Asi1AgenticRequest = await request.json()

    if (!body.task?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Task description is required'
      }, { status: 400 })
    }

    const model = body.model || 'asi1-agentic'
    const temperature = body.temperature || 0.7

    // Find model info
    const modelInfo = asi1Models.find(m => m.modelId === model || m.id === model)
    if (!modelInfo) {
      return NextResponse.json({
        success: false,
        error: 'Model not found'
      }, { status: 400 })
    }

    // Check if model supports agentic capabilities
    if (!modelInfo.capabilities.includes('agentic-reasoning') && !modelInfo.capabilities.includes('multi-step-execution')) {
      return NextResponse.json({
        success: false,
        error: 'Selected model does not support agentic tasks'
      }, { status: 400 })
    }

    const startTime = Date.now()
    const completion = await createAsi1AgenticTask({
      model: modelInfo.modelId,
      task: body.task,
      context: body.context,
      steps: body.steps,
      temperature
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
        id: completion.id || `asi1_agentic_${Date.now()}`,
        response,
        task: body.task,
        model: modelInfo.id,
        modelInfo: {
          name: modelInfo.name,
          provider: modelInfo.provider,
          icon: modelInfo.icon,
          capabilities: modelInfo.capabilities
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
    console.error('ASI1 Agentic API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Agentic task failed',
      message: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}