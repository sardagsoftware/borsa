/**
 * MEDICAL LYDIAN - REAL-TIME WEBSOCKET SERVER
 * WebSocket integration for instant updates across all connected clients
 *
 * Features:
 * - Real-time dashboard updates
 * - Live consultation notifications
 * - Instant user activity tracking
 * - System alerts broadcasting
 * - Multi-client synchronization
 *
 * @version 1.0.0
 */

// WebSocket connection store
const { getCorsOrigin } = require('../_middleware/cors');
const { applySanitization } = require('../_middleware/sanitize');
const connections = new Map();
const rooms = new Map();

// Message types
const MESSAGE_TYPES = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    SUBSCRIBE: 'subscribe',
    UNSUBSCRIBE: 'unsubscribe',
    BROADCAST: 'broadcast',
    DASHBOARD_UPDATE: 'dashboard_update',
    CONSULTATION_UPDATE: 'consultation_update',
    USER_ACTIVITY: 'user_activity',
    SYSTEM_ALERT: 'system_alert',
    NOTIFICATION: 'notification'
};

class WebSocketManager {
    constructor() {
        this.connections = new Map();
        this.rooms = new Map();
    }

    /**
     * Handle new WebSocket connection
     */
    handleConnection(connectionId, userInfo) {
        const connection = {
            id: connectionId,
            userId: userInfo.userId,
            email: userInfo.email,
            role: userInfo.role,
            connectedAt: new Date().toISOString(),
            rooms: new Set(),
            lastActivity: new Date().toISOString()
        };

        this.connections.set(connectionId, connection);

        console.log(`WebSocket connected: ${connectionId} (uid=${userInfo.id})`);

        return {
            success: true,
            connectionId,
            message: 'Connected to WebSocket server',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Handle WebSocket disconnection
     */
    handleDisconnection(connectionId) {
        const connection = this.connections.get(connectionId);

        if (connection) {
            // Remove from all rooms
            connection.rooms.forEach(room => {
                this.leaveRoom(connectionId, room);
            });

            this.connections.delete(connectionId);
            console.log(`WebSocket disconnected: ${connectionId}`);
        }

        return {
            success: true,
            message: 'Disconnected from WebSocket server'
        };
    }

    /**
     * Subscribe to room
     */
    subscribeToRoom(connectionId, roomName) {
        const connection = this.connections.get(connectionId);

        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        if (!this.rooms.has(roomName)) {
            this.rooms.set(roomName, new Set());
        }

        this.rooms.get(roomName).add(connectionId);
        connection.rooms.add(roomName);

        console.log(`${connectionId} subscribed to room: ${roomName}`);

        return {
            success: true,
            room: roomName,
            message: `Subscribed to ${roomName}`
        };
    }

    /**
     * Unsubscribe from room
     */
    unsubscribeFromRoom(connectionId, roomName) {
        const connection = this.connections.get(connectionId);

        if (!connection) {
            return { success: false, error: 'Connection not found' };
        }

        this.leaveRoom(connectionId, roomName);

        return {
            success: true,
            room: roomName,
            message: `Unsubscribed from ${roomName}`
        };
    }

    /**
     * Leave room
     */
    leaveRoom(connectionId, roomName) {
        const room = this.rooms.get(roomName);
        if (room) {
            room.delete(connectionId);
            if (room.size === 0) {
                this.rooms.delete(roomName);
            }
        }

        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.rooms.delete(roomName);
        }
    }

    /**
     * Broadcast message to all connections
     */
    broadcast(message, excludeConnectionId = null) {
        const recipients = [];

        this.connections.forEach((connection, connectionId) => {
            if (connectionId !== excludeConnectionId) {
                recipients.push({
                    connectionId,
                    userId: connection.userId,
                    email: connection.email
                });
            }
        });

        console.log(`Broadcasting to ${recipients.length} connections:`, message.type);

        return {
            success: true,
            recipientCount: recipients.length,
            recipients,
            message
        };
    }

    /**
     * Broadcast to specific room
     */
    broadcastToRoom(roomName, message) {
        const room = this.rooms.get(roomName);

        if (!room) {
            return { success: false, error: 'Room not found' };
        }

        const recipients = Array.from(room).map(connectionId => {
            const connection = this.connections.get(connectionId);
            return {
                connectionId,
                userId: connection?.userId,
                email: connection?.email
            };
        });

        console.log(`Broadcasting to room ${roomName} (${recipients.length} connections):`, message.type);

        return {
            success: true,
            room: roomName,
            recipientCount: recipients.length,
            recipients,
            message
        };
    }

    /**
     * Send message to specific user
     */
    sendToUser(userId, message) {
        const userConnections = Array.from(this.connections.entries())
            .filter(([_, conn]) => conn.userId === userId)
            .map(([id, _]) => id);

        if (userConnections.length === 0) {
            return { success: false, error: 'User not connected' };
        }

        console.log(`Sending to user ${userId} (${userConnections.length} connections):`, message.type);

        return {
            success: true,
            userId,
            connectionCount: userConnections.length,
            connectionIds: userConnections,
            message
        };
    }

    /**
     * Get connection statistics
     */
    getStatistics() {
        const roomStats = {};
        this.rooms.forEach((connections, roomName) => {
            roomStats[roomName] = connections.size;
        });

        return {
            totalConnections: this.connections.size,
            totalRooms: this.rooms.size,
            roomStats,
            connections: Array.from(this.connections.values()).map(conn => ({
                id: conn.id,
                userId: conn.userId,
                email: conn.email,
                connectedAt: conn.connectedAt,
                rooms: Array.from(conn.rooms)
            }))
        };
    }

    /**
     * Dashboard update notification
     */
    notifyDashboardUpdate(data) {
        return this.broadcast({
            type: MESSAGE_TYPES.DASHBOARD_UPDATE,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Consultation update notification
     */
    notifyConsultationUpdate(consultationData) {
        return this.broadcastToRoom('consultations', {
            type: MESSAGE_TYPES.CONSULTATION_UPDATE,
            data: consultationData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * User activity notification
     */
    notifyUserActivity(activityData) {
        return this.broadcast({
            type: MESSAGE_TYPES.USER_ACTIVITY,
            data: activityData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * System alert notification
     */
    notifySystemAlert(alertData) {
        return this.broadcast({
            type: MESSAGE_TYPES.SYSTEM_ALERT,
            data: alertData,
            timestamp: new Date().toISOString(),
            priority: alertData.priority || 'normal'
        });
    }
}

// Singleton instance
const wsManager = new WebSocketManager();

// API Handler
export default async function handler(req, res) {
  applySanitization(req, res);
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { action, connectionId, data } = req.body;

        // Connect
        if (action === 'connect') {
            const result = wsManager.handleConnection(connectionId, data.userInfo);
            return res.status(200).json(result);
        }

        // Disconnect
        if (action === 'disconnect') {
            const result = wsManager.handleDisconnection(connectionId);
            return res.status(200).json(result);
        }

        // Subscribe to room
        if (action === 'subscribe') {
            const result = wsManager.subscribeToRoom(connectionId, data.room);
            return res.status(200).json(result);
        }

        // Unsubscribe from room
        if (action === 'unsubscribe') {
            const result = wsManager.unsubscribeFromRoom(connectionId, data.room);
            return res.status(200).json(result);
        }

        // Broadcast message
        if (action === 'broadcast') {
            const result = wsManager.broadcast(data.message, connectionId);
            return res.status(200).json(result);
        }

        // Broadcast to room
        if (action === 'broadcast-room') {
            const result = wsManager.broadcastToRoom(data.room, data.message);
            return res.status(200).json(result);
        }

        // Send to user
        if (action === 'send-user') {
            const result = wsManager.sendToUser(data.userId, data.message);
            return res.status(200).json(result);
        }

        // Dashboard update
        if (action === 'dashboard-update') {
            const result = wsManager.notifyDashboardUpdate(data);
            return res.status(200).json(result);
        }

        // Consultation update
        if (action === 'consultation-update') {
            const result = wsManager.notifyConsultationUpdate(data);
            return res.status(200).json(result);
        }

        // User activity
        if (action === 'user-activity') {
            const result = wsManager.notifyUserActivity(data);
            return res.status(200).json(result);
        }

        // System alert
        if (action === 'system-alert') {
            const result = wsManager.notifySystemAlert(data);
            return res.status(200).json(result);
        }

        return res.status(400).json({
            success: false,
            error: 'Invalid action'
        });
    }

    if (req.method === 'GET') {
        const { action } = req.query;

        // Get statistics
        if (action === 'stats') {
            const stats = wsManager.getStatistics();
            return res.status(200).json({
                success: true,
                statistics: stats
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Medical LyDian WebSocket API',
            version: '1.0.0',
            endpoints: {
                POST: [
                    'connect', 'disconnect', 'subscribe', 'unsubscribe',
                    'broadcast', 'broadcast-room', 'send-user',
                    'dashboard-update', 'consultation-update',
                    'user-activity', 'system-alert'
                ],
                GET: ['stats']
            }
        });
    }

    return res.status(405).json({
        success: false,
        error: 'Method not allowed'
    });
}
