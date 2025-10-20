/**
 * SHARD_9.3 - Entitlements System
 * Feature access and subscription management
 *
 * Security: JWT-based entitlement tokens
 * White Hat: Clear feature gating, upgrade prompts
 */

import {
  SubscriptionTier,
  Subscription,
  TierLimits,
  TIER_LIMITS,
  TIER_PRICING
} from './types';

/**
 * In-memory subscription store (in production, use DB)
 */
const subscriptionStore = new Map<string, Subscription>();

/**
 * Create default free subscription
 */
export function createFreeSubscription(userId: string): Subscription {
  const now = Date.now();
  const subscription: Subscription = {
    userId,
    tier: SubscriptionTier.FREE,
    status: 'active',
    billingPeriod: 'monthly',
    currentPeriodStart: now,
    currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000, // 30 days
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now
  };

  subscriptionStore.set(userId, subscription);
  return subscription;
}

/**
 * Create trial subscription (7 days Pro trial)
 */
export function createTrialSubscription(userId: string): Subscription {
  const now = Date.now();
  const trialEnd = now + 7 * 24 * 60 * 60 * 1000; // 7 days

  const subscription: Subscription = {
    userId,
    tier: SubscriptionTier.PRO,
    status: 'trial',
    billingPeriod: 'monthly',
    currentPeriodStart: now,
    currentPeriodEnd: trialEnd,
    cancelAtPeriodEnd: false,
    trialEndsAt: trialEnd,
    createdAt: now,
    updatedAt: now
  };

  subscriptionStore.set(userId, subscription);
  return subscription;
}

/**
 * Upgrade subscription
 */
