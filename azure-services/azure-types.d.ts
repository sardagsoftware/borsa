// TypeScript type definitions for Azure Services Integration
// Comprehensive type safety for AiLydian Ultra Pro Azure SDK integration

export interface AzureCredentialsConfig {
  subscriptionId?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface AzureServiceConfig {
  subscriptionId: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  keyVaultUrl?: string;
  resourceGroupName: string;
  location: string;
  enableTelemetry: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
}

export interface AzureHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'error' | 'unknown';
  timestamp: string;
  credentials?: 'healthy' | 'error' | 'unknown';
  keyVault?: 'healthy' | 'error' | 'unknown';
  services?: Record<string, string>;
  error?: string;
}

export interface AzureResponse<T = any> {
  success: boolean;
  operation: string;
  message?: string;
  timestamp: string;
  data?: T;
  error?: {
    message: string;
    code: string;
    statusCode: number;
    timestamp: string;
  };
}

// Azure Container Apps Types
export interface ContainerAppConfiguration {
  image: string;
  ingress?: {
    external?: boolean;
    targetPort?: number;
    allowInsecure?: boolean;
  };
  environment?: Array<{
    name: string;
    value: string;
  }>;
  resources?: {
    cpu?: number;
    memory?: string;
  };
  scale?: {
    minReplicas?: number;
    maxReplicas?: number;
  };
  scalingRules?: ContainerAppScalingRule[];
  secrets?: Array<{
    name: string;
    value: string;
  }>;
  registries?: Array<{
    server: string;
    username: string;
    passwordSecretRef: string;
  }>;
}

export interface ContainerAppScalingRule {
  name: string;
  type: 'http' | 'cpu' | 'memory' | 'queue';
  metadata?: {
    concurrentRequests?: string;
    value?: string;
    queueName?: string;
    queueLength?: string;
    auth?: string[];
  };
}

export interface ContainerAppMetrics {
  app: {
    name: string;
    status: string;
    location: string;
    fqdn?: string;
  };
  revisions: Array<{
    name: string;
    active: boolean;
    replicas: number;
    trafficWeight: number;
    createdTime: string;
  }>;
  scaling: {
    minReplicas: number;
    maxReplicas: number;
    currentReplicas: number;
  };
}

export interface OpenAIEndpoint {
  url: string;
  apiKey: string;
  model: string;
  capacity: number;
  region: string;
}

// Azure DevOps Types
export interface PipelineDefinition {
  name: string;
  folder?: string;
  yamlPath?: string;
  repositoryId: string;
  repositoryName: string;
  repositoryType?: 'azureReposGit' | 'github';
}

export interface PipelineRunParameters {
  branch?: string;
  variables?: Record<string, string>;
}

export interface PipelineRunStatus {
  id: number;
  name: string;
  status: string;
  result?: string;
  startTime: string;
  finishTime?: string;
  requestedBy?: string;
  sourceBranch?: string;
  sourceVersion?: string;
}

export interface WebhookConfiguration {
  eventType?: string;
  branch?: string;
  url: string;
  headers?: Record<string, string>;
  basicAuthUsername?: string;
  basicAuthPassword?: string;
}

export interface EnvironmentConfiguration {
  name: string;
  description?: string;
}

export interface ApprovalGateApprover {
  id: string;
  displayName: string;
}

export interface PipelineYAMLConfig {
  trigger?: string[];
  vmImage?: string;
  azureSubscription?: string;
  containerRegistry?: string;
  imageName?: string;
  nodeVersion?: string;
  dockerfile?: string;
  environment?: string;
  containerAppName?: string;
  resourceGroup?: string;
  variables?: Record<string, string>;
}

export interface ProjectInfo {
  project: {
    id: string;
    name: string;
    description?: string;
    url: string;
    state: string;
  };
  statistics: {
    pipelinesCount: number;
    repositoriesCount: number;
  };
  pipelines: Array<{
    id: number;
    name: string;
    folder?: string;
  }>;
  repositories: Array<{
    id: string;
    name: string;
    url: string;
    defaultBranch: string;
  }>;
}

// Azure Maps Types
export interface MapsSearchOptions {
  limit?: number;
  countrySet?: string[];
  lat?: number;
  lon?: number;
  radius?: number;
  categorySet?: string;
  language?: string;
  view?: string;
}

