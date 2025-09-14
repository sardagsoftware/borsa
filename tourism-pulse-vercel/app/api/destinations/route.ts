import { NextRequest, NextResponse } from 'next/server'

// Mock data for destinations
const destinations = [
  {
    id: 'dest_001',
    name: 'Kapadokya',
    nameEn: 'Cappadocia',
    slug: 'cappadocia',
    emoji: '🏜️',
    rating: 4.9,
    reviewCount: 15420,
    price: { min: 850, max: 3500, currency: 'TRY' },
    trending: true,
    featured: true,
    aiScore: 98,
    sustainabilityScore: 95,
    tags: ['UNESCO', 'Balloon Tours', 'Nature', 'History'],
    location: { 
      lat: 38.6431, 
      lng: 34.8289,
      city: 'Nevşehir',
      country: 'Turkey'
    },
    description: 'Otherworldly landscape with fairy chimneys, underground cities, and hot air balloon tours.',
    images: [
      'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
    ],
    bestTime: 'April - October',
    duration: '2-4 days',
    activities: ['Hot Air Balloon', 'Underground Cities', 'ATV Safari', 'Sunset Viewing'],
    highlights: [
      'UNESCO World Heritage Site',
      'Unique rock formations',
      'Ancient cave churches',
      'Luxury cave hotels'
    ]
  },
  {
    id: 'dest_002',
    name: 'Antalya Old Town',
    nameEn: 'Antalya Kaleiçi',
    slug: 'antalya-old-town',
    emoji: '🏖️',
    rating: 4.8,
    reviewCount: 22150,
    price: { min: 450, max: 2200, currency: 'TRY' },
    trending: false,
    featured: true,
    aiScore: 92,
    sustainabilityScore: 88,
    tags: ['Beach', 'History', 'Marina', 'Mediterranean'],
    location: { 
      lat: 36.8841, 
      lng: 30.7056,
      city: 'Antalya',
      country: 'Turkey'
    },
    description: 'Historic old town with Ottoman houses, narrow stone streets, and beautiful marina.',
    images: [
      'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800',
      'https://images.unsplash.com/photo-1512757776214-26d36777b513?w=800'
    ],
    bestTime: 'Year-round',
    duration: '1-3 days',
    activities: ['Historical Tour', 'Marina Walk', 'Shopping', 'Beach Activities'],
    highlights: [
      'Hadrian\'s Gate',
      'Historic marina',
      'Ottoman architecture',
      'Mediterranean cuisine'
    ]
  },
  {
    id: 'dest_003',
    name: 'Ephesus Ancient City',
    nameEn: 'Efes',
    slug: 'ephesus',
    emoji: '🏛️',
    rating: 4.9,
    reviewCount: 18900,
    price: { min: 320, max: 1500, currency: 'TRY' },
    trending: true,
    featured: true,
    aiScore: 96,
    sustainabilityScore: 92,
    tags: ['History', 'Archaeology', 'UNESCO', 'Ancient'],
    location: { 
      lat: 37.9493, 
      lng: 27.3681,
      city: 'Selçuk',
      country: 'Turkey'
    },
    description: 'Magnificent ruins from the Roman period including the Library of Celsus.',
    images: [
      'https://images.unsplash.com/photo-1541410702738-f87a2c5b283c?w=800',
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=800'
    ],
    bestTime: 'March - November',
    duration: '3-5 hours',
    activities: ['Guided Tours', 'Museum Visits', 'Photography', 'Archaeological Walking'],
    highlights: [
      'Library of Celsus',
      'Great Theatre',
      'Temple of Artemis',
      'Ancient Roman streets'
    ]
  },
  {
    id: 'dest_004',
    name: 'Pamukkale',
    nameEn: 'Cotton Castle',
    slug: 'pamukkale',
    emoji: '♨️',
    rating: 4.7,
    reviewCount: 21340,
    price: { min: 380, max: 1800, currency: 'TRY' },
    trending: false,
    featured: false,
    aiScore: 94,
    sustainabilityScore: 90,
    tags: ['Nature', 'Thermal', 'UNESCO', 'Wellness'],
    location: { 
      lat: 37.9203, 
      lng: 29.1212,
      city: 'Denizli',
      country: 'Turkey'
    },
    description: 'White travertine terraces, thermal pools, and ancient Hierapolis ruins.',
    images: [
      'https://images.unsplash.com/photo-1541600383154-7e4e46c3b6d8?w=800',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
    ],
    bestTime: 'April - October',
    duration: '1 day',
    activities: ['Thermal Bathing', 'Hierapolis Tour', 'Nature Walking', 'Photography'],
    highlights: [
      'Natural travertine pools',
      'Ancient thermal baths',
      'Hierapolis ruins',
      'Healing thermal waters'
    ]
  },
  {
    id: 'dest_005',
    name: 'Istanbul Historic Peninsula',
    nameEn: 'Sultanahmet',
    slug: 'istanbul-historic',
    emoji: '🕌',
    rating: 4.9,
    reviewCount: 45670,
    price: { min: 200, max: 1500, currency: 'TRY' },
    trending: true,
    featured: true,
    aiScore: 97,
    sustainabilityScore: 85,
    tags: ['History', 'Culture', 'UNESCO', 'Museums'],
    location: { 
      lat: 41.0082, 
      lng: 28.9784,
      city: 'Istanbul',
      country: 'Turkey'
    },
    description: 'Historic peninsula with Hagia Sophia, Blue Mosque, and Topkapı Palace.',
    images: [
      'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800',
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800'
    ],
    bestTime: 'April - October',
    duration: '2-5 days',
    activities: ['Museum Tours', 'Bosphorus Cruise', 'Grand Bazaar', 'Turkish Bath'],
    highlights: [
      'Hagia Sophia',
      'Blue Mosque',
      'Topkapı Palace',
      'Grand Bazaar'
    ]
  },
  {
    id: 'dest_006',
    name: 'Bodrum Peninsula',
    nameEn: 'Bodrum',
    slug: 'bodrum',
    emoji: '⛵',
    rating: 4.6,
    reviewCount: 19230,
    price: { min: 600, max: 4000, currency: 'TRY' },
    trending: true,
    featured: false,
    aiScore: 89,
    sustainabilityScore: 82,
    tags: ['Beach', 'Nightlife', 'Marina', 'Luxury'],
    location: { 
      lat: 37.0344, 
      lng: 27.4305,
      city: 'Bodrum',
      country: 'Turkey'
    },
    description: 'Aegean gem with luxury marinas, beautiful beaches, and vibrant nightlife.',
    images: [
      'https://images.unsplash.com/photo-1539650116574-75c0c6b73b10?w=800',
      'https://images.unsplash.com/photo-1578581147286-b9d3b7bea3d9?w=800'
    ],
    bestTime: 'May - October',
    duration: '3-7 days',
    activities: ['Boat Tours', 'Beach Clubs', 'Marina Life', 'Nightlife'],
    highlights: [
      'Bodrum Castle',
      'Luxury marinas',
      'Beach clubs',
      'Aegean cuisine'
    ]
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const trending = searchParams.get('trending')
    const featured = searchParams.get('featured')

    let filteredDestinations = [...destinations]

    // Apply filters
    if (category) {
      filteredDestinations = filteredDestinations.filter(dest =>
        dest.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredDestinations = filteredDestinations.filter(dest =>
        dest.name.toLowerCase().includes(searchLower) ||
        dest.nameEn.toLowerCase().includes(searchLower) ||
        dest.description.toLowerCase().includes(searchLower) ||
        dest.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    if (trending === 'true') {
      filteredDestinations = filteredDestinations.filter(dest => dest.trending)
    }

    if (featured === 'true') {
      filteredDestinations = filteredDestinations.filter(dest => dest.featured)
    }

    // Apply pagination
    const startIndex = offset
    const endIndex = startIndex + limit
    const paginatedDestinations = filteredDestinations.slice(startIndex, endIndex)

    // Add cache headers for better performance
    const response = NextResponse.json({
      success: true,
      data: paginatedDestinations,
      meta: {
        total: filteredDestinations.length,
        limit,
        offset,
        hasMore: endIndex < filteredDestinations.length,
        filters: {
          category,
          search,
          trending: trending === 'true',
          featured: featured === 'true'
        }
      }
    })

    // Cache for 5 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    console.error('Destinations API Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch destinations',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // In a real app, you would save to database
    const newDestination = {
      id: `dest_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...body
    }

    return NextResponse.json({
      success: true,
      data: newDestination
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create destination'
    }, { status: 500 })
  }
}
