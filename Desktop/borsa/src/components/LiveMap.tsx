'use client';

import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  ip?: string;
  device?: string;
  os?: string;
  browser?: string;
  isp?: string;
  timezone?: string;
}

export default function LiveMap({ location }: { location: LocationData | null }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pinDropped, setPinDropped] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  // Translations for popup
  const translations = {
    en: {
      yourLocation: 'Your Location',
      ipAddress: 'IP Address',
      location: 'Location',
      coordinates: 'Coordinates',
      device: 'Device',
      os: 'OS',
      browser: 'Browser',
      isp: 'ISP',
      timezone: 'Timezone',
      secureConnection: 'Secure Connection',
      autoDetected: 'Auto-detected'
    },
    tr: {
      yourLocation: 'Konumunuz',
      ipAddress: 'IP Adresi',
      location: 'Konum',
      coordinates: 'Koordinatlar',
      device: 'Cihaz',
      os: 'İşletim Sistemi',
      browser: 'Tarayıcı',
      isp: 'İnternet Sağlayıcı',
      timezone: 'Saat Dilimi',
      secureConnection: 'Güvenli Bağlantı',
      autoDetected: 'Otomatik tespit'
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (!location) return;

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, [location]);

  useEffect(() => {
    if (!mapLoaded || !location || !mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Use default coordinates if location data is invalid
    const lat = location.latitude || 41.0082;
    const lng = location.longitude || 28.9784;

    // Create map
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView([lat, lng], 13);

    // Add dark theme tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Custom pin icon
    const pinIcon = L.divIcon({
      className: 'custom-pin',
      html: `
        <div class="pin-container">
          <svg width="40" height="50" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 0C11.7157 0 5 6.71573 5 15C5 26.25 20 50 20 50C20 50 35 26.25 35 15C35 6.71573 28.2843 0 20 0Z" fill="#10A37F"/>
            <circle cx="20" cy="15" r="6" fill="white"/>
            <circle cx="20" cy="15" r="3" fill="#10A37F"/>
          </svg>
          <div class="pin-pulse"></div>
        </div>
      `,
      iconSize: [40, 50],
      iconAnchor: [20, 50],
    });

    // Create popup content with location details
    const popupContent = `
      <div style="min-width: 280px; padding: 8px; font-family: system-ui;">
        <div style="border-bottom: 2px solid #10A37F; padding-bottom: 8px; margin-bottom: 12px;">
          <h3 style="margin: 0; color: #10A37F; font-size: 16px; font-weight: 600;">📍 ${t.yourLocation}</h3>
        </div>
        <div style="display: grid; gap: 8px; font-size: 13px;">
          ${location.ip ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #666; font-weight: 500;">${t.ipAddress}:</span>
              <code style="color: #10A37F; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${location.ip}</code>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: #666; font-weight: 500;">${t.location}:</span>
            <span style="color: #333; font-weight: 600;">${location.city}, ${location.country}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: #666; font-weight: 500;">${t.coordinates}:</span>
            <code style="color: #333; font-size: 11px;">${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</code>
          </div>
          ${location.device ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #666; font-weight: 500;">${t.device}:</span>
              <span style="color: #333;">${location.device}</span>
            </div>
          ` : ''}
          ${location.os ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #666; font-weight: 500;">${t.os}:</span>
              <span style="color: #333;">${location.os}</span>
            </div>
          ` : ''}
          ${location.browser ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #666; font-weight: 500;">${t.browser}:</span>
              <span style="color: #333;">${location.browser}</span>
            </div>
          ` : ''}
          ${location.isp ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #666; font-weight: 500;">${t.isp}:</span>
              <span style="color: #333; font-size: 11px;">${location.isp}</span>
            </div>
          ` : ''}
          ${location.timezone ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span style="color: #666; font-weight: 500;">${t.timezone}:</span>
              <span style="color: #333;">${location.timezone}</span>
            </div>
          ` : ''}
        </div>
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e0e0e0; text-align: center;">
          <span style="color: #999; font-size: 11px;">🔐 ${t.secureConnection} • ${t.autoDetected}</span>
        </div>
      </div>
    `;

    // Add marker with drop animation and popup
    const marker = L.marker([lat, lng], {
      icon: pinIcon,
      opacity: 0
    }).addTo(map);

    // Bind popup
    marker.bindPopup(popupContent, {
      maxWidth: 320,
      className: 'custom-popup'
    });

    // Animate pin drop
    setTimeout(() => {
      marker.setOpacity(1);
      setPinDropped(true);
      // Auto open popup after pin drops
      setTimeout(() => {
        marker.openPopup();
      }, 600);
    }, 500);

    // Add circle animation
    const circle = L.circle([lat, lng], {
      color: '#10A37F',
      fillColor: '#10A37F',
      fillOpacity: 0.1,
      radius: 500,
      weight: 2
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, [mapLoaded, location, language]); // Add language dependency to re-render popup on language change

  if (!location) return null;

  return (
    <>
      <div
        ref={mapRef}
        className="fixed inset-0 w-full h-full z-0"
        style={{ filter: 'brightness(0.8) contrast(1.2) saturate(1.1)' }}
      />
      <style jsx global>{`
        .custom-pin {
          background: transparent !important;
          border: none !important;
        }

        .pin-container {
          position: relative;
          animation: pinDrop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform: translateY(-100px);
          opacity: 0;
        }

        @keyframes pinDrop {
          0% {
            transform: translateY(-100px);
            opacity: 0;
          }
          60% {
            transform: translateY(10px);
            opacity: 1;
          }
          80% {
            transform: translateY(-5px);
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .pin-pulse {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 20px;
          background: rgba(16, 163, 127, 0.5);
          border-radius: 50%;
          animation: pulse 2s ease-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: translateX(-50%) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) scale(3);
            opacity: 0;
          }
        }

        .leaflet-container {
          background: #0a0a0a !important;
        }
      `}</style>
    </>
  );
}
