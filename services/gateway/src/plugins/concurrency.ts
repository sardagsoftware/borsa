/**
 * Lydian-IQ Gateway Concurrency Limiter
 *
 * Implements semaphore-based concurrency control with queue and Retry-After headers.
 * Prevents CONCURRENT_LIMIT_EXCEEDED errors that cause UI menu failures.
 *
 * @white-hat Compliant - No blocking of legitimate traffic
 * @kvkk-compliant No PII in logs
 */

import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

interface ConcurrencyOptions {
  maxConcurrency?: number;
  queueSize?: number;
  retryAfterSeconds?: number;
}

const concurrencyPlugin: FastifyPluginAsync<ConcurrencyOptions> = async (app, opts) => {
  // Configuration from environment or options
  const MAX_CONCURRENCY = opts.maxConcurrency ?? Number(process.env.GATEWAY_MAX_CONCURRENCY ?? 64);
  const QUEUE_SIZE = opts.queueSize ?? Number(process.env.GATEWAY_QUEUE_SIZE ?? 256);
  const RETRY_AFTER_SEC = opts.retryAfterSeconds ?? Number(process.env.GATEWAY_RETRY_AFTER_SEC ?? 1);

  // Semaphore state
  let inFlightRequests = 0;
  const requestQueue: Array<() => void> = [];

  // Metrics
  let totalRejections = 0;
  let peakConcurrency = 0;

  /**
   * Acquire semaphore slot or queue request
   */
  const acquire = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (inFlightRequests < MAX_CONCURRENCY) {
        inFlightRequests++;
        peakConcurrency = Math.max(peakConcurrency, inFlightRequests);
        resolve();
        return;
      }

      // Queue is full - reject immediately
      if (requestQueue.length >= QUEUE_SIZE) {
        totalRejections++;
        reject(new Error("QUEUE_FULL"));
        return;
      }

      // Add to queue
      requestQueue.push(() => {
        inFlightRequests++;
        peakConcurrency = Math.max(peakConcurrency, inFlightRequests);
        resolve();
      });
    });
  };

  /**
   * Release semaphore slot and process queue
   */
  const release = (): void => {
    inFlightRequests = Math.max(0, inFlightRequests - 1);

    const next = requestQueue.shift();
    if (next) {
      next();
    }
  };

  /**
   * OnRequest hook - acquire semaphore before processing
   */
  app.addHook("onRequest", async (req, reply) => {
    try {
      await acquire();
    } catch (error) {
      // Queue full - send 429 with Retry-After header
      reply.header("Retry-After", String(RETRY_AFTER_SEC));
      reply.header("X-Concurrency-Queue-Full", "true");
      reply.code(429).send({
        error: "Too many concurrent requests",
        message: `Server is currently processing maximum concurrent requests. Please retry after ${RETRY_AFTER_SEC} second(s).`,
        code: "CONCURRENT_LIMIT_EXCEEDED",
        retryAfter: RETRY_AFTER_SEC
      });
    }
  });

  /**
   * OnResponse hook - release semaphore after processing
   */
  app.addHook("onResponse", async (req, reply) => {
    release();
  });

  /**
   * OnError hook - ensure release on errors
   */
  app.addHook("onError", async (req, reply, error) => {
    release();
  });

  /**
   * Metrics endpoint for monitoring
   */
  app.get("/api/concurrency/metrics", async (req, reply) => {
    return {
      inFlight: inFlightRequests,
      queued: requestQueue.length,
      maxConcurrency: MAX_CONCURRENCY,
      queueSize: QUEUE_SIZE,
      peakConcurrency,
      totalRejections,
      utilizationPercent: Math.round((inFlightRequests / MAX_CONCURRENCY) * 100)
    };
  });

  app.log.info({
    maxConcurrency: MAX_CONCURRENCY,
    queueSize: QUEUE_SIZE,
    retryAfterSec: RETRY_AFTER_SEC
  }, "Concurrency limiter initialized");
};

export default fp(concurrencyPlugin, {
  name: "concurrency-limiter",
  fastify: "4.x"
});
