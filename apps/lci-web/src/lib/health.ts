// 🏥 HEALTH MONITORING UTILITIES - Next.js TypeScript Implementation
// Ring buffer, metrics calculation, localStorage persistence

import type {
  HealthSnapshot,
  HealthRow,
  HealthTarget,
  HealthStatus,
  GroupMetrics,
  SLAConfig
} from '@/types/health';

const RING_BUFFER_KEY = 'lci_health_ring_buffer';
const MAX_SNAPSHOTS = 300; // ~5 hours at 60s interval
const QUOTA_WARNING_THRESHOLD = 0.9;

/**
 * Health monitoring targets configuration
 */
export const HEALTH_TARGETS: HealthTarget[] = [
  // Modules Group
  { name: 'Chat', url: '/chat.html', group: 'Modules' },
  { name: 'LydianIQ', url: '/lydian-iq.html', group: 'Modules' },
  { name: 'Medical', url: '/medical-expert.html', group: 'Modules' },
  { name: 'Legal', url: '/lydian-legal-search.html', group: 'Modules' },
  { name: 'AIAdvisor', url: '/ai-advisor-hub.html', group: 'Modules' },

  // Developers Group
  { name: 'API', url: '/api.html', group: 'Developers' },
  { name: 'Docs', url: '/docs.html', group: 'Developers' },
  { name: 'Console', url: '/console.html', group: 'Developers' },
  { name: 'Dashboard', url: '/dashboard.html', group: 'Developers' },

  // Company Group
  { name: 'About', url: '/about.html', group: 'Company' },
  { name: 'Careers', url: '/careers.html', group: 'Company' },
  { name: 'Contact', url: '/contact.html', group: 'Company' },
  { name: 'Blog', url: '/blog.html', group: 'Company' },
  { name: 'Help', url: '/help.html', group: 'Company' },
  { name: 'Status', url: '/status.html', group: 'Company' },
  { name: 'Privacy', url: '/privacy.html', group: 'Company' },
];

/**
 * Classify health status based on HTTP code
 */
export function classifyStatus(code: number): HealthStatus {
  if (code >= 200 && code < 300) return 'up';
  if (code >= 300 && code < 400) return 'warn';
  return 'down';
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: HealthStatus): string {
  const colors = {
    up: '#10B981', // Emerald 500
    warn: '#F59E0B', // Amber 500
    down: '#EF4444', // Red 500
  };
  return colors[status];
}

/**
 * Get status emoji
 */
export function getStatusEmoji(status: HealthStatus): string {
  const emojis = { up: '🟢', warn: '🟡', down: '🔴' };
  return emojis[status];
}

/**
 * Ring Buffer Management
 */
export class HealthRingBuffer {
  private static instance: HealthRingBuffer;

  private constructor() {}

  static getInstance(): HealthRingBuffer {
    if (!HealthRingBuffer.instance) {
      HealthRingBuffer.instance = new HealthRingBuffer();
    }
    return HealthRingBuffer.instance;
  }

  /**
   * Add snapshot to ring buffer
   */
  addSnapshot(snapshot: HealthSnapshot): void {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.getAllSnapshots();
      const updated = [...existing, snapshot];

      // Keep only last MAX_SNAPSHOTS
      const trimmed = updated.slice(-MAX_SNAPSHOTS);

      // Check quota before save
      if (this.checkQuota(trimmed)) {
        localStorage.setItem(RING_BUFFER_KEY, JSON.stringify(trimmed));
      } else {
        console.warn('localStorage quota warning, clearing old snapshots');
        // Keep only last 150 (half)
        const reduced = trimmed.slice(-150);
        localStorage.setItem(RING_BUFFER_KEY, JSON.stringify(reduced));
      }
    } catch (error) {
      console.error('Failed to save snapshot:', error);
      // Clear on quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clear();
      }
    }
  }

  /**
   * Get all snapshots from ring buffer
   */
  getAllSnapshots(): HealthSnapshot[] {
    if (typeof window === 'undefined') return [];

    try {
      const raw = localStorage.getItem(RING_BUFFER_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as HealthSnapshot[];
    } catch (error) {
      console.error('Failed to read snapshots:', error);
      return [];
    }
  }

  /**
   * Get recent snapshots (last N minutes)
   */
  getRecentSnapshots(minutes: number): HealthSnapshot[] {
    const all = this.getAllSnapshots();
    const cutoff = Date.now() - minutes * 60 * 1000;
    return all.filter(snap => snap.ts >= cutoff);
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(RING_BUFFER_KEY);
  }

  /**
   * Check localStorage quota
   */
  private checkQuota(snapshots: HealthSnapshot[]): boolean {
    const dataSize = JSON.stringify(snapshots).length;
    const quota = 5 * 1024 * 1024; // 5MB typical limit
    return dataSize < quota * QUOTA_WARNING_THRESHOLD;
  }

  /**
   * Get buffer stats
   */
  getStats(): {
    count: number;
    oldestTs: number | null;
    newestTs: number | null;
    sizeKB: number;
  } {
    const snapshots = this.getAllSnapshots();
    const sizeKB = Math.round(
      JSON.stringify(snapshots).length / 1024
    );

    return {
      count: snapshots.length,
      oldestTs: snapshots[0]?.ts || null,
      newestTs: snapshots[snapshots.length - 1]?.ts || null,
      sizeKB,
    };
  }
}

