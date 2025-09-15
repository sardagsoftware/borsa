import { NextRequest, NextResponse } from 'next/server'
import { groqModels } from '@/lib/groq-client'
import { huggingfaceModels } from '@/lib/huggingface-client'
import { geminiModels } from '@/lib/gemini-client'
import { asi1Models } from '@/lib/asi1-client'

// Unified AI Model interface
export interface UnifiedAIModel {
  id: string
  name: string
  provider: string
  status: 'active' | 'inactive' | 'maintenance'
  description: string
  capabilities: string[]
  category: 'text' | 'vision' | 'audio' | 'code' | 'multimodal' | 'agentic'
  speed: 'ultra-fast' | 'fast' | 'standard'
  pricing: {
    inputTokens: number
    outputTokens: number
    currency: string
    tier: 'free' | 'paid' | 'premium'
  }
  limits: {
    maxTokens: number
    requestsPerMinute: number
  }
  icon: string
  apiProvider: 'groq' | 'huggingface' | 'openai' | 'anthropic' | 'google' | 'asi1'
  modelId?: string
}

// Convert Groq models to unified format
const groqUnified: UnifiedAIModel[] = groqModels.map(model => ({
  id: `groq_${model.id}`,
  name: model.name,
  provider: model.provider,
  status: 'active' as const,
  description: model.description,
  capabilities: model.capabilities,
  category: model.category,
  speed: model.speed,
  pricing: {
    inputTokens: model.inputPricing,
    outputTokens: model.outputPricing,
    currency: 'USD',
    tier: 'paid' as const
  },
  limits: {
    maxTokens: model.contextLength,
    requestsPerMinute: 1000
  },
  icon: model.icon,
  apiProvider: 'groq' as const,
  modelId: model.id
}))

// Convert HuggingFace models to unified format
const huggingfaceUnified: UnifiedAIModel[] = huggingfaceModels.map(model => ({
  id: `hf_${model.id}`,
  name: model.name,
  provider: model.provider,
  status: 'active' as const,
  description: model.description,
  capabilities: model.capabilities,
  category: model.category,
  speed: model.speed,
  pricing: {
    inputTokens: model.pricing === 'free' ? 0 : 0.001,
    outputTokens: model.pricing === 'free' ? 0 : 0.002,
    currency: 'USD',
    tier: model.pricing as 'free' | 'paid' | 'premium'
  },
  limits: {
    maxTokens: model.contextLength,
    requestsPerMinute: model.pricing === 'free' ? 60 : 1000
  },
  icon: model.icon,
  apiProvider: 'huggingface' as const,
  modelId: model.modelId
}))

// Convert Gemini models to unified format
const geminiUnified: UnifiedAIModel[] = geminiModels.map(model => ({
  id: `gemini_${model.id}`,
  name: model.name,
  provider: model.provider,
  status: 'active' as const,
  description: model.description,
  capabilities: model.capabilities,
  category: model.category,
  speed: model.speed,
  pricing: {
    inputTokens: model.pricing === 'free' ? 0 : 0.0005,
    outputTokens: model.pricing === 'free' ? 0 : 0.0015,
    currency: 'USD',
    tier: model.pricing as 'free' | 'paid' | 'premium'
  },
  limits: {
    maxTokens: model.contextLength,
    requestsPerMinute: model.pricing === 'free' ? 15 : 300
  },
  icon: model.icon,
  apiProvider: 'google' as const,
  modelId: model.modelId
}))

// Convert ASI1 models to unified format
const asi1Unified: UnifiedAIModel[] = asi1Models.map(model => ({
  id: `asi1_${model.id}`,
  name: model.name,
  provider: model.provider,
  status: 'active' as const,
  description: model.description,
  capabilities: model.capabilities,
  category: model.category,
  speed: model.speed,
  pricing: {
    inputTokens: 0.001,
    outputTokens: 0.002,
    currency: 'USD',
    tier: model.pricing as 'free' | 'paid' | 'premium'
  },
  limits: {
    maxTokens: model.contextLength,
    requestsPerMinute: 100
  },
  icon: model.icon,
  apiProvider: 'asi1' as const,
  modelId: model.modelId
}))

// Legacy models (for compatibility)
const legacyModels: UnifiedAIModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    status: 'active',
    description: 'Most capable GPT-4 model with 128k context length',
    capabilities: ['text-generation', 'code', 'analysis', 'reasoning'],
    category: 'text',
    speed: 'standard',
    pricing: { inputTokens: 0.01, outputTokens: 0.03, currency: 'USD', tier: 'premium' },
    limits: { maxTokens: 128000, requestsPerMinute: 60 },
    icon: '🤖',
    apiProvider: 'openai'
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    status: 'active',
    description: 'Most intelligent Claude model with enhanced reasoning',
    capabilities: ['text-generation', 'analysis', 'code', 'creative-writing'],
    category: 'text',
    speed: 'fast',
    pricing: { inputTokens: 0.003, outputTokens: 0.015, currency: 'USD', tier: 'premium' },
    limits: { maxTokens: 200000, requestsPerMinute: 50 },
    icon: '🧠',
    apiProvider: 'anthropic'
  }
]

// Combine all models
const allModels: UnifiedAIModel[] = [...groqUnified, ...huggingfaceUnified, ...geminiUnified, ...asi1Unified, ...legacyModels]

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const status = searchParams.get('status')
    const capability = searchParams.get('capability')

    const category = searchParams.get('category')
    const speed = searchParams.get('speed')
    const tier = searchParams.get('tier')
    const apiProvider = searchParams.get('api_provider')

    let filteredModels = [...allModels]

    // Apply filters
    if (provider) {
      filteredModels = filteredModels.filter(model =>
        model.provider.toLowerCase().includes(provider.toLowerCase())
      )
    }

    if (category) {
      filteredModels = filteredModels.filter(model =>
        model.category === category
      )
    }

    if (speed) {
      filteredModels = filteredModels.filter(model =>
        model.speed === speed
      )
    }

    if (tier) {
      filteredModels = filteredModels.filter(model =>
        model.pricing.tier === tier
      )
    }

    if (apiProvider) {
      filteredModels = filteredModels.filter(model =>
        model.apiProvider === apiProvider
      )
    }

    const response = NextResponse.json({
      success: true,
      data: filteredModels,
      meta: {
        total: filteredModels.length,
        totalGroq: groqUnified.length,
        totalHuggingFace: huggingfaceUnified.length,
        totalGemini: geminiUnified.length,
        totalAsi1: asi1Unified.length,
        totalLegacy: legacyModels.length,
        categories: [...new Set(allModels.map(m => m.category))],
        providers: [...new Set(allModels.map(m => m.provider))],
        speeds: [...new Set(allModels.map(m => m.speed))],
        tiers: [...new Set(allModels.map(m => m.pricing.tier))],
        apiProviders: [...new Set(allModels.map(m => m.apiProvider))],
        filters: {
          provider,
          category,
          speed,
          tier,
          apiProvider
        }
      }
    })

    // Cache for 5 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

    return response
  } catch (error) {
    console.error('Models API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch AI models',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}