import express from 'express'
import { createServer } from 'http'
import WebSocket from 'ws'
import winston from 'winston'
import cron from 'node-cron'
import { AlertHubService } from '@/services/AlertHubService'
import { EnrichmentService } from '@/services/EnrichmentService'
import { CorrelationEngine } from '@/services/CorrelationEngine'
import { alertRoutes } from '@/routes/alertRoutes'
import { requestLogger, errorHandler } from '@/middleware'
import { WebSocketManager } from '@/services/WebSocketManager'

// Logger configuration
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'alert-hub' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

class AlertHubServer {
  private app: express.Application
  private server: any
  private wss: WebSocket.Server
  private alertHubService: AlertHubService
  private enrichmentService: EnrichmentService
  private correlationEngine: CorrelationEngine
  private wsManager: WebSocketManager
  private port: number

  constructor() {
    this.port = parseInt(process.env.ALERT_HUB_PORT || '3002')
    this.app = express()
    this.server = createServer(this.app)

    // Initialize services
    this.alertHubService = new AlertHubService()
    this.enrichmentService = new EnrichmentService()
    this.correlationEngine = new CorrelationEngine()

    // Initialize WebSocket server
    this.wss = new WebSocket.Server({
      server: this.server,
      path: '/ws'
    })
    this.wsManager = new WebSocketManager(this.wss)

    this.setupMiddleware()
    this.setupRoutes()
    this.setupWebSocket()
    this.setupCronJobs()
    this.setupGracefulShutdown()
  }

  private setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true }))
    this.app.use(requestLogger)

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      next()
    })
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'alert-hub',
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connected_clients: this.wsManager.getConnectedClients()
      })
    })

    // API routes
    this.app.use('/api/v1/alerts', alertRoutes)

    // Error handling
    this.app.use(errorHandler)

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
      })
    })
  }

  private setupWebSocket() {
    this.wsManager.on('connection', (ws, req) => {
      logger.info(`🔌 New WebSocket connection from ${req.socket.remoteAddress}`)

      // Send initial stats
      this.alertHubService.getStats().then(stats => {
        this.wsManager.broadcast({
          type: 'alert_stats',
          data: stats,
          timestamp: new Date().toISOString()
        })
      })
    })

    this.wsManager.on('disconnect', (ws) => {
      logger.info('🔌 WebSocket client disconnected')
    })

    // Set up alert broadcasting
    this.alertHubService.on('newAlert', (alert) => {
      this.wsManager.broadcast({
        type: 'new_alert',
        data: alert,
        timestamp: new Date().toISOString()
      })
    })

    this.alertHubService.on('alertUpdate', (alert) => {
      this.wsManager.broadcast({
        type: 'alert_update',
        data: alert,
        timestamp: new Date().toISOString()
      })
    })

    this.correlationEngine.on('correlation', (correlation) => {
      this.wsManager.broadcast({
        type: 'correlation',
        data: correlation,
        timestamp: new Date().toISOString()
      })
    })
  }

  private setupCronJobs() {
    // Clean up old alerts (runs daily at midnight)
    cron.schedule('0 0 * * *', async () => {
      logger.info('🧹 Starting daily alert cleanup...')
      try {
        const cleaned = await this.alertHubService.cleanupOldAlerts()
        logger.info(`🧹 Cleaned up ${cleaned} old alerts`)
      } catch (error) {
        logger.error('Error during alert cleanup:', error)
      }
    })

    // Generate hourly stats (runs every hour)
    cron.schedule('0 * * * *', async () => {
      try {
        const stats = await this.alertHubService.generateHourlyStats()
        this.wsManager.broadcast({
          type: 'alert_stats',
          data: stats,
          timestamp: new Date().toISOString()
        })
        logger.info('📊 Generated hourly stats')
      } catch (error) {
        logger.error('Error generating hourly stats:', error)
      }
    })

    // Run correlation analysis (every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.correlationEngine.runAnalysis()
        logger.debug('🔗 Completed correlation analysis')
      } catch (error) {
        logger.error('Error during correlation analysis:', error)
      }
    })

    // Health check and metrics (every minute)
    cron.schedule('* * * * *', async () => {
      try {
        const metrics = {
          timestamp: new Date().toISOString(),
          active_alerts: await this.alertHubService.getActiveAlertCount(),
          processed_today: await this.alertHubService.getTodayProcessedCount(),
          ws_connections: this.wsManager.getConnectedClients(),
          memory_usage: process.memoryUsage(),
          cpu_usage: process.cpuUsage()
        }
        logger.debug('📈 System metrics:', metrics)
      } catch (error) {
        logger.error('Error collecting metrics:', error)
      }
    })
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      logger.info(`🛑 Received ${signal}, shutting down Alert Hub gracefully...`)

      // Stop accepting new connections
      this.server.close(async () => {
        logger.info('🔌 HTTP server closed')

        try {
          // Close WebSocket connections
          this.wsManager.close()
          logger.info('🔌 WebSocket server closed')

          // Close database connections
          await this.alertHubService.close()
          logger.info('💾 Database connections closed')

          logger.info('✅ Alert Hub shutdown complete')
          process.exit(0)
        } catch (error) {
          logger.error('❌ Error during shutdown:', error)
          process.exit(1)
        }
      })

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('⏰ Forced shutdown after 30s timeout')
        process.exit(1)
      }, 30000)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  }

  public async start() {
    try {
      // Initialize services
      await this.alertHubService.initialize()
      await this.enrichmentService.initialize()
      await this.correlationEngine.initialize()

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`🚀 Alert Hub started on port ${this.port}`)
        logger.info(`🔌 WebSocket server available at ws://localhost:${this.port}/ws`)
        logger.info(`🏥 Health check available at http://localhost:${this.port}/health`)
        logger.info('🛡️ AILYDIAN SENTINEL OSS Alert Hub is ready!')
      })
    } catch (error) {
      logger.error('❌ Failed to start Alert Hub:', error)
      process.exit(1)
    }
  }
}

// Start the server
const alertHubServer = new AlertHubServer()
alertHubServer.start().catch(error => {
  logger.error('💥 Fatal error starting Alert Hub:', error)
  process.exit(1)
})