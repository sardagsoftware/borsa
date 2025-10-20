// ============================================================================
// AILYDIAN ULTRA PRO - AZURE INFRASTRUCTURE AS CODE (BICEP)
// ============================================================================
// Purpose: Production-grade Azure infrastructure for 6 domains
// Domains: ailydian.com, travel.ailydian.com, borsa.ailydian.com,
//          blockchain.ailydian.com, video.ailydian.com, docs.ailydian.com
// Capacity: 30K concurrent users, 200-500 RPS sustained
// SLO: p95 ≤120ms, error rate <0.5%
// ============================================================================

targetScope = 'subscription'

// Parameters
@description('Environment name (dev, staging, production)')
@allowed(['dev', 'staging', 'production'])
param environment string = 'production'

@description('Primary Azure region')
@allowed(['westeurope', 'northeurope', 'uksouth', 'francecentral'])
param primaryRegion string = 'westeurope'

@description('Secondary region for DR')
@allowed(['westeurope', 'northeurope', 'uksouth', 'francecentral'])
param secondaryRegion string = 'northeurope'

@description('Resource name prefix')
param namePrefix string = 'ailydian'

@description('Tags for all resources')
param tags object = {
  Project: 'Ailydian Ultra Pro'
  Environment: environment
  ManagedBy: 'Bicep'
  CostCenter: 'Engineering'
  Owner: 'Sardag'
}

// Variables
var resourceGroupName = '${namePrefix}-${environment}-rg'
var primaryLocation = primaryRegion
var secondaryLocation = secondaryRegion

// ============================================================================
// RESOURCE GROUP
// ============================================================================
resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: primaryLocation
  tags: tags
}

// ============================================================================
// LOG ANALYTICS WORKSPACE (Centralized Logging)
// ============================================================================
module logAnalytics 'modules/log-analytics.bicep' = {
  scope: resourceGroup
  name: 'logAnalyticsDeployment'
  params: {
    location: primaryLocation
    workspaceName: '${namePrefix}-${environment}-logs'
    retentionInDays: 90
    tags: tags
  }
}

// ============================================================================
// APPLICATION INSIGHTS (APM & Monitoring)
// ============================================================================
module appInsights 'modules/app-insights.bicep' = {
  scope: resourceGroup
  name: 'appInsightsDeployment'
  params: {
    location: primaryLocation
    appInsightsName: '${namePrefix}-${environment}-insights'
    workspaceId: logAnalytics.outputs.workspaceId
    tags: tags
  }
}

// ============================================================================
// VIRTUAL NETWORK (Secure Network Isolation)
// ============================================================================
module vnet 'modules/vnet.bicep' = {
  scope: resourceGroup
  name: 'vnetDeployment'
  params: {
    location: primaryLocation
    vnetName: '${namePrefix}-${environment}-vnet'
    addressPrefix: '10.0.0.0/16'
    tags: tags
  }
}

// ============================================================================
// POSTGRESQL FLEXIBLE SERVER (Primary Database)
// ============================================================================
module postgresql 'modules/postgresql.bicep' = {
  scope: resourceGroup
  name: 'postgresqlDeployment'
  params: {
    location: primaryLocation
    serverName: '${namePrefix}-${environment}-psql'
    administratorLogin: 'ailydianadmin'
    skuName: 'Standard_D4ds_v4' // 4 vCores, 16GB RAM
    storageSizeGB: 256
    version: '15'
    subnetId: vnet.outputs.databaseSubnetId
    tags: tags
  }
}

// ============================================================================
// REDIS CACHE (Session & Caching)
// ============================================================================
module redis 'modules/redis.bicep' = {
  scope: resourceGroup
  name: 'redisDeployment'
  params: {
    location: primaryLocation
    redisCacheName: '${namePrefix}-${environment}-redis'
    skuName: 'Premium'
    skuFamily: 'P'
    skuCapacity: 1 // P1: 6GB cache
    enableNonSslPort: false
    subnetId: vnet.outputs.redisSubnetId
    tags: tags
  }
}