/**
 * Calculate uptime percentage for target
 */
export function calculateUptime(
  snapshots: HealthSnapshot[],
  targetName: string
): number {
  const samples = snapshots.flatMap(snap =>
    snap.items.filter(item => item.name === targetName)
  );

  if (samples.length === 0) return 0;

  const upCount = samples.filter(s => s.status === 'up').length;
  return (upCount / samples.length) * 100;
}

/**
 * Calculate P95 latency for target
 */
export function calculateP95Latency(
  snapshots: HealthSnapshot[],
  targetName: string
): number {
  const latencies = snapshots
    .flatMap(snap => snap.items.filter(item => item.name === targetName))
    .filter(item => item.status === 'up')
    .map(item => item.ms)
    .sort((a, b) => a - b);

  if (latencies.length === 0) return 0;

  const p95Index = Math.floor(latencies.length * 0.95);
  return latencies[p95Index] || 0;
}

/**
 * Get spark chart data for target
 */
export function getSparkData(
  snapshots: HealthSnapshot[],
  targetName: string,
  count: number = 20
): Array<{ ts: number; ms: number; status: HealthStatus }> {
  const recent = snapshots.slice(-count);
  return recent.map(snap => {
    const item = snap.items.find(i => i.name === targetName);
    return {
      ts: snap.ts,
      ms: item?.ms || 0,
      status: item?.status || 'down',
    };
  });
}

/**
 * Calculate group metrics
 */
export function calculateGroupMetrics(
  snapshots: HealthSnapshot[],
  targetNames: string[]
): GroupMetrics {
  const samples = snapshots.flatMap(snap =>
    snap.items.filter(item => targetNames.includes(item.name))
  );

  if (samples.length === 0) {
    return { uptimePct: 0, p95: 0, samples: 0 };
  }

  const upCount = samples.filter(s => s.status === 'up').length;
  const uptimePct = (upCount / samples.length) * 100;

  const latencies = samples
    .filter(s => s.status === 'up')
    .map(s => s.ms)
    .sort((a, b) => a - b);

  const p95Index = Math.floor(latencies.length * 0.95);
  const p95 = latencies[p95Index] || 0;

  return {
    uptimePct: Math.round(uptimePct * 10) / 10,
    p95: Math.round(p95),
    samples: samples.length,
  };
}

/**
 * Format duration (ms to human readable)
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
  return `${Math.floor(ms / 3600000)}h`;
}

/**
 * Format timestamp
 */
export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Fetch health data for all targets
 */
export async function fetchHealthData(
  baseUrl: string = ''
): Promise<HealthSnapshot> {
  const ts = Date.now();
  const items: HealthRow[] = [];

  for (const target of HEALTH_TARGETS) {
    const url = `${baseUrl}${target.url}`;
    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store',
      });

      const ms = Math.round(performance.now() - startTime);
      const status = classifyStatus(response.status);

      items.push({
        name: target.name,
        url: target.url,
        code: response.status,
        ms,
        status,
        err: null,
      });
    } catch (error) {
      const ms = Math.round(performance.now() - startTime);
      items.push({
        name: target.name,
        url: target.url,
        code: 0,
        ms,
        status: 'down',
        err: error instanceof Error ? error.message : 'Network error',
      });
    }
  }

  return { ts, items };
}
