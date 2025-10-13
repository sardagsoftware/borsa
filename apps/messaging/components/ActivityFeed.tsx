/**
 * SHARD_10.5 - Activity Feed Component
 * Display recent user activities
 *
 * Security: No sensitive data, metadata only
 * White Hat: Audit trail for user
 */

'use client';

import React from 'react';
import { ActivityEvent } from '@/lib/dashboard/statistics';

interface ActivityFeedProps {
  activities: ActivityEvent[];
  maxItems?: number;
}

export default function ActivityFeed({ activities, maxItems = 20 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-12 text-[#6B7280]">
        <p className="text-lg mb-2">Henüz aktivite yok</p>
        <p className="text-sm">Mesajlaşmaya başladığınızda burada görünecek</p>
      </div>
    );
  }

  // Group by date
  const groupedActivities = groupByDate(displayActivities);

  return (
    <div className="space-y-6">
      {Object.entries(groupedActivities).map(([date, events]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-[#9CA3AF] mb-3 sticky top-0 bg-[#0B0F19] py-2">
            {formatDate(date)}
          </h3>
          <div className="space-y-2">
            {events.map((event) => (
              <ActivityItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityItem({ event }: { event: ActivityEvent }) {
  const icon = getEventIcon(event.type);
  const { text, color } = getEventDetails(event);
  const time = new Date(event.timestamp).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex items-start gap-3 p-3 bg-[#111827] border border-[#374151] rounded-lg hover:border-[#10A37F]/50 transition-all">
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#E5E7EB]">{text}</p>
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(event.metadata).map(([key, value]) => (
              <span key={key} className="text-xs text-[#6B7280]">
                {formatMetadata(key, value)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Time */}
      <span className="text-xs text-[#6B7280] flex-shrink-0">{time}</span>
    </div>
  );
}

function getEventIcon(type: ActivityEvent['type']): string {
  const icons: Record<ActivityEvent['type'], string> = {
    message: '💬',
    file: '📁',
    call: '📞',
    location: '📍',
    login: '🔐',
    device: '🖥️',
    settings: '⚙️'
  };
  return icons[type];
}

function getEventDetails(event: ActivityEvent): { text: string; color: string } {
  const colors: Record<ActivityEvent['type'], string> = {
    message: '#10A37F',
    file: '#3B82F6',
    call: '#8B5CF6',
    location: '#F59E0B',
    login: '#10B981',
    device: '#6366F1',
    settings: '#6B7280'
  };

  let text = '';

  switch (event.type) {
    case 'message':
      text = event.action === 'sent' ? 'Mesaj gönderdiniz' : 'Mesaj aldınız';
      break;
    case 'file':
      text = 'Dosya yüklediniz';
      break;
    case 'call':
      text = 'Arama yaptınız';
      break;
    case 'location':
      text = 'Konum paylaştınız';
      break;
    case 'login':
      text = 'Giriş yaptınız';
      break;
    case 'device':
      text = event.action === 'added' ? 'Yeni cihaz eklendi' : 'Cihaz kaldırıldı';
      break;
    case 'settings':
      text = 'Ayarları güncellediniz';
      break;
    default:
      text = event.action;
  }

  return { text, color: colors[event.type] };
}

function formatMetadata(key: string, value: any): string {
  if (key === 'size') {
    return formatBytes(value);
  }
  if (key === 'duration') {
    return `${value} dakika`;
  }
  return `${key}: ${value}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function groupByDate(activities: ActivityEvent[]): Record<string, ActivityEvent[]> {
  const groups: Record<string, ActivityEvent[]> = {};

  activities.forEach((event) => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
  });

  return groups;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = dateStr;
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateOnly === todayStr) {
    return 'Bugün';
  }
  if (dateOnly === yesterdayStr) {
    return 'Dün';
  }

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
}