// ============================================================================
// STORAGE ACCOUNT (Blob, Files, Backups)
// ============================================================================
module storage 'modules/storage.bicep' = {
  scope: resourceGroup
  name: 'storageDeployment'
  params: {
    location: primaryLocation
    storageAccountName: '${namePrefix}${environment}stor'
    skuName: 'Standard_ZRS' // Zone-redundant storage
    containers: [
      'uploads'
      'backups'
      'logs'
      'static-assets'
    ]
    tags: tags
  }
}

// ============================================================================
// CONTAINER REGISTRY (Docker Images)
// ============================================================================
module acr 'modules/acr.bicep' = {
  scope: resourceGroup
  name: 'acrDeployment'
  params: {
    location: primaryLocation
    registryName: '${namePrefix}${environment}acr'
    skuName: 'Premium' // Geo-replication support
    adminUserEnabled: false
    tags: tags
  }
}

// ============================================================================
// CONTAINER APPS ENVIRONMENT (Managed Kubernetes)
// ============================================================================
module containerAppsEnv 'modules/container-apps-env.bicep' = {
  scope: resourceGroup
  name: 'containerAppsEnvDeployment'
  params: {
    location: primaryLocation
    environmentName: '${namePrefix}-${environment}-cae'
    logAnalyticsWorkspaceId: logAnalytics.outputs.workspaceId
    appInsightsConnectionString: appInsights.outputs.connectionString
    vnetSubnetId: vnet.outputs.containerAppsSubnetId
    tags: tags
  }
}

// ============================================================================
// CONTAINER APPS (Microservices)
// ============================================================================

// Main API Service
module mainApiApp 'modules/container-app.bicep' = {
  scope: resourceGroup
  name: 'mainApiDeployment'
  params: {
    location: primaryLocation
    appName: '${namePrefix}-${environment}-api'
    environmentId: containerAppsEnv.outputs.environmentId
    containerImage: '${acr.outputs.loginServer}/ailydian-api:latest'
    containerPort: 3100
    minReplicas: 3
    maxReplicas: 30
    cpu: '1.0'
    memory: '2Gi'
    environmentVariables: [
      {
        name: 'NODE_ENV'
        value: 'production'
      }
      {
        name: 'DATABASE_URL'
        secretRef: 'database-url'
      }
      {
        name: 'REDIS_URL'
        secretRef: 'redis-url'
      }
    ]
    tags: tags
  }
}

// Travel Service
module travelApp 'modules/container-app.bicep' = {
  scope: resourceGroup
  name: 'travelAppDeployment'
  params: {
    location: primaryLocation
    appName: '${namePrefix}-${environment}-travel'
    environmentId: containerAppsEnv.outputs.environmentId
    containerImage: '${acr.outputs.loginServer}/ailydian-travel:latest'
    containerPort: 3200
    minReplicas: 2
    maxReplicas: 20
    cpu: '0.5'
    memory: '1Gi'
    environmentVariables: []
    tags: tags
  }
}

// Borsa Service
module borsaApp 'modules/container-app.bicep' = {
  scope: resourceGroup
  name: 'borsaAppDeployment'
  params: {
    location: primaryLocation
    appName: '${namePrefix}-${environment}-borsa'
    environmentId: containerAppsEnv.outputs.environmentId
    containerImage: '${acr.outputs.loginServer}/ailydian-borsa:latest'
    containerPort: 3300
    minReplicas: 2
    maxReplicas: 15
    cpu: '0.75'
    memory: '1.5Gi'
    environmentVariables: []
    tags: tags
  }
}

// Blockchain Service
module blockchainApp 'modules/container-app.bicep' = {
  scope: resourceGroup
  name: 'blockchainAppDeployment'
  params: {
    location: primaryLocation
    appName: '${namePrefix}-${environment}-blockchain'
    environmentId: containerAppsEnv.outputs.environmentId
    containerImage: '${acr.outputs.loginServer}/ailydian-blockchain:latest'
    containerPort: 3400
    minReplicas: 2
    maxReplicas: 10
    cpu: '1.0'
    memory: '2Gi'
    environmentVariables: []
    tags: tags
  }
}

