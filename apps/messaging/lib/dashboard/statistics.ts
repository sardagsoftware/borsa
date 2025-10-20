/**
 * SHARD_10.2 - Usage Statistics
 * Track and analyze user activity
 *
 * Security: Metadata only, no message content
 * White Hat: Privacy-preserving analytics
 */

export interface DailyStats {
  date: string; // YYYY-MM-DD
  messagesSent: number;
  messagesReceived: number;
  filesShared: number;
  callsMade: number;
  callDurationMinutes: number;
  locationShares: number;
  activeMinutes: number;
}

export interface UserStats {
  userId: string;
  totalMessages: number;
  totalFiles: number;
  totalCalls: number;
  totalCallMinutes: number;
  storageUsed: number; // bytes
  accountCreated: number;
  lastActive: number;
  dailyStats: DailyStats[];
}

export interface ActivityEvent {
  id: string;
  userId: string;
  type: 'message' | 'file' | 'call' | 'location' | 'login' | 'device' | 'settings';
  action: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * In-memory stats store (in production, use time-series DB)
 */
const statsStore = new Map<string, UserStats>();
const activityStore = new Map<string, ActivityEvent[]>();

/**
 * Initialize user stats
 */
export function initializeStats(userId: string): UserStats {
  const stats: UserStats = {
    userId,
    totalMessages: 0,
    totalFiles: 0,
    totalCalls: 0,
    totalCallMinutes: 0,
    storageUsed: 0,
    accountCreated: Date.now(),
    lastActive: Date.now(),
    dailyStats: []
  };

  statsStore.set(userId, stats);
  return stats;
}

/**
 * Get user stats
 */
export function getUserStats(userId: string): UserStats {
  let stats = statsStore.get(userId);

  if (!stats) {
    stats = initializeStats(userId);
  }

  return stats;
}

/**
 * Get today's stats
 */
export function getTodayStats(userId: string): DailyStats {
  const stats = getUserStats(userId);
  const today = new Date().toISOString().split('T')[0];

  let todayStats = stats.dailyStats.find((s) => s.date === today);

  if (!todayStats) {
    todayStats = {
      date: today,
      messagesSent: 0,
      messagesReceived: 0,
      filesShared: 0,
      callsMade: 0,
      callDurationMinutes: 0,
      locationShares: 0,
      activeMinutes: 0
    };
    stats.dailyStats.push(todayStats);
  }

  return todayStats;
}

/**
 * Track message sent
 */
export function trackMessageSent(userId: string): void {
  const stats = getUserStats(userId);
  const today = getTodayStats(userId);

  stats.totalMessages++;
  stats.lastActive = Date.now();
  today.messagesSent++;

  logActivity(userId, 'message', 'sent');
}

/**
 * Track message received
 */
export function trackMessageReceived(userId: string): void {
  const stats = getUserStats(userId);
  const today = getTodayStats(userId);

  stats.totalMessages++;
  stats.lastActive = Date.now();
  today.messagesReceived++;
}

/**
 * Track file shared
 */
export function trackFileShared(userId: string, fileSize: number): void {
  const stats = getUserStats(userId);
  const today = getTodayStats(userId);

  stats.totalFiles++;
  stats.storageUsed += fileSize;
  stats.lastActive = Date.now();
  today.filesShared++;

  logActivity(userId, 'file', 'uploaded', { size: fileSize });
}

/**
 * Track call made
 */
export function trackCallMade(userId: string, durationMinutes: number): void {
  const stats = getUserStats(userId);
  const today = getTodayStats(userId);

  stats.totalCalls++;
  stats.totalCallMinutes += durationMinutes;
  stats.lastActive = Date.now();
  today.callsMade++;
  today.callDurationMinutes += durationMinutes;

  logActivity(userId, 'call', 'completed', { duration: durationMinutes });
}

/**
 * Track location share
 */
export function trackLocationShare(userId: string): void {
  const today = getTodayStats(userId);
  const stats = getUserStats(userId);

  stats.lastActive = Date.now();
  today.locationShares++;

  logActivity(userId, 'location', 'shared');
}

/**
 * Log activity event
 */
export function logActivity(
  userId: string,
  type: ActivityEvent['type'],
  action: string,
  metadata?: Record<string, any>
): void {
  const event: ActivityEvent = {
    id: crypto.randomUUID(),
    userId,
    type,
    action,
    timestamp: Date.now(),
    metadata
  };

  const activities = activityStore.get(userId) || [];
  activities.unshift(event); // Most recent first

  // Keep only last 100 events
  if (activities.length > 100) {
    activities.length = 100;
  }

  activityStore.set(userId, activities);
}

/**
 * Get recent activity
 */
export function getRecentActivity(userId: string, limit: number = 20): ActivityEvent[] {
  const activities = activityStore.get(userId) || [];
  return activities.slice(0, limit);
}

/**
 * Get last 7 days stats
 */
export function getWeeklyStats(userId: string): DailyStats[] {
  const stats = getUserStats(userId);
  const last7Days: string[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toISOString().split('T')[0]);
  }

