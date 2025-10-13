/**
 * SHARD_10.3 - Device List Component
 * Display and manage user devices
 *
 * Security: Revoke access, trust management
 * White Hat: Clear device info, easy removal
 */

'use client';

import React from 'react';
import { Device, getDeviceIcon, formatLastActive } from '@/lib/dashboard/devices';

interface DeviceListProps {
  devices: Device[];
  onTrustDevice?: (deviceId: string) => void;
  onUntrustDevice?: (deviceId: string) => void;
  onRemoveDevice?: (deviceId: string) => void;
}

export default function DeviceList({
  devices,
  onTrustDevice,
  onUntrustDevice,
  onRemoveDevice
}: DeviceListProps) {
  const [confirmRemove, setConfirmRemove] = React.useState<string | null>(null);

  const handleRemove = (deviceId: string) => {
    if (confirmRemove === deviceId) {
      onRemoveDevice?.(deviceId);
      setConfirmRemove(null);
    } else {
      setConfirmRemove(deviceId);
      setTimeout(() => setConfirmRemove(null), 3000);
    }
  };

  if (devices.length === 0) {
    return (
      <div className="text-center py-12 text-[#6B7280]">
        <p className="text-lg mb-2">Henüz cihaz yok</p>
        <p className="text-sm">İlk cihazınızı ekleyin</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {devices.map((device) => (
        <DeviceCard
          key={device.id}
          device={device}
          confirmRemove={confirmRemove === device.id}
          onTrust={() => onTrustDevice?.(device.id)}
          onUntrust={() => onUntrustDevice?.(device.id)}
          onRemove={() => handleRemove(device.id)}
        />
      ))}
    </div>
  );
}

function DeviceCard({
  device,
  confirmRemove,
  onTrust,
  onUntrust,
  onRemove
}: {
  device: Device;
  confirmRemove: boolean;
  onTrust: () => void;
  onUntrust: () => void;
  onRemove: () => void;
}) {
  const icon = getDeviceIcon(device.type);
  const lastActive = formatLastActive(device.lastActive);
  const isRecent = Date.now() - device.lastActive < 300000; // 5 minutes

  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-lg p-4 hover:border-[#10A37F]/50 transition-all">
      <div className="flex items-start gap-4">
        {/* Device Icon */}
        <div className="text-4xl">{icon}</div>

        {/* Device Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{device.name}</h3>
                {device.isCurrent && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#10A37F]/20 text-[#10A37F] font-semibold">
                    Aktif Cihaz
                  </span>
                )}
                {isRecent && !device.isCurrent && (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#10A37F] animate-pulse" />
                )}
              </div>
              <p className="text-sm text-[#9CA3AF]">{device.os}</p>
              {device.browser && <p className="text-xs text-[#6B7280]">{device.browser}</p>}
            </div>
          </div>

          {/* Location & IP */}
          {device.location && (
            <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-2">
              <span>📍</span>
              <span>
                {device.location.city}, {device.location.country}
              </span>
            </div>
          )}

          {/* Last Active */}
          <p className="text-xs text-[#9CA3AF] mb-3">{lastActive}</p>

          {/* Trust Status */}
          <div className="flex items-center gap-2 mb-3">
            {device.isTrusted ? (
              <div className="flex items-center gap-2 text-sm text-[#10A37F]">
                <span>✓</span>
                <span>Güvenilir Cihaz</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[#F59E0B]">
                <span>⚠️</span>
                <span>Güvenilir Değil</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {!device.isCurrent && (
            <div className="flex items-center gap-2">
              {device.isTrusted ? (
                <button
                  onClick={onUntrust}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[#374151] hover:bg-[#4B5563] text-white transition-colors"
                >
                  Güveni Kaldır
                </button>
              ) : (
                <button
                  onClick={onTrust}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[#10A37F] hover:bg-[#0D8F6E] text-white transition-colors"
                >
                  Güven
                </button>
              )}

              <button
                onClick={onRemove}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  confirmRemove
                    ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
                    : 'bg-[#374151] hover:bg-[#EF4444]/20 text-[#EF4444]'
                }`}
              >
                {confirmRemove ? 'Emin misiniz?' : 'Kaldır'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
