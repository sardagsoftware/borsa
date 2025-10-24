/**
 * API Key Commands
 */

import { Command } from 'commander';
import * as ora from 'ora';
import { client } from '../lib/client';
import { authManager } from '../lib/auth';
import { createFormatter } from '../lib/output';
import { handleError, validateRequired } from '../lib/errors';
import { GlobalOptions, ApiKey, CreateApiKeyRequest, CreateApiKeyResponse } from '../types';

export function createApiKeyCommand(): Command {
  const apikey = new Command('apikey')
    .description('Manage API keys');

  apikey
    .command('create')
    .description('Create a new API key')
    .requiredOption('-n, --name <name>', 'API key name')
    .requiredOption('-s, --scopes <scopes>', 'Comma-separated list of scopes')
    .option('-e, --expires-in <days>', 'Expiration in days', '365')
    .action(async (opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(opts.name, 'name');
        validateRequired(opts.scopes, 'scopes');

        const scopes = opts.scopes.split(',').map((s: string) => s.trim());
        const expiresIn = parseInt(opts.expiresIn, 10);

        const request: CreateApiKeyRequest = {
          name: opts.name,
          scopes,
          expires_in: expiresIn * 24 * 60 * 60
        };

        const spinner = ora('Creating API key...').start();
        const response = await client.post<CreateApiKeyResponse>('/api/keys', request);
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to create API key');
        }

        output.success('API key created successfully');
        output.warn('⚠ Save this API key now. You won\'t be able to see it again!');
        output.header('API Key Details');
        output.keyValue('ID', response.data.id);
        output.keyValue('Name', response.data.name);
        output.keyValue('API Key', response.data.api_key);
        output.keyValue('Scopes', response.data.scopes.join(', '));
        if (response.data.expires_at) {
          output.keyValue('Expires', response.data.expires_at);
        }

        process.exit(0);
      } catch (error) {
        output.error('Failed to create API key', error);
        handleError(error, opts.verbose);
      }
    });

  apikey
    .command('list')
    .description('List all API keys')
    .option('-l, --limit <number>', 'Limit number of results', '20')
    .action(async (opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        const spinner = ora('Fetching API keys...').start();
        const response = await client.get<ApiKey[]>('/api/keys', {
          params: { limit: opts.limit }
        });
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch API keys');
        }

        output.print(response.data.map(key => ({
          ID: key.id,
          Name: key.name,
          Prefix: key.key_prefix,
          Scopes: key.scopes.join(', '),
          Status: key.status,
          Created: key.created_at,
          'Last Used': key.last_used_at || 'Never'
        })));

        process.exit(0);
      } catch (error) {
        output.error('Failed to list API keys', error);
        handleError(error, opts.verbose);
      }
    });

  apikey
    .command('revoke <key-id>')
    .description('Revoke an API key')
    .action(async (keyId: string, opts: GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(keyId, 'key ID');

        const spinner = ora('Revoking API key...').start();
        const response = await client.delete(`/api/keys/${keyId}`);
        spinner.stop();

        if (!response.success) {
          throw new Error('Failed to revoke API key');
        }

        output.success(`API key ${keyId} revoked successfully`);
        process.exit(0);
      } catch (error) {
        output.error('Failed to revoke API key', error);
        handleError(error, opts.verbose);
      }
    });

  apikey
    .command('info <key-id>')
    .description('Get API key information')
    .action(async (keyId: string, opts: GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(keyId, 'key ID');

        const spinner = ora('Fetching API key details...').start();
        const response = await client.get<ApiKey>(`/api/keys/${keyId}`);
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch API key');
        }

        output.print(response.data);
        process.exit(0);
      } catch (error) {
        output.error('Failed to get API key information', error);
        handleError(error, opts.verbose);
      }
    });

  return apikey;
}