export function upgradeSubscription(
  userId: string,
  newTier: SubscriptionTier,
  billingPeriod: 'monthly' | 'yearly'
): Subscription {
  const existing = getSubscription(userId);
  const now = Date.now();
  const periodLength = billingPeriod === 'monthly'
    ? 30 * 24 * 60 * 60 * 1000
    : 365 * 24 * 60 * 60 * 1000;

  const subscription: Subscription = {
    userId,
    tier: newTier,
    status: 'active',
    billingPeriod,
    currentPeriodStart: now,
    currentPeriodEnd: now + periodLength,
    cancelAtPeriodEnd: false,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  subscriptionStore.set(userId, subscription);
  return subscription;
}

/**
 * Cancel subscription (at period end)
 */
export function cancelSubscription(userId: string): Subscription {
  const subscription = getSubscription(userId);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  subscription.cancelAtPeriodEnd = true;
  subscription.updatedAt = Date.now();

  subscriptionStore.set(userId, subscription);
  return subscription;
}

/**
 * Reactivate cancelled subscription
 */
export function reactivateSubscription(userId: string): Subscription {
  const subscription = getSubscription(userId);

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  subscription.cancelAtPeriodEnd = false;
  subscription.updatedAt = Date.now();

  subscriptionStore.set(userId, subscription);
  return subscription;
}

/**
 * Get subscription for user
 */
export function getSubscription(userId: string): Subscription {
  let subscription = subscriptionStore.get(userId);

  // Create free subscription if none exists
  if (!subscription) {
    subscription = createFreeSubscription(userId);
  }

  // Check if trial expired
  if (subscription.status === 'trial' && subscription.trialEndsAt) {
    if (Date.now() > subscription.trialEndsAt) {
      // Downgrade to free
      subscription = upgradeSubscription(userId, SubscriptionTier.FREE, 'monthly');
    }
  }

  // Check if subscription expired
  if (Date.now() > subscription.currentPeriodEnd) {
    if (subscription.cancelAtPeriodEnd) {
      subscription.status = 'expired';
      // Downgrade to free
      subscription = upgradeSubscription(userId, SubscriptionTier.FREE, 'monthly');
    } else {
      // Auto-renew (in production, charge payment method)
      const periodLength = subscription.billingPeriod === 'monthly'
        ? 30 * 24 * 60 * 60 * 1000
        : 365 * 24 * 60 * 60 * 1000;

      subscription.currentPeriodStart = subscription.currentPeriodEnd;
      subscription.currentPeriodEnd += periodLength;
      subscription.updatedAt = Date.now();
      subscriptionStore.set(userId, subscription);
    }
  }

  return subscription;
}

/**
 * Check if user has feature access
 */
export function hasFeatureAccess(
  userId: string,
  feature: keyof TierLimits
): boolean {
  const subscription = getSubscription(userId);
  const limits = TIER_LIMITS[subscription.tier];

  const value = limits[feature];

  // Boolean features
  if (typeof value === 'boolean') {
    return value;
  }

  // Numeric features (check if > 0)
  if (typeof value === 'number') {
    return value > 0;
  }

  return false;
}

/**
 * Get feature value
 */
export function getFeatureLimit<K extends keyof TierLimits>(
  userId: string,
  feature: K
): TierLimits[K] {
  const subscription = getSubscription(userId);
  const limits = TIER_LIMITS[subscription.tier];
  return limits[feature];
}

/**
 * Check if user is on trial
 */
export function isOnTrial(userId: string): boolean {
  const subscription = getSubscription(userId);
  return subscription.status === 'trial';
}

/**
 * Get trial days remaining
 */
export function getTrialDaysRemaining(userId: string): number {
  const subscription = getSubscription(userId);

  if (subscription.status !== 'trial' || !subscription.trialEndsAt) {
    return 0;
  }

  const remaining = subscription.trialEndsAt - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

/**
 * Get days until renewal
 */
export function getDaysUntilRenewal(userId: string): number {
  const subscription = getSubscription(userId);
  const remaining = subscription.currentPeriodEnd - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

/**
 * Get subscription info for UI
 */
export function getSubscriptionInfo(userId: string) {
  const subscription = getSubscription(userId);
  const limits = TIER_LIMITS[subscription.tier];
  const pricing = TIER_PRICING[subscription.tier];

  const isActive = subscription.status === 'active' || subscription.status === 'trial';
  const willCancel = subscription.cancelAtPeriodEnd;

  let statusText = '';
  if (subscription.status === 'trial') {
    const daysLeft = getTrialDaysRemaining(userId);
    statusText = `${daysLeft} günlük deneme süresi kaldı`;
  } else if (subscription.status === 'active') {
    const daysLeft = getDaysUntilRenewal(userId);
    if (willCancel) {
      statusText = `${daysLeft} gün sonra iptal edilecek`;
    } else {
      statusText = `${daysLeft} gün sonra yenilenecek`;
    }
  } else if (subscription.status === 'expired') {
    statusText = 'Süresi doldu';
  } else if (subscription.status === 'cancelled') {
    statusText = 'İptal edildi';
  }

  return {
    tier: subscription.tier,
    tierName: getTierName(subscription.tier),
    status: subscription.status,
    statusText,
    billingPeriod: subscription.billingPeriod,
    price: subscription.billingPeriod === 'monthly'
      ? pricing.monthlyPrice
      : pricing.yearlyPrice,
    currency: pricing.currency,
    isActive,
    willCancel,
    currentPeriodEnd: subscription.currentPeriodEnd,
    limits,
    features: getFeatureList(subscription.tier)
  };
}

/**
 * Get tier name for display
 */
function getTierName(tier: SubscriptionTier): string {
  switch (tier) {
    case SubscriptionTier.FREE:
      return 'Ücretsiz';
    case SubscriptionTier.PRO:
      return 'Pro';
    case SubscriptionTier.ENTERPRISE:
      return 'Enterprise';
  }
}

/**
 * Get feature list for tier
 */
function getFeatureList(tier: SubscriptionTier): string[] {
  const limits = TIER_LIMITS[tier];
  const features: string[] = [];

  if (tier === SubscriptionTier.FREE) {
    features.push(`${limits.messagesPerDay} mesaj/gün`);
    features.push(`${(limits.maxFileSize / (1024 * 1024)).toFixed(0)} MB dosya boyutu`);
    features.push(`${limits.callDurationPerDay} dakika arama/gün`);
    features.push(`${limits.groupCallParticipants} kişilik grup araması`);
    features.push('Temel özellikler');
  } else if (tier === SubscriptionTier.PRO) {
    features.push(`${limits.messagesPerDay} mesaj/gün`);
    features.push(`${(limits.maxFileSize / (1024 * 1024)).toFixed(0)} MB dosya boyutu`);
    features.push(`${(limits.storageQuota / (1024 * 1024 * 1024)).toFixed(0)} GB depolama`);
    features.push(`${limits.callDurationPerDay} dakika arama/gün`);
    features.push(`${limits.groupCallParticipants} kişilik grup araması`);
    features.push('Özel emoji');
    features.push('Öncelikli destek');
    features.push('Gelişmiş özellikler');
  } else {
    features.push('Sınırsız mesajlaşma');
    features.push('1 GB dosya boyutu');
    features.push('1 TB depolama');
    features.push('Sınırsız arama süresi');
    features.push('100 kişilik grup araması');
    features.push('Tüm premium özellikler');
    features.push('Öncelikli 7/24 destek');
    features.push('SLA garantisi');
  }

  return features;
}

/**
 * Get upgrade recommendation
 */
export function getUpgradeRecommendation(userId: string): {
  shouldUpgrade: boolean;
  reason: string;
  recommendedTier: SubscriptionTier;
} | null {
  const subscription = getSubscription(userId);

  if (subscription.tier === SubscriptionTier.ENTERPRISE) {
    return null; // Already on highest tier
  }

  if (subscription.tier === SubscriptionTier.FREE) {
    return {
      shouldUpgrade: true,
      reason: 'Daha fazla mesaj, daha büyük dosyalar ve öncelikli destek için Pro plana yükseltin',
      recommendedTier: SubscriptionTier.PRO
    };
  }

  if (subscription.tier === SubscriptionTier.PRO) {
    return {
      shouldUpgrade: true,
      reason: 'Sınırsız kullanım ve kurumsal özellikler için Enterprise plana yükseltin',
      recommendedTier: SubscriptionTier.ENTERPRISE
    };
  }

  return null;
}
