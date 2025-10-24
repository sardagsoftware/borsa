// ============================================================================
// API MANAGEMENT MODULE
// ============================================================================
@description('Location for resources')
param location string

@description('APIM name')
param apimName string

@description('Publisher email')
param publisherEmail string

@description('Publisher name')
param publisherName string

@description('SKU name')
@allowed(['Developer', 'Basic', 'Standard', 'Premium'])
param skuName string = 'Premium'

@description('SKU capacity')
param skuCapacity int = 1

@description('Virtual network type')
@allowed(['None', 'External', 'Internal'])
param virtualNetworkType string = 'Internal'

@description('Subnet ID for VNet integration')
param subnetId string

@description('App Insights ID')
param appInsightsId string

@description('Tags')
param tags object = {}

resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' = {
  name: apimName
  location: location
  tags: tags
  sku: {
    name: skuName
    capacity: skuCapacity
  }
  properties: {
    publisherEmail: publisherEmail
    publisherName: publisherName
    virtualNetworkType: virtualNetworkType
    virtualNetworkConfiguration: {
      subnetResourceId: subnetId
    }
    customProperties: {
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls11': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Tls10': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Security.Backend.Protocols.Ssl30': 'false'
      'Microsoft.WindowsAzure.ApiManagement.Gateway.Protocols.Server.Http2': 'true'
    }
  }
}

resource apimLogger 'Microsoft.ApiManagement/service/loggers@2023-05-01-preview' = {
  parent: apim
  name: 'appinsights-logger'
  properties: {
    loggerType: 'applicationInsights'
    resourceId: appInsightsId
    credentials: {
      instrumentationKey: reference(appInsightsId, '2020-02-02').InstrumentationKey
    }
  }
}

output id string = apim.id
output gatewayUrl string = apim.properties.gatewayUrl
output name string = apim.name