export interface MapsSearchResult {
  id: string;
  type: string;
  score: number;
  address: {
    streetNumber?: string;
    streetName?: string;
    municipality?: string;
    neighbourhood?: string;
    countrySubdivision?: string;
    countryCode?: string;
    country?: string;
    postalCode?: string;
    freeformAddress?: string;
  };
  position: {
    lat: number;
    lon: number;
  };
  poi?: {
    name: string;
    categories: string[];
    phone?: string;
    url?: string;
  };
  distance?: number;
}

export interface Waypoint {
  lat: number;
  lon: number;
}

export interface RouteOptions {
  travelMode?: 'car' | 'truck' | 'taxi' | 'bus' | 'van' | 'motorcycle' | 'bicycle' | 'pedestrian';
  routeType?: 'fastest' | 'shortest' | 'eco' | 'thrilling';
  traffic?: boolean;
  departAt?: string;
  arriveAt?: string;
  avoid?: string[];
  language?: string;
  instructionsType?: 'text' | 'tagged';
}

export interface RouteResult {
  summary: {
    lengthInMeters: number;
    travelTimeInSeconds: number;
    trafficDelayInSeconds?: number;
    departureTime?: string;
    arrivalTime?: string;
  };
  legs: Array<{
    summary: any;
    points: any[];
  }>;
  sections: any[];
  guidance: {
    instructions: any[];
    instructionGroups: any[];
  };
}

export interface TimezoneInfo {
  location: {
    lat: number;
    lon: number;
  };
  timeZone: {
    id: string;
    name: string;
    abbreviation: string;
    utcOffset: string;
    dstOffset?: string;
  };
}

export interface GeolocationResult {
  ipAddress: string;
  countryRegion: {
    isoCode: string;
    name: string;
  };
  location: {
    lat: number;
    lon: number;
  };
}

export interface BatchGeocodeItem {
  id: string;
  query: string;
  statusCode: number;
  response?: {
    results: Array<{
      position: { lat: number; lon: number };
      address: any;
      confidence: string;
    }>;
  };
}

// Azure Weather Types
export interface WeatherOptions {
  language?: string;
  unit?: 'metric' | 'imperial';
  details?: boolean;
}

export interface WeatherCondition {
  location: {
    lat: number;
    lon: number;
  };
  observationTime: string;
  conditions: {
    phrase: string;
    iconCode: number;
    isDayTime: boolean;
    hasPrecipitation: boolean;
    precipitationType?: string;
  };
  temperature: {
    value: number;
    unit: string;
    realFeel?: number;
    realFeelShade?: number;
  };
  humidity: number;
  dewPoint: {
    value: number;
    unit: string;
  };
  wind: {
    direction: {
      degrees: number;
      localizedDescription: string;
    };
    speed: {
      value: number;
      unit: string;
    };
  };
  windGust?: {
    value: number;
    unit: string;
  };
  uvIndex: number;
  uvIndexPhrase: string;
  visibility: {
    value: number;
    unit: string;
  };
  cloudCover: number;
  ceiling?: {
    value: number;
    unit: string;
  };
  pressure: {
    value: number;
    unit: string;
    tendencyCode?: number;
    tendencyPhrase?: string;
  };
  apparentTemperature?: {
    value: number;
    unit: string;
  };
  windChillTemperature?: {
    value: number;
    unit: string;
  };
  wetBulbTemperature?: {
    value: number;
    unit: string;
  };
}

export interface WeatherForecast {
  location: {
    lat: number;
    lon: number;
  };
  forecasts: Array<{
    dateTime: string;
    iconCode: number;
    iconPhrase: string;
    hasPrecipitation: boolean;
    isDaylight?: boolean;
    temperature: {
      value: number;
      unit: string;
    };
    realFeelTemperature: {
      value: number;
      unit: string;
    };
    dewPoint: {
      value: number;
      unit: string;
    };
    wind: {
      direction: any;
      speed: any;
    };
    windGust?: any;
    relativeHumidity: number;
    visibility: any;
    uvIndex: number;
    uvIndexPhrase: string;
    precipitationProbability: number;
    rainProbability: number;
    snowProbability: number;
    iceProbability: number;
    cloudCover: number;
    ceiling?: any;
  }>;
}

export interface DailyWeatherForecast {
  location: {
    lat: number;
    lon: number;
  };
  headline?: any;
  forecasts: Array<{
    date: string;
    sun?: {
      rise: string;
      set: string;
      epochRise: number;
      epochSet: number;
    };
    moon?: {
      rise: string;
      set: string;
      phase: string;
      age: number;
      illumination: number;
    };
    temperature: {
      minimum: any;
      maximum: any;
    };
    realFeelTemperature: {
      minimum: any;
      maximum: any;
    };
    realFeelTemperatureShade: {
      minimum: any;
      maximum: any;
    };
    hoursOfSun: number;
    degreeDaySummary: {
      heating: any;
      cooling: any;
    };
    airAndPollen: any[];
    day?: DayNightWeatherInfo;
    night?: DayNightWeatherInfo;
  }>;
}

