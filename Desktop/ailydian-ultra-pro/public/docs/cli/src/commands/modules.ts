/**
 * Modules Commands
 */

import { Command } from 'commander';
import * as ora from 'ora';
import { client } from '../lib/client';
import { authManager } from '../lib/auth';
import { createFormatter } from '../lib/output';
import { handleError, validateRequired } from '../lib/errors';
import { GlobalOptions, Module } from '../types';

export function createModulesCommand(): Command {
  const modules = new Command('modules')
    .description('Manage platform modules');

  modules
    .command('list')
    .description('List all available modules')
    .option('--status <status>', 'Filter by status (active, inactive, deprecated)')
    .action(async (opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        const spinner = ora('Fetching modules...').start();
        const response = await client.get<Module[]>('/api/modules', {
          params: { status: opts.status }
        });
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch modules');
        }

        output.print(response.data.map(module => ({
          ID: module.id,
          Name: module.name,
          Version: module.version,
          Status: module.status,
          Capabilities: module.capabilities.length,
          Description: module.description
        })));

        process.exit(0);
      } catch (error) {
        output.error('Failed to list modules', error);
        handleError(error, opts.verbose);
      }
    });

  modules
    .command('info <module-id>')
    .description('Get detailed module information')
    .action(async (moduleId: string, opts: GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        await authManager.requireAuth();
        await client.init();

        validateRequired(moduleId, 'module ID');

        const spinner = ora('Fetching module details...').start();
        const response = await client.get<Module>(`/api/modules/${moduleId}`);
        spinner.stop();

        if (!response.success || !response.data) {
          throw new Error('Failed to fetch module');
        }

        const module = response.data;

        if (opts.json || opts.yaml) {
          output.print(module);
        } else {
          output.header('Module Information');
          output.keyValue('ID', module.id);
          output.keyValue('Name', module.name);
          output.keyValue('Version', module.version);
          output.keyValue('Status', module.status);
          output.keyValue('Description', module.description);

          output.divider();
          output.header('Capabilities');
          module.capabilities.forEach(cap => console.log(`  • ${cap}`));

          output.divider();
          output.header('Endpoints');
          Object.entries(module.endpoints).forEach(([key, value]) => {
            output.keyValue(key, value);
          });

          if (module.documentation_url) {
            output.divider();
            output.keyValue('Documentation', module.documentation_url);
          }
        }

        process.exit(0);
      } catch (error) {
        output.error('Failed to get module information', error);
        handleError(error, opts.verbose);
      }
    });

  return modules;
}
