'use client';

import { useEffect, useState } from 'react';
import LiveMap from './LiveMap';
import { useLanguage } from '@/contexts/LanguageContext';

interface GeoData {
  ip: string;
  location: {
    city: string;
    region: string;
    country: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  device: {
    type: string;
    os: string;
    browser: string;
    brand: string;
  };
  isp: string;
}

export default function GlobalMap() {
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    fetchGeolocation();
  }, []);

  const fetchGeolocation = async () => {
    try {
      const response = await fetch('/api/geolocation');
      const result = await response.json();

      if (result.success) {
        setGeoData(result.data);
      }
    } catch (error) {
      console.error('Geolocation error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!geoData) return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center z-0">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent mb-6"></div>
        <p className="text-white text-xl font-semibold animate-pulse">
          🗺️ {language === 'tr' ? 'Harita yükleniyor...' : 'Loading map...'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <LiveMap
        location={{
          latitude: geoData.location.latitude,
          longitude: geoData.location.longitude,
          city: geoData.location.city,
          country: geoData.location.country,
          ip: geoData.ip,
          device: `${geoData.device.brand} ${geoData.device.type}`,
          os: geoData.device.os,
          browser: geoData.device.browser,
          isp: geoData.isp,
          timezone: geoData.location.timezone
        }}
      />
      {/* Overlay for better readability - very light */}
      <div className="fixed inset-0 bg-black/10 z-[5] pointer-events-none"></div>
    </>
  );
}
