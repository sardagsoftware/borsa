// Azure Services Integration Hub
// Main entry point for all Azure services in AiLydian Ultra Pro

const AzureConfigManager = require('./azure-config');
const AzureContainerAppsService = require('./azure-container-apps');
const AzureDevOpsService = require('./azure-devops');
const AzureMapsService = require('./azure-maps');
const AzureWeatherService = require('./azure-weather');
const AzureSecurityService = require('./azure-security');
const AzureLoggerService = require('./azure-logger');
const AzureAPIGateway = require('./azure-api-gateway');

/**
 * Azure Services Integration Hub
 * Provides centralized management and initialization of all Azure services
 */
class AzureServicesHub {
    constructor(options = {}) {
        this.options = {
            enableLogging: options.enableLogging !== false,
            enableSecurity: options.enableSecurity !== false,
            enableWebSocket: options.enableWebSocket !== false,
            logLevel: options.logLevel || process.env.LOG_LEVEL || 'info',
            port: options.port || process.env.PORT || 3000,
            autoStart: options.autoStart !== false,
            ...options
        };

        this.services = {};
        this.initialized = false;
        this.isRunning = false;
    }

    /**
     * Initialize all Azure services
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Azure Services Hub...');

            // Initialize logger first if enabled
            if (this.options.enableLogging) {
                console.log('📋 Initializing Azure Logger Service...');
                this.services.logger = new AzureLoggerService();
                await this.services.logger.initialize();
                console.log('✅ Azure Logger Service initialized');
            }

            // Initialize core configuration manager
            console.log('⚙️ Initializing Azure Configuration Manager...');
            this.services.config = new AzureConfigManager();
            await this.services.config.initializeCredentials();
            console.log('✅ Azure Configuration Manager initialized');

            // Initialize security service if enabled
            if (this.options.enableSecurity) {
                console.log('🔐 Initializing Azure Security Service...');
                this.services.security = new AzureSecurityService();
                await this.services.security.initialize();
                console.log('✅ Azure Security Service initialized');
            }

            // Initialize Azure Container Apps service
            console.log('📦 Initializing Azure Container Apps Service...');
            this.services.containerApps = new AzureContainerAppsService();
            await this.services.containerApps.initialize();
            console.log('✅ Azure Container Apps Service initialized');

            // Initialize Azure DevOps service
            console.log('🔄 Initializing Azure DevOps Service...');
            this.services.devOps = new AzureDevOpsService();
            await this.services.devOps.initialize();
            console.log('✅ Azure DevOps Service initialized');

            // Initialize Azure Maps service
            console.log('🗺️ Initializing Azure Maps Service...');
            this.services.maps = new AzureMapsService();
            await this.services.maps.initialize();
            console.log('✅ Azure Maps Service initialized');

            // Initialize Azure Weather service
            console.log('🌤️ Initializing Azure Weather Service...');
            this.services.weather = new AzureWeatherService();
            await this.services.weather.initialize();
            console.log('✅ Azure Weather Service initialized');

            // Initialize API Gateway
            console.log('🌐 Initializing Azure API Gateway...');
            this.services.apiGateway = new AzureAPIGateway();
            await this.services.apiGateway.initialize();
            console.log('✅ Azure API Gateway initialized');

            this.initialized = true;
            console.log('🎉 All Azure services initialized successfully!');

            // Auto-start if enabled
            if (this.options.autoStart) {
                await this.start();
            }

            return this;

        } catch (error) {
            console.error('❌ Failed to initialize Azure Services Hub:', error);

            if (this.services.logger) {
                this.services.logger.logError(error, {
                    operation: 'azure_services_initialization',
                    options: this.options
                }, 'azure-services-hub');
            }

            throw error;
        }
    }

    /**
     * Start the API Gateway server
     */
    async start(port) {
        try {
            if (!this.initialized) {
                throw new Error('Azure Services Hub must be initialized before starting');
            }

            if (this.isRunning) {
                console.log('⚠️ Azure Services Hub is already running');
                return this;
            }

            const serverPort = port || this.options.port;
            console.log(`🚀 Starting Azure API Gateway on port ${serverPort}...`);

            await this.services.apiGateway.start(serverPort);
            this.isRunning = true;

            console.log(`✅ Azure Services Hub is now running on port ${serverPort}`);
            console.log(`📡 API Documentation: http://localhost:${serverPort}/health`);

            if (this.options.enableWebSocket) {
                console.log(`🔌 WebSocket Server: ws://localhost:${serverPort}/ws`);
            }

            if (this.services.logger) {
                this.services.logger.createLogEntry('info', 'Azure Services Hub started successfully', {
                    port: serverPort,
                    services: Object.keys(this.services),
                    options: this.options
                }, 'azure-services-hub');
            }

            return this;

        } catch (error) {
            console.error('❌ Failed to start Azure Services Hub:', error);

            if (this.services.logger) {
                this.services.logger.logError(error, {
                    operation: 'azure_services_start',
                    port: port || this.options.port
                }, 'azure-services-hub');
            }

            throw error;
        }
    }

