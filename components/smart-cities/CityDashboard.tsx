/**
 * Smart Cities Dashboard Component
 * Real-time city metrics visualization
 *
 * White-Hat Policy: Real API calls, no mock data
 */

import React, { useState, useEffect } from 'react';

interface City {
  cityId: string;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  population: number;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

interface CityMetrics {
  cityId: string;
  timestamp: string;
  traffic: {
    congestionLevel: number;
    avgSpeed: number;
    incidents: number;
  };
  energy: {
    totalConsumption: number;
    renewablePercentage: number;
    gridLoad: number;
  };
  air: {
    aqi: number;
    pm25: number;
    pm10: number;
    co2: number;
  };
  water: {
    consumption: number;
    qualityIndex: number;
    pressure: number;
  };
}

export default function CityDashboard() {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [metrics, setMetrics] = useState<CityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cities on mount
  useEffect(() => {
    fetchCities();
  }, []);

  // Fetch metrics when city is selected
  useEffect(() => {
    if (selectedCity) {
      fetchMetrics(selectedCity.cityId);
      // Refresh metrics every 30 seconds
      const interval = setInterval(() => {
        fetchMetrics(selectedCity.cityId);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedCity]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiKey = process.env.NEXT_PUBLIC_LYDIAN_API_KEY || '';
      const response = await fetch('/api/v1/smart-cities/cities?limit=50', {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch cities');
      }

      const data = await response.json();
      setCities(data.data || []);

      // Auto-select first city
      if (data.data && data.data.length > 0) {
        setSelectedCity(data.data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async (cityId: string) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_LYDIAN_API_KEY || '';
      const response = await fetch(`/api/v1/smart-cities/cities/${cityId}/metrics`, {
        headers: {
          'X-API-Key': apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  const getAQIStatus = (aqi: number): { label: string; color: string } => {
    if (aqi <= 50) return { label: 'İyi', color: 'text-green-600' };
    if (aqi <= 100) return { label: 'Orta', color: 'text-yellow-600' };
    if (aqi <= 150) return { label: 'Hassas Gruplar için Sağlıksız', color: 'text-orange-600' };
    if (aqi <= 200) return { label: 'Sağlıksız', color: 'text-red-600' };
    if (aqi <= 300) return { label: 'Çok Sağlıksız', color: 'text-purple-600' };
    return { label: 'Tehlikeli', color: 'text-red-900' };
  };

  const getCongestionStatus = (level: number): { label: string; color: string } => {
    if (level < 25) return { label: 'Akıcı', color: 'text-green-600' };
    if (level < 50) return { label: 'Yoğun', color: 'text-yellow-600' };
    if (level < 75) return { label: 'Çok Yoğun', color: 'text-orange-600' };
    return { label: 'Kilitlenmiş', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Hata: {error}</div>
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Henüz şehir bulunamadı.</div>
      </div>
    );
  }

  const aqiStatus = metrics ? getAQIStatus(metrics.air.aqi) : null;
  const congestionStatus = metrics ? getCongestionStatus(metrics.traffic.congestionLevel) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Akıllı Şehirler Kontrol Paneli</h1>
          <p className="text-gray-600">Gerçek zamanlı şehir metrikleri ve izleme</p>
        </div>

        {/* City Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Şehir Seçin</label>
          <select
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedCity?.cityId || ''}
            onChange={(e) => {
              const city = cities.find((c) => c.cityId === e.target.value);
              setSelectedCity(city || null);
            }}
          >
            {cities.map((city) => (
              <option key={city.cityId} value={city.cityId}>
                {city.name} - {city.population.toLocaleString('tr-TR')} kişi
              </option>
            ))}
          </select>
        </div>

        {selectedCity && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedCity.name}</h2>
            <div className="text-gray-600">
              <p>Nüfus: {selectedCity.population.toLocaleString('tr-TR')}</p>
              <p>Konum: {selectedCity.coordinates.latitude.toFixed(4)}, {selectedCity.coordinates.longitude.toFixed(4)}</p>
              <p>Saat Dilimi: {selectedCity.timezone}</p>
            </div>
          </div>
        )}

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Traffic Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Trafik</h3>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Yoğunluk</div>
                  <div className={`text-2xl font-bold ${congestionStatus?.color}`}>
                    {metrics.traffic.congestionLevel.toFixed(1)}%
                  </div>
                  <div className={`text-sm ${congestionStatus?.color}`}>{congestionStatus?.label}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ortalama Hız</div>
                  <div className="text-xl font-semibold">{metrics.traffic.avgSpeed.toFixed(1)} km/s</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Aktif Olaylar</div>
                  <div className="text-xl font-semibold">{metrics.traffic.incidents}</div>
                </div>
              </div>
            </div>

            {/* Energy Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Enerji</h3>
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Toplam Tüketim</div>
                  <div className="text-2xl font-bold">{(metrics.energy.totalConsumption / 1000).toFixed(1)} MW</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Yenilenebilir Enerji</div>
                  <div className="text-xl font-semibold text-green-600">
                    {metrics.energy.renewablePercentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Şebeke Yükü</div>
                  <div className="text-xl font-semibold">{metrics.energy.gridLoad.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Air Quality Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Hava Kalitesi</h3>
                <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Hava Kalitesi İndeksi</div>
                  <div className={`text-2xl font-bold ${aqiStatus?.color}`}>{metrics.air.aqi}</div>
                  <div className={`text-sm ${aqiStatus?.color}`}>{aqiStatus?.label}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">PM2.5</div>
                  <div className="text-xl font-semibold">{metrics.air.pm25.toFixed(1)} µg/m³</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">CO2</div>
                  <div className="text-xl font-semibold">{metrics.air.co2.toFixed(1)} ppm</div>
                </div>
              </div>
            </div>

            {/* Water Metrics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Su</h3>
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Tüketim</div>
                  <div className="text-2xl font-bold">{(metrics.water.consumption / 1000).toFixed(1)} m³</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Su Kalitesi</div>
                  <div className="text-xl font-semibold text-green-600">
                    {metrics.water.qualityIndex.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Basınç</div>
                  <div className="text-xl font-semibold">{metrics.water.pressure.toFixed(1)} bar</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {metrics && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Son güncelleme: {new Date(metrics.timestamp).toLocaleString('tr-TR')}
          </div>
        )}
      </div>
    </div>
  );
}
