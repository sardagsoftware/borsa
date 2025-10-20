// ============================================================================
// SHADOW TRAFFIC MIRRORING SETUP
// ============================================================================
// Purpose: Mirror production traffic to canary without affecting users
// ============================================================================

@description('Location for resources')
param location string = 'westeurope'

@description('APIM name')
param apimName string

@description('Primary backend URL')
param primaryBackend string

@description('Shadow backend URL')
param shadowBackend string

@description('Shadow traffic percentage (0-100)')
@minValue(0)
@maxValue(100)
param shadowPercentage int = 10

resource apim 'Microsoft.ApiManagement/service@2023-05-01-preview' existing = {
  name: apimName
}

// Create shadow backend
resource shadowBackendResource 'Microsoft.ApiManagement/service/backends@2023-05-01-preview' = {
  parent: apim
  name: 'shadow-backend'
  properties: {
    description: 'Shadow traffic backend for canary testing'
    url: shadowBackend
    protocol: 'http'
    circuitBreaker: {
      rules: [
        {
          name: 'shadowFailureRule'
          failureCondition: {
            count: 3
            interval: 'PT30S'
            statusCodeRanges: [
              {
                min: 500
                max: 599
              }
            ]
          }
          tripDuration: 'PT1M'
        }
      ]
    }
  }
}

// API policy fragment for shadow mirroring
resource shadowPolicyFragment 'Microsoft.ApiManagement/service/policyFragments@2023-05-01-preview' = {
  parent: apim
  name: 'shadow-traffic-mirror'
  properties: {
    description: 'Mirror traffic to shadow backend'
    value: '''
      <fragment>
        <choose>
          <when condition="@(new Random().Next(100) < ${shadowPercentage})">
            <!-- Mirror request to shadow backend -->
            <send-request mode="copy" response-variable-name="shadowResponse" timeout="10" ignore-error="true">
              <set-url>@{
                var originalUrl = context.Request.Url.ToString();
                return originalUrl.Replace("${primaryBackend}", "${shadowBackend}");
              }</set-url>
              <set-method>@(context.Request.Method)</set-method>
              <set-header name="X-Shadow-Request" exists-action="override">
                <value>true</value>
              </set-header>
            </send-request>
            <!-- Log shadow response for comparison -->
            <log-to-eventhub logger-id="shadow-logger">
              @{
                var shadowResp = context.Variables.GetValueOrDefault<IResponse>("shadowResponse");
                return new JObject(
                  new JProperty("timestamp", DateTime.UtcNow.ToString()),
                  new JProperty("requestId", context.RequestId),
                  new JProperty("primaryStatusCode", context.Response.StatusCode),
                  new JProperty("shadowStatusCode", shadowResp?.StatusCode ?? 0),
                  new JProperty("primaryLatency", context.Elapsed.TotalMilliseconds),
                  new JProperty("url", context.Request.Url.Path)
                ).ToString();
              }
            </log-to-eventhub>
          </when>
        </choose>
      </fragment>
    '''
  }
}

output shadowBackendId string = shadowBackendResource.id
output policyFragmentId string = shadowPolicyFragment.id
