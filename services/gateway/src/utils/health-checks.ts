// ========================================
// HEALTH CHECK UTILITIES
// Database, Redis, Kafka connectivity checks
// ========================================

import pg from 'pg';
import { createClient } from 'redis';
import { Kafka } from 'kafkajs';

/**
 * Check PostgreSQL database health
 */
export async function checkPostgresHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  message?: string;
}> {
  const startTime = Date.now();

  if (!process.env.DB_URL) {
    return {
      healthy: false,
      responseTime: 0,
      message: 'DB_URL not configured',
    };
  }

  const client = new pg.Client({ connectionString: process.env.DB_URL });

  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();

    return {
      healthy: true,
      responseTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      message: error.message,
    };
  }
}

/**
 * Check Redis cache health
 */
export async function checkRedisHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  message?: string;
}> {
  const startTime = Date.now();

  if (!process.env.REDIS_URL) {
    return {
      healthy: false,
      responseTime: 0,
      message: 'REDIS_URL not configured',
    };
  }

  const client = createClient({ url: process.env.REDIS_URL });

  try {
    await client.connect();
    await client.ping();
    await client.disconnect();

    return {
      healthy: true,
      responseTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      message: error.message,
    };
  }
}

/**
 * Check Kafka broker health
 */
export async function checkKafkaHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  message?: string;
}> {
  const startTime = Date.now();

  if (!process.env.KAFKA_BROKERS) {
    return {
      healthy: false,
      responseTime: 0,
      message: 'KAFKA_BROKERS not configured',
    };
  }

  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'lydian-gateway',
    brokers: process.env.KAFKA_BROKERS.split(','),
  });

  try {
    const admin = kafka.admin();
    await admin.connect();
    await admin.listTopics();
    await admin.disconnect();

    return {
      healthy: true,
      responseTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      message: error.message,
    };
  }
}

/**
 * Check Vault secrets manager health
 */
export async function checkVaultHealth(): Promise<{
  healthy: boolean;
  responseTime: number;
  message?: string;
}> {
  const startTime = Date.now();

  if (!process.env.VAULT_ADDR) {
    return {
      healthy: false,
      responseTime: 0,
      message: 'VAULT_ADDR not configured',
    };
  }

  try {
    const response = await fetch(`${process.env.VAULT_ADDR}/v1/sys/health`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': process.env.VAULT_TOKEN || '',
      },
    });

    if (response.status === 200) {
      return {
        healthy: true,
        responseTime: Date.now() - startTime,
      };
    } else {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        message: `Vault returned status ${response.status}`,
      };
    }
  } catch (error: any) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      message: error.message,
    };
  }
}
