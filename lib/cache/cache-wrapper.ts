/**
 * Cache Wrapper Functions
 * High-level utilities for caching data fetching operations
 */

import { cache, CacheOptions } from './redis-client';

export interface WrapperOptions extends CacheOptions {
  /**
   * Function to generate cache key (if not provided, `key` will be used)
   */
  keyFn?: (...args: any[]) => string;

  /**
   * Whether to cache null/undefined values
   */
  cacheNull?: boolean;

  /**
   * Fallback function if cache fails
   */
  onCacheError?: (error: Error) => void;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

/**
 * Wrap a data fetching function with caching
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: WrapperOptions
): Promise<T> {
  const debug = options?.debug || false;

  try {
    // Try to get from cache first
    const cached = await cache.get<T>(key, options);

    if (cached !== null) {
      if (debug) console.log(`[Cache] HIT: ${key}`);
      return cached;
    }

    if (debug) console.log(`[Cache] MISS: ${key}`);

    // Cache miss - fetch fresh data
    const data = await fetcher();

    // Don't cache null/undefined unless explicitly allowed
    if (data === null || data === undefined) {
      if (!options?.cacheNull) {
        return data;
      }
    }

    // Store in cache
    await cache.set(key, data, options);

    return data;
  } catch (error) {
    console.error(`[Cache] Error with key "${key}":`, error);

    if (options?.onCacheError) {
      options.onCacheError(error as Error);
    }

    // Fallback to fresh fetch if cache fails
    return await fetcher();
  }
}

/**
 * Wrap a function with automatic cache key generation
 */
export function cacheFunction<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: WrapperOptions & { keyPrefix: string }
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    // Generate cache key
    const cacheKey = options.keyFn
      ? options.keyFn(...args)
      : `${options.keyPrefix}:${JSON.stringify(args)}`;

    return withCache(cacheKey, () => fn(...args), options);
  };
}

/**
 * Cache with tags for easier invalidation
 */
export async function withCacheTags<T>(
  key: string,
  tags: string[],
  fetcher: () => Promise<T>,
  options?: WrapperOptions
): Promise<T> {
  const result = await withCache(key, fetcher, options);

  // Store key in tag sets for later invalidation
  for (const tag of tags) {
    const tagKey = `tag:${tag}`;
    // Add key to tag set (would need Redis SET operations)
    // This is a simplified version - in production, use Redis SADD
  }

  return result;
}

/**
 * Invalidate all keys with specific tags
 */
export async function invalidateTags(tags: string[]): Promise<number> {
  let count = 0;

  for (const tag of tags) {
    // Get all keys for this tag and delete them
    const pattern = `tag:${tag}:*`;
    count += await cache.invalidatePattern(pattern);
  }

  return count;
}

/**
 * Memoize a function with cache
 * (In-memory cache for repeated calls within same request)
 */
export function memoize<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn {
  const cache = new Map<string, TReturn>();

  return (...args: TArgs): TReturn => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Cache with stale-while-revalidate pattern
 */
export async function withSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: WrapperOptions & { staleTime?: number }
): Promise<T> {
  const staleKey = `${key}:stale`;
  const staleTime = options?.staleTime || 60; // 1 minute stale time

  // Try to get fresh data
  const fresh = await cache.get<T>(key, options);
  if (fresh !== null) {
    return fresh;
  }

  // No fresh data, try stale
  const stale = await cache.get<T>(staleKey, options);

  if (stale !== null) {
    // Return stale data immediately
    // Revalidate in background
    setImmediate(async () => {
      try {
        const newData = await fetcher();
        await cache.set(key, newData, options);
        await cache.set(staleKey, newData, { ttl: (options?.ttl || 300) + staleTime });
      } catch (error) {
        console.error('[SWR] Revalidation failed:', error);
      }
    });

    return stale;
  }

  // No stale data either, fetch fresh
  const data = await fetcher();
  await cache.set(key, data, options);
  await cache.set(staleKey, data, { ttl: (options?.ttl || 300) + staleTime });

  return data;
}

/**
 * Batch multiple cache operations
 */
export async function batchGet<T>(
  keys: string[],
  options?: CacheOptions
): Promise<Map<string, T>> {
  const values = await cache.mget<T>(keys, options);

  const result = new Map<string, T>();
  keys.forEach((key, index) => {
    if (values[index] !== null) {
      result.set(key, values[index]!);
    }
  });

  return result;
}

/**
 * Batch set multiple cache values
 */
export async function batchSet(
  entries: Record<string, any>,
  options?: CacheOptions
): Promise<boolean> {
  return await cache.mset(entries, options);
}

/**
 * Create a cached getter with automatic refresh
 */
export function createCachedGetter<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: WrapperOptions & { refreshInterval?: number }
) {
  const refreshInterval = options.refreshInterval;

  if (refreshInterval) {
    // Set up automatic refresh
    setInterval(async () => {
      try {
        const data = await fetcher();
        await cache.set(key, data, options);
        console.log(`[Cache] Auto-refreshed: ${key}`);
      } catch (error) {
        console.error(`[Cache] Auto-refresh failed for ${key}:`, error);
      }
    }, refreshInterval * 1000);
  }

  return () => withCache(key, fetcher, options);
}
