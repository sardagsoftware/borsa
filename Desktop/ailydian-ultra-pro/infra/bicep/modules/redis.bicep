// ============================================================================
// REDIS CACHE MODULE
// ============================================================================
@description('Location for resources')
param location string

@description('Redis cache name')
param redisCacheName string

@description('SKU name')
@allowed(['Basic', 'Standard', 'Premium'])
param skuName string = 'Premium'

@description('SKU family')
@allowed(['C', 'P'])
param skuFamily string = 'P'

@description('SKU capacity')
@allowed([0, 1, 2, 3, 4, 5, 6])
param skuCapacity int = 1

@description('Enable non-SSL port')
param enableNonSslPort bool = false

@description('Subnet ID for VNet integration')
param subnetId string

@description('Tags')
param tags object = {}

resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisCacheName
  location: location
  tags: tags
  properties: {
    sku: {
      name: skuName
      family: skuFamily
      capacity: skuCapacity
    }
    enableNonSslPort: enableNonSslPort
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Disabled'
    subnetId: subnetId
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
      'maxmemory-reserved': '125'
      'maxmemory-delta': '125'
    }
    redisVersion: '6'
  }
}

output id string = redisCache.id
output hostName string = redisCache.properties.hostName
output sslPort int = redisCache.properties.sslPort
output cacheName string = redisCache.name
