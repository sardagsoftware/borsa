/**
 * İnsan IQ - Persona Dashboard Component
 * Persona yönetimi ve AI asistan oluşturma
 *
 * White-Hat Policy: Real API calls, no mock data
 */

import React, { useState, useEffect } from 'react';

interface Persona {
  personaId: string;
  name: string;
  personality: string;
  expertise: string[];
  language: string;
  description: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export default function PersonaDashboard() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const languages = [
    { code: 'all', name: 'Tüm Diller' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'it', name: 'Italiano' },
    { code: 'ar', name: 'العربية' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ru', name: 'Русский' },
  ];

  useEffect(() => {
    fetchPersonas();
  }, [selectedLanguage]);

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiKey = process.env.NEXT_PUBLIC_LYDIAN_API_KEY || '';
      const params = new URLSearchParams({ limit: '50' });
      if (selectedLanguage !== 'all') {
        params.append('language', selectedLanguage);
      }

      const response = await fetch(`/api/v1/insan-iq/personas?${params.toString()}`, {
        headers: { 'X-API-Key': apiKey },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Personalar getirilemedi');
      }

      const data = await response.json();
      setPersonas(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      console.error('Error fetching personas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPersonalityBadgeColor = (personality: string): string => {
    const keywords = {
      friendly: 'bg-green-100 text-green-800',
      professional: 'bg-blue-100 text-blue-800',
      creative: 'bg-purple-100 text-purple-800',
      analytical: 'bg-gray-100 text-gray-800',
      helpful: 'bg-yellow-100 text-yellow-800',
    };

    for (const [keyword, color] of Object.entries(keywords)) {
      if (personality.toLowerCase().includes(keyword)) {
        return color;
      }
    }
    return 'bg-gray-100 text-gray-600';
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">İnsan IQ - Persona Yönetimi</h1>
            <p className="text-gray-600">AI asistanları için kişilik profilleri oluşturun ve yönetin</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Yeni Persona Oluştur
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Dil Filtresi:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <div className="text-sm text-gray-600">
            {personas.length} persona bulundu
          </div>
        </div>

        {/* Personas Grid */}
        {personas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz persona bulunamadı</h3>
            <p className="text-gray-600 mb-6">İlk personanızı oluşturarak başlayın</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Persona Oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <div
                key={persona.personaId}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{persona.name}</h3>
                    <span className="text-sm text-gray-500">{languages.find(l => l.code === persona.language)?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                </div>

                {/* Personality */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Kişilik:</div>
                  <div className="flex flex-wrap gap-2">
                    {persona.personality.split(',').slice(0, 3).map((trait, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getPersonalityBadgeColor(trait.trim())}`}
                      >
                        {trait.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expertise */}
                {persona.expertise.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Uzmanlık:</div>
                    <div className="flex flex-wrap gap-2">
                      {persona.expertise.slice(0, 4).map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {persona.expertise.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{persona.expertise.length - 4} daha
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {persona.description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{persona.description}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Oluşturulma: {new Date(persona.createdAt).toLocaleDateString('tr-TR')}</span>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      Detaylar →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
