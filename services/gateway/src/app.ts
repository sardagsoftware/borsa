/**
 * Lydian-IQ Gateway Application
 *
 * Main gateway application with concurrency control and rate limiting.
 * Configured for production deployment with proxy support.
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

// Plugins
import concurrencyPlugin from "./plugins/concurrency";
import rateLimitPlugin from "./plugins/rate-limit";

// Routes
import healthRoutes from "./routes/health";
import capabilitiesRoutes from "./routes/capabilities";
import connectorsRoutes from "./routes/connectors";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport: process.env.NODE_ENV === "development" ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname"
        }
      } : undefined
    },
    trustProxy: process.env.TRUST_PROXY === "true",
    requestIdLogLabel: "reqId",
    disableRequestLogging: false,
    requestTimeout: 30000, // 30s timeout
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Trust proxy if behind load balancer/reverse proxy
  if (process.env.TRUST_PROXY === "true") {
    app.log.info("Trust proxy enabled - using X-Forwarded-* headers");
  }

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });

  // CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  });

  // Register concurrency limiter FIRST (before rate limiter)
  // This ensures we handle concurrent requests before checking rate limits
  await app.register(concurrencyPlugin, {
    maxConcurrency: Number(process.env.GATEWAY_MAX_CONCURRENCY ?? 64),
    queueSize: Number(process.env.GATEWAY_QUEUE_SIZE ?? 256),
    retryAfterSeconds: Number(process.env.GATEWAY_RETRY_AFTER_SEC ?? 1)
  });

  // Register rate limiter SECOND (after concurrency)
  await app.register(rateLimitPlugin, {
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    timeWindow: process.env.RATE_LIMIT_WINDOW ?? "1 minute",
    allowCapabilities: process.env.RATE_LIMIT_ALLOW_CAPABILITIES === "true"
  });

  // Register routes
  await app.register(healthRoutes, { prefix: "/api" });
  await app.register(capabilitiesRoutes, { prefix: "/api" });
  await app.register(connectorsRoutes, { prefix: "/api/connectors" });

  // Root health check (no prefix)
  app.get("/health", async () => ({ status: "healthy", service: "gateway" }));

  // 404 handler
  app.setNotFoundHandler((req, reply) => {
    reply.code(404).send({
      error: "Not Found",
      message: `Route ${req.method} ${req.url} not found`,
      statusCode: 404
    });
  });

  // Global error handler
  app.setErrorHandler((error, req, reply) => {
    app.log.error({
      err: error,
      req: {
        method: req.method,
        url: req.url,
        headers: req.headers
      }
    }, "Request error");

    // Don't expose internal errors in production
    const isDev = process.env.NODE_ENV === "development";

    reply.code(error.statusCode ?? 500).send({
      error: error.name || "Internal Server Error",
      message: isDev ? error.message : "An internal error occurred",
      statusCode: error.statusCode ?? 500,
      ...(isDev && { stack: error.stack })
    });
  });

  return app;
}

// Start server if running directly
if (require.main === module) {
  const PORT = Number(process.env.PORT ?? 3100);
  const HOST = process.env.HOST ?? "0.0.0.0";

  buildApp()
    .then(app => app.listen({ port: PORT, host: HOST }))
    .then(address => {
      console.log(`🚀 Gateway listening on ${address}`);
    })
    .catch(err => {
      console.error("Failed to start gateway:", err);
      process.exit(1);
    });
}
