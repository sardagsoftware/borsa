# Azure Services Integration for AiLydian Ultra Pro

Enterprise-grade Microsoft Azure SDK integration providing comprehensive cloud services, containerization, DevOps automation, geospatial capabilities, and weather data for the AiLydian Ultra Pro platform.

## 🌟 Features

### Core Azure Services
- **Azure Container Apps**: Serverless container orchestration with auto-scaling
- **Azure DevOps**: Complete CI/CD pipeline management and automation
- **Azure Maps**: Comprehensive geospatial and mapping services
- **Azure Weather**: Advanced weather forecasting and climate data
- **Azure Key Vault**: Secure configuration and secrets management
- **Azure Monitoring**: Enterprise logging and telemetry

### Enterprise Capabilities
- **Production-Ready Security**: JWT authentication, session management, rate limiting
- **Real-Time Communication**: WebSocket integration for live updates
- **Comprehensive Logging**: Structured logging with retention and export
- **Error Handling**: Robust error management with retry mechanisms
- **Health Monitoring**: Service health checks and status reporting
- **Type Safety**: Full TypeScript definitions and interfaces

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your Azure credentials
```

### Basic Usage

```javascript
const { quickStart } = require('./azure-services');

// Quick start with all services
const azureHub = await quickStart(3000);

// Access individual services
const maps = azureHub.getService('maps');
const weather = azureHub.getService('weather');
const containerApps = azureHub.getService('containerApps');
```

### Advanced Configuration

```javascript
const { createAzureServicesHub } = require('./azure-services');

const hub = await createAzureServicesHub({
    port: 3000,
    enableLogging: true,
    enableSecurity: true,
    enableWebSocket: true,
    logLevel: 'info'
});

await hub.start();
```

## 📋 Environment Variables

### Required Azure Credentials
```env
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Azure Services Configuration
```env
# Resource Management
AZURE_RESOURCE_GROUP=ailydian-enterprise-rg
AZURE_LOCATION=West Europe
AZURE_KEYVAULT_URL=https://ailydian-vault.vault.azure.net/

# Azure Maps
AZURE_MAPS_SUBSCRIPTION_KEY=your-maps-key
AZURE_MAPS_CLIENT_ID=your-maps-client-id

# Azure Container Apps
AZURE_CONTAINER_APPS_ENVIRONMENT=ailydian-env

# Azure DevOps
AZURE_DEVOPS_ORGANIZATION=ailydian-enterprise
AZURE_DEVOPS_PROJECT=ailydian-ultra-pro
AZURE_DEVOPS_TOKEN=your-devops-token
```

### Security Configuration
```env
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRY=7d
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000
SESSION_TIMEOUT=3600000
REQUIRE_MFA=false
ENCRYPTION_KEY=your-encryption-key
```

## 🛠️ API Reference

### Container Apps Service

#### Create Container App
```javascript
const containerApp = await containerApps.createContainerApp('my-app', {
    image: 'myregistry/myapp:latest',
    environment: [
        { name: 'ENV', value: 'production' }
    ],
    scale: {
        minReplicas: 1,
        maxReplicas: 10
    }
});
```

#### Scale Container App
```javascript
const scaling = await containerApps.scaleContainerApp('my-app', {
    minReplicas: 2,
    maxReplicas: 20,
    rules: [
        {
            name: 'http-scaling',
            type: 'http',
            metadata: { concurrentRequests: '100' }
        }
    ]
});
```

### DevOps Service

#### Create Pipeline
```javascript
const pipeline = await devOps.createPipeline({
    name: 'AI-Application-Pipeline',
    repositoryId: 'repo-id',
    repositoryName: 'ailydian-ultra-pro',
    yamlPath: '/azure-pipelines.yml'
});
```

#### Run Pipeline
```javascript
const run = await devOps.runPipeline(pipelineId, {
    branch: 'main',
    variables: {
        buildConfiguration: 'Release',
        deployEnvironment: 'production'
    }
});
```

### Maps Service

#### Search Places
```javascript
const places = await maps.searchPlaces('coffee shops', {
    lat: 40.7589,
    lon: -73.9851,
    radius: 1000,
    limit: 10
});
```

#### Get Route
```javascript
const route = await maps.getRoute([
    { lat: 40.7589, lon: -73.9851 }, // Start
    { lat: 40.7505, lon: -73.9934 }  // End
], {
    travelMode: 'car',
    traffic: true
});
```

#### Reverse Geocoding
```javascript
const address = await maps.reverseGeocode(40.7589, -73.9851);
```

### Weather Service

#### Current Weather
```javascript
const weather = await weather.getCurrentConditions(40.7589, -73.9851, {
    language: 'en-US',
    unit: 'metric'
});
```

#### Weather Forecast
```javascript
const forecast = await weather.getDailyForecast(40.7589, -73.9851, 5, {
    language: 'en-US'
});
```

#### Weather Alerts
```javascript
const alerts = await weather.getSevereWeatherAlerts(40.7589, -73.9851);
```

#### Comprehensive Weather Summary
```javascript
const summary = await weather.getWeatherSummary(40.7589, -73.9851);
```

## 🔌 WebSocket Integration

### Client Connection
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
    // Subscribe to service updates
    ws.send(JSON.stringify({
        type: 'subscribe',
        service: 'containerApps'
    }));
};

ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Real-time update:', message);
};
```

### Available Subscriptions
- `containerApps`: Container app lifecycle events
- `devOps`: Pipeline run status updates
- `weather`: Weather alert notifications
- `security`: Security event notifications

## 🔐 Security Features

### Authentication
```javascript
const { security } = azureHub.getAllServices();

