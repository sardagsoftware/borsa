import Groq from 'groq-sdk'

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface GroqModel {
  id: string
  name: string
  provider: string
  description: string
  contextLength: number
  inputPricing: number
  outputPricing: number
  capabilities: string[]
  category: 'text' | 'vision' | 'audio' | 'code'
  speed: 'ultra-fast' | 'fast' | 'standard'
  icon: string
}

// Comprehensive Groq Models List
export const groqModels: GroqModel[] = [
  // Meta Llama Models
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    provider: 'Meta',
    description: 'Most versatile Llama model with enhanced reasoning and multilingual support',
    contextLength: 131072,
    inputPricing: 0.00059,
    outputPricing: 0.00079,
    capabilities: ['text-generation', 'reasoning', 'multilingual', 'conversation'],
    category: 'text',
    speed: 'ultra-fast',
    icon: '🦙'
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    provider: 'Meta',
    description: 'Lightning-fast Llama model optimized for instant responses',
    contextLength: 131072,
    inputPricing: 0.00005,
    outputPricing: 0.00008,
    capabilities: ['text-generation', 'chat', 'instant-response'],
    category: 'text',
    speed: 'ultra-fast',
    icon: '⚡'
  },
  {
    id: 'llama-3.1-70b-versatile',
    name: 'Llama 3.1 70B Versatile',
    provider: 'Meta',
    description: 'Advanced reasoning capabilities with 70B parameters',
    contextLength: 131072,
    inputPricing: 0.00059,
    outputPricing: 0.00079,
    capabilities: ['text-generation', 'reasoning', 'complex-tasks'],
    category: 'text',
    speed: 'fast',
    icon: '🧠'
  },
  {
    id: 'llama-3.2-1b-preview',
    name: 'Llama 3.2 1B Preview',
    provider: 'Meta',
    description: 'Compact and efficient model for edge deployment',
    contextLength: 131072,
    inputPricing: 0.00004,
    outputPricing: 0.00004,
    capabilities: ['text-generation', 'edge-optimized'],
    category: 'text',
    speed: 'ultra-fast',
    icon: '🔥'
  },
  {
    id: 'llama-3.2-3b-preview',
    name: 'Llama 3.2 3B Preview',
    provider: 'Meta',
    description: 'Balanced performance and efficiency for general tasks',
    contextLength: 131072,
    inputPricing: 0.00006,
    outputPricing: 0.00006,
    capabilities: ['text-generation', 'general-purpose'],
    category: 'text',
    speed: 'ultra-fast',
    icon: '🚀'
  },
  {
    id: 'llama-3.2-11b-vision-preview',
    name: 'Llama 3.2 11B Vision',
    provider: 'Meta',
    description: 'Multimodal model with vision and text capabilities',
    contextLength: 131072,
    inputPricing: 0.00018,
    outputPricing: 0.00018,
    capabilities: ['text-generation', 'vision', 'multimodal', 'image-understanding'],
    category: 'vision',
    speed: 'fast',
    icon: '👁️'
  },
  {
    id: 'llama-3.2-90b-vision-preview',
    name: 'Llama 3.2 90B Vision',
    provider: 'Meta',
    description: 'Advanced multimodal model with superior vision understanding',
    contextLength: 131072,
    inputPricing: 0.00090,
    outputPricing: 0.00090,
    capabilities: ['text-generation', 'vision', 'multimodal', 'advanced-reasoning'],
    category: 'vision',
    speed: 'fast',
    icon: '🔍'
  },
  // Guard Models
  {
    id: 'llama-guard-3-8b',
    name: 'Llama Guard 3 8B',
    provider: 'Meta',
    description: 'Content moderation and safety classification model',
    contextLength: 8192,
    inputPricing: 0.00020,
    outputPricing: 0.00020,
    capabilities: ['content-moderation', 'safety', 'classification'],
    category: 'text',
    speed: 'fast',
    icon: '🛡️'
  },
  // Mixtral Models
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'Mistral AI',
    description: 'Mixture of experts model with excellent multilingual capabilities',
    contextLength: 32768,
    inputPricing: 0.00024,
    outputPricing: 0.00024,
    capabilities: ['text-generation', 'multilingual', 'code', 'reasoning'],
    category: 'text',
    speed: 'fast',
    icon: '🌟'
  },
  // Gemma Models
  {
    id: 'gemma-7b-it',
    name: 'Gemma 7B Instruct',
    provider: 'Google',
    description: 'Instruction-tuned Gemma model for chat and assistance',
    contextLength: 8192,
    inputPricing: 0.00007,
    outputPricing: 0.00007,
    capabilities: ['text-generation', 'instruction-following', 'chat'],
    category: 'text',
    speed: 'fast',
    icon: '💎'
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B Instruct',
    provider: 'Google',
    description: 'Enhanced Gemma 2 model with improved performance',
    contextLength: 8192,
    inputPricing: 0.00020,
    outputPricing: 0.00020,
    capabilities: ['text-generation', 'instruction-following', 'enhanced-reasoning'],
    category: 'text',
    speed: 'fast',
    icon: '💎'
  },
  // Audio Models
  {
    id: 'whisper-large-v3',
    name: 'Whisper Large v3',
    provider: 'OpenAI',
    description: 'State-of-the-art speech recognition and transcription',
    contextLength: 0,
    inputPricing: 0.00006,
    outputPricing: 0,
    capabilities: ['speech-to-text', 'transcription', 'multilingual-audio'],
    category: 'audio',
    speed: 'fast',
    icon: '🎙️'
  },
  {
    id: 'whisper-large-v3-turbo',
    name: 'Whisper Large v3 Turbo',
    provider: 'OpenAI',
    description: 'Ultra-fast speech recognition with optimized performance',
    contextLength: 0,
    inputPricing: 0.00004,
    outputPricing: 0,
    capabilities: ['speech-to-text', 'real-time-transcription', 'fast-processing'],
    category: 'audio',
    speed: 'ultra-fast',
    icon: '🎤'
  },
  // Compound AI Systems
  {
    id: 'groq-compound',
    name: 'Groq Compound',
    provider: 'Groq',
    description: 'Advanced AI system with web search and code execution',
    contextLength: 131072,
    inputPricing: 0.00100,
    outputPricing: 0.00100,
    capabilities: ['web-search', 'code-execution', 'tool-use', 'reasoning'],
    category: 'text',
    speed: 'standard',
    icon: '🔧'
  }
]

export async function createGroqChatCompletion({
  model = 'llama-3.3-70b-versatile',
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
    const completion = await groq.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0
    })

    return completion
  } catch (error: any) {
    console.error('Groq API Error:', error)
    throw new Error(`Groq API Error: ${error.message}`)
  }
}

export async function createGroqAudioTranscription({
  file,
  model = 'whisper-large-v3',
  language,
  prompt,
  response_format = 'json' as 'json' | 'text' | 'verbose_json',
  temperature = 0
}: {
  file: any
  model?: string
  language?: string
  prompt?: string
  response_format?: 'json' | 'text' | 'verbose_json'
  temperature?: number
}) {
  try {
    const transcription = await groq.audio.transcriptions.create({
      file,
      model,
      language,
      prompt,
      response_format,
      temperature
    })

    return transcription
  } catch (error: any) {
    console.error('Groq Audio API Error:', error)
    throw new Error(`Groq Audio API Error: ${error.message}`)
  }
}

export async function listGroqModels() {
  try {
    const models = await groq.models.list()
    return models
  } catch (error: any) {
    console.error('Groq Models API Error:', error)
    throw new Error(`Groq Models API Error: ${error.message}`)
  }
}

export default groq