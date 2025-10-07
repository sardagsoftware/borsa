// Azure Configuration and Authentication Module
// Enterprise-grade Azure SDK integration for AiLydian Ultra Pro

const { DefaultAzureCredential, ClientSecretCredential, ManagedIdentityCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const winston = require('winston');

class AzureConfigManager {
    constructor() {
        this.credentials = null;
        this.keyVaultClient = null;
        this.config = {
            // Azure subscription and tenant information
            subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
            tenantId: process.env.AZURE_TENANT_ID,
            clientId: process.env.AZURE_CLIENT_ID,
            clientSecret: process.env.AZURE_CLIENT_SECRET,

            // Azure service-specific configurations
            keyVaultUrl: process.env.AZURE_KEYVAULT_URL || 'https://ailydian-vault.vault.azure.net/',
            resourceGroupName: process.env.AZURE_RESOURCE_GROUP || 'ailydian-enterprise-rg',
            location: process.env.AZURE_LOCATION || 'West Europe',

            // Azure Maps configuration
            mapsSubscriptionKey: process.env.AZURE_MAPS_SUBSCRIPTION_KEY,
            mapsClientId: process.env.AZURE_MAPS_CLIENT_ID,

            // Azure Container Apps configuration
            containerAppsEnvironment: process.env.AZURE_CONTAINER_APPS_ENVIRONMENT || 'ailydian-env',

            // Azure DevOps configuration
            devOpsOrganization: process.env.AZURE_DEVOPS_ORGANIZATION || 'ailydian-enterprise',
            devOpsProject: process.env.AZURE_DEVOPS_PROJECT || 'ailydian-ultra-pro',
            devOpsToken: process.env.AZURE_DEVOPS_TOKEN,

            // Monitoring and logging
            enableTelemetry: process.env.AZURE_ENABLE_TELEMETRY !== 'false',
            logLevel: process.env.AZURE_LOG_LEVEL || 'info'
        };

        this.logger = winston.createLogger({
            level: this.config.logLevel,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'azure-config' },
            transports: [
                new winston.transports.File({ filename: 'logs/azure-error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/azure-combined.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });

        this.initializeCredentials();
    }

    /**
     * Initialize Azure credentials using the most appropriate method
     */
    async initializeCredentials() {
        try {
            // Try different credential types in order of preference
            if (this.config.clientId && this.config.clientSecret && this.config.tenantId) {
                // Service Principal authentication
                this.credentials = new ClientSecretCredential(
                    this.config.tenantId,
                    this.config.clientId,
                    this.config.clientSecret
                );
                this.logger.info('Azure authentication: Using Service Principal credentials');
            } else if (process.env.MSI_ENDPOINT || process.env.IDENTITY_ENDPOINT) {
                // Managed Identity authentication (for Azure-hosted applications)
                this.credentials = new ManagedIdentityCredential();
                this.logger.info('Azure authentication: Using Managed Identity credentials');
            } else {
                // Default credential chain (includes Azure CLI, VS Code, etc.)
                this.credentials = new DefaultAzureCredential();
                this.logger.info('Azure authentication: Using Default credential chain');
            }

            // Test credential validity
            await this.validateCredentials();

            // Initialize Key Vault client if URL is provided
            if (this.config.keyVaultUrl) {
                await this.initializeKeyVault();
            }

        } catch (error) {
            this.logger.error('Failed to initialize Azure credentials', error);
            throw new Error(`Azure credential initialization failed: ${error.message}`);
        }
    }

    /**
     * Validate credentials by attempting to get an access token
     */
    async validateCredentials() {
        try {
            const token = await this.credentials.getToken('https://management.azure.com/.default');
            if (!token) {
                throw new Error('Failed to obtain access token');
            }
            this.logger.info('Azure credentials validated successfully');
            return true;
        } catch (error) {
            this.logger.error('Azure credential validation failed', error);
            throw new Error(`Credential validation failed: ${error.message}`);
        }
    }

    /**
     * Initialize Azure Key Vault client
     */
    async initializeKeyVault() {
        try {
            this.keyVaultClient = new SecretClient(this.config.keyVaultUrl, this.credentials);

            // Test Key Vault access
            const testSecret = 'test-connection';
            try {
                await this.keyVaultClient.getSecret(testSecret);
            } catch (error) {
                if (error.code !== 'SecretNotFound') {
                    throw error;
                }
            }

            this.logger.info('Azure Key Vault client initialized successfully');
        } catch (error) {
            this.logger.warn('Azure Key Vault initialization failed', error);
            // Don't throw here as Key Vault might not be required for all operations
        }
    }

    /**
     * Get credentials for Azure service authentication
     */
    getCredentials() {
        if (!this.credentials) {
            throw new Error('Azure credentials not initialized. Call initializeCredentials() first.');
        }
        return this.credentials;
    }

    /**
     * Get configuration value, with Key Vault fallback
     */
    async getConfig(key, defaultValue = null) {
        // First, try environment variable
        if (this.config[key] !== undefined) {
            return this.config[key];
        }

        // Then, try Key Vault if available
        if (this.keyVaultClient) {
            try {
                const secret = await this.keyVaultClient.getSecret(key);
                return secret.value;
            } catch (error) {
                if (error.code !== 'SecretNotFound') {
                    this.logger.warn(`Failed to retrieve secret ${key} from Key Vault`, error);
                }
            }
        }

        return defaultValue;
    }

    /**
     * Store configuration value in Key Vault
     */
    async setConfig(key, value) {
        if (!this.keyVaultClient) {
            throw new Error('Key Vault client not initialized');
        }

        try {
            await this.keyVaultClient.setSecret(key, value);
            this.logger.info(`Configuration ${key} stored in Key Vault successfully`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to store configuration ${key} in Key Vault`, error);
            throw error;
        }
    }

    /**
     * Get Azure Maps authentication configuration
     */
    async getMapsConfig() {
        return {
            subscriptionKey: await this.getConfig('mapsSubscriptionKey'),
            clientId: await this.getConfig('mapsClientId'),
            defaultLocale: 'en-US',
            defaultLanguage: 'en',
            apiVersion: '1.0'
        };
    }

    /**
     * Get Azure Container Apps configuration
     */
    async getContainerAppsConfig() {
        return {
            subscriptionId: this.config.subscriptionId,
            resourceGroupName: this.config.resourceGroupName,
            environmentName: this.config.containerAppsEnvironment,
            location: this.config.location,
            credentials: this.credentials
        };
    }

    /**
     * Get Azure DevOps configuration
     */
    async getDevOpsConfig() {
        return {
            organization: this.config.devOpsOrganization,
            project: this.config.devOpsProject,
            personalAccessToken: await this.getConfig('devOpsToken'),
            apiVersion: '7.1-preview.1'
        };
    }

    /**
     * Get comprehensive health check information
     */
    async getHealthStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            credentials: 'unknown',
            keyVault: 'unknown',
            services: {
                maps: 'unknown',
                containerApps: 'unknown',
                devOps: 'unknown'
            }
        };

        try {
            // Check credentials
            await this.validateCredentials();
            status.credentials = 'healthy';
        } catch (error) {
            status.credentials = 'error';
            status.credentialsError = error.message;
        }

        // Check Key Vault
        if (this.keyVaultClient) {
            try {
                await this.keyVaultClient.getSecret('test-connection');
                status.keyVault = 'healthy';
            } catch (error) {
                if (error.code === 'SecretNotFound') {
                    status.keyVault = 'healthy';
                } else {
                    status.keyVault = 'error';
                    status.keyVaultError = error.message;
                }
            }
        }

        // Check service configurations
        try {
            const mapsConfig = await this.getMapsConfig();
            status.services.maps = mapsConfig.subscriptionKey ? 'configured' : 'missing-key';
        } catch (error) {
            status.services.maps = 'error';
        }

        try {
            const devOpsConfig = await this.getDevOpsConfig();
            status.services.devOps = devOpsConfig.personalAccessToken ? 'configured' : 'missing-token';
        } catch (error) {
            status.services.devOps = 'error';
        }

        status.services.containerApps = this.config.subscriptionId ? 'configured' : 'missing-subscription';

        return status;
    }

    /**
     * Create a standardized error response
     */
    createErrorResponse(operation, error, statusCode = 500) {
        const errorResponse = {
            success: false,
            operation,
            error: {
                message: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                statusCode,
                timestamp: new Date().toISOString()
            }
        };

        this.logger.error(`Azure operation failed: ${operation}`, error);
        return errorResponse;
    }

    /**
     * Create a standardized success response
     */
    createSuccessResponse(operation, data = null, message = 'Operation completed successfully') {
        const response = {
            success: true,
            operation,
            message,
            timestamp: new Date().toISOString()
        };

        if (data !== null) {
            response.data = data;
        }

        this.logger.info(`Azure operation succeeded: ${operation}`);
        return response;
    }
}

module.exports = AzureConfigManager;