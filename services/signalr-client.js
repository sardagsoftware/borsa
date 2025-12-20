/**
 * 🚀 AZURE SIGNALR CLIENT - BROWSER/NODE.JS CLIENT LIBRARY
 * Complete client implementation for real-time communication
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Event handlers for all hub methods
 * - TypeScript-like API with JSDoc
 * - Connection state management
 * - Message queuing during reconnection
 * - Presence tracking
 * - Typing indicators
 * - AI response streaming
 * - Real-time notifications
 */

import * as signalR from '@microsoft/signalr';

/**
 * @typedef {'Disconnected' | 'Connecting' | 'Connected' | 'Reconnecting'} ConnectionState
 */

/**
 * @typedef {Object} SignalRClientOptions
 * @property {string} endpoint - SignalR service endpoint
 * @property {string} accessToken - JWT access token
 * @property {boolean} [automaticReconnect=true] - Enable automatic reconnection
 * @property {number[]} [retryDelays=[0, 2000, 10000, 30000, 60000]] - Reconnection delays
 * @property {boolean} [enableLogging=false] - Enable console logging
 */

/**
 * Base SignalR Client
 */
class SignalRClient {
    /**
     * @param {string} hubName - Hub name (e.g., 'chatHub')
     * @param {SignalRClientOptions} options
     */
    constructor(hubName, options) {
        this.hubName = hubName;
        this.options = {
            automaticReconnect: true,
            retryDelays: [0, 2000, 10000, 30000, 60000],
            enableLogging: false,
            ...options
        };

        this.connection = null;
        this.connectionState = 'Disconnected';
        this.eventHandlers = new Map();
        this.messageQueue = [];
        this.userId = null;

        this._initializeConnection();
    }

    _initializeConnection() {
        const { endpoint, accessToken, automaticReconnect, retryDelays, enableLogging } = this.options;

        const hubUrl = `${endpoint}/hubs/${this.hubName}`;

        const connectionBuilder = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => accessToken,
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets
            });

        if (automaticReconnect) {
            connectionBuilder.withAutomaticReconnect(retryDelays);
        }

        if (enableLogging) {
            connectionBuilder.configureLogging(signalR.LogLevel.Information);
        } else {
            connectionBuilder.configureLogging(signalR.LogLevel.Error);
        }

        this.connection = connectionBuilder.build();

        this._setupConnectionHandlers();
    }

    _setupConnectionHandlers() {
        this.connection.onclose((error) => {
            this.connectionState = 'Disconnected';
            console.log(`[SignalR] Connection closed`, error);
            this._triggerEvent('connectionClosed', { error });
        });

        this.connection.onreconnecting((error) => {
            this.connectionState = 'Reconnecting';
            console.log(`[SignalR] Reconnecting...`, error);
            this._triggerEvent('reconnecting', { error });
        });

        this.connection.onreconnected((connectionId) => {
            this.connectionState = 'Connected';
            console.log(`[SignalR] Reconnected with ID: ${connectionId}`);
            this._triggerEvent('reconnected', { connectionId });
            this._flushMessageQueue();
        });
    }

    /**
     * Register event handler
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler function
     */
    on(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        this.eventHandlers.get(eventName).push(handler);

        // Also register with SignalR connection
        if (this.connection) {
            this.connection.on(eventName, handler);
        }
    }

    /**
     * Remove event handler
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler function
     */
    off(eventName, handler) {
        const handlers = this.eventHandlers.get(eventName);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }

        if (this.connection) {
            this.connection.off(eventName, handler);
        }
    }

    _triggerEvent(eventName, data) {
        const handlers = this.eventHandlers.get(eventName);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    /**
     * Connect to SignalR hub
     * @returns {Promise<void>}
     */
    async connect() {
        if (this.connectionState === 'Connected' || this.connectionState === 'Connecting') {
            console.warn('[SignalR] Already connected or connecting');
            return;
        }

        try {
            this.connectionState = 'Connecting';
            await this.connection.start();
            this.connectionState = 'Connected';
            console.log(`[SignalR] Connected to ${this.hubName}`);
            this._triggerEvent('connected', { connectionId: this.connection.connectionId });
        } catch (error) {
            this.connectionState = 'Disconnected';
            console.error('[SignalR] Connection failed:', error);
            throw error;
        }
    }

    /**
     * Disconnect from SignalR hub
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (this.connection) {
            await this.connection.stop();
            this.connectionState = 'Disconnected';
            console.log('[SignalR] Disconnected');
        }
    }

    /**
     * Invoke server method
     * @param {string} methodName - Server method name
     * @param {...any} args - Method arguments
     * @returns {Promise<any>}
     */
    async invoke(methodName, ...args) {
        if (this.connectionState !== 'Connected') {
            console.warn('[SignalR] Not connected, queueing message');
            return new Promise((resolve, reject) => {
                this.messageQueue.push({ methodName, args, resolve, reject });
            });
        }

        try {
            return await this.connection.invoke(methodName, ...args);
        } catch (error) {
            console.error(`[SignalR] Invoke failed: ${methodName}`, error);
            throw error;
        }
    }

    /**
     * Send message without waiting for response
     * @param {string} methodName - Server method name
     * @param {...any} args - Method arguments
     * @returns {Promise<void>}
     */
    async send(methodName, ...args) {
        if (this.connectionState !== 'Connected') {
            console.warn('[SignalR] Not connected, queueing message');
            this.messageQueue.push({ methodName, args });
            return;
        }

        try {
            await this.connection.send(methodName, ...args);
        } catch (error) {
            console.error(`[SignalR] Send failed: ${methodName}`, error);
            throw error;
        }
    }

    _flushMessageQueue() {
        console.log(`[SignalR] Flushing message queue (${this.messageQueue.length} messages)`);

        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            const { methodName, args, resolve, reject } = message;

            if (resolve && reject) {
                this.connection.invoke(methodName, ...args)
                    .then(resolve)
                    .catch(reject);
            } else {
                this.connection.send(methodName, ...args);
            }
        }
    }

    /**
     * Get current connection state
     * @returns {ConnectionState}
     */
    getState() {
        return this.connectionState;
    }

    /**
     * Check if connected
     * @returns {boolean}
     */
    isConnected() {
        return this.connectionState === 'Connected';
    }
}

