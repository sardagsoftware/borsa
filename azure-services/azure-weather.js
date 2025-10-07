// Azure Weather API Integration Service
// Advanced weather data and forecasting for AiLydian Ultra Pro

const axios = require('axios');
const AzureConfigManager = require('./azure-config');
const winston = require('winston');

class AzureWeatherService {
    constructor() {
        this.configManager = new AzureConfigManager();
        this.config = null;
        this.apiClient = null;

        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'azure-weather' },
            transports: [
                new winston.transports.File({ filename: 'logs/weather-error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/weather.log' }),
                new winston.transports.Console({ format: winston.format.simple() })
            ]
        });

        this.initialize();
    }

    /**
     * Initialize Azure Weather API service
     */
    async initialize() {
        try {
            await this.configManager.initializeCredentials();
            this.config = await this.configManager.getMapsConfig();

            if (!this.config.subscriptionKey) {
                throw new Error('Azure Maps subscription key is required for Weather API');
            }

            this.apiClient = axios.create({
                baseURL: 'https://atlas.microsoft.com/weather',
                params: {
                    'subscription-key': this.config.subscriptionKey,
                    'api-version': '1.0'
                },
                timeout: 10000
            });

            this.logger.info('Azure Weather service initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Azure Weather service', error);
            throw error;
        }
    }

    /**
     * Get current weather conditions with enhanced data
     */
    async getCurrentConditions(lat, lon, options = {}) {
        try {
            const params = {
                query: `${lat},${lon}`,
                language: options.language || 'en-US',
                details: options.details !== false,
                unit: options.unit || 'metric'
            };

            const response = await this.apiClient.get('/currentConditions/json', { params });

            if (response.status !== 200) {
                throw new Error(`Weather API request failed with status: ${response.status}`);
            }

            const weather = response.data.results[0];
            const result = {
                location: { lat, lon },
                observationTime: weather.dateTime,
                conditions: {
                    phrase: weather.phrase,
                    iconCode: weather.iconCode,
                    isDayTime: weather.isDayTime,
                    hasPrecipitation: weather.hasPrecipitation,
                    precipitationType: weather.precipitationType
                },
                temperature: {
                    value: weather.temperature?.value,
                    unit: weather.temperature?.unit,
                    realFeel: weather.realFeelTemperature?.value,
                    realFeelShade: weather.realFeelTemperatureShade?.value
                },
                humidity: weather.relativeHumidity,
                dewPoint: {
                    value: weather.dewPoint?.value,
                    unit: weather.dewPoint?.unit
                },
                wind: {
                    direction: {
                        degrees: weather.wind?.direction?.degrees,
                        localizedDescription: weather.wind?.direction?.localizedDescription
                    },
                    speed: {
                        value: weather.wind?.speed?.value,
                        unit: weather.wind?.speed?.unit
                    }
                },
                windGust: weather.windGust ? {
                    value: weather.windGust.speed?.value,
                    unit: weather.windGust.speed?.unit
                } : null,
                uvIndex: weather.uvIndex,
                uvIndexPhrase: weather.uvIndexPhrase,
                visibility: {
                    value: weather.visibility?.value,
                    unit: weather.visibility?.unit
                },
                cloudCover: weather.cloudCover,
                ceiling: weather.ceiling ? {
                    value: weather.ceiling.value,
                    unit: weather.ceiling.unit
                } : null,
                pressure: {
                    value: weather.pressure?.value,
                    unit: weather.pressure?.unit,
                    tendencyCode: weather.pressureTendency?.code,
                    tendencyPhrase: weather.pressureTendency?.localizedDescription
                },
                apparentTemperature: {
                    value: weather.apparentTemperature?.value,
                    unit: weather.apparentTemperature?.unit
                },
                windChillTemperature: weather.windChillTemperature ? {
                    value: weather.windChillTemperature.value,
                    unit: weather.windChillTemperature.unit
                } : null,
                wetBulbTemperature: weather.wetBulbTemperature ? {
                    value: weather.wetBulbTemperature.value,
                    unit: weather.wetBulbTemperature.unit
                } : null
            };

            this.logger.info(`Current weather conditions retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getCurrentConditions', result);

        } catch (error) {
            return this.configManager.createErrorResponse('getCurrentConditions', error);
        }
    }

    /**
     * Get detailed hourly forecast
     */
    async getHourlyForecast(lat, lon, hours = 12, options = {}) {
        try {
            const validHours = [1, 12, 24, 72, 120, 240];
            if (!validHours.includes(hours)) {
                hours = 12; // Default to 12 hours
            }

            const params = {
                query: `${lat},${lon}`,
                language: options.language || 'en-US',
                details: options.details !== false,
                metric: options.metric !== false
            };

            const response = await this.apiClient.get(`/forecast/hourly/${hours}hour/json`, { params });

            const forecasts = response.data.forecasts.map(forecast => ({
                dateTime: forecast.date,
                iconCode: forecast.iconCode,
                iconPhrase: forecast.iconPhrase,
                hasPrecipitation: forecast.hasPrecipitation,
                isDaylight: forecast.isDaylight,
                temperature: {
                    value: forecast.temperature?.value,
                    unit: forecast.temperature?.unit
                },
                realFeelTemperature: {
                    value: forecast.realFeelTemperature?.value,
                    unit: forecast.realFeelTemperature?.unit
                },
                dewPoint: {
                    value: forecast.dewPoint?.value,
                    unit: forecast.dewPoint?.unit
                },
                wind: {
                    direction: forecast.wind?.direction,
                    speed: forecast.wind?.speed
                },
                windGust: forecast.windGust,
                relativeHumidity: forecast.relativeHumidity,
                visibility: forecast.visibility,
                uvIndex: forecast.uvIndex,
                uvIndexPhrase: forecast.uvIndexPhrase,
                precipitationProbability: forecast.precipitationProbability,
                rainProbability: forecast.rainProbability,
                snowProbability: forecast.snowProbability,
                iceProbability: forecast.iceProbability,
                cloudCover: forecast.cloudCover,
                ceiling: forecast.ceiling
            }));

            this.logger.info(`${hours}-hour weather forecast retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getHourlyForecast', {
                location: { lat, lon },
                forecasts
            });

        } catch (error) {
            return this.configManager.createErrorResponse('getHourlyForecast', error);
        }
    }

    /**
     * Get detailed daily forecast
     */
    async getDailyForecast(lat, lon, days = 5, options = {}) {
        try {
            const validDays = [1, 5, 10, 15, 25, 45];
            if (!validDays.includes(days)) {
                days = 5; // Default to 5 days
            }

            const params = {
                query: `${lat},${lon}`,
                language: options.language || 'en-US',
                details: options.details !== false,
                metric: options.metric !== false
            };

            const response = await this.apiClient.get(`/forecast/daily/${days}day/json`, { params });

            const forecasts = response.data.forecasts.map(forecast => ({
                date: forecast.date,
                sun: {
                    rise: forecast.sun?.rise,
                    set: forecast.sun?.set,
                    epochRise: forecast.sun?.epochRise,
                    epochSet: forecast.sun?.epochSet
                },
                moon: {
                    rise: forecast.moon?.rise,
                    set: forecast.moon?.set,
                    phase: forecast.moon?.phase,
                    age: forecast.moon?.age,
                    illumination: forecast.moon?.illumination
                },
                temperature: {
                    minimum: forecast.temperature?.minimum,
                    maximum: forecast.temperature?.maximum
                },
                realFeelTemperature: {
                    minimum: forecast.realFeelTemperature?.minimum,
                    maximum: forecast.realFeelTemperature?.maximum
                },
                realFeelTemperatureShade: {
                    minimum: forecast.realFeelTemperatureShade?.minimum,
                    maximum: forecast.realFeelTemperatureShade?.maximum
                },
                hoursOfSun: forecast.hoursOfSun,
                degreeDaySummary: {
                    heating: forecast.degreeDaySummary?.heating,
                    cooling: forecast.degreeDaySummary?.cooling
                },
                airAndPollen: forecast.airAndPollen,
                day: forecast.day ? {
                    iconCode: forecast.day.iconCode,
                    iconPhrase: forecast.day.iconPhrase,
                    hasPrecipitation: forecast.day.hasPrecipitation,
                    precipitationType: forecast.day.precipitationType,
                    precipitationIntensity: forecast.day.precipitationIntensity,
                    shortPhrase: forecast.day.shortPhrase,
                    longPhrase: forecast.day.longPhrase,
                    precipitationProbability: forecast.day.precipitationProbability,
                    thunderstormProbability: forecast.day.thunderstormProbability,
                    rainProbability: forecast.day.rainProbability,
                    snowProbability: forecast.day.snowProbability,
                    iceProbability: forecast.day.iceProbability,
                    wind: forecast.day.wind,
                    windGust: forecast.day.windGust,
                    totalLiquid: forecast.day.totalLiquid,
                    rain: forecast.day.rain,
                    snow: forecast.day.snow,
                    ice: forecast.day.ice,
                    hoursOfPrecipitation: forecast.day.hoursOfPrecipitation,
                    hoursOfRain: forecast.day.hoursOfRain,
                    hoursOfSnow: forecast.day.hoursOfSnow,
                    hoursOfIce: forecast.day.hoursOfIce,
                    cloudCover: forecast.day.cloudCover
                } : null,
                night: forecast.night ? {
                    iconCode: forecast.night.iconCode,
                    iconPhrase: forecast.night.iconPhrase,
                    hasPrecipitation: forecast.night.hasPrecipitation,
                    precipitationType: forecast.night.precipitationType,
                    precipitationIntensity: forecast.night.precipitationIntensity,
                    shortPhrase: forecast.night.shortPhrase,
                    longPhrase: forecast.night.longPhrase,
                    precipitationProbability: forecast.night.precipitationProbability,
                    thunderstormProbability: forecast.night.thunderstormProbability,
                    rainProbability: forecast.night.rainProbability,
                    snowProbability: forecast.night.snowProbability,
                    iceProbability: forecast.night.iceProbability,
                    wind: forecast.night.wind,
                    windGust: forecast.night.windGust,
                    totalLiquid: forecast.night.totalLiquid,
                    rain: forecast.night.rain,
                    snow: forecast.night.snow,
                    ice: forecast.night.ice,
                    hoursOfPrecipitation: forecast.night.hoursOfPrecipitation,
                    hoursOfRain: forecast.night.hoursOfRain,
                    hoursOfSnow: forecast.night.hoursOfSnow,
                    hoursOfIce: forecast.night.hoursOfIce,
                    cloudCover: forecast.night.cloudCover
                } : null
            }));

            this.logger.info(`${days}-day weather forecast retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getDailyForecast', {
                location: { lat, lon },
                headline: response.data.headline,
                forecasts
            });

        } catch (error) {
            return this.configManager.createErrorResponse('getDailyForecast', error);
        }
    }

    /**
     * Get minute-by-minute precipitation forecast
     */
    async getMinuteForecast(lat, lon, options = {}) {
        try {
            const params = {
                query: `${lat},${lon}`,
                language: options.language || 'en-US'
            };

            const response = await this.apiClient.get('/forecast/minute/json', { params });

            const result = {
                location: { lat, lon },
                summary: {
                    briefPhrase60: response.data.summary?.briefPhrase60,
                    shortPhrase: response.data.summary?.shortPhrase,
                    briefPhrase: response.data.summary?.briefPhrase,
                    longPhrase: response.data.summary?.longPhrase,
                    iconCode: response.data.summary?.iconCode
                },
                forecasts: response.data.forecasts?.map(forecast => ({
                    minute: forecast.minute,
                    dbz: forecast.dbz,
                    shortPhrase: forecast.shortPhrase,
                    threshold: forecast.threshold,
                    color: forecast.color,
                    simplifiedColor: forecast.simplifiedColor,
                    precipitationType: forecast.precipitationType,
                    iconCode: forecast.iconCode,
                    cloudCover: forecast.cloudCover
                })) || [],
                intervalSummaries: response.data.intervalSummaries?.map(summary => ({
                    startMinute: summary.startMinute,
                    endMinute: summary.endMinute,
                    totalMinutes: summary.totalMinutes,
                    shortPhrase: summary.shortPhrase,
                    briefPhrase: summary.briefPhrase,
                    longPhrase: summary.longPhrase,
                    iconCode: summary.iconCode
                })) || []
            };

            this.logger.info(`Minute-by-minute precipitation forecast retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getMinuteForecast', result);

        } catch (error) {
            return this.configManager.createErrorResponse('getMinuteForecast', error);
        }
    }

    /**
     * Get severe weather alerts
     */
    async getSevereWeatherAlerts(lat, lon, options = {}) {
        try {
            const params = {
                query: `${lat},${lon}`,
                language: options.language || 'en-US',
                details: options.details !== false
            };

            const response = await this.apiClient.get('/alerts/json', { params });

            const alerts = response.data.results?.map(alert => ({
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
                alertDetails: alert.alertDetails ? {
                    language: alert.alertDetails.language,
                    text: alert.alertDetails.text
                } : null,
                areas: alert.areas?.map(area => ({
                    name: area.name,
                    summary: area.summary,
                    startTime: area.startTime,
                    endTime: area.endTime,
                    latestStatus: area.latestStatus
                })) || []
            })) || [];

            this.logger.info(`Severe weather alerts retrieved for coordinates: ${lat}, ${lon}, found ${alerts.length} alerts`);
            return this.configManager.createSuccessResponse('getSevereWeatherAlerts', alerts);

        } catch (error) {
            return this.configManager.createErrorResponse('getSevereWeatherAlerts', error);
        }
    }

    /**
     * Get historical weather data
     */
    async getHistoricalWeather(lat, lon, startDate, endDate, options = {}) {
        try {
            const params = {
                query: `${lat},${lon}`,
                startDate: startDate,
                endDate: endDate,
                language: options.language || 'en-US',
                unit: options.unit || 'metric'
            };

            const response = await this.apiClient.get('/historical/daily/json', { params });

            const historicalData = response.data.historicalRecords?.map(record => ({
                date: record.date,
                temperature: {
                    minimum: record.temperature?.minimum,
                    maximum: record.temperature?.maximum,
                    average: record.temperature?.average
                },
                dewPoint: {
                    minimum: record.dewPoint?.minimum,
                    maximum: record.dewPoint?.maximum,
                    average: record.dewPoint?.average
                },
                humidity: {
                    minimum: record.humidity?.minimum,
                    maximum: record.humidity?.maximum,
                    average: record.humidity?.average
                },
                pressure: {
                    minimum: record.pressure?.minimum,
                    maximum: record.pressure?.maximum,
                    average: record.pressure?.average
                },
                wind: {
                    direction: record.wind?.direction,
                    speed: record.wind?.speed
                },
                precipitation: {
                    rain: record.precipitation?.rain,
                    snow: record.precipitation?.snow,
                    total: record.precipitation?.total
                },
                snowDepth: record.snowDepth
            })) || [];

            this.logger.info(`Historical weather data retrieved for coordinates: ${lat}, ${lon} from ${startDate} to ${endDate}`);
            return this.configManager.createSuccessResponse('getHistoricalWeather', {
                location: { lat, lon },
                period: { startDate, endDate },
                historicalData
            });

        } catch (error) {
            return this.configManager.createErrorResponse('getHistoricalWeather', error);
        }
    }

    /**
     * Get air quality index and data
     */
    async getAirQuality(lat, lon, options = {}) {
        try {
            const params = {
                query: `${lat},${lon}`,
                language: options.language || 'en-US',
                pollutants: options.pollutants !== false
            };

            const response = await this.apiClient.get('/airQuality/current/json', { params });

            const airQuality = response.data.results[0];
            const result = {
                location: { lat, lon },
                dateTime: airQuality.dateTime,
                index: airQuality.index,
                indexDescription: airQuality.indexDescription,
                category: airQuality.category,
                categoryColor: airQuality.categoryColor,
                dominantPollutant: airQuality.dominantPollutant,
                pollutants: airQuality.pollutants?.map(pollutant => ({
                    name: pollutant.name,
                    concentration: {
                        value: pollutant.concentration?.value,
                        unit: pollutant.concentration?.unit
                    },
                    index: pollutant.index,
                    indexDescription: pollutant.indexDescription,
                    category: pollutant.category,
                    categoryColor: pollutant.categoryColor
                })) || []
            };

            this.logger.info(`Air quality data retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getAirQuality', result);

        } catch (error) {
            return this.configManager.createErrorResponse('getAirQuality', error);
        }
    }

    /**
     * Get marine weather conditions
     */
    async getMarineWeather(lat, lon, options = {}) {
        try {
            const params = {
                query: `${lat},${lon}`,
                language: options.language || 'en-US',
                details: options.details !== false
            };

            const response = await this.apiClient.get('/marine/current/json', { params });

            const marine = response.data.results[0];
            const result = {
                location: { lat, lon },
                observationTime: marine.dateTime,
                conditions: {
                    phrase: marine.phrase,
                    iconCode: marine.iconCode
                },
                temperature: {
                    air: marine.airTemperature,
                    water: marine.waterTemperature
                },
                wind: {
                    direction: marine.wind?.direction,
                    speed: marine.wind?.speed,
                    gust: marine.windGust
                },
                waves: {
                    height: marine.waveHeight,
                    period: marine.wavePeriod,
                    direction: marine.waveDirection
                },
                visibility: marine.visibility,
                pressure: marine.pressure,
                humidity: marine.relativeHumidity,
                dewPoint: marine.dewPoint,
                uvIndex: marine.uvIndex
            };

            this.logger.info(`Marine weather conditions retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getMarineWeather', result);

        } catch (error) {
            return this.configManager.createErrorResponse('getMarineWeather', error);
        }
    }

    /**
     * Get weather indices (comfort, health, sports)
     */
    async getWeatherIndices(lat, lon, options = {}) {
        try {
            const params = {
                query: `${lat},${lon}`,
                language: options.language || 'en-US',
                indexId: options.indexId || 'all'
            };

            const response = await this.apiClient.get('/indices/daily/json', { params });

            const indices = response.data.results?.map(index => ({
                id: index.id,
                name: index.name,
                category: index.category,
                index: index.index,
                indexDescription: index.indexDescription,
                value: index.value,
                ascending: index.ascending
            })) || [];

            this.logger.info(`Weather indices retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getWeatherIndices', {
                location: { lat, lon },
                indices
            });

        } catch (error) {
            return this.configManager.createErrorResponse('getWeatherIndices', error);
        }
    }

    /**
     * Get comprehensive weather summary
     */
    async getWeatherSummary(lat, lon, options = {}) {
        try {
            const [current, hourly, daily, alerts] = await Promise.allSettled([
                this.getCurrentConditions(lat, lon, options),
                this.getHourlyForecast(lat, lon, 12, options),
                this.getDailyForecast(lat, lon, 5, options),
                this.getSevereWeatherAlerts(lat, lon, options)
            ]);

            const summary = {
                location: { lat, lon },
                timestamp: new Date().toISOString(),
                current: current.status === 'fulfilled' ? current.value.data : null,
                hourlyForecast: hourly.status === 'fulfilled' ? hourly.value.data?.forecasts?.slice(0, 6) : null,
                dailyForecast: daily.status === 'fulfilled' ? daily.value.data?.forecasts?.slice(0, 3) : null,
                alerts: alerts.status === 'fulfilled' ? alerts.value.data : [],
                errors: []
            };

            // Collect any errors
            [current, hourly, daily, alerts].forEach((result, index) => {
                if (result.status === 'rejected') {
                    const services = ['current', 'hourly', 'daily', 'alerts'];
                    summary.errors.push({
                        service: services[index],
                        error: result.reason.message
                    });
                }
            });

            this.logger.info(`Weather summary retrieved for coordinates: ${lat}, ${lon}`);
            return this.configManager.createSuccessResponse('getWeatherSummary', summary);

        } catch (error) {
            return this.configManager.createErrorResponse('getWeatherSummary', error);
        }
    }

    /**
     * Get comprehensive health status
     */
    async getHealthStatus() {
        try {
            const baseStatus = await this.configManager.getHealthStatus();

            const weatherStatus = {
                apiClient: this.apiClient ? 'initialized' : 'not-initialized',
                subscriptionKey: this.config?.subscriptionKey ? 'configured' : 'missing'
            };

            // Test API connectivity
            if (this.config?.subscriptionKey) {
                try {
                    await this.getCurrentConditions(52.5200, 13.4050); // Berlin coordinates
                    weatherStatus.apiConnectivity = 'healthy';
                    weatherStatus.status = 'healthy';
                } catch (error) {
                    weatherStatus.apiConnectivity = 'error';
                    weatherStatus.status = 'error';
                    weatherStatus.error = error.message;
                }
            }

            return {
                ...baseStatus,
                weather: weatherStatus
            };

        } catch (error) {
            return this.configManager.createErrorResponse('getHealthStatus', error);
        }
    }
}

module.exports = AzureWeatherService;