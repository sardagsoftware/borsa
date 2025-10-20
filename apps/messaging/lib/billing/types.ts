/**
 * SHARD_9.1 - Billing Types & Tier System
 * Subscription tiers and usage quotas
 *
 * Security: Client-side quota enforcement + server-side validation
 * White Hat: Fair usage, transparent pricing, no hidden limits
 */

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export interface TierLimits {
  // Messages
  messagesPerDay: number;
  messagesPerMonth: number;

  // Files
  maxFileSize: number; // bytes
  storageQuota: number; // bytes
  filesPerDay: number;

  // Calls
  callDurationPerDay: number; // minutes
  callDurationPerMonth: number; // minutes
  groupCallParticipants: number;

  // Location
  locationShareDuration: number; // minutes
  locationSharesPerDay: number;

  // Features
  canUseE2EECalls: boolean;
  canShareLiveLocation: boolean;
  canSendVoiceMessages: boolean;
  canUseCustomEmoji: boolean;
  prioritySupport: boolean;

  // Storage
  messageRetentionDays: number;
  fileRetentionDays: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  [SubscriptionTier.FREE]: {
    messagesPerDay: 100,
    messagesPerMonth: 2000,
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    storageQuota: 100 * 1024 * 1024, // 100 MB
    filesPerDay: 20,
    callDurationPerDay: 30, // 30 minutes
    callDurationPerMonth: 300, // 5 hours
    groupCallParticipants: 4,
    locationShareDuration: 15, // 15 minutes
    locationSharesPerDay: 5,
    canUseE2EECalls: true,
    canShareLiveLocation: true,
    canSendVoiceMessages: true,
    canUseCustomEmoji: false,
    prioritySupport: false,
    messageRetentionDays: 30,
    fileRetentionDays: 7
  },
  [SubscriptionTier.PRO]: {
    messagesPerDay: 1000,
    messagesPerMonth: 20000,
    maxFileSize: 100 * 1024 * 1024, // 100 MB
    storageQuota: 10 * 1024 * 1024 * 1024, // 10 GB
    filesPerDay: 200,
    callDurationPerDay: 240, // 4 hours
    callDurationPerMonth: 3600, // 60 hours
    groupCallParticipants: 25,
    locationShareDuration: 120, // 2 hours
    locationSharesPerDay: 50,
    canUseE2EECalls: true,
    canShareLiveLocation: true,
    canSendVoiceMessages: true,
    canUseCustomEmoji: true,
    prioritySupport: true,
    messageRetentionDays: 365,
    fileRetentionDays: 90
  },
  [SubscriptionTier.ENTERPRISE]: {
    messagesPerDay: Infinity,
    messagesPerMonth: Infinity,
    maxFileSize: 1024 * 1024 * 1024, // 1 GB
    storageQuota: 1024 * 1024 * 1024 * 1024, // 1 TB
    filesPerDay: Infinity,
    callDurationPerDay: Infinity,
    callDurationPerMonth: Infinity,
    groupCallParticipants: 100,
    locationShareDuration: Infinity,
    locationSharesPerDay: Infinity,
    canUseE2EECalls: true,
    canShareLiveLocation: true,
    canSendVoiceMessages: true,
    canUseCustomEmoji: true,
    prioritySupport: true,
    messageRetentionDays: Infinity,
    fileRetentionDays: Infinity
  }
};

export interface TierPricing {
  tier: SubscriptionTier;
  monthlyPrice: number; // USD
  yearlyPrice: number; // USD (discounted)
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
}

export const TIER_PRICING: Record<SubscriptionTier, Omit<TierPricing, 'billingPeriod'>> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'USD'
  },
  [SubscriptionTier.PRO]: {
    tier: SubscriptionTier.PRO,
    monthlyPrice: 9.99,
    yearlyPrice: 99.99, // ~17% discount
    currency: 'USD'
  },
  [SubscriptionTier.ENTERPRISE]: {
    tier: SubscriptionTier.ENTERPRISE,
    monthlyPrice: 49.99,
    yearlyPrice: 499.99, // ~17% discount
    currency: 'USD'
  }
};

export interface Subscription {
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  billingPeriod: 'monthly' | 'yearly';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface UsageRecord {
  userId: string;
  period: string; // YYYY-MM-DD
  messagesSent: number;
  filesUploaded: number;
  storageUsed: number; // bytes
  callMinutesUsed: number;
  locationSharesCreated: number;
  lastUpdated: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  resetAt?: number;
}
