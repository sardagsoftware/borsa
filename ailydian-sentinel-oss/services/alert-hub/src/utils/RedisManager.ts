import { createClient, RedisClientType } from 'redis'
import { logger } from '@/index'

export class RedisManager {
  private client: RedisClientType
  private connected: boolean = false

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('🟥 Redis: Max reconnection attempts reached')
            return false
          }
          return Math.min(retries * 50, 1000)
        }
      }
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('🟥 Redis: Connecting...')
    })

    this.client.on('ready', () => {
      logger.info('✅ Redis: Connected and ready')
      this.connected = true
    })

    this.client.on('error', (error) => {
      logger.error('🟥 Redis error:', error)
      this.connected = false
    })

    this.client.on('end', () => {
      logger.warn('🟥 Redis: Connection ended')
      this.connected = false
    })

    this.client.on('reconnecting', () => {
      logger.info('🟥 Redis: Reconnecting...')
      this.connected = false
    })
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect()
      logger.info('✅ Redis connection established')
    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        await this.client.disconnect()
        logger.info('🔌 Redis connection closed')
      }
    } catch (error) {
      logger.error('❌ Error disconnecting from Redis:', error)
    }
  }

  isConnected(): boolean {
    return this.connected
  }

  // Key-Value operations
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key)
    } catch (error) {
      logger.error(`❌ Redis GET error for key '${key}':`, error)
      throw error
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.client.set(key, value)
    } catch (error) {
      logger.error(`❌ Redis SET error for key '${key}':`, error)
      throw error
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    try {
      await this.client.setEx(key, seconds, value)
    } catch (error) {
      logger.error(`❌ Redis SETEX error for key '${key}':`, error)
      throw error
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key)
    } catch (error) {
      logger.error(`❌ Redis DEL error for key '${key}':`, error)
      throw error
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key)
    } catch (error) {
      logger.error(`❌ Redis EXISTS error for key '${key}':`, error)
      throw error
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern)
    } catch (error) {
      logger.error(`❌ Redis KEYS error for pattern '${pattern}':`, error)
      throw error
    }
  }

  // List operations
  async lpush(key: string, value: string): Promise<number> {
    try {
      return await this.client.lPush(key, value)
    } catch (error) {
      logger.error(`❌ Redis LPUSH error for key '${key}':`, error)
      throw error
    }
  }

  async rpush(key: string, value: string): Promise<number> {
    try {
      return await this.client.rPush(key, value)
    } catch (error) {
      logger.error(`❌ Redis RPUSH error for key '${key}':`, error)
      throw error
    }
  }

  async lpop(key: string): Promise<string | null> {
    try {
      return await this.client.lPop(key)
    } catch (error) {
      logger.error(`❌ Redis LPOP error for key '${key}':`, error)
      throw error
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lRange(key, start, stop)
    } catch (error) {
      logger.error(`❌ Redis LRANGE error for key '${key}':`, error)
      throw error
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    try {
      await this.client.lTrim(key, start, stop)
    } catch (error) {
      logger.error(`❌ Redis LTRIM error for key '${key}':`, error)
      throw error
    }
  }

  // Set operations
  async sadd(key: string, member: string): Promise<number> {
    try {
      return await this.client.sAdd(key, member)
    } catch (error) {
      logger.error(`❌ Redis SADD error for key '${key}':`, error)
      throw error
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key)
    } catch (error) {
      logger.error(`❌ Redis SMEMBERS error for key '${key}':`, error)
      throw error
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      return Boolean(await this.client.sIsMember(key, member))
    } catch (error) {
      logger.error(`❌ Redis SISMEMBER error for key '${key}':`, error)
      throw error
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | undefined> {
    try {
      return await this.client.hGet(key, field)
    } catch (error) {
      logger.error(`❌ Redis HGET error for key '${key}', field '${field}':`, error)
      throw error
    }
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hSet(key, field, value)
    } catch (error) {
      logger.error(`❌ Redis HSET error for key '${key}', field '${field}':`, error)
      throw error
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key)
    } catch (error) {
      logger.error(`❌ Redis HGETALL error for key '${key}':`, error)
      throw error
    }
  }

  // Sorted Set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      return await this.client.zAdd(key, { score, value: member })
    } catch (error) {
      logger.error(`❌ Redis ZADD error for key '${key}':`, error)
      throw error
    }
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.zRange(key, start, stop)
    } catch (error) {
      logger.error(`❌ Redis ZRANGE error for key '${key}':`, error)
      throw error
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    try {
      return await this.client.publish(channel, message)
    } catch (error) {
      logger.error(`❌ Redis PUBLISH error for channel '${channel}':`, error)
      throw error
    }
  }

  // Utility methods
  async flushall(): Promise<void> {
    try {
      await this.client.flushAll()
      logger.warn('⚠️ Redis: All data flushed')
    } catch (error) {
      logger.error('❌ Redis FLUSHALL error:', error)
      throw error
    }
  }

  async ping(): Promise<string> {
    try {
      return await this.client.ping()
    } catch (error) {
      logger.error('❌ Redis PING error:', error)
      throw error
    }
  }

  getClient(): RedisClientType {
    return this.client
  }
}