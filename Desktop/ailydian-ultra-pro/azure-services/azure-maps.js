// Azure Maps Integration Service
// Enterprise geospatial and weather capabilities for AiLydian Ultra Pro

const MapsSearch = require('@azure-rest/maps-search').default;
const MapsRoute = require('@azure-rest/maps-route').default;
const MapsRender = require('@azure-rest/maps-render').default;
const MapsGeolocation = require('@azure-rest/maps-geolocation').default;
const axios = require('axios');
const AzureConfigManager = require('./azure-config');
const winston = require('winston');

class AzureMapsService {
    constructor() {
        this.configManager = new AzureConfigManager();
        this.config = null;
        this.searchClient = null;
        this.routeClient = null;
        this.renderClient = null;
        this.geolocationClient = null;
        this.weatherApiClient = null;

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'azure-maps' },
            transports: [
                new winston.transports.File({ filename: 'logs/maps-error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/maps.log' }),
                new winston.transports.Console({ format: winston.format.simple() })
            ]
        });

        this.initialize();
    }

    /**
     * Initialize Azure Maps service clients
     */
    async initialize() {
        try {
            await this.configManager.initializeCredentials();
            this.config = await this.configManager.getMapsConfig();

            if (!this.config.subscriptionKey) {
                throw new Error('Azure Maps subscription key is required');
            }

            const credential = { key: this.config.subscriptionKey };

            // Initialize Maps service clients
            this.searchClient = MapsSearch(credential);
            this.routeClient = MapsRoute(credential);
            this.renderClient = MapsRender(credential);
            this.geolocationClient = MapsGeolocation(credential);

            // Initialize Weather API client
            this.weatherApiClient = axios.create({
                baseURL: 'https://atlas.microsoft.com/weather',
                params: {
                    'subscription-key': this.config.subscriptionKey,
                    'api-version': '1.0'
                }
            });

            this.logger.info('Azure Maps service initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Azure Maps service', error);
            throw error;
        }
    }

    /**
     * Search for places, addresses, or POIs
     */
    async searchPlaces(query, options = {}) {
        try {
            const searchOptions = {
                query,
                limit: options.limit || 10,
                countrySet: options.countrySet || [],
                lat: options.lat,
                lon: options.lon,
                radius: options.radius,
                categorySet: options.categorySet,
                language: options.language || this.config.defaultLanguage,
                view: options.view || 'Auto'
            };

            const response = await this.searchClient.path('/search/fuzzy/{format}', 'json').get({
                queryParameters: searchOptions
            });

            if (response.status !== '200') {
                throw new Error(`Search request failed with status: ${response.status}`);
            }

            const results = response.body.results.map(result => ({
                id: result.id,
                type: result.type,
                score: result.score,
                address: {
                    streetNumber: result.address?.streetNumber,
                    streetName: result.address?.streetName,
                    municipality: result.address?.municipality,
                    neighbourhood: result.address?.neighbourhood,
                    countrySubdivision: result.address?.countrySubdivision,
                    countryCode: result.address?.countryCode,
                    country: result.address?.country,
                    postalCode: result.address?.postalCode,
                    freeformAddress: result.address?.freeformAddress
                },
                position: {
                    lat: result.position?.lat,
                    lon: result.position?.lon
                },
                poi: result.poi ? {
                    name: result.poi.name,
                    categories: result.poi.categories,
                    phone: result.poi.phone,
                    url: result.poi.url
                } : null,
                distance: result.dist
            }));

            this.logger.info(`Search completed for query: ${query}, found ${results.length} results`);
            return this.configManager.createSuccessResponse('searchPlaces', results);

        } catch (error) {
            return this.configManager.createErrorResponse('searchPlaces', error);
        }
    }

    /**
     * Get route directions between points
     */
    async getRoute(waypoints, options = {}) {
        try {
            if (!waypoints || waypoints.length < 2) {
                throw new Error('At least 2 waypoints are required for routing');
            }

            const routeOptions = {
                query: waypoints.map(wp => `${wp.lat},${wp.lon}`).join(':'),
                travelMode: options.travelMode || 'car',
                routeType: options.routeType || 'fastest',
                traffic: options.traffic !== false,
                departAt: options.departAt,
                arriveAt: options.arriveAt,
                avoid: options.avoid,
                language: options.language || this.config.defaultLanguage,
                instructionsType: options.instructionsType || 'text'
            };

            const response = await this.routeClient.path('/route/directions/{format}', 'json').get({
                queryParameters: routeOptions
            });

            if (response.status !== '200') {
                throw new Error(`Route request failed with status: ${response.status}`);
            }

            const route = response.body.routes[0];
            const result = {
                summary: {
                    lengthInMeters: route.summary.lengthInMeters,
                    travelTimeInSeconds: route.summary.travelTimeInSeconds,
                    trafficDelayInSeconds: route.summary.trafficDelayInSeconds,
                    departureTime: route.summary.departureTime,
                    arrivalTime: route.summary.arrivalTime
                },
                legs: route.legs.map(leg => ({
                    summary: leg.summary,
                    points: leg.points
                })),
                sections: route.sections,
                guidance: {
                    instructions: route.guidance?.instructions || [],
                    instructionGroups: route.guidance?.instructionGroups || []
                }
            };

            this.logger.info(`Route calculated between ${waypoints.length} waypoints`);
            return this.configManager.createSuccessResponse('getRoute', result);

        } catch (error) {
            return this.configManager.createErrorResponse('getRoute', error);
        }
    }

    /**
     * Get current weather conditions
     */
    async getCurrentWeather(lat, lon, options = {}) {
        try {
            const params = {
                query: `${lat},${lon}`,
                language: options.language || this.config.defaultLanguage,
                details: options.details || false,
                unit: options.unit || 'metric'
            };

            const response = await this.weatherApiClient.get('/currentConditions/json', { params });

            const weather = response.data.results[0];
            const result = {
                location: {
                    lat,
                    lon
                },
                dateTime: weather.dateTime,
                phrase: weather.phrase,
                iconCode: weather.iconCode,
                hasPrecipitation: weather.hasPrecipitation,
                precipitationType: weather.precipitationType,
                isDayTime: weather.isDayTime,
                temperature: {
                    value: weather.temperature?.value,
                    unit: weather.temperature?.unit
                },
                realFeelTemperature: {
                    value: weather.realFeelTemperature?.value,
                    unit: weather.realFeelTemperature?.unit
                },
                humidity: weather.relativeHumidity,
                dewPoint: weather.dewPoint,
                wind: {
                    direction: weather.wind?.direction,
                    speed: weather.wind?.speed
                },
                windGust: weather.windGust,
                uvIndex: weather.uvIndex,
                uvIndexPhrase: weather.uvIndexPhrase,
                visibility: weather.visibility,
                cloudCover: weather.cloudCover,
                pressure: weather.pressure
            };

            this.logger.info(`Current weather retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getCurrentWeather', result);

        } catch (error) {
            return this.configManager.createErrorResponse('getCurrentWeather', error);
        }
    }

    /**
     * Get weather forecast
     */
    async getWeatherForecast(lat, lon, duration = 'daily', options = {}) {
        try {
            const endpoint = duration === 'hourly' ? '/forecast/hourly/12hour/json' : '/forecast/daily/5day/json';
            const params = {
                query: `${lat},${lon}`,
                language: options.language || this.config.defaultLanguage,
                details: options.details || true,
                metric: options.metric !== false
            };

            const response = await this.weatherApiClient.get(endpoint, { params });

            const forecasts = response.data.forecasts.map(forecast => ({
                date: forecast.date,
                temperature: {
                    minimum: forecast.temperature?.minimum,
                    maximum: forecast.temperature?.maximum
                },
                realFeelTemperature: {
                    minimum: forecast.realFeelTemperature?.minimum,
                    maximum: forecast.realFeelTemperature?.maximum
                },
                day: forecast.day ? {
                    iconCode: forecast.day.iconCode,
                    iconPhrase: forecast.day.iconPhrase,
                    hasPrecipitation: forecast.day.hasPrecipitation,
                    precipitationType: forecast.day.precipitationType,
                    precipitationIntensity: forecast.day.precipitationIntensity
                } : null,
                night: forecast.night ? {
                    iconCode: forecast.night.iconCode,
                    iconPhrase: forecast.night.iconPhrase,
                    hasPrecipitation: forecast.night.hasPrecipitation,
                    precipitationType: forecast.night.precipitationType,
                    precipitationIntensity: forecast.night.precipitationIntensity
                } : null,
                sources: forecast.sources
            }));

            this.logger.info(`${duration} weather forecast retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getWeatherForecast', {
                location: { lat, lon },
                forecasts,
                headline: response.data.headline
            });

        } catch (error) {
            return this.configManager.createErrorResponse('getWeatherForecast', error);
        }
    }

    /**
     * Get severe weather alerts
     */
    async getWeatherAlerts(lat, lon, options = {}) {
        try {
            const params = {
                query: `${lat},${lon}`,
                language: options.language || this.config.defaultLanguage,
                details: options.details || true
            };

            const response = await this.weatherApiClient.get('/alerts/json', { params });

            const alerts = response.data.results.map(alert => ({
                countryCode: alert.countryCode,
                alertId: alert.alertId,
                description: {
                    localized: alert.description?.localized,
                    english: alert.description?.english
                },
                category: alert.category,
                priority: alert.priority,
                class: alert.class,
                level: alert.level,
                source: alert.source,
                sourceId: alert.sourceId,
                disclaimer: alert.disclaimer,
                areas: alert.areas
            }));

            this.logger.info(`Weather alerts retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getWeatherAlerts', alerts);

        } catch (error) {
            return this.configManager.createErrorResponse('getWeatherAlerts', error);
        }
    }

    /**
     * Reverse geocoding - get address from coordinates
     */
    async reverseGeocode(lat, lon, options = {}) {
        try {
            const searchOptions = {
                query: `${lat},${lon}`,
                language: options.language || this.config.defaultLanguage,
                returnSpeedLimit: options.returnSpeedLimit || false,
                returnRoadUse: options.returnRoadUse || false,
                allowFreeformNewline: options.allowFreeformNewline || false,
                returnMatchType: options.returnMatchType || false
            };

            const response = await this.searchClient.path('/search/address/reverse/{format}', 'json').get({
                queryParameters: searchOptions
            });

            if (response.status !== '200') {
                throw new Error(`Reverse geocoding failed with status: ${response.status}`);
            }

            const result = response.body.addresses[0];
            const address = {
                address: {
                    streetNumber: result.address?.streetNumber,
                    streetName: result.address?.streetName,
                    municipality: result.address?.municipality,
                    neighbourhood: result.address?.neighbourhood,
                    countrySubdivision: result.address?.countrySubdivision,
                    countryCode: result.address?.countryCode,
                    country: result.address?.country,
                    postalCode: result.address?.postalCode,
                    freeformAddress: result.address?.freeformAddress
                },
                position: {
                    lat: result.position?.lat,
                    lon: result.position?.lon
                }
            };

            this.logger.info(`Reverse geocoding completed for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('reverseGeocode', address);

        } catch (error) {
            return this.configManager.createErrorResponse('reverseGeocode', error);
        }
    }

    /**
     * Get IP geolocation
     */
    async getIpGeolocation(ipAddress) {
        try {
            const response = await this.geolocationClient.path('/geolocation/ip/{format}', 'json').get({
                queryParameters: {
                    ip: ipAddress
                }
            });

            if (response.status !== '200') {
                throw new Error(`IP geolocation failed with status: ${response.status}`);
            }

            const result = response.body;
            const location = {
                ipAddress,
                countryRegion: {
                    isoCode: result.countryRegion?.isoCode,
                    name: result.countryRegion?.name
                },
                location: {
                    lat: result.location?.lat,
                    lon: result.location?.lon
                }
            };

            this.logger.info(`IP geolocation completed for IP: ${ipAddress}`);
            return this.configManager.createSuccessResponse('getIpGeolocation', location);

        } catch (error) {
            return this.configManager.createErrorResponse('getIpGeolocation', error);
        }
    }

    /**
     * Generate map tile URL
     */
    generateMapTileUrl(zoom, x, y, options = {}) {
        const baseUrl = 'https://atlas.microsoft.com/map/tile';
        const params = new URLSearchParams({
            'subscription-key': this.config.subscriptionKey,
            'api-version': '2.0',
            'tilesetId': options.tilesetId || 'microsoft.base.road',
            'zoom': zoom,
            'x': x,
            'y': y,
            'tileSize': options.tileSize || '256',
            'language': options.language || this.config.defaultLanguage,
            'view': options.view || 'Auto'
        });

        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Get timezone information for coordinates
     */
    async getTimezone(lat, lon, options = {}) {
        try {
            const params = {
                query: `${lat},${lon}`,
                timeStamp: options.timeStamp || Math.floor(Date.now() / 1000),
                transitionsFrom: options.transitionsFrom,
                transitionsYears: options.transitionsYears || 1
            };

            const response = await axios.get('https://atlas.microsoft.com/timezone/byCoordinates/json', {
                params: {
                    ...params,
                    'subscription-key': this.config.subscriptionKey,
                    'api-version': '1.0'
                }
            });

            const timezone = response.data;
            const result = {
                location: { lat, lon },
                timeZone: {
                    id: timezone.TimeZones[0]?.Id,
                    name: timezone.TimeZones[0]?.Names?.Generic,
                    abbreviation: timezone.TimeZones[0]?.Abbreviation,
                    utcOffset: timezone.TimeZones[0]?.ReferenceTime?.StandardOffset,
                    dstOffset: timezone.TimeZones[0]?.ReferenceTime?.DaylightSavings
                }
            };

            this.logger.info(`Timezone information retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getTimezone', result);

        } catch (error) {
            return this.configManager.createErrorResponse('getTimezone', error);
        }
    }

    /**
     * Batch geocoding for multiple addresses
     */
    async batchGeocode(addresses, options = {}) {
        try {
            const batchItems = addresses.map((address, index) => ({
                id: index.toString(),
                query: address
            }));

            const batchRequest = {
                batchItems
            };

            const response = await this.searchClient.path('/search/address/batch/{format}', 'json').post({
                body: batchRequest,
                queryParameters: {
                    language: options.language || this.config.defaultLanguage
                }
            });

            if (response.status !== '200') {
                throw new Error(`Batch geocoding failed with status: ${response.status}`);
            }

            const results = response.body.batchItems.map(item => ({
                id: item.id,
                query: addresses[parseInt(item.id)],
                statusCode: item.statusCode,
                response: item.response ? {
                    results: item.response.results?.map(result => ({
                        position: result.position,
                        address: result.address,
                        confidence: result.confidence
                    }))
                } : null
            }));

            this.logger.info(`Batch geocoding completed for ${addresses.length} addresses`);
            return this.configManager.createSuccessResponse('batchGeocode', results);

        } catch (error) {
            return this.configManager.createErrorResponse('batchGeocode', error);
        }
    }

    /**
     * Get comprehensive health status
     */
    async getHealthStatus() {
        try {
            const baseStatus = await this.configManager.getHealthStatus();

            const mapsStatus = {
                searchClient: this.searchClient ? 'initialized' : 'not-initialized',
                routeClient: this.routeClient ? 'initialized' : 'not-initialized',
                renderClient: this.renderClient ? 'initialized' : 'not-initialized',
                geolocationClient: this.geolocationClient ? 'initialized' : 'not-initialized',
                weatherApiClient: this.weatherApiClient ? 'initialized' : 'not-initialized',
                subscriptionKey: this.config?.subscriptionKey ? 'configured' : 'missing'
            };

            // Test API connectivity
            if (this.config?.subscriptionKey) {
                try {
                    await this.getCurrentWeather(52.5200, 13.4050); // Berlin coordinates
                    mapsStatus.apiConnectivity = 'healthy';
                    mapsStatus.status = 'healthy';
                } catch (error) {
                    mapsStatus.apiConnectivity = 'error';
                    mapsStatus.status = 'error';
                    mapsStatus.error = error.message;
                }
            }

            return {
                ...baseStatus,
                maps: mapsStatus
            };

        } catch (error) {
            return this.configManager.createErrorResponse('getHealthStatus', error);
        }
    }
}

module.exports = AzureMapsService;