// Hash password
const hashedPassword = await security.hashPassword('userPassword');

// Generate JWT token
const token = security.generateJWTToken({
    userId: 'user123',
    email: 'user@example.com',
    role: 'admin'
});

// Verify token
const payload = security.verifyJWTToken(token);
```

### Session Management
```javascript
// Create session
const sessionId = security.createSession(userId, userInfo, request);

// Validate session
const session = security.validateSession(sessionId, request);

// Destroy session
security.destroySession(sessionId);
```

### Rate Limiting
```javascript
// Check rate limits
await security.checkRateLimit('api', request);
await security.checkRateLimit('login', request);
```

## 📊 Health Monitoring

### Service Health Check
```http
GET /health
```

Response:
```json
{
  "overall": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "services": {
    "config": { "status": "healthy", "credentials": "healthy" },
    "containerApps": { "status": "healthy" },
    "devOps": { "status": "healthy" },
    "maps": { "status": "healthy" },
    "weather": { "status": "healthy" },
    "security": { "status": "healthy" },
    "logger": { "status": "healthy" }
  },
  "websocket": {
    "activeConnections": 5,
    "subscriptions": 3
  }
}
```

### Individual Service Health
```http
GET /health/maps
GET /health/weather
GET /health/containerApps
```

## 📈 Logging and Monitoring

### Structured Logging
```javascript
const { logger } = azureHub.getAllServices();

// Log application events
logger.createLogEntry('info', 'User action completed', {
    userId: 'user123',
    action: 'create_container_app',
    duration: 1500
});

// Log security events
logger.logSecurityEvent('login_success', {
    userId: 'user123',
    ipAddress: '192.168.1.1'
});

// Log performance metrics
logger.logPerformanceMetric('api_response_time', 250, 'ms', {
    endpoint: '/api/weather/current'
});
```

### Log Export
```http
GET /api/azure/logs/export?service=weather&startDate=2025-01-01&endDate=2025-01-15&format=csv
```

## 🔄 CI/CD Pipeline Configuration

### Azure Pipelines YAML
```yaml
# Generated automatically by DevOps service
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  containerRegistry: 'ailydianregistry.azurecr.io'
  imageName: 'ailydian-ultra-pro'

stages:
- stage: Build
  displayName: 'Build and Test'
  jobs:
  - job: Build
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    - script: npm install && npm run test && npm run build

- stage: Deploy
  displayName: 'Deploy to Azure Container Apps'
  jobs:
  - deployment: Deploy
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureContainerApps@1
            inputs:
              azureSubscription: '$(azureSubscription)'
              containerAppName: 'ailydian-ultra-pro'
              imageToDeploy: '$(containerRegistry)/$(imageName):$(Build.BuildId)'
```

## 🚨 Error Handling

### Global Error Handler
```javascript
// Automatic error handling with structured logging
try {
    const result = await maps.searchPlaces('invalid query');
} catch (error) {
    // Error is automatically logged with context
    // Returns standardized error response
    console.error('Maps search failed:', error.message);
}
```

### Error Response Format
```json
{
  "success": false,
  "operation": "searchPlaces",
  "error": {
    "message": "Invalid search parameters",
    "code": "INVALID_PARAMETERS",
    "statusCode": 400,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

## 🔧 Advanced Configuration

### Custom Service Initialization
```javascript
const { AzureServicesHub } = require('./azure-services');

const hub = new AzureServicesHub({
    enableLogging: true,
    enableSecurity: true,
    enableWebSocket: true,
    logLevel: 'debug',
    port: 3000,
    autoStart: false
});

// Custom initialization
await hub.initialize();

// Configure additional options
hub.configure({
    logLevel: 'info',
    enableCaching: true
});

// Start server
await hub.start(3000);
```

### Service-Specific Configuration
```javascript
// Access individual services
const services = hub.getAllServices();

// Configure Maps service
const mapsConfig = await services.config.getMapsConfig();

// Configure Container Apps
const containerConfig = await services.config.getContainerAppsConfig();

// Configure DevOps
const devOpsConfig = await services.config.getDevOpsConfig();
```

## 📚 TypeScript Support

Full TypeScript definitions are provided:

```typescript
import {
    AzureServicesHub,
    WeatherCondition,
    ContainerAppConfiguration,
    PipelineDefinition
} from './azure-services/azure-types';

const hub = new AzureServicesHub({
    enableLogging: true,
    port: 3000
});

const weather: WeatherCondition = await hub
    .getService('weather')
    .getCurrentConditions(40.7589, -73.9851);
```

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Azure credentials in environment variables
   - Check Azure subscription and tenant IDs
   - Ensure service principal has required permissions

2. **Rate Limiting**
   - Monitor rate limit headers in responses
   - Implement exponential backoff for retries
   - Consider upgrading Azure service tiers

3. **WebSocket Connection Issues**
   - Check firewall and proxy settings
   - Verify WebSocket endpoint is accessible
   - Monitor connection logs for details

### Debug Mode
```bash
LOG_LEVEL=debug npm start
```

### Health Check Debugging
```javascript
const health = await hub.getHealthStatus();
console.log('Service health:', JSON.stringify(health, null, 2));
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

## 📄 License

This Azure Services Integration is part of the AiLydian Ultra Pro enterprise platform.

## 🆘 Support

For enterprise support and advanced configuration:
- Documentation: `/docs`
- Health Monitoring: `/health`
- API Reference: `/api/docs`
- Real-time Status: WebSocket at `/ws`

---

**AiLydian Ultra Pro Azure Services** - Enterprise-grade cloud integration for modern AI applications.