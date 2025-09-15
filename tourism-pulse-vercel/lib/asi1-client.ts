export interface Asi1Model {
  id: string
  name: string
  provider: string
  description: string
  contextLength: number
  capabilities: string[]
  category: 'text' | 'vision' | 'audio' | 'code' | 'multimodal' | 'agentic'
  speed: 'ultra-fast' | 'fast' | 'standard'
  pricing: 'free' | 'paid'
  icon: string
  modelId: string
}

// Asi1.AI Models with comprehensive specifications
export const asi1Models: Asi1Model[] = [
  {
    id: 'asi1-mini',
    name: 'ASI1 Mini',
    provider: 'ASI1',
    description: 'Balanced performance and speed for general tasks',
    contextLength: 32768,
    capabilities: ['text-generation', 'reasoning', 'general-purpose', 'balanced'],
    category: 'text',
    speed: 'ultra-fast',
    pricing: 'paid',
    icon: '⚡',
    modelId: 'asi1-mini'
  },
  {
    id: 'asi1-fast',
    name: 'ASI1 Fast',
    provider: 'ASI1',
    description: 'Optimized for quick responses and real-time applications',
    contextLength: 16384,
    capabilities: ['text-generation', 'quick-response', 'real-time', 'optimized'],
    category: 'text',
    speed: 'ultra-fast',
    pricing: 'paid',
    icon: '🚀',
    modelId: 'asi1-fast'
  },
  {
    id: 'asi1-extended',
    name: 'ASI1 Extended',
    provider: 'ASI1',
    description: 'Enhanced capabilities for complex tasks and deep reasoning',
    contextLength: 128000,
    capabilities: ['text-generation', 'complex-reasoning', 'analysis', 'extended-context'],
    category: 'text',
    speed: 'standard',
    pricing: 'paid',
    icon: '🧠',
    modelId: 'asi1-extended'
  },
  {
    id: 'asi1-agentic',
    name: 'ASI1 Agentic',
    provider: 'ASI1',
    description: 'Specialized for agent interactions and multi-step task execution',
    contextLength: 65536,
    capabilities: ['agentic-reasoning', 'multi-step-execution', 'agent-interactions', 'tool-use'],
    category: 'agentic',
    speed: 'fast',
    pricing: 'paid',
    icon: '🤖',
    modelId: 'asi1-agentic'
  },
  {
    id: 'asi1-graph',
    name: 'ASI1 Graph',
    provider: 'ASI1',
    description: 'Optimized for data analytics, graphs, and structured data processing',
    contextLength: 32768,
    capabilities: ['data-analytics', 'graph-processing', 'structured-data', 'visualization'],
    category: 'code',
    speed: 'fast',
    pricing: 'paid',
    icon: '📊',
    modelId: 'asi1-graph'
  }
]

export async function createAsi1Completion({
  model = 'asi1-mini',
  messages,
  temperature = 0.7,
  maxTokens = 1024,
  stream = false
}: {
  model?: string
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
}) {
  try {
    const response = await fetch('https://api.asi1.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ASI1_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream,
        top_p: 0.9
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`ASI1 API Error: ${response.status} ${response.statusText} - ${errorData}`)
    }

    const completion = await response.json()

    return {
      id: completion.id || `asi1_${Date.now()}`,
      choices: completion.choices || [{
        message: {
          content: completion.choices?.[0]?.message?.content || ''
        }
      }],
      usage: {
        prompt_tokens: completion.usage?.prompt_tokens || 0,
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0
      }
    }
  } catch (error: any) {
    console.error('ASI1 API Error:', error)
    throw new Error(`ASI1 API Error: ${error.message}`)
  }
}

export async function createAsi1AgenticTask({
  model = 'asi1-agentic',
  task,
  context = '',
  steps = [],
  temperature = 0.7
}: {
  model?: string
  task: string
  context?: string
  steps?: string[]
  temperature?: number
}) {
  try {
    const messages = [
      {
        role: 'system' as const,
        content: `You are an advanced agentic AI specialized in multi-step task execution. ${context ? `Context: ${context}` : ''}`
      },
      {
        role: 'user' as const,
        content: `Task: ${task}${steps.length ? `\nSteps to consider: ${steps.join(', ')}` : ''}`
      }
    ]

    return await createAsi1Completion({
      model,
      messages,
      temperature,
      maxTokens: 2048
    })
  } catch (error: any) {
    console.error('ASI1 Agentic API Error:', error)
    throw new Error(`ASI1 Agentic API Error: ${error.message}`)
  }
}

export async function createAsi1GraphAnalysis({
  model = 'asi1-graph',
  data,
  analysisType = 'general',
  format = 'structured'
}: {
  model?: string
  data: any
  analysisType?: string
  format?: string
}) {
  try {
    const messages = [
      {
        role: 'system' as const,
        content: `You are specialized in data analytics and graph processing. Analyze the provided data with ${analysisType} analysis approach and return results in ${format} format.`
      },
      {
        role: 'user' as const,
        content: `Please analyze this data: ${JSON.stringify(data, null, 2)}`
      }
    ]

    return await createAsi1Completion({
      model,
      messages,
      temperature: 0.3,
      maxTokens: 2048
    })
  } catch (error: any) {
    console.error('ASI1 Graph API Error:', error)
    throw new Error(`ASI1 Graph API Error: ${error.message}`)
  }
}