import express from 'express'
import { createServer } from 'http'
import WebSocket from 'ws'
import winston from 'winston'
import cron from 'node-cron'
import { AnomalyDetectionEngine } from '@/services/AnomalyDetectionEngine'
import { BaselineManager } from '@/services/BaselineManager'
import { SelfHealingEngine } from '@/services/SelfHealingEngine'
import { anomalyRoutes } from '@/routes/anomalyRoutes'
import { requestLogger, errorHandler, rateLimiter } from '@/middleware'
import { WebSocketManager } from '@/services/WebSocketManager'

// Logger configuration
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'anomaly-detection' },
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

class AnomalyDetectionServer {
  private app: express.Application
  private server: any
  private wss: WebSocket.Server
  private detectionEngine: AnomalyDetectionEngine
  private baselineManager: BaselineManager
  private selfHealingEngine: SelfHealingEngine
  private wsManager: WebSocketManager
  private port: number

  constructor() {
    this.port = parseInt(process.env.ANOMALY_DETECTION_PORT || '3003')
    this.app = express()
    this.server = createServer(this.app)

    // Initialize services
    this.detectionEngine = new AnomalyDetectionEngine()
    this.baselineManager = new BaselineManager()
    this.selfHealingEngine = new SelfHealingEngine()

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
    this.app.use(rateLimiter(60000, 500)) // 500 requests per minute

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
        service: 'anomaly-detection',
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connected_clients: this.wsManager.getConnectedClients(),
        active_models: this.detectionEngine.getActiveModelCount(),
        baseline_profiles: this.baselineManager.getProfileCount()
      })
    })

    // API routes
    this.app.use('/api/v1/anomalies', anomalyRoutes)

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
    })

    this.wsManager.on('disconnect', (ws) => {
      logger.info('🔌 WebSocket client disconnected')
    })

    // Set up anomaly broadcasting
    this.detectionEngine.on('anomaly_detected', (anomaly) => {
      this.wsManager.broadcast({
        type: 'anomaly_detected',
        data: anomaly,
        timestamp: new Date().toISOString()
      })
    })

    this.baselineManager.on('baseline_updated', (baseline) => {
      this.wsManager.broadcast({
        type: 'baseline_updated',
        data: baseline,
        timestamp: new Date().toISOString()
      })
    })

    this.selfHealingEngine.on('healing_action', (action) => {
      this.wsManager.broadcast({
        type: 'healing_action',
        data: action,
        timestamp: new Date().toISOString()
      })
    })
  }

  private setupCronJobs() {
    // Update baselines (runs every 6 hours)
    cron.schedule('0 */6 * * *', async () => {
      logger.info('📈 Starting baseline update...')
      try {
        await this.baselineManager.updateAllBaselines()
        logger.info('✅ Baseline update completed')
      } catch (error) {
        logger.error('Error during baseline update:', error)
      }
    })

    // Retrain models (runs daily at 2 AM)
    cron.schedule('0 2 * * *', async () => {
      logger.info('🤖 Starting model retraining...')
      try {
        await this.detectionEngine.retrainAllModels()
        logger.info('✅ Model retraining completed')
      } catch (error) {
        logger.error('Error during model retraining:', error)
      }
    })

    // Clean up old data (runs weekly)
    cron.schedule('0 0 * * 0', async () => {
      logger.info('🧹 Starting data cleanup...')
      try {
        await this.detectionEngine.cleanupOldData()
        await this.baselineManager.cleanupOldBaselines()
        logger.info('✅ Data cleanup completed')
      } catch (error) {
        logger.error('Error during data cleanup:', error)
      }
    })

    // Generate hourly stats
    cron.schedule('0 * * * *', async () => {
      try {
        const stats = await this.detectionEngine.generateStats()
        this.wsManager.broadcast({
          type: 'stats_update',
          data: stats,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        logger.error('Error generating stats:', error)
      }
    })

    // Health monitoring (every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
      try {
        const health = {
          timestamp: new Date().toISOString(),
          active_models: this.detectionEngine.getActiveModelCount(),
          baseline_profiles: this.baselineManager.getProfileCount(),
          pending_healing_actions: await this.selfHealingEngine.getPendingActionCount(),
          memory_usage: process.memoryUsage(),
          cpu_usage: process.cpuUsage()
        }
        logger.debug('📊 System health:', health)
      } catch (error) {
        logger.error('Error collecting health metrics:', error)
      }
    })
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      logger.info(`🛑 Received ${signal}, shutting down Anomaly Detection Engine gracefully...`)

      this.server.close(async () => {
        logger.info('🔌 HTTP server closed')

        try {
          // Close WebSocket connections
          this.wsManager.close()
          logger.info('🔌 WebSocket server closed')

          // Save model states and close services
          await this.detectionEngine.close()
          await this.baselineManager.close()
          await this.selfHealingEngine.close()
          logger.info('💾 Service states saved and connections closed')

          logger.info('✅ Anomaly Detection Engine shutdown complete')
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
      await this.detectionEngine.initialize()
      await this.baselineManager.initialize()
      await this.selfHealingEngine.initialize()

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`🚀 Anomaly Detection Engine started on port ${this.port}`)
        logger.info(`🔌 WebSocket server available at ws://localhost:${this.port}/ws`)
        logger.info(`🎥 Health check available at http://localhost:${this.port}/health`)
        logger.info('🤖 AILYDIAN SENTINEL OSS Anomaly Detection is ready!')
      })
    } catch (error) {
      logger.error('❌ Failed to start Anomaly Detection Engine:', error)
      process.exit(1)
    }
  }
}

// Start the server
const anomalyDetectionServer = new AnomalyDetectionServer()
anomalyDetectionServer.start().catch(error => {
  logger.error('💥 Fatal error starting Anomaly Detection Engine:', error)
  process.exit(1)
})