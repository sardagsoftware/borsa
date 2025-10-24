// ============================================================================
// POSTGRESQL FLEXIBLE SERVER MODULE
// ============================================================================
@description('Location for resources')
param location string

@description('Server name')
param serverName string

@description('Administrator login')
param administratorLogin string

@description('Administrator password')
@secure()
param administratorPassword string = newGuid()

@description('SKU name')
param skuName string = 'Standard_D4ds_v4'

@description('Storage size in GB')
param storageSizeGB int = 256

@description('PostgreSQL version')
@allowed(['11', '12', '13', '14', '15'])
param version string = '15'

@description('Subnet ID for VNet integration')
param subnetId string

@description('Tags')
param tags object = {}

resource postgresqlServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: serverName
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: 'GeneralPurpose'
  }
  properties: {
    version: version
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    storage: {
      storageSizeGB: storageSizeGB
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 35
      geoRedundantBackup: 'Enabled'
    }
    highAvailability: {
      mode: 'ZoneRedundant'
      standbyAvailabilityZone: '2'
    }
    network: {
      delegatedSubnetResourceId: subnetId
    }
  }
}

resource ailydianDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresqlServer
  name: 'ailydian'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

output id string = postgresqlServer.id
output fqdn string = postgresqlServer.properties.fullyQualifiedDomainName
output databaseName string = ailydianDb.name