// Video Service
module videoApp 'modules/container-app.bicep' = {
  scope: resourceGroup
  name: 'videoAppDeployment'
  params: {
    location: primaryLocation
    appName: '${namePrefix}-${environment}-video'
    environmentId: containerAppsEnv.outputs.environmentId
    containerImage: '${acr.outputs.loginServer}/ailydian-video:latest'
    containerPort: 3500
    minReplicas: 2
    maxReplicas: 20
    cpu: '1.5'
    memory: '3Gi'
    environmentVariables: []
    tags: tags
  }
}

// Docs Service
module docsApp 'modules/container-app.bicep' = {
  scope: resourceGroup
  name: 'docsAppDeployment'
  params: {
    location: primaryLocation
    appName: '${namePrefix}-${environment}-docs'
    environmentId: containerAppsEnv.outputs.environmentId
    containerImage: '${acr.outputs.loginServer}/ailydian-docs:latest'
    containerPort: 4003
    minReplicas: 1
    maxReplicas: 5
    cpu: '0.25'
    memory: '0.5Gi'
    environmentVariables: []
    tags: tags
  }
}

// ============================================================================
// API MANAGEMENT (Gateway + Rate Limiting + Policies)
// ============================================================================
module apim 'modules/apim.bicep' = {
  scope: resourceGroup
  name: 'apimDeployment'
  params: {
    location: primaryLocation
    apimName: '${namePrefix}-${environment}-apim'
    publisherEmail: 'admin@ailydian.com'
    publisherName: 'Ailydian'
    skuName: 'Premium' // Multi-region support
    skuCapacity: 2 // 2 units for HA
    virtualNetworkType: 'Internal'
    subnetId: vnet.outputs.apimSubnetId
    appInsightsId: appInsights.outputs.id
    tags: tags
  }
}

// ============================================================================
// FRONT DOOR (CDN + WAF + SSL)
// ============================================================================
module frontDoor 'modules/front-door.bicep' = {
  scope: resourceGroup
  name: 'frontDoorDeployment'
  params: {
    frontDoorName: '${namePrefix}-${environment}-fd'
    backendPools: [
      {
        name: 'api-backend'
        backends: [
          {
            address: mainApiApp.outputs.fqdn
            httpPort: 80
            httpsPort: 443
            priority: 1
            weight: 100
          }
        ]
      }
      {
        name: 'travel-backend'
        backends: [
          {
            address: travelApp.outputs.fqdn
            httpPort: 80
            httpsPort: 443
            priority: 1
            weight: 100
          }
        ]
      }
      {
        name: 'borsa-backend'
        backends: [
          {
            address: borsaApp.outputs.fqdn
            httpPort: 80
            httpsPort: 443
            priority: 1
            weight: 100
          }
        ]
      }
    ]
    wafPolicyName: '${namePrefix}${environment}wafpolicy'
    tags: tags
  }
}

// ============================================================================
// KEY VAULT (Secrets Management)
// ============================================================================
module keyVault 'modules/key-vault.bicep' = {
  scope: resourceGroup
  name: 'keyVaultDeployment'
  params: {
    location: primaryLocation
    keyVaultName: '${namePrefix}-${environment}-kv'
    skuName: 'premium'
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    tags: tags
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================
output resourceGroupName string = resourceGroup.name
output logAnalyticsWorkspaceId string = logAnalytics.outputs.workspaceId
output appInsightsInstrumentationKey string = appInsights.outputs.instrumentationKey
output postgresqlFQDN string = postgresql.outputs.fqdn
output redisCacheName string = redis.outputs.cacheName
output storageAccountName string = storage.outputs.storageAccountName
output acrLoginServer string = acr.outputs.loginServer
output apimGatewayUrl string = apim.outputs.gatewayUrl
output frontDoorEndpoint string = frontDoor.outputs.frontDoorEndpoint
output keyVaultUri string = keyVault.outputs.vaultUri
