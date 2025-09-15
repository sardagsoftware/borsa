import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

export interface GeminiModel {
  id: string
  name: string
  provider: string
  description: string
  contextLength: number
  capabilities: string[]
  category: 'text' | 'vision' | 'audio' | 'code' | 'multimodal'
  speed: 'ultra-fast' | 'fast' | 'standard'
  pricing: 'free' | 'paid'
  icon: string
  modelId: string // Gemini model ID
}

// Google Gemini Models
export const geminiModels: GeminiModel[] = [
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Experimental)',
    provider: 'Google',
    description: 'Latest experimental Gemini model with enhanced multimodal capabilities',
    contextLength: 1000000,
    capabilities: ['text-generation', 'vision', 'audio', 'multimodal', 'tool-use', 'reasoning'],
    category: 'multimodal',
    speed: 'ultra-fast',
    pricing: 'free',
    icon: '✨',
    modelId: 'gemini-2.0-flash-exp'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    description: 'Fast and versatile performance across diverse tasks',
    contextLength: 1000000,
    capabilities: ['text-generation', 'vision', 'multimodal', 'code', 'reasoning'],
    category: 'multimodal',
    speed: 'ultra-fast',
    pricing: 'free',
    icon: '⚡',
    modelId: 'gemini-1.5-flash'
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash 8B',
    provider: 'Google',
    description: 'High volume and lower intelligence tasks at higher rate limits',
    contextLength: 1000000,
    capabilities: ['text-generation', 'multimodal', 'fast-processing'],
    category: 'text',
    speed: 'ultra-fast',
    pricing: 'free',
    icon: '🚀',
    modelId: 'gemini-1.5-flash-8b'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    description: 'Complex reasoning tasks requiring more intelligence',
    contextLength: 2000000,
    capabilities: ['text-generation', 'vision', 'multimodal', 'advanced-reasoning', 'code', 'analysis'],
    category: 'multimodal',
    speed: 'standard',
    pricing: 'free',
    icon: '🧠',
    modelId: 'gemini-1.5-pro'
  },
  {
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    provider: 'Google',
    description: 'Natural language tasks, multi-turn text and code chat, and code generation',
    contextLength: 30720,
    capabilities: ['text-generation', 'conversation', 'code', 'multi-turn-chat'],
    category: 'text',
    speed: 'fast',
    pricing: 'free',
    icon: '💎',
    modelId: 'gemini-1.0-pro'
  }
]

// Safety settings for content generation
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
]

export async function createGeminiCompletion({
  model = 'gemini-1.5-flash',
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
    const geminiModel = genAI.getGenerativeModel({
      model,
      safetySettings,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.95,
        topK: 64,
      },
    })

    // Convert chat messages to Gemini format
    // Filter out system messages and convert to proper format
    const chatHistory = messages.filter(msg => msg.role !== 'system').slice(0, -1)
    const chat = geminiModel.startChat({
      history: chatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    const response = await result.response

    return {
      id: `gemini_${Date.now()}`,
      choices: [{
        message: {
          content: response.text()
        }
      }],
      usage: {
        prompt_tokens: result.response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: result.response.usageMetadata?.totalTokenCount || 0
      }
    }
  } catch (error: any) {
    console.error('Gemini API Error:', error)
    throw new Error(`Gemini API Error: ${error.message}`)
  }
}

export async function createGeminiImageGeneration({
  model = 'gemini-1.5-flash',
  prompt,
  image
}: {
  model?: string
  prompt: string
  image?: string | Buffer
}) {
  try {
    const geminiModel = genAI.getGenerativeModel({
      model,
      safetySettings
    })

    let parts: any[] = [{ text: prompt }]

    if (image) {
      // Handle image input
      const imageData = typeof image === 'string'
        ? Buffer.from(image, 'base64')
        : image

      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData.toString('base64')
        }
      })
    }

    const result = await geminiModel.generateContent(parts)
    const response = await result.response

    return {
      text: response.text(),
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0
      }
    }
  } catch (error: any) {
    console.error('Gemini Image API Error:', error)
    throw new Error(`Gemini Image API Error: ${error.message}`)
  }
}

export async function createGeminiDocumentProcessing({
  model = 'gemini-1.5-pro',
  prompt,
  document
}: {
  model?: string
  prompt: string
  document: string | Buffer
}) {
  try {
    const geminiModel = genAI.getGenerativeModel({
      model,
      safetySettings
    })

    const documentData = typeof document === 'string'
      ? Buffer.from(document, 'base64')
      : document

    const result = await geminiModel.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: documentData.toString('base64')
        }
      }
    ])

    const response = await result.response

    return {
      text: response.text(),
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0
      }
    }
  } catch (error: any) {
    console.error('Gemini Document API Error:', error)
    throw new Error(`Gemini Document API Error: ${error.message}`)
  }
}

export async function createGeminiAudioProcessing({
  model = 'gemini-1.5-flash',
  prompt,
  audio
}: {
  model?: string
  prompt: string
  audio: string | Buffer
}) {
  try {
    const geminiModel = genAI.getGenerativeModel({
      model,
      safetySettings
    })

    const audioData = typeof audio === 'string'
      ? Buffer.from(audio, 'base64')
      : audio

    const result = await geminiModel.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: 'audio/wav',
          data: audioData.toString('base64')
        }
      }
    ])

    const response = await result.response

    return {
      text: response.text(),
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0
      }
    }
  } catch (error: any) {
    console.error('Gemini Audio API Error:', error)
    throw new Error(`Gemini Audio API Error: ${error.message}`)
  }
}

export default genAI