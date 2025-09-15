import { NextRequest, NextResponse } from 'next/server'
import { groqModels, listGroqModels } from '@/lib/groq-client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const provider = searchParams.get('provider')
    const speed = searchParams.get('speed')
    const includeApi = searchParams.get('include_api') === 'true'

    let filteredModels = [...groqModels]

    // Apply filters
    if (category) {
      filteredModels = filteredModels.filter(model =>
        model.category === category
      )
    }

    if (provider) {
      filteredModels = filteredModels.filter(model =>
        model.provider.toLowerCase().includes(provider.toLowerCase())
      )
    }

    if (speed) {
      filteredModels = filteredModels.filter(model =>
        model.speed === speed
      )
    }

    // Get live models from Groq API if requested
    let liveModels = null
    if (includeApi) {
      try {
        liveModels = await listGroqModels()
      } catch (error) {
        console.warn('Failed to fetch live models from Groq API:', error)
      }
    }

    return NextResponse.json({
      success: true,
      data: filteredModels,
      liveModels,
      meta: {
        total: filteredModels.length,
        categories: [...new Set(groqModels.map(m => m.category))],
        providers: [...new Set(groqModels.map(m => m.provider))],
        speeds: [...new Set(groqModels.map(m => m.speed))],
        filters: {
          category,
          provider,
          speed
        }
      }
    })

  } catch (error: any) {
    console.error('Groq Models API Error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Groq models',
      message: error.message || 'Unknown error'
    }, { status: 500 })
  }
}