/**
 * Smart Cities Commands
 */

import { Command } from 'commander';
import * as ora from 'ora';
import { client } from '../lib/client';
import { authManager } from '../lib/auth';
import { createFormatter } from '../lib/output';
import { handleError, validateRequired } from '../lib/errors';
import { GlobalOptions, City, CreateCityRequest, CityAsset, CityMetrics, CityAlert } from '../types';

export function createCitiesCommand(): Command {
  const cities = new Command('cities')
    .description('Manage smart cities');

  cities
    .command('create')
    .description('Create a new city')
    .requiredOption('-n, --name <name>', 'City name')
    .requiredOption('-c, --country <country>', 'Country')
    .requiredOption('-p, --population <number>', 'Population')
    .option('-r, --region <region>', 'Region/State')
    .option('-a, --area <km2>', 'Area in square kilometers')
    .option('-t, --timezone <timezone>', 'Timezone', 'UTC')
    .option('--lat <latitude>', 'Latitude')
    .option('--lon <longitude>', 'Longitude')
    .action(async (opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        const request: CreateCityRequest = {
          name: opts.name,
          country: opts.country,
          population: parseInt(opts.population, 10),
          region: opts.region,
          area_km2: opts.area ? parseFloat(opts.area) : undefined,
          timezone: opts.timezone
        };

        if (opts.lat && opts.lon) {
          request.coordinates = {
            latitude: parseFloat(opts.lat),
            longitude: parseFloat(opts.lon)
          };
        }

        const spinner = ora('Creating city...').start();
        const response = await client.post<City>('/api/cities', request);
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to create city');
        }

        output.success('City created successfully');
        output.print(response.data);
        process.exit(0);
      } catch (error) {
        output.error('Failed to create city', error);
        handleError(error, opts.verbose);
      }
    });

  cities
    .command('list')
    .description('List all cities')
    .option('-l, --limit <number>', 'Limit number of results', '20')
    .option('-f, --filter <filter>', 'Filter by name or country')
    .action(async (opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        const spinner = ora('Fetching cities...').start();
        const response = await client.get<City[]>('/api/cities', {
          params: { limit: opts.limit, filter: opts.filter }
        });
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch cities');
        }

        output.print(response.data.map(city => ({
          ID: city.id,
          Name: city.name,
          Country: city.country,
          Population: city.population.toLocaleString(),
          Timezone: city.timezone,
          Created: city.created_at
        })));

        process.exit(0);
      } catch (error) {
        output.error('Failed to list cities', error);
        handleError(error, opts.verbose);
      }
    });

  cities
    .command('get <city-id>')
    .description('Get city details')
    .action(async (cityId: string, opts: GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(cityId, 'city ID');

        const spinner = ora('Fetching city details...').start();
        const response = await client.get<City>(`/api/cities/${cityId}`);
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch city');
        }

        output.print(response.data);
        process.exit(0);
      } catch (error) {
        output.error('Failed to get city', error);
        handleError(error, opts.verbose);
      }
    });

  cities
    .command('assets <city-id>')
    .description('List city assets (sensors, cameras, etc.)')
    .option('-t, --type <type>', 'Filter by asset type')
    .option('-l, --limit <number>', 'Limit number of results', '50')
    .action(async (cityId: string, opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(cityId, 'city ID');

        const spinner = ora('Fetching city assets...').start();
        const response = await client.get<CityAsset[]>(`/api/cities/${cityId}/assets`, {
          params: { type: opts.type, limit: opts.limit }
        });
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch assets');
        }

        output.print(response.data.map(asset => ({
          ID: asset.id,
          Name: asset.name,
          Type: asset.type,
          Status: asset.status,
          Location: `${asset.location.latitude}, ${asset.location.longitude}`,
          Created: asset.created_at
        })));

        process.exit(0);
      } catch (error) {
        output.error('Failed to list assets', error);
        handleError(error, opts.verbose);
      }
    });

  cities
    .command('metrics <city-id>')
    .description('Get city metrics')
    .requiredOption('-k, --kind <kind>', 'Metric kind (traffic, air_quality, energy, etc.)')
    .option('-f, --from <date>', 'Start date (ISO format)')
    .option('-t, --to <date>', 'End date (ISO format)')
    .option('-l, --limit <number>', 'Limit number of results', '100')
    .action(async (cityId: string, opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(cityId, 'city ID');

        const spinner = ora('Fetching city metrics...').start();
        const response = await client.get<CityMetrics[]>(`/api/cities/${cityId}/metrics`, {
          params: {
            kind: opts.kind,
            from: opts.from,
            to: opts.to,
            limit: opts.limit
          }
        });
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch metrics');
        }

        output.print(response.data.map(metric => ({
          Kind: metric.kind,
          Value: metric.value,
          Unit: metric.unit,
          Timestamp: metric.timestamp
        })));

        process.exit(0);
      } catch (error) {
        output.error('Failed to get metrics', error);
        handleError(error, opts.verbose);
      }
    });

  cities
    .command('alerts <city-id>')
    .description('Get city alerts')
    .option('-s, --severity <severity>', 'Filter by severity (info, warning, critical)')
    .option('-l, --limit <number>', 'Limit number of results', '50')
    .action(async (cityId: string, opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(cityId, 'city ID');

        const spinner = ora('Fetching city alerts...').start();
        const response = await client.get<CityAlert[]>(`/api/cities/${cityId}/alerts`, {
          params: { severity: opts.severity, limit: opts.limit }
        });
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch alerts');
        }

        output.print(response.data.map(alert => ({
          ID: alert.id,
          Severity: alert.severity,
          Type: alert.type,
          Message: alert.message,
          Created: alert.created_at,
          Resolved: alert.resolved_at || 'Active'
        })));

        process.exit(0);
      } catch (error) {
        output.error('Failed to get alerts', error);
        handleError(error, opts.verbose);
      }
    });

  return cities;
}