    /**
     * Stop the API Gateway server
     */
    async stop() {
        try {
            if (!this.isRunning) {
                console.log('⚠️ Azure Services Hub is not running');
                return this;
            }

            console.log('🛑 Stopping Azure Services Hub...');

            if (this.services.apiGateway) {
                await this.services.apiGateway.stop();
            }

            this.isRunning = false;
            console.log('✅ Azure Services Hub stopped successfully');

            if (this.services.logger) {
                this.services.logger.createLogEntry('info', 'Azure Services Hub stopped', {
                    services: Object.keys(this.services)
                }, 'azure-services-hub');
            }

            return this;

        } catch (error) {
            console.error('❌ Failed to stop Azure Services Hub:', error);

            if (this.services.logger) {
                this.services.logger.logError(error, {
                    operation: 'azure_services_stop'
                }, 'azure-services-hub');
            }

            throw error;
        }
    }

    /**
     * Get a specific service instance
     */
    getService(serviceName) {
        if (!this.initialized) {
            throw new Error('Azure Services Hub must be initialized before accessing services');
        }

        const service = this.services[serviceName];
        if (!service) {
            throw new Error(`Service '${serviceName}' not found. Available services: ${Object.keys(this.services).join(', ')}`);
        }

        return service;
    }

    /**
     * Get all service instances
     */
    getAllServices() {
        if (!this.initialized) {
            throw new Error('Azure Services Hub must be initialized before accessing services');
        }

        return { ...this.services };
    }

    /**
     * Get comprehensive health status of all services
     */
    async getHealthStatus() {
        try {
            if (!this.initialized) {
                return {
                    overall: 'error',
                    message: 'Azure Services Hub not initialized',
                    timestamp: new Date().toISOString()
                };
            }

            const healthChecks = await Promise.allSettled([
                this.services.config?.getHealthStatus(),
                this.services.containerApps?.getHealthStatus(),
                this.services.devOps?.getHealthStatus(),
                this.services.maps?.getHealthStatus(),
                this.services.weather?.getHealthStatus(),
                this.services.security?.getSecurityStatus(),
                this.services.logger?.getHealthStatus()
            ].filter(Boolean));

            const healthStatuses = {};
            const serviceNames = ['config', 'containerApps', 'devOps', 'maps', 'weather', 'security', 'logger'];

            healthChecks.forEach((result, index) => {
                const serviceName = serviceNames[index];
                if (result.status === 'fulfilled') {
                    healthStatuses[serviceName] = result.value;
                } else {
                    healthStatuses[serviceName] = {
                        service: serviceName,
                        status: 'error',
                        error: result.reason?.message || 'Unknown error',
                        timestamp: new Date().toISOString()
                    };
                }
            });

            // Determine overall health
            const overallHealth = Object.values(healthStatuses).every(status =>
                status.status === 'healthy' || status.credentials === 'healthy'
            ) ? 'healthy' : 'degraded';

            const report = {
                overall: overallHealth,
                timestamp: new Date().toISOString(),
                services: healthStatuses,
                hub: {
                    initialized: this.initialized,
                    running: this.isRunning,
                    servicesCount: Object.keys(this.services).length,
                    options: this.options
                }
            };

            // Add WebSocket info if available
            if (this.services.apiGateway && this.options.enableWebSocket) {
                report.websocket = {
                    activeConnections: this.services.apiGateway.activeConnections?.size || 0,
                    subscriptions: this.services.apiGateway.subscriptions?.size || 0
                };
            }

            return report;

        } catch (error) {
            if (this.services.logger) {
                this.services.logger.logError(error, {
                    operation: 'get_health_status'
                }, 'azure-services-hub');
            }

            return {
                overall: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Restart all services
     */
    async restart() {
        try {
            console.log('🔄 Restarting Azure Services Hub...');

            await this.stop();
            await this.initialize();

            console.log('✅ Azure Services Hub restarted successfully');
            return this;

        } catch (error) {
            console.error('❌ Failed to restart Azure Services Hub:', error);
            throw error;
        }
    }

    /**
     * Configure service options
     */
    configure(newOptions) {
        this.options = {
            ...this.options,
            ...newOptions
        };

        if (this.services.logger) {
            this.services.logger.createLogEntry('info', 'Azure Services Hub configuration updated', {
                newOptions,
                currentOptions: this.options
            }, 'azure-services-hub');
        }

        return this;
    }

    /**
     * Get service statistics
     */
    getStatistics() {
        const stats = {
            hub: {
                initialized: this.initialized,
                running: this.isRunning,
                uptime: this.isRunning ? Date.now() - this.startTime : 0,
                servicesCount: Object.keys(this.services).length
            },
            services: {}
        };

        // Collect statistics from each service
        Object.entries(this.services).forEach(([name, service]) => {
            stats.services[name] = {
                initialized: !!service,
                type: service.constructor.name
            };
        });

        return stats;
    }
}

/**
 * Factory function to create and initialize Azure Services Hub
 */
async function createAzureServicesHub(options = {}) {
    const hub = new AzureServicesHub(options);
    await hub.initialize();
    return hub;
}

/**
 * Quick start function for common use cases
 */
async function quickStart(port = 3000) {
    console.log('🚀 Quick starting Azure Services Hub...');

    const hub = await createAzureServicesHub({
        port,
        autoStart: true,
        enableLogging: true,
        enableSecurity: true,
        enableWebSocket: true
    });

    console.log(`✅ Azure Services Hub quick start completed on port ${port}`);
    return hub;
}

// Export everything
module.exports = {
    AzureServicesHub,
    createAzureServicesHub,
    quickStart,

    // Individual services for direct access
    AzureConfigManager,
    AzureContainerAppsService,
    AzureDevOpsService,
    AzureMapsService,
    AzureWeatherService,
    AzureSecurityService,
    AzureLoggerService,
    AzureAPIGateway
};

// For ES6 imports
module.exports.default = AzureServicesHub;