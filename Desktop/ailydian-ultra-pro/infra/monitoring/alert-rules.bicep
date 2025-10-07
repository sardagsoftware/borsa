// ============================================================================
// AZURE MONITOR ALERT RULES
// ============================================================================
// Alerts: Cost, Latency, Errors, Database, Redis
// ============================================================================

@description('Location for resources')
param location string = 'westeurope'

@description('App Insights ID')
param appInsightsId string

@description('Action group ID for notifications')
param actionGroupId string

// ============================================================================
// HIGH ERROR RATE ALERT
// ============================================================================
resource errorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'ailydian-high-error-rate'
  location: 'global'
  properties: {
    description: 'Alert when error rate exceeds 1%'
    severity: 2
    enabled: true
    scopes: [appInsightsId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ErrorRate'
          metricName: 'requests/failed'
          operator: 'GreaterThan'
          threshold: 1
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
      }
    ]
  }
}

// ============================================================================
// HIGH LATENCY ALERT
// ============================================================================
resource latencyAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'ailydian-high-latency'
  location: 'global'
  properties: {
    description: 'Alert when p95 latency exceeds 200ms'
    severity: 3
    enabled: true
    scopes: [appInsightsId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'P95Latency'
          metricName: 'requests/duration'
          operator: 'GreaterThan'
          threshold: 200
          timeAggregation: 'Percentile'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroupId
      }
    ]
  }
}

// ============================================================================
// DAILY COST ALERT
// ============================================================================
resource costAlert 'Microsoft.CostManagement/scheduledActions@2023-11-01' = {
  name: 'ailydian-daily-cost-alert'
  kind: 'Email'
  properties: {
    displayName: 'Daily cost alert - Ailydian'
    notification: {
      to: ['admin@ailydian.com']
      subject: 'Azure Daily Cost Alert'
      message: 'Your Azure costs have exceeded the threshold'
    }
    schedule: {
      frequency: 'Daily'
      startDate: '2025-01-01'
      endDate: '2026-12-31'
      dayOfMonth: 0
    }
    status: 'Enabled'
    viewId: '/subscriptions/${subscription().subscriptionId}/providers/Microsoft.CostManagement/views/AccumulatedCosts'
  }
}

output errorRateAlertId string = errorRateAlert.id
output latencyAlertId string = latencyAlert.id
output costAlertId string = costAlert.id
