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

// API key authentication middleware (optional)
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key') || req.query.api_key

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'API key required'
    })
  }

  const validApiKeys = process.env.API_KEYS?.split(',') || []

  if (!validApiKeys.includes(apiKey as string)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API key'
    })
  }

  next()
}