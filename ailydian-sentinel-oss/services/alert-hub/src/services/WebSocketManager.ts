import { EventEmitter } from 'events'
import WebSocket from 'ws'
import { IncomingMessage } from 'http'
import { AlertWebSocketMessage } from '@/types'
import { logger } from '@/index'

export class WebSocketManager extends EventEmitter {
  private wss: WebSocket.Server
  private clients: Map<WebSocket, ClientInfo> = new Map()
  private heartbeatInterval: NodeJS.Timeout
  private messageQueue: Map<string, AlertWebSocketMessage[]> = new Map()

  constructor(wss: WebSocket.Server) {
    super()
    this.wss = wss
    this.setupWebSocketServer()
    this.startHeartbeat()
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientInfo: ClientInfo = {
        id: this.generateClientId(),
        ip: req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        connectedAt: new Date(),
        lastPing: new Date(),
        subscriptions: new Set(['alerts', 'stats']) // Default subscriptions
      }

      this.clients.set(ws, clientInfo)
      logger.info(`🔌 WebSocket client connected: ${clientInfo.id} from ${clientInfo.ip}`)

      // Set up client event handlers
      this.setupClientHandlers(ws, clientInfo)

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connection',
        data: {
          client_id: clientInfo.id,
          server_time: new Date().toISOString(),
          subscriptions: Array.from(clientInfo.subscriptions)
        },
        timestamp: new Date().toISOString()
      } as any)

      // Emit connection event
      this.emit('connection', ws, req)

      // Send any queued messages for this client
      this.sendQueuedMessages(ws)
    })

    this.wss.on('error', (error) => {
      logger.error('🔌 WebSocket server error:', error)
    })
  }

  private setupClientHandlers(ws: WebSocket, clientInfo: ClientInfo) {
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        this.handleClientMessage(ws, clientInfo, message)
      } catch (error) {
        logger.error(`🔌 Error parsing WebSocket message from ${clientInfo.id}:`, error)
        this.sendError(ws, 'Invalid JSON message')
      }
    })

    ws.on('pong', () => {
      clientInfo.lastPing = new Date()
    })

    ws.on('close', (code, reason) => {
      logger.info(`🔌 WebSocket client disconnected: ${clientInfo.id} (${code}: ${reason})`)
      this.clients.delete(ws)
      this.emit('disconnect', ws)
    })

    ws.on('error', (error) => {
      logger.error(`🔌 WebSocket client error (${clientInfo.id}):`, error)
      this.clients.delete(ws)
    })
  }

  private handleClientMessage(ws: WebSocket, clientInfo: ClientInfo, message: any) {
    logger.debug(`🔌 Received message from ${clientInfo.id}:`, message)

    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', data: {}, timestamp: new Date().toISOString() } as any)
        break

      case 'subscribe':
        if (message.channels && Array.isArray(message.channels)) {
          message.channels.forEach((channel: string) => {
            if (this.isValidChannel(channel)) {
              clientInfo.subscriptions.add(channel)
            }
          })
          logger.info(`🔌 Client ${clientInfo.id} subscribed to: ${message.channels.join(', ')}`)
        }
        break

      case 'unsubscribe':
        if (message.channels && Array.isArray(message.channels)) {
          message.channels.forEach((channel: string) => {
            clientInfo.subscriptions.delete(channel)
          })
          logger.info(`🔌 Client ${clientInfo.id} unsubscribed from: ${message.channels.join(', ')}`)
        }
        break

      case 'get_alerts':
        // Handle request for recent alerts
        this.handleGetAlertsRequest(ws, message)
        break

      case 'mark_alert_read':
        // Handle alert acknowledgment
        this.handleMarkAlertRead(ws, message)
        break

      default:
        this.sendError(ws, `Unknown message type: ${message.type}`)
    }
  }

  private async handleGetAlertsRequest(ws: WebSocket, message: any) {
    try {
      const limit = Math.min(message.limit || 50, 100) // Cap at 100
      const offset = message.offset || 0

      // This would typically query the AlertHubService
      // For now, send a mock response
      this.sendToClient(ws, {
        type: 'alerts_response',
        data: {
          alerts: [],
          total: 0,
          limit,
          offset
        },
        timestamp: new Date().toISOString()
      } as any)
    } catch (error) {
      logger.error('🔌 Error handling get_alerts request:', error)
      this.sendError(ws, 'Failed to fetch alerts')
    }
  }

  private handleMarkAlertRead(ws: WebSocket, message: any) {
    if (message.alert_id) {
      logger.info(`🔌 Client marked alert as read: ${message.alert_id}`)
      // This would typically update the alert status
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: AlertWebSocketMessage, channel?: string): void {
    const messageStr = JSON.stringify(message)
    let sentCount = 0

    this.clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Check if client is subscribed to the channel
        if (!channel || clientInfo.subscriptions.has(channel) || clientInfo.subscriptions.has('all')) {
          try {
            ws.send(messageStr)
            sentCount++
          } catch (error) {
            logger.error(`🔌 Error sending message to client ${clientInfo.id}:`, error)
            this.clients.delete(ws)
          }
        }
      } else {
        // Clean up dead connections
        this.clients.delete(ws)
      }
    })

    logger.debug(`🔌 Broadcast message sent to ${sentCount} clients`)
  }

  /**
   * Send message to specific client
   */
  sendToClient(ws: WebSocket, message: AlertWebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message))
      } catch (error) {
        const clientInfo = this.clients.get(ws)
        logger.error(`🔌 Error sending message to client ${clientInfo?.id}:`, error)
        this.clients.delete(ws)
      }
    }
  }

  /**
   * Send error message to client
   */
  private sendError(ws: WebSocket, errorMessage: string): void {
    this.sendToClient(ws, {
      type: 'error',
      data: {
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    } as any)
  }

  /**
   * Send message to clients subscribed to specific channel
   */
  sendToChannel(channel: string, message: AlertWebSocketMessage): void {
    this.broadcast(message, channel)
  }

  /**
   * Queue message for offline clients (future feature)
   */
  private queueMessage(clientId: string, message: AlertWebSocketMessage): void {
    if (!this.messageQueue.has(clientId)) {
      this.messageQueue.set(clientId, [])
    }

    const queue = this.messageQueue.get(clientId)!
    queue.push(message)

    // Limit queue size
    if (queue.length > 100) {
      queue.shift() // Remove oldest message
    }
  }

  /**
   * Send queued messages to newly connected client
   */
  private sendQueuedMessages(ws: WebSocket): void {
    const clientInfo = this.clients.get(ws)
    if (!clientInfo) return

    const queue = this.messageQueue.get(clientInfo.id)
    if (queue && queue.length > 0) {
      logger.info(`🔌 Sending ${queue.length} queued messages to client ${clientInfo.id}`)
      
      queue.forEach(message => {
        this.sendToClient(ws, message)
      })

      // Clear the queue
      this.messageQueue.delete(clientInfo.id)
    }
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date()
      const deadClients: WebSocket[] = []

      this.clients.forEach((clientInfo, ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          // Check if client has been inactive for too long
          const inactiveTime = now.getTime() - clientInfo.lastPing.getTime()
          if (inactiveTime > 60000) { // 1 minute
            // Send ping
            try {
              ws.ping()
            } catch (error) {
              deadClients.push(ws)
            }
          }

          // Mark as dead if inactive for more than 5 minutes
          if (inactiveTime > 300000) {
            deadClients.push(ws)
          }
        } else {
          deadClients.push(ws)
        }
      })

      // Clean up dead clients
      deadClients.forEach(ws => {
        const clientInfo = this.clients.get(ws)
        if (clientInfo) {
          logger.info(`🔌 Removing dead client: ${clientInfo.id}`)
        }
        this.clients.delete(ws)
        try {
          ws.terminate()
        } catch (error) {
          // Ignore termination errors
        }
      })
    }, 30000) // Check every 30 seconds
  }

  /**
   * Get number of connected clients
   */
  getConnectedClients(): number {
    return this.clients.size
  }

  /**
   * Get client information
   */
  getClientInfo(): Array<{ id: string; ip: string; connectedAt: Date; subscriptions: string[] }> {
    const info: Array<{ id: string; ip: string; connectedAt: Date; subscriptions: string[] }> = []
    
    this.clients.forEach((clientInfo) => {
      info.push({
        id: clientInfo.id,
        ip: clientInfo.ip,
        connectedAt: clientInfo.connectedAt,
        subscriptions: Array.from(clientInfo.subscriptions)
      })
    })

    return info
  }

  /**
   * Close all connections and cleanup
   */
  close(): void {
    logger.info('🔌 Closing WebSocket server...')

    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    // Close all client connections
    this.clients.forEach((clientInfo, ws) => {
      try {
        ws.close(1001, 'Server shutting down')
      } catch (error) {
        // Ignore close errors
      }
    })

    this.clients.clear()
    this.messageQueue.clear()

    // Close WebSocket server
    this.wss.close(() => {
      logger.info('🔌 WebSocket server closed')
    })
  }

  /**
   * Helper methods
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private isValidChannel(channel: string): boolean {
    const validChannels = ['alerts', 'stats', 'correlations', 'incidents', 'all']
    return validChannels.includes(channel)
  }
}

interface ClientInfo {
  id: string
  ip: string
  userAgent: string
  connectedAt: Date
  lastPing: Date
  subscriptions: Set<string>
}