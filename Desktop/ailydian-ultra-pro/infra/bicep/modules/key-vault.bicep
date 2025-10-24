// ============================================================================
// KEY VAULT MODULE
// ============================================================================
@description('Location for resources')
param location string

@description('Key Vault name')
param keyVaultName string

@description('SKU name')
@allowed(['standard', 'premium'])
param skuName string = 'premium'

@description('Enable soft delete')
param enableSoftDelete bool = true

@description('Soft delete retention in days')
param softDeleteRetentionInDays int = 90

@description('Enable purge protection')
param enablePurgeProtection bool = true

@description('Tags')
param tags object = {}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: skuName
    }
    tenantId: subscription().tenantId
    enableSoftDelete: enableSoftDelete
    softDeleteRetentionInDays: softDeleteRetentionInDays
    enablePurgeProtection: enablePurgeProtection
    enableRbacAuthorization: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Deny'
    }
  }
}

output id string = keyVault.id
output vaultUri string = keyVault.properties.vaultUri
output name string = keyVault.name
