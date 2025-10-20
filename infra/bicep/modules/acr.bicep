// ============================================================================
// AZURE CONTAINER REGISTRY MODULE
// ============================================================================
@description('Location for resources')
param location string

@description('Container registry name')
param registryName string

@description('SKU name')
@allowed(['Basic', 'Standard', 'Premium'])
param skuName string = 'Premium'

@description('Enable admin user')
param adminUserEnabled bool = false

@description('Tags')
param tags object = {}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  tags: tags
  sku: {
    name: skuName
  }
  properties: {
    adminUserEnabled: adminUserEnabled
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
    zoneRedundancy: 'Enabled'
    anonymousPullEnabled: false
  }
}

output id string = containerRegistry.id
output loginServer string = containerRegistry.properties.loginServer
output name string = containerRegistry.name
