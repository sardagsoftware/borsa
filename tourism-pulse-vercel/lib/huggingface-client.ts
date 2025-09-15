import { HfInference } from '@huggingface/inference'

// Initialize HuggingFace client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

export interface HuggingFaceModel {
  id: string
  name: string
  provider: string
  description: string
  contextLength: number
  parameters: string
  capabilities: string[]
  category: 'text' | 'vision' | 'audio' | 'code' | 'multimodal'
  speed: 'ultra-fast' | 'fast' | 'standard'
  pricing: 'free' | 'paid' | 'premium'
  icon: string
  modelId: string // HuggingFace model ID
}

// Comprehensive HuggingFace Models
export const huggingfaceModels: HuggingFaceModel[] = [
  // Meta MobileLLM
  {
    id: 'mobilellm-r1-950m',
    name: 'MobileLLM R1 950M',
    provider: 'Meta',
    description: 'Efficient mobile-optimized model for math, coding, and reasoning',
    contextLength: 32768,
    parameters: '950M',
    capabilities: ['text-generation', 'math', 'coding', 'reasoning', 'mobile-optimized'],
    category: 'text',
    speed: 'ultra-fast',
    pricing: 'free',
    icon: '📱',
    modelId: 'facebook/MobileLLM-R1-950M'
  },

  // Microsoft Models
  {
    id: 'phi-3-mini-4k',
    name: 'Phi-3 Mini 4K',
    provider: 'Microsoft',
    description: 'Compact yet powerful model for general tasks',
    contextLength: 4096,
    parameters: '3.8B',
    capabilities: ['text-generation', 'conversation', 'reasoning'],
    category: 'text',
    speed: 'fast',
    pricing: 'free',
    icon: '🔵',
    modelId: 'microsoft/Phi-3-mini-4k-instruct'
  },

  // Google Models
  {
    id: 'gemma-2b',
    name: 'Gemma 2B',
    provider: 'Google',
    description: 'Lightweight Gemma model for efficient inference',
    contextLength: 8192,
    parameters: '2B',
    capabilities: ['text-generation', 'instruction-following'],
    category: 'text',
    speed: 'ultra-fast',
    pricing: 'free',
    icon: '💎',
    modelId: 'google/gemma-2b-it'
  },

  // Stability AI
  {
    id: 'stablelm-2-1_6b',
    name: 'StableLM 2 1.6B',
    provider: 'Stability AI',
    description: 'Stable and efficient language model',
    contextLength: 4096,
    parameters: '1.6B',
    capabilities: ['text-generation', 'creative-writing'],
    category: 'text',
    speed: 'fast',
    pricing: 'free',
    icon: '🎯',
    modelId: 'stabilityai/stablelm-2-1_6b'
  },

  // Qwen Models
  {
    id: 'qwen2-0_5b',
    name: 'Qwen2 0.5B',
    provider: 'Alibaba',
    description: 'Ultra-compact multilingual model',
    contextLength: 32768,
    parameters: '0.5B',
    capabilities: ['text-generation', 'multilingual', 'chat'],
    category: 'text',
    speed: 'ultra-fast',
    pricing: 'free',
    icon: '🌏',
    modelId: 'Qwen/Qwen2-0.5B-Instruct'
  },

  // Code Models
  {
    id: 'starcoder2-3b',
    name: 'StarCoder2 3B',
    provider: 'BigCode',
    description: 'Advanced code generation and understanding',
    contextLength: 16384,
    parameters: '3B',
    capabilities: ['code-generation', 'code-completion', 'debugging'],
    category: 'code',
    speed: 'fast',
    pricing: 'free',
    icon: '💻',
    modelId: 'bigcode/starcoder2-3b'
  },

  // Vision Models
  {
    id: 'blip2-opt-2_7b',
    name: 'BLIP-2 OPT 2.7B',
    provider: 'Salesforce',
    description: 'Vision-language model for image understanding',
    contextLength: 2048,
    parameters: '2.7B',
    capabilities: ['vision-language', 'image-captioning', 'visual-qa'],
    category: 'vision',
    speed: 'standard',
    pricing: 'free',
    icon: '👁️',
    modelId: 'Salesforce/blip2-opt-2.7b'
  },

  // Audio Models
  {
    id: 'whisper-small',
    name: 'Whisper Small',
    provider: 'OpenAI',
    description: 'Efficient speech recognition model',
    contextLength: 0,
    parameters: '244M',
    capabilities: ['speech-to-text', 'multilingual-audio'],
    category: 'audio',
    speed: 'fast',
    pricing: 'free',
    icon: '🎙️',
    modelId: 'openai/whisper-small'
  }
]

export async function createHuggingFaceCompletion({
  model = 'facebook/MobileLLM-R1-950M',
  messages,
  temperature = 0.7,
  maxTokens = 1024
}: {
  model?: string
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  temperature?: number
  maxTokens?: number
}) {
  try {
    // Convert messages to a single prompt (HuggingFace format)
    const prompt = messages
      .map(msg => {
        if (msg.role === 'system') return `System: ${msg.content}`
        if (msg.role === 'user') return `User: ${msg.content}`
        return `Assistant: ${msg.content}`
      })
      .join('\n') + '\nAssistant:'

    const response = await hf.textGeneration({
      model,
      inputs: prompt,
      parameters: {
        max_new_tokens: maxTokens,
        temperature,
        top_p: 0.9,
        repetition_penalty: 1.1,
        return_full_text: false
      }
    })

    return {
      id: `hf_${Date.now()}`,
      choices: [{
        message: {
          content: response.generated_text || ''
        }
      }],
      usage: {
        prompt_tokens: prompt.length / 4, // Rough estimate
        completion_tokens: (response.generated_text?.length || 0) / 4,
        total_tokens: (prompt.length + (response.generated_text?.length || 0)) / 4
      }
    }
  } catch (error: any) {
    console.error('HuggingFace API Error:', error)
    throw new Error(`HuggingFace API Error: ${error.message}`)
  }
}

export async function createHuggingFaceImageClassification({
  model = 'google/vit-base-patch16-224',
  image
}: {
  model?: string
  image: Blob | File
}) {
  try {
    const response = await hf.imageClassification({
      model,
      data: image
    })

    return response
  } catch (error: any) {
    console.error('HuggingFace Image API Error:', error)
    throw new Error(`HuggingFace Image API Error: ${error.message}`)
  }
}

export async function createHuggingFaceAudioTranscription({
  model = 'openai/whisper-small',
  audio
}: {
  model?: string
  audio: Blob | File
}) {
  try {
    const response = await hf.automaticSpeechRecognition({
      model,
      data: audio
    })

    return response
  } catch (error: any) {
    console.error('HuggingFace Audio API Error:', error)
    throw new Error(`HuggingFace Audio API Error: ${error.message}`)
  }
}

export default hf