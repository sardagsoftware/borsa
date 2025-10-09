/**
 * Create City Form Component
 * Form for creating new smart cities
 *
 * White-Hat Policy: Real API calls, proper validation
 */

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface CreateCityFormProps {
  onSuccess?: (city: any) => void;
  onCancel?: () => void;
}

export default function CreateCityForm({ onSuccess, onCancel }: CreateCityFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    population: '',
    timezone: 'Europe/Istanbul',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const timezones = [
    'Europe/Istanbul',
    'Europe/Athens',
    'Europe/Berlin',
    'Europe/London',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Asia/Dubai',
    'Asia/Singapore',
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Şehir adı gerekli';
    }

    const lat = parseFloat(formData.latitude);
    if (isNaN(lat)) {
      newErrors.latitude = 'Geçerli bir enlem girin';
    } else if (lat < -90 || lat > 90) {
      newErrors.latitude = 'Enlem -90 ile 90 arasında olmalı';
    }

    const lng = parseFloat(formData.longitude);
    if (isNaN(lng)) {
      newErrors.longitude = 'Geçerli bir boylam girin';
    } else if (lng < -180 || lng > 180) {
      newErrors.longitude = 'Boylam -180 ile 180 arasında olmalı';
    }

    const pop = parseInt(formData.population, 10);
    if (isNaN(pop) || pop <= 0) {
      newErrors.population = 'Geçerli bir nüfus girin';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_LYDIAN_API_KEY || '';
      const idempotencyKey = uuidv4();

      const response = await fetch('/api/v1/smart-cities/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          coordinates: {
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
          },
          population: parseInt(formData.population, 10),
          timezone: formData.timezone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Şehir oluşturulamadı');
      }

      const city = await response.json();

      // Reset form
      setFormData({
        name: '',
        latitude: '',
        longitude: '',
        population: '',
        timezone: 'Europe/Istanbul',
      });

      if (onSuccess) {
        onSuccess(city);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Bir hata oluştu');
      console.error('Error creating city:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Yeni Akıllı Şehir Oluştur</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* City Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Şehir Adı *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="örn. İstanbul Smart City"
            disabled={loading}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enlem (Latitude) *
            </label>
            <input
              type="number"
              step="0.0001"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.latitude ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="örn. 41.0082"
              disabled={loading}
            />
            {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Boylam (Longitude) *
            </label>
            <input
              type="number"
              step="0.0001"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.longitude ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="örn. 28.9784"
              disabled={loading}
            />
            {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
          </div>
        </div>

        {/* Population */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nüfus *
          </label>
          <input
            type="number"
            value={formData.population}
            onChange={(e) => setFormData({ ...formData, population: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.population ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="örn. 15840900"
            disabled={loading}
          />
          {errors.population && <p className="mt-1 text-sm text-red-600">{errors.population}</p>}
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Saat Dilimi *
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 px-6 py-2 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Oluşturuluyor...' : 'Şehir Oluştur'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
