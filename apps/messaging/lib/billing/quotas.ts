/**
 * SHARD_9.2 - Quota Management
 * Check and enforce usage limits
 *
 * Security: Client-side preview + server-side enforcement
 * White Hat: Transparent limits, clear upgrade paths
 */

import {
  SubscriptionTier,
  TierLimits,
  TIER_LIMITS,
  UsageRecord,
  QuotaCheckResult
} from './types';

/**
 * In-memory usage store (in production, use Redis/DB)
 */
const usageStore = new Map<string, UsageRecord>();

/**
 * Get user's tier limits
 */
export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier];
}

/**
 * Get current usage for user
 */
export function getCurrentUsage(userId: string): UsageRecord {
  const today = new Date().toISOString().split('T')[0];
  const key = `${userId}:${today}`;

  if (!usageStore.has(key)) {
    usageStore.set(key, {
      userId,
      period: today,
      messagesSent: 0,
      filesUploaded: 0,
      storageUsed: 0,
      callMinutesUsed: 0,
      locationSharesCreated: 0,
      lastUpdated: Date.now()
    });
  }

  return usageStore.get(key)!;
}

/**
 * Check if user can send message
 */
export function canSendMessage(
  userId: string,
  tier: SubscriptionTier
): QuotaCheckResult {
  const limits = getTierLimits(tier);
  const usage = getCurrentUsage(userId);

  if (usage.messagesSent >= limits.messagesPerDay) {
    return {
      allowed: false,
      reason: 'Günlük mesaj limitine ulaştınız',
      currentUsage: usage.messagesSent,
      limit: limits.messagesPerDay,
      resetAt: getEndOfDay()
    };
  }

  return { allowed: true };
}

/**
 * Check if user can upload file
 */
export function canUploadFile(
  userId: string,
  tier: SubscriptionTier,
  fileSize: number
): QuotaCheckResult {
  const limits = getTierLimits(tier);
  const usage = getCurrentUsage(userId);

  // Check file size limit
  if (fileSize > limits.maxFileSize) {
    return {
      allowed: false,
      reason: `Dosya boyutu limiti: ${formatBytes(limits.maxFileSize)}`,
      currentUsage: fileSize,
      limit: limits.maxFileSize
    };
  }

  // Check daily file count
  if (usage.filesUploaded >= limits.filesPerDay) {
    return {
      allowed: false,
      reason: 'Günlük dosya yükleme limitine ulaştınız',
      currentUsage: usage.filesUploaded,
      limit: limits.filesPerDay,
      resetAt: getEndOfDay()
    };
  }

  // Check storage quota
  if (usage.storageUsed + fileSize > limits.storageQuota) {
    return {
      allowed: false,
      reason: 'Depolama kotanız doldu',
      currentUsage: usage.storageUsed,
      limit: limits.storageQuota
    };
  }

  return { allowed: true };
}

/**
 * Check if user can make call
 */
export function canMakeCall(
  userId: string,
  tier: SubscriptionTier,
  durationMinutes: number = 0
): QuotaCheckResult {
  const limits = getTierLimits(tier);
  const usage = getCurrentUsage(userId);

  if (usage.callMinutesUsed + durationMinutes > limits.callDurationPerDay) {
    return {
      allowed: false,
      reason: 'Günlük arama süresi limitine ulaştınız',
      currentUsage: usage.callMinutesUsed,
      limit: limits.callDurationPerDay,
      resetAt: getEndOfDay()
    };
  }

  return { allowed: true };
}

/**
 * Check if user can share location
 */
export function canShareLocation(
  userId: string,
  tier: SubscriptionTier
): QuotaCheckResult {
  const limits = getTierLimits(tier);
  const usage = getCurrentUsage(userId);

  if (!limits.canShareLiveLocation) {
    return {
      allowed: false,
      reason: 'Bu özellik sizin planınızda mevcut değil'
    };
  }

  if (usage.locationSharesCreated >= limits.locationSharesPerDay) {
    return {
      allowed: false,
      reason: 'Günlük konum paylaşım limitine ulaştınız',
      currentUsage: usage.locationSharesCreated,
      limit: limits.locationSharesPerDay,
      resetAt: getEndOfDay()
    };
  }

  return { allowed: true };
}

/**
 * Track message sent
 */
export function trackMessageSent(userId: string): void {
  const usage = getCurrentUsage(userId);
  usage.messagesSent++;
  usage.lastUpdated = Date.now();
}

/**
 * Track file uploaded
 */
export function trackFileUploaded(userId: string, fileSize: number): void {
  const usage = getCurrentUsage(userId);
  usage.filesUploaded++;
  usage.storageUsed += fileSize;
  usage.lastUpdated = Date.now();
}

/**
 * Track call minutes
 */
export function trackCallMinutes(userId: string, minutes: number): void {
  const usage = getCurrentUsage(userId);
  usage.callMinutesUsed += minutes;
  usage.lastUpdated = Date.now();
}

/**
 * Track location share
 */
export function trackLocationShare(userId: string): void {
  const usage = getCurrentUsage(userId);
  usage.locationSharesCreated++;
  usage.lastUpdated = Date.now();
}

/**
 * Get usage percentage
 */
export function getUsagePercentage(
  current: number,
  limit: number
): number {
  if (limit === Infinity) return 0;
  return Math.min(100, (current / limit) * 100);
}

/**
 * Get time until reset
 */
export function getTimeUntilReset(): number {
  return getEndOfDay() - Date.now();
}

/**
 * Format time until reset
 */
export function formatTimeUntilReset(): string {
  const ms = getTimeUntilReset();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}s ${minutes}dk`;
  }
  return `${minutes}dk`;
}

/**
 * Get end of day timestamp
 */
function getEndOfDay(): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

/**
 * Format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === Infinity) return '∞';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format number
 */
export function formatNumber(num: number): string {
  if (num === Infinity) return '∞';
  return num.toLocaleString('tr-TR');
}

/**
 * Format storage
 */
export function formatStorage(bytes: number): string {
  return formatBytes(bytes);
}

/**
 * Reset daily usage (called at midnight)
 */
export function resetDailyUsage(): void {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Delete yesterday's records
  for (const [key] of usageStore.entries()) {
    if (key.includes(yesterdayStr)) {
      usageStore.delete(key);
    }
  }
}

/**
 * Get all usage for user (for dashboard)
 */
export function getUserUsageSummary(userId: string, tier: SubscriptionTier) {
  const usage = getCurrentUsage(userId);
  const limits = getTierLimits(tier);

  return {
    messages: {
      used: usage.messagesSent,
      limit: limits.messagesPerDay,
      percentage: getUsagePercentage(usage.messagesSent, limits.messagesPerDay)
    },
    files: {
      used: usage.filesUploaded,
      limit: limits.filesPerDay,
      percentage: getUsagePercentage(usage.filesUploaded, limits.filesPerDay)
    },
    storage: {
      used: usage.storageUsed,
      limit: limits.storageQuota,
      percentage: getUsagePercentage(usage.storageUsed, limits.storageQuota)
    },
    calls: {
      used: usage.callMinutesUsed,
      limit: limits.callDurationPerDay,
      percentage: getUsagePercentage(usage.callMinutesUsed, limits.callDurationPerDay)
    },
    locationShares: {
      used: usage.locationSharesCreated,
      limit: limits.locationSharesPerDay,
      percentage: getUsagePercentage(usage.locationSharesCreated, limits.locationSharesPerDay)
    },
    resetAt: getEndOfDay(),
    timeUntilReset: formatTimeUntilReset()
  };
}
