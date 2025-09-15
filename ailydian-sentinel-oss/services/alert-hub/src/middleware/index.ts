import { Request, Response, NextFunction } from 'express'
import { logger } from '@/index'

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()

  // Log request
  logger.info(`📥 ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentLength: req.get('content-length') || '0'
  })

  // Override res.json to log response
  const originalJson = res.json
  res.json = function(obj: any) {
    const duration = Date.now() - start
    logger.info(`📤 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`)
    return originalJson.call(this, obj)
  }

  next()
}

// Error handling middleware
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`💥 Error in ${req.method} ${req.path}:`, {
    error: error.message,
    stack: error.stack,
    ip: req.ip
  })

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: error.stack })
  })
}

// Rate limiting middleware (basic implementation)
export const rateLimiter = (windowMs: number = 60000, maxRequests: number = 100) => {
  const clients = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown'
    const now = Date.now()

    let clientData = clients.get(clientId)
    if (!clientData || now > clientData.resetTime) {
      clientData = {
        count: 0,
        resetTime: now + windowMs
      }
      clients.set(clientId, clientData)
    }

    clientData.count++

    if (clientData.count > maxRequests) {
      logger.warn(`🚫 Rate limit exceeded for ${clientId}`, {
        count: clientData.count,
        limit: maxRequests
      })

      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      })
    }

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - clientData.count).toString(),
      'X-RateLimit-Reset': clientData.resetTime.toString()
    })

    next()
  }
}

// API key authentication middleware
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key') || req.query.api_key

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'API key required'
    })
  }

  const validApiKeys = process.env.ALERT_HUB_API_KEYS?.split(',') || []

  if (!validApiKeys.includes(apiKey as string)) {
    logger.warn(`🔑 Invalid API key attempt from ${req.ip}`, {
      apiKey: String(apiKey).substring(0, 8) + '...',
      ip: req.ip
    })

    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API key'
    })
  }

  next()
}

// Request size limiter
export const sizeLimiter = (maxSizeBytes: number = 10 * 1024 * 1024) => { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0')

    if (contentLength > maxSizeBytes) {
      logger.warn(`📦 Request too large from ${req.ip}`, {
        size: contentLength,
        limit: maxSizeBytes
      })

      return res.status(413).json({
        success: false,
        error: 'Request Too Large',
        message: `Request body too large. Maximum size is ${Math.round(maxSizeBytes / 1024 / 1024)}MB`
      })
    }

    next()
  }
}

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'"
  })
  next()
}

// Request validation middleware
export const validateContentType = (allowedTypes: string[] = ['application/json']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next()
    }

    const contentType = req.get('content-type')
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return res.status(415).json({
        success: false,
        error: 'Unsupported Media Type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
      })
    }

    next()
  }
}