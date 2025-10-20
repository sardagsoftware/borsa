// ============================================================================
// AZURE FRONT DOOR MODULE
// ============================================================================
@description('Front Door name')
param frontDoorName string

@description('Backend pools configuration')
param backendPools array

@description('WAF policy name')
param wafPolicyName string

@description('Tags')
param tags object = {}

resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2022-05-01' = {
  name: wafPolicyName
  location: 'Global'
  tags: tags
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
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
          ruleSetAction: 'Block'
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.0'
        }
      ]
    }
  }
}

resource frontDoor 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: frontDoorName
  location: 'Global'
  tags: tags
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  properties: {
    originResponseTimeoutSeconds: 60
  }
}

resource endpoint 'Microsoft.Cdn/profiles/afdEndpoints@2023-05-01' = {
  parent: frontDoor
  name: '${frontDoorName}-endpoint'
  location: 'Global'
  properties: {
    enabledState: 'Enabled'
  }
}

output id string = frontDoor.id
output frontDoorEndpoint string = endpoint.properties.hostName
output wafPolicyId string = wafPolicy.id
