// Azure Container Apps Integration Service
// Enterprise-grade container orchestration and scaling for AiLydian Ultra Pro

const { ContainerAppsAPIClient } = require('@azure/arm-containerservice');
const { DefaultAzureCredential } = require('@azure/identity');
const AzureConfigManager = require('./azure-config');
const winston = require('winston');

class AzureContainerAppsService {
    constructor() {
        this.configManager = new AzureConfigManager();
        this.client = null;
        this.config = null;

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'azure-container-apps' },
            transports: [
                new winston.transports.File({ filename: 'logs/container-apps-error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/container-apps.log' }),
                new winston.transports.Console({ format: winston.format.simple() })
            ]
        });

        this.initialize();
    }

    /**
     * Initialize Azure Container Apps client
     */
    async initialize() {
        try {
            await this.configManager.initializeCredentials();
            this.config = await this.configManager.getContainerAppsConfig();

            this.client = new ContainerAppsAPIClient(
                this.config.credentials,
                this.config.subscriptionId
            );

            this.logger.info('Azure Container Apps service initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Azure Container Apps service', error);
            throw error;
        }
    }

    /**
     * Create a new Container App for AI workload scaling
     */
    async createContainerApp(appName, configuration) {
        try {
            const containerAppDefinition = {
                location: this.config.location,
                environmentId: `/subscriptions/${this.config.subscriptionId}/resourceGroups/${this.config.resourceGroupName}/providers/Microsoft.App/managedEnvironments/${this.config.environmentName}`,
                configuration: {
                    secrets: configuration.secrets || [],
                    activeRevisionsMode: configuration.activeRevisionsMode || 'Single',
                    ingress: {
                        external: configuration.ingress?.external || true,
                        targetPort: configuration.ingress?.targetPort || 3000,
                        allowInsecure: configuration.ingress?.allowInsecure || false,
                        traffic: [{
                            weight: 100,
                            latestRevision: true
                        }]
                    },
                    registries: configuration.registries || []
                },
                template: {
                    containers: [{
                        name: appName,
                        image: configuration.image || 'ailydian/ultra-pro:latest',
                        env: configuration.environment || [],
                        resources: {
                            cpu: configuration.resources?.cpu || 0.5,
                            memory: configuration.resources?.memory || '1Gi'
                        }
                    }],
                    scale: {
                        minReplicas: configuration.scale?.minReplicas || 1,
                        maxReplicas: configuration.scale?.maxReplicas || 10,
                        rules: this.generateScalingRules(configuration.scalingRules)
                    }
                }
            };

            const result = await this.client.containerApps.beginCreateOrUpdate(
                this.config.resourceGroupName,
                appName,
                containerAppDefinition
            );

            this.logger.info(`Container App ${appName} created successfully`);
            return this.configManager.createSuccessResponse('createContainerApp', result);

        } catch (error) {
            return this.configManager.createErrorResponse('createContainerApp', error);
        }
    }

    /**
     * Scale Container App based on AI workload demands
     */
    async scaleContainerApp(appName, scalingConfig) {
        try {
            const app = await this.client.containerApps.get(
                this.config.resourceGroupName,
                appName
            );

            const updatedTemplate = {
                ...app.template,
                scale: {
                    minReplicas: scalingConfig.minReplicas || app.template.scale.minReplicas,
                    maxReplicas: scalingConfig.maxReplicas || app.template.scale.maxReplicas,
                    rules: this.generateScalingRules(scalingConfig.rules)
                }
            };

            const result = await this.client.containerApps.beginUpdate(
                this.config.resourceGroupName,
                appName,
                { template: updatedTemplate }
            );

            this.logger.info(`Container App ${appName} scaling updated`);
            return this.configManager.createSuccessResponse('scaleContainerApp', result);

        } catch (error) {
            return this.configManager.createErrorResponse('scaleContainerApp', error);
        }
    }

    /**
     * Deploy new revision of Container App
     */
    async deployRevision(appName, revisionConfig) {
        try {
            const app = await this.client.containerApps.get(
                this.config.resourceGroupName,
                appName
            );

            const newTemplate = {
                ...app.template,
                containers: [{
                    ...app.template.containers[0],
                    image: revisionConfig.image || app.template.containers[0].image,
                    env: revisionConfig.environment || app.template.containers[0].env
                }],
                revisionSuffix: revisionConfig.suffix || `rev-${Date.now()}`
            };

            const result = await this.client.containerApps.beginUpdate(
                this.config.resourceGroupName,
                appName,
                { template: newTemplate }
            );

            this.logger.info(`New revision deployed for Container App ${appName}`);
            return this.configManager.createSuccessResponse('deployRevision', result);

        } catch (error) {
            return this.configManager.createErrorResponse('deployRevision', error);
        }
    }

    /**
     * Implement load balancing across multiple OpenAI endpoints
     */
    async setupOpenAILoadBalancer(balancerName, openAIEndpoints) {
        try {
            const loadBalancerConfig = {
                image: 'ailydian/openai-load-balancer:latest',
                ingress: {
                    external: true,
                    targetPort: 8080
                },
                environment: [
                    {
                        name: 'OPENAI_ENDPOINTS',
                        value: JSON.stringify(openAIEndpoints)
                    },
                    {
                        name: 'OPENAI_CAPACITY',
                        value: process.env.OPENAI_CAPACITY || '30000'
                    },
                    {
                        name: 'LOAD_BALANCER_STRATEGY',
                        value: 'round-robin'
                    }
                ],
                scalingRules: [
                    {
                        name: 'http-scaling',
                        type: 'http',
                        metadata: {
                            concurrentRequests: '100'
                        }
                    },
                    {
                        name: 'cpu-scaling',
                        type: 'cpu',
                        metadata: {
                            type: 'Utilization',
                            value: '70'
                        }
                    }
                ]
            };

            return await this.createContainerApp(balancerName, loadBalancerConfig);

        } catch (error) {
            return this.configManager.createErrorResponse('setupOpenAILoadBalancer', error);
        }
    }

    /**
     * Monitor Container App performance and health
     */
    async getContainerAppMetrics(appName, timeRange = '1h') {
        try {
            const app = await this.client.containerApps.get(
                this.config.resourceGroupName,
                appName
            );

            const revisions = await this.client.containerAppsRevisions.listRevisions(
                this.config.resourceGroupName,
                appName
            );

            const metrics = {
                app: {
                    name: appName,
                    status: app.provisioningState,
                    location: app.location,
                    fqdn: app.configuration?.ingress?.fqdn
                },
                revisions: revisions.value?.map(rev => ({
                    name: rev.name,
                    active: rev.active,
                    replicas: rev.replicas,
                    trafficWeight: rev.trafficWeight,
                    createdTime: rev.createdTime
                })) || [],
                scaling: {
                    minReplicas: app.template?.scale?.minReplicas || 0,
                    maxReplicas: app.template?.scale?.maxReplicas || 0,
                    currentReplicas: app.template?.scale?.rules?.length || 0
                }
            };

            this.logger.info(`Retrieved metrics for Container App ${appName}`);
            return this.configManager.createSuccessResponse('getContainerAppMetrics', metrics);

        } catch (error) {
            return this.configManager.createErrorResponse('getContainerAppMetrics', error);
        }
    }

    /**
     * List all Container Apps in the resource group
     */
    async listContainerApps() {
        try {
            const apps = await this.client.containerApps.listByResourceGroup(
                this.config.resourceGroupName
            );

            const appList = apps.value?.map(app => ({
                name: app.name,
                status: app.provisioningState,
                location: app.location,
                fqdn: app.configuration?.ingress?.fqdn,
                replicas: app.template?.scale?.minReplicas || 0,
                image: app.template?.containers?.[0]?.image
            })) || [];

            return this.configManager.createSuccessResponse('listContainerApps', appList);

        } catch (error) {
            return this.configManager.createErrorResponse('listContainerApps', error);
        }
    }

    /**
     * Delete a Container App
     */
    async deleteContainerApp(appName) {
        try {
            await this.client.containerApps.beginDelete(
                this.config.resourceGroupName,
                appName
            );

            this.logger.info(`Container App ${appName} deleted successfully`);
            return this.configManager.createSuccessResponse('deleteContainerApp', null, `Container App ${appName} deleted`);

        } catch (error) {
            return this.configManager.createErrorResponse('deleteContainerApp', error);
        }
    }

    /**
     * Generate scaling rules based on configuration
     */
    generateScalingRules(rulesConfig) {
        if (!rulesConfig || !Array.isArray(rulesConfig)) {
            return [
                {
                    name: 'http-scaling-rule',
                    http: {
                        metadata: {
                            concurrentRequests: '100'
                        }
                    }
                }
            ];
        }

        return rulesConfig.map(rule => {
            switch (rule.type) {
                case 'http':
                    return {
                        name: rule.name,
                        http: {
                            metadata: {
                                concurrentRequests: rule.metadata?.concurrentRequests || '100'
                            }
                        }
                    };
                case 'cpu':
                    return {
                        name: rule.name,
                        custom: {
                            type: 'cpu',
                            metadata: {
                                type: 'Utilization',
                                value: rule.metadata?.value || '70'
                            }
                        }
                    };
                case 'memory':
                    return {
                        name: rule.name,
                        custom: {
                            type: 'memory',
                            metadata: {
                                type: 'Utilization',
                                value: rule.metadata?.value || '80'
                            }
                        }
                    };
                case 'queue':
                    return {
                        name: rule.name,
                        azureQueue: {
                            queueName: rule.metadata?.queueName,
                            queueLength: rule.metadata?.queueLength || '5',
                            auth: rule.metadata?.auth || []
                        }
                    };
                default:
                    return {
                        name: rule.name,
                        http: {
                            metadata: {
                                concurrentRequests: '100'
                            }
                        }
                    };
            }
        });
    }

    /**
     * Setup CI/CD integration for Container Apps
     */
    async setupCICDIntegration(appName, sourceControlConfig) {
        try {
            const sourceControl = {
                repoUrl: sourceControlConfig.repoUrl,
                branch: sourceControlConfig.branch || 'main',
                githubActionConfiguration: {
                    registryInfo: {
                        registryUrl: sourceControlConfig.registryUrl,
                        registryUserName: sourceControlConfig.registryUserName
                    },
                    azureCredentials: {
                        clientId: this.config.credentials.clientId,
                        clientSecret: sourceControlConfig.clientSecret,
                        tenantId: this.config.credentials.tenantId,
                        subscriptionId: this.config.subscriptionId
                    }
                }
            };

            const result = await this.client.containerAppsSourceControls.beginCreateOrUpdate(
                this.config.resourceGroupName,
                appName,
                sourceControl
            );

            this.logger.info(`CI/CD integration setup for Container App ${appName}`);
            return this.configManager.createSuccessResponse('setupCICDIntegration', result);

        } catch (error) {
            return this.configManager.createErrorResponse('setupCICDIntegration', error);
        }
    }

    /**
     * Get comprehensive health status
     */
    async getHealthStatus() {
        try {
            const baseStatus = await this.configManager.getHealthStatus();

            // Add Container Apps specific health checks
            const containerAppsStatus = {
                client: this.client ? 'initialized' : 'not-initialized',
                resourceGroup: this.config?.resourceGroupName || 'not-configured',
                environment: this.config?.environmentName || 'not-configured'
            };

            if (this.client) {
                try {
                    const apps = await this.listContainerApps();
                    containerAppsStatus.appsCount = apps.data?.length || 0;
                    containerAppsStatus.status = 'healthy';
                } catch (error) {
                    containerAppsStatus.status = 'error';
                    containerAppsStatus.error = error.message;
                }
            }

            return {
                ...baseStatus,
                containerApps: containerAppsStatus
            };

        } catch (error) {
            return this.configManager.createErrorResponse('getHealthStatus', error);
        }
    }
}

module.exports = AzureContainerAppsService;