/**
 * Chat Hub Client
 */
class ChatHubClient extends SignalRClient {
    constructor(options) {
        super('chat', options);

        // Register client methods
        this.on('ReceiveMessage', this.handleReceiveMessage.bind(this));
        this.on('UserJoined', this.handleUserJoined.bind(this));
        this.on('UserLeft', this.handleUserLeft.bind(this));
        this.on('TypingUpdate', this.handleTypingUpdate.bind(this));
        this.on('MessageEdited', this.handleMessageEdited.bind(this));
        this.on('MessageDeleted', this.handleMessageDeleted.bind(this));
    }

    handleReceiveMessage(message) {
        console.log('[Chat] Message received:', message);
        this._triggerEvent('messageReceived', message);
    }

    handleUserJoined(notification) {
        console.log('[Chat] User joined:', notification);
        this._triggerEvent('userJoined', notification);
    }

    handleUserLeft(notification) {
        console.log('[Chat] User left:', notification);
        this._triggerEvent('userLeft', notification);
    }

    handleTypingUpdate(data) {
        this._triggerEvent('typingUpdate', data);
    }

    handleMessageEdited(message) {
        this._triggerEvent('messageEdited', message);
    }

    handleMessageDeleted(data) {
        this._triggerEvent('messageDeleted', data);
    }

    /**
     * Send a message
     * @param {string} conversationId
     * @param {string} content
     * @returns {Promise<any>}
     */
    async sendMessage(conversationId, content) {
        return this.invoke('SendMessage', {
            conversationId,
            content,
            messageId: crypto.randomUUID()
        });
    }

    /**
     * Join a conversation
     * @param {string} conversationId
     * @returns {Promise<void>}
     */
    async joinConversation(conversationId) {
        return this.send('JoinConversation', conversationId);
    }

    /**
     * Leave a conversation
     * @param {string} conversationId
     * @returns {Promise<void>}
     */
    async leaveConversation(conversationId) {
        return this.send('LeaveConversation', conversationId);
    }

    /**
     * Start typing indicator
     * @param {string} conversationId
     * @returns {Promise<void>}
     */
    async startTyping(conversationId) {
        return this.send('StartTyping', conversationId);
    }

    /**
     * Stop typing indicator
     * @param {string} conversationId
     * @returns {Promise<void>}
     */
    async stopTyping(conversationId) {
        return this.send('StopTyping', conversationId);
    }

    /**
     * Edit a message
     * @param {string} conversationId
     * @param {string} messageId
     * @param {string} newContent
     * @returns {Promise<void>}
     */
    async editMessage(conversationId, messageId, newContent) {
        return this.send('EditMessage', {
            conversationId,
            messageId,
            newContent
        });
    }