export interface DayNightWeatherInfo {
  iconCode: number;
  iconPhrase: string;
  hasPrecipitation: boolean;
  precipitationType?: string;
  precipitationIntensity?: string;
  shortPhrase: string;
  longPhrase: string;
  precipitationProbability: number;
  thunderstormProbability: number;
  rainProbability: number;
  snowProbability: number;
  iceProbability: number;
  wind: any;
  windGust: any;
  totalLiquid: any;
  rain: any;
  snow: any;
  ice: any;
  hoursOfPrecipitation: number;
  hoursOfRain: number;
  hoursOfSnow: number;
  hoursOfIce: number;
  cloudCover: number;
}

export interface WeatherAlert {
  countryCode: string;
  alertId: string;
  description: {
    localized: string;
    english: string;
  };
  category: string;
  priority: number;
  class: string;
  level: string;
  source: string;
  sourceId: string;
  disclaimer?: string;
  alertDetails?: {
    language: string;
    text: string;
  };
  areas: Array<{
    name: string;
    summary: string;
    startTime: string;
    endTime: string;
    latestStatus: any;
  }>;
}

export interface MinuteForecast {
  location: {
    lat: number;
    lon: number;
  };
  summary: {
    briefPhrase60: string;
    shortPhrase: string;
    briefPhrase: string;
    longPhrase: string;
    iconCode: number;
  };
  forecasts: Array<{
    minute: number;
    dbz: number;
    shortPhrase: string;
    threshold: string;
    color: string;
    simplifiedColor: string;
    precipitationType: string;
    iconCode: number;
    cloudCover: number;
  }>;
  intervalSummaries: Array<{
    startMinute: number;
    endMinute: number;
    totalMinutes: number;
    shortPhrase: string;
    briefPhrase: string;
    longPhrase: string;
    iconCode: number;
  }>;
}

export interface AirQualityData {
  location: {
    lat: number;
    lon: number;
  };
  dateTime: string;
  index: number;
  indexDescription: string;
  category: string;
  categoryColor: string;
  dominantPollutant: string;
  pollutants: Array<{
    name: string;
    concentration: {
      value: number;
      unit: string;
    };
    index: number;
    indexDescription: string;
    category: string;
    categoryColor: string;
  }>;
}

export interface MarineWeather {
  location: {
    lat: number;
    lon: number;
  };
  observationTime: string;
  conditions: {
    phrase: string;
    iconCode: number;
  };
  temperature: {
    air: any;
    water: any;
  };
  wind: {
    direction: any;
    speed: any;
    gust: any;
  };
  waves: {
    height: any;
    period: any;
    direction: any;
  };
  visibility: any;
  pressure: any;
  humidity: number;
  dewPoint: any;
  uvIndex: number;
}

export interface WeatherIndex {
  id: string;
  name: string;
  category: string;
  index: number;
  indexDescription: string;
  value: number;
  ascending: boolean;
}

export interface WeatherSummary {
  location: {
    lat: number;
    lon: number;
  };
  timestamp: string;
  current: WeatherCondition | null;
  hourlyForecast: WeatherForecast['forecasts'] | null;
  dailyForecast: DailyWeatherForecast['forecasts'] | null;
  alerts: WeatherAlert[];
  errors: Array<{
    service: string;
    error: string;
  }>;
}

// Security Types
export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiry: string;
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  requireMFA: boolean;
  allowedOrigins: string[];
  encryptionKey: string;
}

export interface UserSession {
  userId: string;
  userInfo: any;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
  fingerprint: string;
}

