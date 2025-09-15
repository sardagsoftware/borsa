import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [width, height] = params.params
    const w = parseInt(width) || 400
    const h = parseInt(height) || 300

    // Generate a simple placeholder SVG
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#e5e7eb"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
          ${w} × ${h}
        </text>
      </svg>
    `

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Placeholder image error:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to generate placeholder image'
    }, { status: 500 })
  }
}