// LyDian Platform - Azure Infrastructure as Code (Bicep)
// Generated: 2025-10-08 by Claude SRE Agent
// Purpose: Core infrastructure for production deployment

targetScope = 'resourceGroup'

// Parameters
@description('Environment name (staging, production)')
param environment string = 'production'

@description('Primary Azure region')
param primaryRegion string = 'westeurope'

@description('DR Azure region')
param drRegion string = 'northeurope'

@description('Project name prefix')
param projectName string = 'lydian'

@description('Key Vault name')
param keyVaultName string

@description('Enable WAF on Front Door')
param enableWAF bool = true

// Variables
var resourcePrefix = '${projectName}-${environment}'
var tags = {
  Environment: environment
  Project: 'LyDian Platform'
  ManagedBy: 'IaC-Bicep'
  CostCenter: 'Engineering'
  CreatedDate: utcNow('yyyy-MM-dd')
}

// Azure Front Door with WAF
resource frontDoor 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: '${resourcePrefix}-afd'
  location: 'global'
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  tags: tags
  properties: {}
}

// WAF Policy (OWASP 3.2)
resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2022-05-01' = if (enableWAF) {
  name: '${resourcePrefix}wafpolicy'
  location: 'global'
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  tags: tags
  properties: {
    policySettings: {
      enabledState: 'Enabled'
      mode: 'Prevention'
      requestBodyCheck: 'Enabled'
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
        }
      ]
    }
  }
}

// API Management Service
resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: '${resourcePrefix}-apim'
  location: primaryRegion
  sku: {
    name: 'Developer'
    capacity: 1
  }
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    publisherEmail: 'devops@ailydian.com'
    publisherName: 'LyDian Platform'
    notificationSenderEmail: 'noreply@ailydian.com'
  }
}

// Azure Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: primaryRegion
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: []
    enableRbacAuthorization: true
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enablePurgeProtection: true
    softDeleteRetentionInDays: 90
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: '${resourcePrefix}-pg'
  location: primaryRegion
  tags: tags
  sku: {
    name: 'Standard_B2s'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: 'lydianadmin'
    administratorLoginPassword: 'PLACEHOLDER_FROM_KEYVAULT' // Will be replaced
    storage: {
      storageSizeGB: 32
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Enabled'
    }
    highAvailability: {
      mode: 'Disabled' // Enable for production
    }
  }
}

// Redis Cache
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: '${resourcePrefix}-redis'
  location: primaryRegion
  tags: tags
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
    }
  }
}

// Storage Account (Blob)
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: replace('${resourcePrefix}storage', '-', '')
  location: primaryRegion
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    encryption: {
      services: {
        blob: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${resourcePrefix}-insights'
  location: primaryRegion
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    IngestionMode: 'LogAnalytics'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${resourcePrefix}-logs'
  location: primaryRegion
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Container Apps Environment
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${resourcePrefix}-cae'
  location: primaryRegion
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsWorkspace.properties.customerId
        sharedKey: logAnalyticsWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

// Outputs
output frontDoorId string = frontDoor.id
output frontDoorEndpoint string = frontDoor.properties.frontDoorId
output apimGatewayUrl string = apim.properties.gatewayUrl
output keyVaultUri string = keyVault.properties.vaultUri
output postgresHost string = postgresServer.properties.fullyQualifiedDomainName
output redisHost string = redisCache.properties.hostName
output storageAccountName string = storageAccount.name
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output containerAppsEnvironmentId string = containerAppsEnvironment.id
