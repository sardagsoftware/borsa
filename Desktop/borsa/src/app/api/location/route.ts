import { NextRequest, NextResponse } from 'next/server';

// Multiple location API providers for redundancy
const LOCATION_APIS = [
  {
    name: 'ipapi.co',
    url: (ip: string) => `https://ipapi.co/${ip}/json/`,
    transform: (data: any) => ({
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      countryCode: data.country_code,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      isp: data.org,
      asn: data.asn,
      postal: data.postal,
      currency: data.currency,
      languages: data.languages?.split(',')[0] || 'tr'
    })
  },
  {
    name: 'ip-api.com',
    url: (ip: string) => `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
    transform: (data: any) => ({
      ip: data.query,
      city: data.city,
      region: data.regionName,
      country: data.country,
      countryCode: data.countryCode,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      asn: data.as,
      postal: data.zip
    })
  }
];

function getClientIP(request: NextRequest): string {
  // Try various headers to get real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();

  return ''; // Will use API's auto-detection
}

async function fetchLocationData(ip: string, retries = 0): Promise<any> {
  const apiIndex = retries % LOCATION_APIS.length;
  const api = LOCATION_APIS[apiIndex];

  try {
    const url = api.url(ip || '');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LyDian-Trader/1.0',
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`API ${api.name} returned ${response.status}`);
    }

    const data = await response.json();

    // Check for API-specific error indicators
    if (data.error || data.status === 'fail') {
      throw new Error(data.message || 'API returned error');
    }

    return api.transform(data);
  } catch (error) {
    console.error(`Location API ${api.name} failed:`, error);

    // Retry with next API if available
    if (retries < LOCATION_APIS.length * 2) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      return fetchLocationData(ip, retries + 1);
    }

    throw error;
  }
}

// Geocoding reverse lookup for additional context
async function getReverseGeocode(lat: number, lng: number): Promise<any> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'LyDian-Trader/1.0'
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      address: data.display_name,
      neighborhood: data.address?.neighbourhood || data.address?.suburb,
      road: data.address?.road,
      district: data.address?.city_district,
      locality: data.address?.city || data.address?.town || data.address?.village
    };
  } catch (error) {
    console.error('Reverse geocode failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP
    const clientIP = getClientIP(request);

    console.log(`🌍 Location request from IP: ${clientIP || 'auto-detect'}`);

    // Fetch location data with fallback
    const locationData = await fetchLocationData(clientIP);

    // Get additional reverse geocoding data
    const geocodeData = await getReverseGeocode(
      locationData.latitude,
      locationData.longitude
    );

    // Combine all data
    const enrichedData = {
      ...locationData,
      geocode: geocodeData,
      timestamp: new Date().toISOString(),
      accuracy: 'high', // High accuracy from IP geolocation
      source: 'ip-geolocation'
    };

    console.log(`✅ Location resolved: ${enrichedData.city}, ${enrichedData.country}`);

    return NextResponse.json(enrichedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Location-Provider': 'LyDian-Trader-Multi-API'
      }
    });

  } catch (error: any) {
    console.error('❌ Location API error:', error);

    // Return fallback data (Istanbul, Turkey)
    return NextResponse.json({
      ip: 'unavailable',
      city: 'Istanbul',
      region: 'Istanbul',
      country: 'Turkey',
      countryCode: 'TR',
      latitude: 41.0082,
      longitude: 28.9784,
      timezone: 'Europe/Istanbul',
      isp: 'Unknown',
      error: error.message,
      fallback: true,
      timestamp: new Date().toISOString()
    }, {
      status: 200, // Still return 200 for fallback
      headers: {
        'X-Location-Fallback': 'true'
      }
    });
  }
}

// Browser geolocation support endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude required' },
        { status: 400 }
      );
    }

    // Get reverse geocoding data
    const geocodeData = await getReverseGeocode(latitude, longitude);

    return NextResponse.json({
      latitude,
      longitude,
      geocode: geocodeData,
      accuracy: 'very-high', // Browser geolocation is most accurate
      source: 'browser-geolocation',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}