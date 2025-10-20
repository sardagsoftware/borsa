// Azure Comprehensive Logging and Error Handling System
// Enterprise-grade logging, monitoring, and error management for AiLydian Ultra Pro

const winston = require('winston');
const { format } = winston;
const path = require('path');
const fs = require('fs').promises;

class AzureLoggerService {
    constructor() {
        this.loggers = new Map();
        this.logLevels = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];
        this.logDirectory = path.join(process.cwd(), 'logs');
        this.maxLogSize = 50 * 1024 * 1024; // 50MB
        this.maxFiles = 30;
        this.retentionDays = 30;

        this.initialize();
    }

    /**
     * Initialize logging system
     */
    async initialize() {
        try {
            // Ensure log directory exists
            await this.ensureLogDirectory();

            // Create main application logger
            this.createLogger('application', {
                level: process.env.LOG_LEVEL || 'info',
                enableConsole: process.env.NODE_ENV !== 'production'
            });

            // Create service-specific loggers
            this.createServiceLoggers();

            // Setup log rotation and cleanup
            this.setupLogMaintenance();

            console.log('Azure Logger Service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Azure Logger Service:', error);
            throw error;
        }
    }

    /**
     * Ensure log directory exists
     */
    async ensureLogDirectory() {
        try {
            await fs.mkdir(this.logDirectory, { recursive: true });

            // Create subdirectories for different log types
            const subDirs = ['application', 'azure-services', 'security', 'performance', 'audit'];
            for (const dir of subDirs) {
                await fs.mkdir(path.join(this.logDirectory, dir), { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create log directories:', error);
            throw error;
        }
    }

    /**
     * Create a logger instance
     */
    createLogger(name, options = {}) {
        const loggerOptions = {
            level: options.level || 'info',
            format: format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                format.errors({ stack: true }),
                format.json(),
                format.prettyPrint()
            ),
            defaultMeta: {
                service: name,
                environment: process.env.NODE_ENV || 'development',
                version: process.env.APP_VERSION || '1.0.0',
                instance: process.env.INSTANCE_ID || 'local'
            },
            transports: []
        };

        // Add file transports
        loggerOptions.transports.push(
            // Error log
            new winston.transports.File({
                filename: path.join(this.logDirectory, `${name}`, 'error.log'),
                level: 'error',
                maxsize: this.maxLogSize,
                maxFiles: this.maxFiles,
                format: format.combine(
                    format.timestamp(),
                    format.errors({ stack: true }),
                    format.json()
                )
            }),

            // Warning log
            new winston.transports.File({
                filename: path.join(this.logDirectory, `${name}`, 'warn.log'),
                level: 'warn',
                maxsize: this.maxLogSize,
                maxFiles: this.maxFiles,
                format: format.combine(
                    format.timestamp(),
                    format.json()
                )
            }),

            // Combined log
            new winston.transports.File({
                filename: path.join(this.logDirectory, `${name}`, 'combined.log'),
                maxsize: this.maxLogSize,
                maxFiles: this.maxFiles,
                format: format.combine(
                    format.timestamp(),
                    format.json()
                )
            })
        );

        // Add console transport for development
        if (options.enableConsole !== false && process.env.NODE_ENV !== 'production') {
            loggerOptions.transports.push(
                new winston.transports.Console({
                    format: format.combine(
                        format.colorize(),
                        format.timestamp({ format: 'HH:mm:ss' }),
                        format.printf(({ timestamp, level, message, service, ...meta }) => {
                            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                            return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
                        })
                    )
                })
            );
        }

        const logger = winston.createLogger(loggerOptions);
        this.loggers.set(name, logger);
        return logger;
    }

    /**
     * Create service-specific loggers
     */
    createServiceLoggers() {
        const services = [
            'azure-config',
            'azure-container-apps',
            'azure-devops',
            'azure-maps',
            'azure-weather',
            'security',
            'performance',
            'audit',
            'api-gateway',
            'websocket'
        ];

        services.forEach(service => {
            this.createLogger(service, {
                level: process.env[`${service.toUpperCase().replace('-', '_')}_LOG_LEVEL`] || 'info'
            });
        });
    }

    /**
     * Get logger instance
     */
    getLogger(name = 'application') {
        if (!this.loggers.has(name)) {
            return this.createLogger(name);
        }
        return this.loggers.get(name);
    }

    /**
     * Log Azure service operations
     */
    logAzureOperation(serviceName, operation, data = {}, level = 'info') {
        const logger = this.getLogger(serviceName);
        const logData = {
            operation,
            timestamp: new Date().toISOString(),
            ...data
        };

        logger.log(level, `Azure ${serviceName} operation: ${operation}`, logData);
    }

    /**
     * Log security events
     */
    logSecurityEvent(eventType, details = {}, level = 'warn') {
        const securityLogger = this.getLogger('security');
        const logData = {
            eventType,
            timestamp: new Date().toISOString(),
            ipAddress: details.ipAddress,
            userAgent: details.userAgent,
            userId: details.userId,
            sessionId: details.sessionId,
            ...details
        };

        securityLogger.log(level, `Security event: ${eventType}`, logData);
    }

    /**
     * Log performance metrics
     */
    logPerformanceMetric(metric, value, unit = 'ms', context = {}) {
        const performanceLogger = this.getLogger('performance');
        const logData = {
            metric,
            value,
            unit,
            timestamp: new Date().toISOString(),
            ...context
        };

        performanceLogger.info(`Performance metric: ${metric}`, logData);
    }

    /**
     * Log audit trail
     */
    logAuditEvent(action, resource, userId, details = {}) {
        const auditLogger = this.getLogger('audit');
        const logData = {
            action,
            resource,
            userId,
            timestamp: new Date().toISOString(),
            ipAddress: details.ipAddress,
            userAgent: details.userAgent,
            ...details
        };

        auditLogger.info(`Audit: ${action} on ${resource}`, logData);
    }

    /**
     * Log API requests and responses
     */
    logApiCall(method, url, statusCode, responseTime, details = {}) {
        const apiLogger = this.getLogger('api-gateway');
        const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';

        const logData = {
            method,
            url,
            statusCode,
            responseTime,
            timestamp: new Date().toISOString(),
            ...details
        };

        apiLogger.log(level, `API ${method} ${url} - ${statusCode} (${responseTime}ms)`, logData);
    }

    /**
     * Log WebSocket events
     */
    logWebSocketEvent(eventType, connectionId, data = {}) {
        const wsLogger = this.getLogger('websocket');
        const logData = {
            eventType,
            connectionId,
            timestamp: new Date().toISOString(),
            ...data
        };

        wsLogger.info(`WebSocket event: ${eventType}`, logData);
    }

    /**
     * Log errors with enhanced context
     */
    logError(error, context = {}, serviceName = 'application') {
        const logger = this.getLogger(serviceName);
        const errorData = {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code
            },
            context,
            timestamp: new Date().toISOString(),
            severity: this.getErrorSeverity(error)
        };

        logger.error('Application error occurred', errorData);

        // Also log to security logger if it's a security-related error
        if (this.isSecurityError(error)) {
            this.logSecurityEvent('error', {
                error: error.message,
                ...context
            }, 'error');
        }
    }

    /**
     * Determine error severity
     */
    getErrorSeverity(error) {
        if (error.name === 'ValidationError') return 'low';
        if (error.name === 'AuthenticationError') return 'high';
        if (error.name === 'AuthorizationError') return 'high';
        if (error.code === 'ECONNREFUSED') return 'medium';
        if (error.code === 'ETIMEDOUT') return 'medium';
        return 'medium';
    }

    /**
     * Check if error is security-related
     */
    isSecurityError(error) {
        const securityErrors = [
            'AuthenticationError',
            'AuthorizationError',
            'InvalidTokenError',
            'RateLimitError',
            'SuspiciousActivityError'
        ];
        return securityErrors.includes(error.name);
    }

    /**
     * Create structured log entry
     */
    createLogEntry(level, message, data = {}, serviceName = 'application') {
        const logger = this.getLogger(serviceName);
        const logData = {
            ...data,
            timestamp: new Date().toISOString(),
            correlationId: data.correlationId || this.generateCorrelationId()
        };

        logger.log(level, message, logData);
        return logData.correlationId;
    }

    /**
     * Generate correlation ID for request tracking
     */
    generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Setup log maintenance (rotation and cleanup)
     */
    setupLogMaintenance() {
        // Clean up old logs every 24 hours
        setInterval(async () => {
            try {
                await this.cleanupOldLogs();
            } catch (error) {
                console.error('Log cleanup failed:', error);
            }
        }, 24 * 60 * 60 * 1000); // 24 hours

        // Log system stats every hour
        setInterval(() => {
            this.logSystemStats();
        }, 60 * 60 * 1000); // 1 hour
    }

    /**
     * Clean up old log files
     */
    async cleanupOldLogs() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

            const logDirs = await fs.readdir(this.logDirectory);

            for (const dir of logDirs) {
                const dirPath = path.join(this.logDirectory, dir);
                const stat = await fs.stat(dirPath);

                if (stat.isDirectory()) {
                    const files = await fs.readdir(dirPath);

                    for (const file of files) {
                        const filePath = path.join(dirPath, file);
                        const fileStat = await fs.stat(filePath);

                        if (fileStat.mtime < cutoffDate) {
                            await fs.unlink(filePath);
                            console.log(`Deleted old log file: ${filePath}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to cleanup old logs:', error);
        }
    }

    /**
     * Log system statistics
     */
    logSystemStats() {
        const stats = {
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            platform: process.platform,
            nodeVersion: process.version,
            loggers: this.loggers.size
        };

        this.logPerformanceMetric('system_stats', JSON.stringify(stats), 'object', {
            component: 'logger-service'
        });
    }

    /**
     * Get log statistics
     */
    async getLogStatistics() {
        try {
            const stats = {
                loggers: this.loggers.size,
                logDirectory: this.logDirectory,
                totalLogFiles: 0,
                totalLogSize: 0,
                logsByLevel: {},
                logsByService: {}
            };

            // Count log files and sizes
            const logDirs = await fs.readdir(this.logDirectory);

            for (const dir of logDirs) {
                const dirPath = path.join(this.logDirectory, dir);
                const dirStat = await fs.stat(dirPath);

                if (dirStat.isDirectory()) {
                    const files = await fs.readdir(dirPath);
                    stats.logsByService[dir] = files.length;

                    for (const file of files) {
                        const filePath = path.join(dirPath, file);
                        const fileStat = await fs.stat(filePath);
                        stats.totalLogFiles++;
                        stats.totalLogSize += fileStat.size;

                        // Count by level
                        const level = file.split('.')[0];
                        stats.logsByLevel[level] = (stats.logsByLevel[level] || 0) + 1;
                    }
                }
            }

            return stats;
        } catch (error) {
            console.error('Failed to get log statistics:', error);
            return null;
        }
    }

    /**
     * Export logs for analysis
     */
    async exportLogs(serviceName, startDate, endDate, format = 'json') {
        try {
            const serviceDir = path.join(this.logDirectory, serviceName);
            const files = await fs.readdir(serviceDir);
            const logs = [];

            for (const file of files) {
                if (file.endsWith('.log')) {
                    const filePath = path.join(serviceDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const logLines = content.split('\n').filter(line => line.trim());

                    for (const line of logLines) {
                        try {
                            const logEntry = JSON.parse(line);
                            const logDate = new Date(logEntry.timestamp);

                            if (logDate >= startDate && logDate <= endDate) {
                                logs.push(logEntry);
                            }
                        } catch (parseError) {
                            // Skip invalid JSON lines
                            continue;
                        }
                    }
                }
            }

            // Sort by timestamp
            logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            if (format === 'csv') {
                return this.convertLogsToCSV(logs);
            }

            return logs;
        } catch (error) {
            console.error('Failed to export logs:', error);
            return null;
        }
    }

    /**
     * Convert logs to CSV format
     */
    convertLogsToCSV(logs) {
        if (logs.length === 0) return '';

        const headers = ['timestamp', 'level', 'message', 'service'];
        const rows = logs.map(log => [
            log.timestamp,
            log.level,
            log.message,
            log.service
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    /**
     * Get comprehensive health status
     */
    async getHealthStatus() {
        try {
            const stats = await this.getLogStatistics();
            const status = {
                service: 'azure-logger',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                statistics: stats,
                configuration: {
                    logDirectory: this.logDirectory,
                    maxLogSize: this.maxLogSize,
                    maxFiles: this.maxFiles,
                    retentionDays: this.retentionDays,
                    loggersCount: this.loggers.size
                }
            };

            // Check disk space for log directory
            try {
                const diskUsage = await this.checkDiskUsage();
                status.diskUsage = diskUsage;

                if (diskUsage.freePercent < 10) {
                    status.status = 'warning';
                    status.warnings = ['Low disk space for logs'];
                }
            } catch (error) {
                status.warnings = status.warnings || [];
                status.warnings.push('Could not check disk usage');
            }

            return status;
        } catch (error) {
            return {
                service: 'azure-logger',
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Check disk usage for log directory
     */
    async checkDiskUsage() {
        const { execSync } = require('child_process');
        try {
            const output = execSync(`df -h ${this.logDirectory}`, { encoding: 'utf8' });
            const lines = output.trim().split('\n');
            const data = lines[1].split(/\s+/);

            return {
                total: data[1],
                used: data[2],
                available: data[3],
                usePercent: parseInt(data[4]),
                freePercent: 100 - parseInt(data[4])
            };
        } catch (error) {
            throw new Error('Could not check disk usage');
        }
    }
}

module.exports = AzureLoggerService;