export interface RefreshTokenData {
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface JWTPayload {
  userId: string;
  email?: string;
  role?: string;
  permissions?: string[];
  iat: number;
  exp: number;
  jti: string;
  iss: string;
  aud: string;
}

export interface PasswordValidation {
  isValid: boolean;
  issues: string[];
  strength: {
    score: number;
    level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
    percentage: number;
  };
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export interface SecurityStatus {
  service: string;
  status: 'healthy' | 'warning' | 'error';
  timestamp: string;
  statistics: {
    activeSessions: number;
    refreshTokens: number;
    loginAttempts: number;
    suspiciousActivities: number;
    rateLimiters: number;
  };
  configuration: {
    jwtExpiresIn: string;
    refreshTokenExpiry: string;
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    requireMFA: boolean;
    bcryptRounds: number;
  };
  security: {
    encryptionEnabled: boolean;
    jwtSecretConfigured: boolean;
    rateLimitingEnabled: boolean;
    sessionManagementEnabled: boolean;
    securityMonitoringEnabled: boolean;
  };
}

// Logging Types
export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
  message: string;
  service: string;
  environment: string;
  version: string;
  instance: string;
  correlationId?: string;
  [key: string]: any;
}

export interface LogStatistics {
  loggers: number;
  logDirectory: string;
  totalLogFiles: number;
  totalLogSize: number;
  logsByLevel: Record<string, number>;
  logsByService: Record<string, number>;
}

export interface LogExportOptions {
  service: string;
  startDate: Date;
  endDate: Date;
  format?: 'json' | 'csv';
}

// API Gateway Types
export interface APIGatewayConfig {
  port: number;
  enableCors: boolean;
  allowedOrigins: string[];
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    max: number;
  };
  authentication: {
    required: boolean;
    jwtSecret: string;
  };
  websocket: {
    enabled: boolean;
    path: string;
  };
}

export interface WebSocketConnection {
  ws: any;
  id: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
  ip: string;
  userAgent: string;
}

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'pong' | 'error' | 'connected' | 'subscribed' | 'unsubscribed';
  service?: string;
  connectionId?: string;
  message?: string;
  timestamp: string;
  [key: string]: any;
}

export interface APIError {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode?: number;
    timestamp: string;
  };
}

export interface APISuccess<T = any> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

export type APIResponse<T = any> = APISuccess<T> | APIError;

// Service Integration Types
export interface AzureServiceContainer {
  config: AzureConfigManager;
  containerApps: AzureContainerAppsService;
  devOps: AzureDevOpsService;
  maps: AzureMapsService;
  weather: AzureWeatherService;
  security: AzureSecurityService;
  logger: AzureLoggerService;
  apiGateway: AzureAPIGateway;
}

export interface ServiceInitializationOptions {
  enableLogging?: boolean;
  enableSecurity?: boolean;
  enableWebSocket?: boolean;
  logLevel?: string;
  port?: number;
}

export interface ServiceHealthReport {
  overall: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  services: {
    config: AzureHealthStatus;
    containerApps: AzureHealthStatus;
    devOps: AzureHealthStatus;
    maps: AzureHealthStatus;
    weather: AzureHealthStatus;
    security: SecurityStatus;
    logger: any;
  };
  websocket: {
    activeConnections: number;
    subscriptions: number;
  };
}

// Request/Response Extensions for Express
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      sessionId?: string;
      correlationId?: string;
    }
  }
}

// Environment Variables
export interface AzureEnvironmentVariables {
  // Azure Credentials
  AZURE_SUBSCRIPTION_ID?: string;
  AZURE_TENANT_ID?: string;
  AZURE_CLIENT_ID?: string;
  AZURE_CLIENT_SECRET?: string;
  AZURE_KEYVAULT_URL?: string;
  AZURE_RESOURCE_GROUP?: string;
  AZURE_LOCATION?: string;

  // Azure Maps
  AZURE_MAPS_SUBSCRIPTION_KEY?: string;
  AZURE_MAPS_CLIENT_ID?: string;

  // Azure Container Apps
  AZURE_CONTAINER_APPS_ENVIRONMENT?: string;

  // Azure DevOps
  AZURE_DEVOPS_ORGANIZATION?: string;
  AZURE_DEVOPS_PROJECT?: string;
  AZURE_DEVOPS_TOKEN?: string;

  // Security
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
  REFRESH_TOKEN_EXPIRY?: string;
  BCRYPT_ROUNDS?: string;
  MAX_LOGIN_ATTEMPTS?: string;
  LOCKOUT_DURATION?: string;
  SESSION_TIMEOUT?: string;
  REQUIRE_MFA?: string;
  ENCRYPTION_KEY?: string;

  // Application
  NODE_ENV?: 'development' | 'production' | 'test';
  PORT?: string;
  LOG_LEVEL?: string;
  ALLOWED_ORIGINS?: string;

  // Azure Monitoring
  AZURE_ENABLE_TELEMETRY?: string;
  AZURE_LOG_LEVEL?: string;
}