  return last7Days.map((date) => {
    const existing = stats.dailyStats.find((s) => s.date === date);
    return (
      existing || {
        date,
        messagesSent: 0,
        messagesReceived: 0,
        filesShared: 0,
        callsMade: 0,
        callDurationMinutes: 0,
        locationShares: 0,
        activeMinutes: 0
      }
    );
  });
}

/**
 * Get last 30 days stats
 */
export function getMonthlyStats(userId: string): DailyStats[] {
  const stats = getUserStats(userId);
  const last30Days: string[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last30Days.push(date.toISOString().split('T')[0]);
  }

  return last30Days.map((date) => {
    const existing = stats.dailyStats.find((s) => s.date === date);
    return (
      existing || {
        date,
        messagesSent: 0,
        messagesReceived: 0,
        filesShared: 0,
        callsMade: 0,
        callDurationMinutes: 0,
        locationShares: 0,
        activeMinutes: 0
      }
    );
  });
}

/**
 * Calculate weekly growth
 */
export function calculateWeeklyGrowth(userId: string): {
  messages: number;
  files: number;
  calls: number;
} {
  const weeklyStats = getWeeklyStats(userId);

  const thisWeek = weeklyStats.slice(0, 7);
  const lastWeek = weeklyStats.slice(7, 14) || [];

  const thisWeekMessages = thisWeek.reduce((sum, s) => sum + s.messagesSent, 0);
  const lastWeekMessages = lastWeek.reduce((sum, s) => sum + s.messagesSent, 0);

  const thisWeekFiles = thisWeek.reduce((sum, s) => sum + s.filesShared, 0);
  const lastWeekFiles = lastWeek.reduce((sum, s) => sum + s.filesShared, 0);

  const thisWeekCalls = thisWeek.reduce((sum, s) => sum + s.callsMade, 0);
  const lastWeekCalls = lastWeek.reduce((sum, s) => sum + s.callsMade, 0);

  return {
    messages: lastWeekMessages === 0 ? 0 : ((thisWeekMessages - lastWeekMessages) / lastWeekMessages) * 100,
    files: lastWeekFiles === 0 ? 0 : ((thisWeekFiles - lastWeekFiles) / lastWeekFiles) * 100,
    calls: lastWeekCalls === 0 ? 0 : ((thisWeekCalls - lastWeekCalls) / lastWeekCalls) * 100
  };
}

/**
 * Get peak usage hours
 */
export function getPeakUsageHours(userId: string): number[] {
  const activities = getRecentActivity(userId, 100);
  const hourCounts = new Array(24).fill(0);

  activities.forEach((event) => {
    const hour = new Date(event.timestamp).getHours();
    hourCounts[hour]++;
  });

  return hourCounts;
}

/**
 * Get most active day
 */
export function getMostActiveDay(userId: string): { date: string; activity: number } | null {
  const weeklyStats = getWeeklyStats(userId);

  if (weeklyStats.length === 0) return null;

  const mostActive = weeklyStats.reduce((max, stat) => {
    const activity = stat.messagesSent + stat.messagesReceived + stat.filesShared + stat.callsMade;
    const maxActivity = max.messagesSent + max.messagesReceived + max.filesShared + max.callsMade;

    return activity > maxActivity ? stat : max;
  });

  const activity =
    mostActive.messagesSent + mostActive.messagesReceived + mostActive.filesShared + mostActive.callsMade;

  return {
    date: mostActive.date,
    activity
  };
}

/**
 * Format activity event for display
 */
export function formatActivityEvent(event: ActivityEvent): string {
  const time = new Date(event.timestamp).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const icons = {
    message: '💬',
    file: '📁',
    call: '📞',
    location: '📍',
    login: '🔐',
    device: '🖥️',
    settings: '⚙️'
  };

  const icon = icons[event.type];
  const actionText = getActionText(event);

  return `${icon} ${actionText} - ${time}`;
}

/**
 * Get action text
 */
function getActionText(event: ActivityEvent): string {
  switch (event.type) {
    case 'message':
      return event.action === 'sent' ? 'Mesaj gönderildi' : 'Mesaj alındı';
    case 'file':
      return `Dosya yüklendi${event.metadata?.size ? ` (${formatBytes(event.metadata.size)})` : ''}`;
    case 'call':
      return `Arama tamamlandı${event.metadata?.duration ? ` (${event.metadata.duration}dk)` : ''}`;
    case 'location':
      return 'Konum paylaşıldı';
    case 'login':
      return 'Giriş yapıldı';
    case 'device':
      return event.action === 'added' ? 'Yeni cihaz eklendi' : 'Cihaz kaldırıldı';
    case 'settings':
      return 'Ayarlar güncellendi';
    default:
      return event.action;
  }
}

/**
 * Format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Clean old stats (keep last 90 days)
 */
export function cleanOldStats(userId: string): void {
  const stats = getUserStats(userId);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  stats.dailyStats = stats.dailyStats.filter((s) => s.date >= cutoffStr);
}
