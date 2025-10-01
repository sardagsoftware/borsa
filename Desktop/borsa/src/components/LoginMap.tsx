'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom animated pin icon
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="position: relative;">
        <div class="pin-pulse"></div>
        <div style="
          font-size: 40px;
          line-height: 1;
          color: #10b981;
          filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.8));
          animation: dropPin 2s ease-out;
        ">📍</div>
      </div>
      <style>
        @keyframes dropPin {
          0% {
            transform: translateY(-300px) rotate(45deg);
            opacity: 0;
          }
          50% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          65% {
            transform: translateY(-15px) rotate(-5deg);
          }
          80% {
            transform: translateY(0) rotate(0deg);
          }
          90% {
            transform: translateY(-5px) rotate(2deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }
        .pin-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.4);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

function MapUpdater({ location }: { location: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([location.lat, location.lng], 13, {
      duration: 2,
      easeLinearity: 0.25
    });
  }, [location, map]);

  return null;
}

interface LoginMapProps {
  location: { lat: number; lng: number };
}

export default function LoginMap({ location }: LoginMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-full bg-slate-900/50 rounded-lg animate-pulse" />;
  }

  return (
    <MapContainer
      center={[location.lat, location.lng]}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[location.lat, location.lng]} icon={createCustomIcon()}>
        <Popup>
          <div className="text-center">
            <strong className="text-emerald-600">🎯 Konumunuz</strong>
            <br />
            <span className="text-xs text-slate-600">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          </div>
        </Popup>
      </Marker>
      <MapUpdater location={location} />
    </MapContainer>
  );
}