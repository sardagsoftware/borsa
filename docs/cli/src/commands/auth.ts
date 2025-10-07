/**
 * Authentication Commands
 */

import { Command } from 'commander';
import * as ora from 'ora';
import { authManager } from '../lib/auth';
import { client } from '../lib/client';
import { createFormatter } from '../lib/output';
import { handleError } from '../lib/errors';
import { GlobalOptions } from '../types';

export function createAuthCommand(): Command {
  const auth = new Command('auth')
    .description('Manage authentication');

  auth
    .command('login')
    .description('Authenticate with LyDian platform using OAuth2 device flow')
    .action(async (options: GlobalOptions) => {
      const output = createFormatter(options);

      try {
        output.info('Starting authentication...');
        const userInfo = await authManager.login();

        output.success('Successfully authenticated!');
        output.header('User Information');
        output.keyValue('ID', userInfo.id);
        output.keyValue('Name', userInfo.name);
        output.keyValue('Email', userInfo.email);
        if (userInfo.organization) {
          output.keyValue('Organization', userInfo.organization);
        }
        output.keyValue('Roles', userInfo.roles.join(', '));

        process.exit(0);
      } catch (error) {
        output.error('Authentication failed', error);
        handleError(error, options.verbose);
      }
    });

  auth
    .command('logout')
    .description('Sign out and clear credentials')
    .action(async (options: GlobalOptions) => {
      const output = createFormatter(options);

      try {
        const spinner = ora('Signing out...').start();
        await authManager.logout();
        spinner.stop();

        output.success('Successfully signed out');
        process.exit(0);
      } catch (error) {
        output.error('Logout failed', error);
        handleError(error, options.verbose);
      }
    });

  auth
    .command('whoami')
    .description('Display current user information')
    .action(async (options: GlobalOptions) => {
      const output = createFormatter(options);

      try {
        await authManager.requireAuth();
        await client.init();

        const spinner = ora('Fetching user information...').start();
        const userInfo = await authManager.getCurrentUser();
        spinner.stop();

        output.print(userInfo);
        process.exit(0);
      } catch (error) {
        output.error('Failed to get user information', error);
        handleError(error, options.verbose);
      }
    });

  auth
    .command('refresh')
    .description('Refresh authentication token')
    .action(async (options: GlobalOptions) => {
      const output = createFormatter(options);

      try {
        const spinner = ora('Refreshing token...').start();
        await authManager.refreshToken();
        await client.init();
        spinner.stop();

        output.success('Token refreshed successfully');
        process.exit(0);
      } catch (error) {
        output.error('Failed to refresh token', error);
        handleError(error, options.verbose);
      }
    });

  return auth;
}