    /**
     * Delete a message
     * @param {string} conversationId
     * @param {string} messageId
     * @returns {Promise<void>}
     */
    async deleteMessage(conversationId, messageId) {
        return this.send('DeleteMessage', {
            conversationId,
            messageId
        });
    }
}

/**
 * AI Stream Hub Client
 */
class AIStreamHubClient extends SignalRClient {
    constructor(options) {
        super('ai-stream', options);

        this.activeStreams = new Map();

        // Register client methods
        this.on('AIStreamStarted', this.handleStreamStarted.bind(this));
        this.on('ReceiveAIChunk', this.handleReceiveChunk.bind(this));
        this.on('AIStreamCompleted', this.handleStreamCompleted.bind(this));
        this.on('AIStreamError', this.handleStreamError.bind(this));
        this.on('TokenCountUpdate', this.handleTokenCountUpdate.bind(this));
    }

    handleStreamStarted(data) {
        console.log('[AIStream] Stream started:', data);
        this.activeStreams.set(data.streamId, {
            conversationId: data.conversationId,
            chunks: [],
            startTime: Date.now()
        });
        this._triggerEvent('streamStarted', data);
    }

    handleReceiveChunk(data) {
        const stream = this.activeStreams.get(data.streamId);
        if (stream) {
            stream.chunks.push(data.chunk);
        }
        this._triggerEvent('chunkReceived', data);
    }

    handleStreamCompleted(data) {
        console.log('[AIStream] Stream completed:', data);
        const stream = this.activeStreams.get(data.streamId);
        if (stream) {
            data.fullText = stream.chunks.join('');
            this.activeStreams.delete(data.streamId);
        }
        this._triggerEvent('streamCompleted', data);
    }

    handleStreamError(data) {
        console.error('[AIStream] Stream error:', data);
        this.activeStreams.delete(data.streamId);
        this._triggerEvent('streamError', data);
    }

    handleTokenCountUpdate(data) {
        this._triggerEvent('tokenCountUpdate', data);
    }

    /**
     * Stream AI response
     * @param {string} conversationId
     * @param {string} prompt
     * @param {string} [model='OX5C9E2B']
     * @returns {Promise<string>} - Stream ID
     */
    async streamAIResponse(conversationId, prompt, model = 'OX5C9E2B') {
        const streamId = crypto.randomUUID();

        await this.send('StreamAIResponse', {
            conversationId,
            prompt,
            model,
            streamId
        });

        return streamId;
    }

    /**
     * Cancel active stream
     * @returns {Promise<void>}
     */
    async cancelStream() {
        return this.send('CancelStream');
    }

    /**
     * Get full text from completed stream
     * @param {string} streamId
     * @returns {string|null}
     */
    getStreamText(streamId) {
        const stream = this.activeStreams.get(streamId);
        return stream ? stream.chunks.join('') : null;
    }
}

/**
 * Presence Hub Client
 */
class PresenceHubClient extends SignalRClient {
    constructor(options) {
        super('presence', options);

        this.heartbeatInterval = null;

        // Register client methods
        this.on('UserOnline', this.handleUserOnline.bind(this));
        this.on('UserOffline', this.handleUserOffline.bind(this));
        this.on('UserStatusChanged', this.handleStatusChanged.bind(this));
        this.on('OnlineUsersUpdated', this.handleOnlineUsersUpdated.bind(this));

        // Start heartbeat after connection
        this.on('connected', () => this.startHeartbeat());
        this.on('connectionClosed', () => this.stopHeartbeat());
    }

    handleUserOnline(data) {
        this._triggerEvent('userOnline', data);
    }

    handleUserOffline(data) {
        this._triggerEvent('userOffline', data);
    }

    handleStatusChanged(data) {
        this._triggerEvent('statusChanged', data);
    }

    handleOnlineUsersUpdated(data) {
        this._triggerEvent('onlineUsersUpdated', data);
    }

    /**
     * Update user status
     * @param {'online' | 'away' | 'busy' | 'offline'} status
     * @returns {Promise<void>}
     */
    async updateStatus(status) {
        return this.send('UpdateStatus', status);
    }

    /**
     * Get online users
     * @returns {Promise<void>}
     */
    async getOnlineUsers() {
        return this.send('GetOnlineUsers');
    }

    /**
     * Start heartbeat (every 30 seconds)
     */
    startHeartbeat() {
        this.stopHeartbeat();

        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected()) {
                this.send('SendHeartbeat').catch(err => {
                    console.error('[Presence] Heartbeat failed:', err);
                });
            }
        }, 30000); // 30 seconds

        console.log('[Presence] Heartbeat started');
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            console.log('[Presence] Heartbeat stopped');
        }
    }
}

