'use client';

// 🟢 STATUS DOT COMPONENT - Animated status indicator
// Features: Color-coded, pulse animation, tooltip

import type { HealthStatus } from '@/types/health';
import { getStatusColor, getStatusEmoji } from '@/lib/health';

interface StatusDotProps {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  tooltip?: string;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export default function StatusDot({
  status,
  size = 'md',
  showPulse = true,
  tooltip,
  className = '',
}: StatusDotProps) {
  const color = getStatusColor(status);
  const emoji = getStatusEmoji(status);
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      title={tooltip || status}
    >
      {/* Pulse ring (only for down status) */}
      {showPulse && status === 'down' && (
        <span
          className={`absolute inline-flex ${sizeClass} rounded-full opacity-75 animate-ping`}
          style={{ backgroundColor: color }}
        />
      )}

      {/* Dot */}
      <span
        className={`relative inline-flex ${sizeClass} rounded-full`}
        style={{ backgroundColor: color }}
      />

      {/* Emoji overlay for accessibility */}
      <span className="sr-only">{emoji}</span>
    </div>
  );
}

/**
 * Status Badge with text
 */
interface StatusBadgeProps {
  status: HealthStatus;
  label?: string;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  className = '',
}: StatusBadgeProps) {
  const color = getStatusColor(status);
  const emoji = getStatusEmoji(status);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${className}`}
      style={{
        backgroundColor: `${color}15`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      <StatusDot status={status} size="sm" showPulse={false} />
      <span>
        {label || status.toUpperCase()}
      </span>
    </div>
  );
}

/**
 * Status Grid - Show multiple status dots
 */
interface StatusGridProps {
  statuses: Array<{ name: string; status: HealthStatus; url?: string }>;
  className?: string;
}

export function StatusGrid({ statuses, className = '' }: StatusGridProps) {
  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`}>
      {statuses.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900"
        >
          <StatusDot status={item.status} tooltip={item.name} />
          <span className="text-xs font-medium truncate">{item.name}</span>
        </div>
      ))}
    </div>
  );
}
