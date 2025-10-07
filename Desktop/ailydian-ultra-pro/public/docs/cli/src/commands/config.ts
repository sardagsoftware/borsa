/**
 * Configuration Commands
 */

import { Command } from 'commander';
import { configManager } from '../lib/config';
import { createFormatter } from '../lib/output';
import { handleError, validateRequired } from '../lib/errors';
import { GlobalOptions } from '../types';

export function createConfigCommand(): Command {
  const config = new Command('config')
    .description('Manage CLI configuration');

  config
    .command('init')
    .description('Initialize configuration with default values')
    .option('--force', 'Overwrite existing configuration')
    .action(async (opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        const exists = configManager.exists();

        if (exists && !opts.force) {
          output.warn('Configuration already exists. Use --force to overwrite.');
          output.info(`Config location: ${configManager.getConfigPath()}`);
          process.exit(0);
        }

        await configManager.init();
        output.success('Configuration initialized');
        output.info(`Config location: ${configManager.getConfigPath()}`);
        process.exit(0);
      } catch (error) {
        output.error('Failed to initialize configuration', error);
        handleError(error, opts.verbose);
      }
    });

  config
    .command('set <key> <value>')
    .description('Set a configuration value')
    .option('-p, --profile <profile>', 'Profile to update')
    .action(async (key: string, value: string, opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        validateRequired(key, 'key');
        validateRequired(value, 'value');

        // Parse value (handle booleans and numbers)
        let parsedValue: any = value;
        if (value === 'true') parsedValue = true;
        else if (value === 'false') parsedValue = false;
        else if (!isNaN(Number(value))) parsedValue = Number(value);

        await configManager.set(key, parsedValue, opts.profile);
        output.success(`Set ${key} = ${parsedValue}`);
        process.exit(0);
      } catch (error) {
        output.error('Failed to set configuration', error);
        handleError(error, opts.verbose);
      }
    });

  config
    .command('get <key>')
    .description('Get a configuration value')
    .option('-p, --profile <profile>', 'Profile to query')
    .action(async (key: string, opts: any & GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        validateRequired(key, 'key');

        const value = await configManager.get(key, opts.profile);

        if (value === undefined) {
          output.warn(`Configuration key '${key}' not found`);
          process.exit(1);
        }

        if (opts.json || opts.yaml) {
          output.print({ [key]: value });
        } else {
          console.log(value);
        }
        process.exit(0);
      } catch (error) {
        output.error('Failed to get configuration', error);
        handleError(error, opts.verbose);
      }
    });

  config
    .command('list')
    .description('List all configuration')
    .action(async (opts: GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        const allConfig = await configManager.list();
        output.print(allConfig);
        process.exit(0);
      } catch (error) {
        output.error('Failed to list configuration', error);
        handleError(error, opts.verbose);
      }
    });

  config
    .command('profile <name>')
    .description('Switch to a different profile')
    .action(async (name: string, opts: GlobalOptions) => {
      const output = createFormatter(opts);

      try {
        validateRequired(name, 'profile name');
        await configManager.switchProfile(name);
        output.success(`Switched to profile: ${name}`);
        process.exit(0);
      } catch (error) {
        output.error('Failed to switch profile', error);
        handleError(error, opts.verbose);
      }
    });

  config
    .command('path')
    .description('Show configuration file path')
    .action((opts: GlobalOptions) => {
      const output = createFormatter(opts);
      console.log(configManager.getConfigPath());
      process.exit(0);
    });

  return config;
}