/**
 * Notification Hub Client
 */
class NotificationHubClient extends SignalRClient {
    constructor(options) {
        super('notifications', options);

        this.notifications = [];

        // Register client methods
        this.on('ReceiveNotification', this.handleReceiveNotification.bind(this));
        this.on('NotificationRead', this.handleNotificationRead.bind(this));
        this.on('NotificationDeleted', this.handleNotificationDeleted.bind(this));
    }

    handleReceiveNotification(notification) {
        console.log('[Notification] Received:', notification);
        this.notifications.push(notification);
        this._triggerEvent('notificationReceived', notification);
    }

    handleNotificationRead(data) {
        const notification = this.notifications.find(n => n.notificationId === data.notificationId);
        if (notification) {
            notification.read = true;
        }
        this._triggerEvent('notificationRead', data);
    }

    handleNotificationDeleted(data) {
        const index = this.notifications.findIndex(n => n.notificationId === data.notificationId);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }
        this._triggerEvent('notificationDeleted', data);
    }

    /**
     * Subscribe to notification types
     * @param {string[]} notificationTypes
     * @returns {Promise<void>}
     */
    async subscribeToNotifications(notificationTypes) {
        return this.send('SubscribeToNotifications', notificationTypes);
    }

    /**
     * Unsubscribe from notification types
     * @param {string[]} notificationTypes
     * @returns {Promise<void>}
     */
    async unsubscribeFromNotifications(notificationTypes) {
        return this.send('UnsubscribeFromNotifications', notificationTypes);
    }

    /**
     * Mark notification as read
     * @param {string} notificationId
     * @returns {Promise<void>}
     */
    async markAsRead(notificationId) {
        return this.send('MarkNotificationAsRead', notificationId);
    }

    /**
     * Delete notification
     * @param {string} notificationId
     * @returns {Promise<void>}
     */
    async deleteNotification(notificationId) {
        return this.send('DeleteNotification', notificationId);
    }

    /**
     * Get unread notifications
     * @returns {Array}
     */
    getUnreadNotifications() {
        return this.notifications.filter(n => !n.read);
    }

    /**
     * Get all notifications
     * @returns {Array}
     */
    getAllNotifications() {
        return this.notifications;
    }
}

/**
 * Unified SignalR Client Manager
 * Manages all hubs from a single instance
 */
class SignalRManager {
    constructor() {
        this.chat = null;
        this.aiStream = null;
        this.presence = null;
        this.notifications = null;
    }

    /**
     * Initialize all hubs
     * @param {string} apiEndpoint - API endpoint for negotiation
     * @param {string} authToken - JWT auth token
     * @returns {Promise<void>}
     */
    async initialize(apiEndpoint, authToken) {
        try {
            // Negotiate with server to get SignalR endpoint and access token
            const response = await fetch(`${apiEndpoint}/api/signalr/negotiate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Negotiation failed');
            }

            const negotiationResult = await response.json();
            const { url, accessToken, userId } = negotiationResult;

            const options = {
                endpoint: url,
                accessToken,
                automaticReconnect: true,
                enableLogging: false
            };

            // Initialize hubs
            this.chat = new ChatHubClient(options);
            this.aiStream = new AIStreamHubClient(options);
            this.presence = new PresenceHubClient(options);
            this.notifications = new NotificationHubClient(options);

            // Connect all hubs
            await Promise.all([
                this.chat.connect(),
                this.aiStream.connect(),
                this.presence.connect(),
                this.notifications.connect()
            ]);

            console.log('✅ All SignalR hubs connected');

        } catch (error) {
            console.error('❌ SignalR initialization failed:', error);
            throw error;
        }
    }

    /**
     * Disconnect all hubs
     * @returns {Promise<void>}
     */
    async disconnect() {
        await Promise.all([
            this.chat?.disconnect(),
            this.aiStream?.disconnect(),
            this.presence?.disconnect(),
            this.notifications?.disconnect()
        ]);

        console.log('🔌 All SignalR hubs disconnected');
    }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SignalRClient,
        ChatHubClient,
        AIStreamHubClient,
        PresenceHubClient,
        NotificationHubClient,
        SignalRManager
    };
}

export {
    SignalRClient,
    ChatHubClient,
    AIStreamHubClient,
    PresenceHubClient,
    NotificationHubClient,
    SignalRManager
};
