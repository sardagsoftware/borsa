import { NextRequest, NextResponse } from 'next/server'
import { createGroqAudioTranscription } from '@/lib/groq-client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const model = formData.get('model') as string || 'whisper-large-v3'
    const language = formData.get('language') as string
    const prompt = formData.get('prompt') as string
    const responseFormat = formData.get('response_format') as string || 'json'
    const temperature = parseFloat(formData.get('temperature') as string) || 0

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Audio file is required'
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/mpga',
      'audio/m4a', 'audio/wav', 'audio/webm'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav, webm'
      }, { status: 400 })
    }

    // Check file size (25MB limit)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File size exceeds 25MB limit'
      }, { status: 400 })
    }

    const startTime = Date.now()

    const transcription = await createGroqAudioTranscription({
      file,
      model,
      language,
      prompt,
      response_format: responseFormat as any,
      temperature
    })

    const endTime = Date.now()
    const processingTime = endTime - startTime

    return NextResponse.json({
      success: true,
      data: {
        transcription,
        model,
        language: language || 'auto-detected',
        duration: file.size > 0 ? Math.round(file.size / 16000) : null, // Rough estimate
        performance: {
          processingTime,
          fileSize: file.size,
          fileName: file.name
        },
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Groq Audio API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Audio transcription failed',
      message: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}