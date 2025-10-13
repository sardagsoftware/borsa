/**
 * SHARD_8.3 - Location Map Component
 * Interactive map with live location markers
 */

import React from 'react';
import { Location } from '@/lib/location/geolocation';

interface LocationMapProps {
  userLocation?: Location;
  otherLocations?: Array<{
    id: string;
    name: string;
    location: Location;
    color: string;
  }>;
  zoom?: number;
  height?: string;
  showControls?: boolean;
}

export default function LocationMap({
  userLocation,
  otherLocations = [],
  zoom = 15,
  height = '400px',
  showControls = true
}: LocationMapProps) {
  const [mapZoom, setMapZoom] = React.useState(zoom);

  // Center on user location or first other location
  const center = userLocation || otherLocations[0]?.location || {
    latitude: 41.0082,
    longitude: 28.9784 // Istanbul default
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-[#374151]" style={{ height }}>
      {/* Map Canvas */}
      <div className="absolute inset-0 bg-[#1F2937]">
        {/* Simplified map visualization (in production, use Mapbox/Leaflet) */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full"
          style={{
            transform: `scale(${mapZoom / 15})`
          }}
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#374151"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="400" height="400" fill="url(#grid)" />

          {/* User location marker */}
          {userLocation && (
            <g transform="translate(200, 200)">
              <circle
                cx="0"
                cy="0"
                r="20"
                fill="#10A37F"
                fillOpacity="0.3"
                className="animate-ping"
              />
              <circle cx="0" cy="0" r="8" fill="#10A37F" />
              <circle cx="0" cy="0" r="3" fill="white" />
            </g>
          )}

          {/* Other locations */}
          {otherLocations.map((loc, i) => {
            // Simple positioning (in production, calculate from lat/lon)
            const x = 200 + (i + 1) * 40;
            const y = 200 - (i + 1) * 30;

            return (
              <g key={loc.id} transform={`translate(${x}, ${y})`}>
                <circle
                  cx="0"
                  cy="0"
                  r="15"
                  fill={loc.color}
                  fillOpacity="0.3"
                />
                <circle cx="0" cy="0" r="6" fill={loc.color} />
                <text
                  x="0"
                  y="-20"
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {loc.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-8 h-8 border-2 border-white rounded-full" />
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => setMapZoom(prev => Math.min(prev + 2, 20))}
            className="w-10 h-10 bg-[#111827] border border-[#374151] rounded-lg flex items-center justify-center hover:bg-[#1F2937] transition-colors"
          >
            +
          </button>
          <button
            onClick={() => setMapZoom(prev => Math.max(prev - 2, 5))}
            className="w-10 h-10 bg-[#111827] border border-[#374151] rounded-lg flex items-center justify-center hover:bg-[#1F2937] transition-colors"
          >
            −
          </button>
          <button
            onClick={() => setMapZoom(15)}
            className="w-10 h-10 bg-[#111827] border border-[#374151] rounded-lg flex items-center justify-center hover:bg-[#1F2937] transition-colors text-xs"
          >
            📍
          </button>
        </div>
      )}

      {/* Location info overlay */}
      {userLocation && (
        <div className="absolute bottom-4 left-4 bg-[#111827] border border-[#374151] rounded-lg p-3 text-sm max-w-xs">
          <div className="font-semibold mb-1">📍 Konumunuz</div>
          <div className="text-[#9CA3AF] text-xs space-y-1">
            <div>Lat: {userLocation.latitude.toFixed(6)}</div>
            <div>Lon: {userLocation.longitude.toFixed(6)}</div>
            <div>Doğruluk: ±{Math.round(userLocation.accuracy)}m</div>
            {userLocation.speed && (
              <div>Hız: {(userLocation.speed * 3.6).toFixed(1)} km/s</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
