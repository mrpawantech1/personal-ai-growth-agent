import { logger } from './logger';

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

// In-memory cache (for development and fallback)
const memoryCache = new Map<string, CacheEntry>();

/**
 * Cache class with support for in-memory and Redis (if available)
 */
export class Cache {
  private prefix: string;
  private ttl: number; // seconds

  constructor(prefix: string = 'app', ttl: number = 300) {
    this.prefix = prefix;
    this.ttl = ttl;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const cacheKey = this.getKey(key);

    // Check memory cache first
    if (memoryCache.has(cacheKey)) {
      const entry = memoryCache.get(cacheKey)!;
      if (entry.expiresAt > Date.now()) {
        logger.debug('Cache: Memory hit', { key: cacheKey });
        return entry.value as T;
      } else {
        memoryCache.delete(cacheKey);
      }
    }

    // Try Redis if available (optional)
    if (process.env.REDIS_URL) {
      try {
        const { kv } = await import('@vercel/kv');
        const value = await kv.get<T>(cacheKey);
        if (value !== null && value !== undefined) {
          logger.debug('Cache: Redis hit', { key: cacheKey });
          return value;
        }
      } catch (error) {
        logger.warn('Cache: Redis error, falling back to memory', { error });
      }
    }

    logger.debug('Cache: Miss', { key: cacheKey });
    return null;
  }

  /**
   * Set a value in cache
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const cacheKey = this.getKey(key);
    const ttlSeconds = ttl || this.ttl;

    // Store in memory
    memoryCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Store in Redis if available
    if (process.env.REDIS_URL) {
      try {
        const { kv } = await import('@vercel/kv');
        await kv.set(cacheKey, value, { ex: ttlSeconds });
        logger.debug('Cache: Redis set', { key: cacheKey, ttl: ttlSeconds });
      } catch (error) {
        logger.warn('Cache: Redis set error', { error });
      }
    }

    logger.debug('Cache: Set', { key: cacheKey, ttl: ttlSeconds });
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    const cacheKey = this.getKey(key);
    memoryCache.delete(cacheKey);

    if (process.env.REDIS_URL) {
      try {
        const { kv } = await import('@vercel/kv');
        await kv.del(cacheKey);
        logger.debug('Cache: Redis delete', { key: cacheKey });
      } catch (error) {
        logger.warn('Cache: Redis delete error', { error });
      }
    }

    logger.debug('Cache: Deleted', { key: cacheKey });
  }

  /**
   * Clear all cache with this prefix
   */
  async clear(): Promise<void> {
    const keys: string[] = [];
    for (const key of memoryCache.keys()) {
      if (key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      memoryCache.delete(key);
    }

    if (process.env.REDIS_URL) {
      try {
        const { kv } = await import('@vercel/kv');
        const keys = await kv.keys(`${this.prefix}:*`);
        if (keys.length > 0) {
          await kv.del(...keys);
        }
        logger.debug('Cache: Redis clear', { count: keys.length });
      } catch (error) {
        logger.warn('Cache: Redis clear error', { error });
      }
    }

    logger.debug('Cache: Cleared', { prefix: this.prefix });
  }

  /**
   * Get or set cache (with fetch function)
   */
  async getOrSet<T = any>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }
}

// Singleton instances
export const defaultCache = new Cache('growth-agent', 300);
export const trendCache = new Cache('trends', 3600); // 1 hour
export const analyticsCache = new Cache('analytics', 1800); // 30 minutes

/**
 * Helper: Cache decorator for methods
 * (Use with caution in classes)
 */
export function cached(ttl: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = new Cache(`method:${propertyKey}`, ttl);

    descriptor.value = async function (...args: any[]) {
      const key = JSON.stringify(args);
      return cache.getOrSet(key, () => originalMethod.apply(this, args), ttl);
    };

    return descriptor;
  };
}
