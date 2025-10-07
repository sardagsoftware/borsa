// Azure DevOps Pipeline Integration Service
// Enterprise CI/CD capabilities for AiLydian Ultra Pro

const axios = require('axios');
const AzureConfigManager = require('./azure-config');
const winston = require('winston');

class AzureDevOpsService {
    constructor() {
        this.configManager = new AzureConfigManager();
        this.config = null;
        this.apiClient = null;

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'azure-devops' },
            transports: [
                new winston.transports.File({ filename: 'logs/devops-error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/devops.log' }),
                new winston.transports.Console({ format: winston.format.simple() })
            ]
        });

        this.initialize();
    }

    /**
     * Initialize Azure DevOps service
     */
    async initialize() {
        try {
            await this.configManager.initializeCredentials();
            this.config = await this.configManager.getDevOpsConfig();

            if (!this.config.personalAccessToken) {
                throw new Error('Azure DevOps Personal Access Token is required');
            }

            this.apiClient = axios.create({
                baseURL: `https://dev.azure.com/${this.config.organization}`,
                headers: {
                    'Authorization': `Basic ${Buffer.from(':' + this.config.personalAccessToken).toString('base64')}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            this.logger.info('Azure DevOps service initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Azure DevOps service', error);
            throw error;
        }
    }

    /**
     * Create a new pipeline
     */
    async createPipeline(pipelineDefinition) {
        try {
            const pipelineConfig = {
                name: pipelineDefinition.name,
                folder: pipelineDefinition.folder || '\\',
                configuration: {
                    type: 'yaml',
                    path: pipelineDefinition.yamlPath || '/azure-pipelines.yml',
                    repository: {
                        id: pipelineDefinition.repositoryId,
                        name: pipelineDefinition.repositoryName,
                        type: pipelineDefinition.repositoryType || 'azureReposGit'
                    }
                }
            };

            const response = await this.apiClient.post(
                `/${this.config.project}/_apis/pipelines?api-version=${this.config.apiVersion}`,
                pipelineConfig
            );

            this.logger.info(`Pipeline ${pipelineDefinition.name} created successfully`);
            return this.configManager.createSuccessResponse('createPipeline', response.data);

        } catch (error) {
            return this.configManager.createErrorResponse('createPipeline', error);
        }
    }

    /**
     * Run a pipeline
     */
    async runPipeline(pipelineId, parameters = {}) {
        try {
            const runConfig = {
                stagesToSkip: [],
                resources: {
                    repositories: {
                        self: {
                            refName: parameters.branch || 'refs/heads/main'
                        }
                    }
                },
                variables: parameters.variables || {}
            };

            const response = await this.apiClient.post(
                `/${this.config.project}/_apis/pipelines/${pipelineId}/runs?api-version=${this.config.apiVersion}`,
                runConfig
            );

            this.logger.info(`Pipeline ${pipelineId} run initiated`);
            return this.configManager.createSuccessResponse('runPipeline', response.data);

        } catch (error) {
            return this.configManager.createErrorResponse('runPipeline', error);
        }
    }

    /**
     * Get pipeline run status
     */
    async getPipelineRunStatus(pipelineId, runId) {
        try {
            const response = await this.apiClient.get(
                `/${this.config.project}/_apis/pipelines/${pipelineId}/runs/${runId}?api-version=${this.config.apiVersion}`
            );

            return this.configManager.createSuccessResponse('getPipelineRunStatus', response.data);

        } catch (error) {
            return this.configManager.createErrorResponse('getPipelineRunStatus', error);
        }
    }

    /**
     * Create YAML pipeline for AI application deployment
     */
    generateAIPipelineYAML(config) {
        const yamlConfig = {
            trigger: config.trigger || ['main'],
            pool: {
                vmImage: config.vmImage || 'ubuntu-latest'
            },
            variables: {
                buildConfiguration: 'Release',
                azureSubscription: config.azureSubscription || 'ailydian-enterprise-connection',
                containerRegistry: config.containerRegistry || 'ailydianregistry.azurecr.io',
                imageName: config.imageName || 'ailydian-ultra-pro',
                ...config.variables
            },
            stages: [
                {
                    stage: 'Build',
                    displayName: 'Build and Test',
                    jobs: [{
                        job: 'Build',
                        displayName: 'Build AI Application',
                        steps: [
                            {
                                task: 'NodeTool@0',
                                inputs: {
                                    versionSpec: config.nodeVersion || '18.x'
                                },
                                displayName: 'Install Node.js'
                            },
                            {
                                script: 'npm install',
                                displayName: 'Install dependencies'
                            },
                            {
                                script: 'npm run test',
                                displayName: 'Run tests',
                                continueOnError: false
                            },
                            {
                                script: 'npm run build',
                                displayName: 'Build application'
                            }
                        ]
                    }]
                },
                {
                    stage: 'ContainerBuild',
                    displayName: 'Container Build and Push',
                    dependsOn: 'Build',
                    jobs: [{
                        job: 'ContainerBuild',
                        displayName: 'Build and Push Container',
                        steps: [
                            {
                                task: 'Docker@2',
                                displayName: 'Build and push container image',
                                inputs: {
                                    command: 'buildAndPush',
                                    repository: '$(imageName)',
                                    dockerfile: config.dockerfile || '$(Build.SourcesDirectory)/Dockerfile',
                                    containerRegistry: '$(containerRegistry)',
                                    tags: '$(Build.BuildId)'
                                }
                            }
                        ]
                    }]
                },
                {
                    stage: 'Deploy',
                    displayName: 'Deploy to Azure Container Apps',
                    dependsOn: 'ContainerBuild',
                    jobs: [{
                        deployment: 'Deploy',
                        displayName: 'Deploy AI Application',
                        environment: config.environment || 'production',
                        strategy: {
                            runOnce: {
                                deploy: {
                                    steps: [
                                        {
                                            task: 'AzureContainerApps@1',
                                            displayName: 'Deploy to Container Apps',
                                            inputs: {
                                                azureSubscription: '$(azureSubscription)',
                                                containerAppName: config.containerAppName || 'ailydian-ultra-pro',
                                                resourceGroup: config.resourceGroup || 'ailydian-enterprise-rg',
                                                imageToDeploy: '$(containerRegistry)/$(imageName):$(Build.BuildId)'
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }]
                }
            ]
        };

        return `# Azure DevOps Pipeline for AiLydian Ultra Pro AI Application
# Generated automatically by Azure DevOps Service

trigger:
${yamlConfig.trigger.map(branch => `  - ${branch}`).join('\n')}

pool:
  vmImage: '${yamlConfig.pool.vmImage}'

variables:
${Object.entries(yamlConfig.variables).map(([key, value]) => `  ${key}: '${value}'`).join('\n')}

stages:
${this.convertStageToYAML(yamlConfig.stages)}`;
    }

    /**
     * Convert stage configuration to YAML format
     */
    convertStageToYAML(stages) {
        return stages.map(stage => {
            let yaml = `- stage: ${stage.stage}\n  displayName: '${stage.displayName}'\n`;

            if (stage.dependsOn) {
                yaml += `  dependsOn: ${stage.dependsOn}\n`;
            }

            yaml += '  jobs:\n';
            yaml += stage.jobs.map(job => this.convertJobToYAML(job)).join('\n');

            return yaml;
        }).join('\n\n');
    }

    /**
     * Convert job configuration to YAML format
     */
    convertJobToYAML(job) {
        let yaml = `  - job: ${job.job || job.deployment}\n    displayName: '${job.displayName}'\n`;

        if (job.environment) {
            yaml += `    environment: '${job.environment}'\n`;
        }

        if (job.strategy) {
            yaml += '    strategy:\n      runOnce:\n        deploy:\n          steps:\n';
            yaml += job.strategy.runOnce.deploy.steps.map(step => this.convertStepToYAML(step, '          ')).join('\n');
        } else if (job.steps) {
            yaml += '    steps:\n';
            yaml += job.steps.map(step => this.convertStepToYAML(step, '    ')).join('\n');
        }

        return yaml;
    }

    /**
     * Convert step configuration to YAML format
     */
    convertStepToYAML(step, indent) {
        let yaml = `${indent}- `;

        if (step.task) {
            yaml += `task: ${step.task}\n`;
            if (step.displayName) {
                yaml += `${indent}  displayName: '${step.displayName}'\n`;
            }
            if (step.inputs) {
                yaml += `${indent}  inputs:\n`;
                yaml += Object.entries(step.inputs).map(([key, value]) => `${indent}    ${key}: '${value}'`).join('\n');
            }
            if (step.continueOnError !== undefined) {
                yaml += `\n${indent}  continueOnError: ${step.continueOnError}`;
            }
        } else if (step.script) {
            yaml += `script: '${step.script}'\n`;
            if (step.displayName) {
                yaml += `${indent}  displayName: '${step.displayName}'`;
            }
        }

        return yaml;
    }

    /**
     * Create a repository webhook for CI/CD automation
     */
    async createWebhook(repositoryId, webhookConfig) {
        try {
            const webhook = {
                publisherId: 'tfs',
                eventType: webhookConfig.eventType || 'git.push',
                resourceVersion: '1.0',
                consumerId: 'webHooks',
                consumerActionId: 'httpRequest',
                publisherInputs: {
                    repository: repositoryId,
                    branch: webhookConfig.branch || 'main'
                },
                consumerInputs: {
                    url: webhookConfig.url,
                    httpHeaders: webhookConfig.headers || {},
                    basicAuthUsername: webhookConfig.basicAuthUsername || '',
                    basicAuthPassword: webhookConfig.basicAuthPassword || ''
                }
            };

            const response = await this.apiClient.post(
                `/_apis/hooks/subscriptions?api-version=${this.config.apiVersion}`,
                webhook
            );

            this.logger.info(`Webhook created for repository ${repositoryId}`);
            return this.configManager.createSuccessResponse('createWebhook', response.data);

        } catch (error) {
            return this.configManager.createErrorResponse('createWebhook', error);
        }
    }

    /**
     * Get build/release history
     */
    async getBuildHistory(pipelineId, count = 10) {
        try {
            const response = await this.apiClient.get(
                `/${this.config.project}/_apis/pipelines/${pipelineId}/runs?api-version=${this.config.apiVersion}&$top=${count}`
            );

            const builds = response.data.value.map(build => ({
                id: build.id,
                name: build.name,
                status: build.state,
                result: build.result,
                startTime: build.createdDate,
                finishTime: build.finishedDate,
                requestedBy: build.requestedBy?.displayName,
                sourceBranch: build.resources?.repositories?.self?.refName,
                sourceVersion: build.resources?.repositories?.self?.version
            }));

            return this.configManager.createSuccessResponse('getBuildHistory', builds);

        } catch (error) {
            return this.configManager.createErrorResponse('getBuildHistory', error);
        }
    }

    /**
     * Create environment for deployment stages
     */
    async createEnvironment(environmentConfig) {
        try {
            const environment = {
                name: environmentConfig.name,
                description: environmentConfig.description || `Environment for ${environmentConfig.name}`
            };

            const response = await this.apiClient.post(
                `/${this.config.project}/_apis/distributedtask/environments?api-version=${this.config.apiVersion}`,
                environment
            );

            this.logger.info(`Environment ${environmentConfig.name} created successfully`);
            return this.configManager.createSuccessResponse('createEnvironment', response.data);

        } catch (error) {
            return this.configManager.createErrorResponse('createEnvironment', error);
        }
    }

    /**
     * Setup approval gates for production deployments
     */
    async setupApprovalGates(environmentId, approvers) {
        try {
            const approvalConfig = {
                type: {
                    id: '31C3C104-40F7-4A8E-85E0-2E3C984EE443',
                    name: 'Approval'
                },
                settings: {
                    approvers: approvers.map(approver => ({
                        id: approver.id,
                        displayName: approver.displayName
                    })),
                    executionOrder: 'anyOrder',
                    instructions: 'Please review and approve the deployment to production',
                    minRequiredApprovers: approvers.length
                }
            };

            const response = await this.apiClient.post(
                `/${this.config.project}/_apis/distributedtask/environments/${environmentId}/checks?api-version=${this.config.apiVersion}`,
                approvalConfig
            );

            this.logger.info(`Approval gates setup for environment ${environmentId}`);
            return this.configManager.createSuccessResponse('setupApprovalGates', response.data);

        } catch (error) {
            return this.configManager.createErrorResponse('setupApprovalGates', error);
        }
    }

    /**
     * Get project information and statistics
     */
    async getProjectInfo() {
        try {
            const projectResponse = await this.apiClient.get(
                `/_apis/projects/${this.config.project}?api-version=${this.config.apiVersion}`
            );

            const pipelinesResponse = await this.apiClient.get(
                `/${this.config.project}/_apis/pipelines?api-version=${this.config.apiVersion}`
            );

            const repositoriesResponse = await this.apiClient.get(
                `/${this.config.project}/_apis/git/repositories?api-version=${this.config.apiVersion}`
            );

            const projectInfo = {
                project: projectResponse.data,
                statistics: {
                    pipelinesCount: pipelinesResponse.data.count || 0,
                    repositoriesCount: repositoriesResponse.data.count || 0
                },
                pipelines: pipelinesResponse.data.value || [],
                repositories: repositoriesResponse.data.value || []
            };

            return this.configManager.createSuccessResponse('getProjectInfo', projectInfo);

        } catch (error) {
            return this.configManager.createErrorResponse('getProjectInfo', error);
        }
    }

    /**
     * Get comprehensive health status
     */
    async getHealthStatus() {
        try {
            const baseStatus = await this.configManager.getHealthStatus();

            const devOpsStatus = {
                client: this.apiClient ? 'initialized' : 'not-initialized',
                organization: this.config?.organization || 'not-configured',
                project: this.config?.project || 'not-configured',
                token: this.config?.personalAccessToken ? 'configured' : 'missing'
            };

            if (this.apiClient) {
                try {
                    const projectInfo = await this.getProjectInfo();
                    devOpsStatus.projectExists = projectInfo.success;
                    devOpsStatus.pipelinesCount = projectInfo.data?.statistics?.pipelinesCount || 0;
                    devOpsStatus.status = 'healthy';
                } catch (error) {
                    devOpsStatus.status = 'error';
                    devOpsStatus.error = error.message;
                }
            }

            return {
                ...baseStatus,
                devOps: devOpsStatus
            };

        } catch (error) {
            return this.configManager.createErrorResponse('getHealthStatus', error);
        }
    }
}

module.exports = AzureDevOpsService;