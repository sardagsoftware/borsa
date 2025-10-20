// ============================================================================
// VIRTUAL NETWORK MODULE
// ============================================================================
@description('Location for resources')
param location string

@description('Virtual network name')
param vnetName string

@description('Address prefix')
param addressPrefix string = '10.0.0.0/16'

@description('Tags')
param tags object = {}

resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        addressPrefix
      ]
    }
    subnets: [
      {
        name: 'container-apps-subnet'
        properties: {
          addressPrefix: '10.0.1.0/24'
          delegations: [
            {
              name: 'container-apps-delegation'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
      {
        name: 'database-subnet'
        properties: {
          addressPrefix: '10.0.2.0/24'
          delegations: [
            {
              name: 'postgresql-delegation'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
        }
      }
      {
        name: 'redis-subnet'
        properties: {
          addressPrefix: '10.0.3.0/24'
        }
      }
      {
        name: 'apim-subnet'
        properties: {
          addressPrefix: '10.0.4.0/24'
        }
      }
      {
        name: 'appgw-subnet'
        properties: {
          addressPrefix: '10.0.5.0/24'
        }
      }
    ]
  }
}

output vnetId string = vnet.id
output containerAppsSubnetId string = vnet.properties.subnets[0].id
output databaseSubnetId string = vnet.properties.subnets[1].id
output redisSubnetId string = vnet.properties.subnets[2].id
output apimSubnetId string = vnet.properties.subnets[3].id
output appGatewaySubnetId string = vnet.properties.subnets[4].id
