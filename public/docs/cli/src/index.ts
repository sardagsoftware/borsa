#!/usr/bin/env node

/**
 * LyDian CLI - Main Entry Point
 * Command-line interface for LyDian Enterprise Platform
 */

import { Command } from 'commander';
import * as chalk from 'chalk';
import { createAuthCommand } from './commands/auth';
import { createConfigCommand } from './commands/config';
import { createApiKeyCommand } from './commands/apikey';
import { createCitiesCommand } from './commands/cities';
import { createPersonasCommand } from './commands/personas';
import { createSignalsCommand } from './commands/signals';
import { createModulesCommand } from './commands/modules';
import { configManager } from './lib/config';
import { handleError } from './lib/errors';
import { GlobalOptions } from './types';

const packageJson = require('../package.json');

const program = new Command();

// Global configuration
let globalOptions: GlobalOptions = {};

program
  .name('lydian')
  .description('LyDian Enterprise Platform CLI - Manage your LyDian services from the command line')
  .version(packageJson.version, '-v, --version', 'Output the current version')
  .option('--verbose', 'Enable verbose output')
  .option('--json', 'Output as JSON')
  .option('--yaml', 'Output as YAML')
  .option('--silent', 'Suppress all output')
  .option('--timeout <ms>', 'Request timeout in milliseconds', '30000')
  .option('--retry <count>', 'Number of retry attempts', '3')
  .option('--profile <name>', 'Use specific configuration profile')
  .hook('preAction', (thisCommand, actionCommand) => {
    // Extract global options
    const opts = program.opts();
    globalOptions = {
      verbose: opts.verbose,
      json: opts.json,
      yaml: opts.yaml,
      silent: opts.silent,
      timeout: parseInt(opts.timeout, 10),
      retry: parseInt(opts.retry, 10),
      profile: opts.profile
    };

    // Apply profile if specified
    if (opts.profile) {
      configManager.switchProfile(opts.profile).catch(err => {
        console.error(chalk.red(`Failed to switch to profile '${opts.profile}': ${err.message}`));
        process.exit(1);
      });
    }

    // Pass global options to all subcommands
    actionCommand.opts = () => ({ ...actionCommand.opts(), ...globalOptions });
  });

// Add commands
program.addCommand(createAuthCommand());
program.addCommand(createConfigCommand());
program.addCommand(createApiKeyCommand());
program.addCommand(createCitiesCommand());
program.addCommand(createPersonasCommand());
program.addCommand(createSignalsCommand());
program.addCommand(createModulesCommand());

// Add completion command
program
  .command('completion <shell>')
  .description('Generate shell completion script')
  .argument('<shell>', 'Shell type (bash, zsh, fish, powershell)')
  .action((shell: string) => {
    const completions: Record<string, string> = {
      bash: require('../completions/bash.sh'),
      zsh: require('../completions/zsh.sh'),
      fish: require('../completions/fish.sh'),
      powershell: require('../completions/powershell.ps1')
    };

    if (completions[shell]) {
      console.log(completions[shell]);
    } else {
      console.error(chalk.red(`Unknown shell: ${shell}`));
      console.error(`Supported shells: ${Object.keys(completions).join(', ')}`);
      process.exit(1);
    }
  });

// Add help examples
program.addHelpText('after', `
${chalk.bold('Examples:')}

  ${chalk.cyan('Authentication:')}
    $ lydian auth login              ${chalk.gray('# Login with OAuth2')}
    $ lydian auth whoami              ${chalk.gray('# Show current user')}

  ${chalk.cyan('Configuration:')}
    $ lydian config init              ${chalk.gray('# Initialize config')}
    $ lydian config set endpoint https://api.lydian.com
    $ lydian config get endpoint      ${chalk.gray('# Get config value')}

  ${chalk.cyan('API Keys:')}
    $ lydian apikey create --name "My Key" --scopes "cities:read,cities:write"
    $ lydian apikey list              ${chalk.gray('# List all API keys')}

  ${chalk.cyan('Smart Cities:')}
    $ lydian cities create --name "Istanbul" --country "Turkey" --population 15462452
    $ lydian cities list --limit 10
    $ lydian cities metrics --city-id city_123 --kind traffic

  ${chalk.cyan('Personas (Insan-IQ):')}
    $ lydian personas create --name "John Doe" --type customer
    $ lydian personas skills persona_123 --add "JavaScript"

  ${chalk.cyan('Signals (LyDian-IQ):')}
    $ lydian signals send --type metric --data '{"temperature": 25.5}'
    $ lydian signals insights signal_789
    $ lydian signals kg --query "temperature > 30"

  ${chalk.cyan('Output Formats:')}
    $ lydian cities list --json      ${chalk.gray('# JSON output')}
    $ lydian cities list --yaml      ${chalk.gray('# YAML output')}
    $ lydian cities list --verbose   ${chalk.gray('# Verbose output')}

${chalk.bold('Documentation:')}
  https://lydian.com/docs/cli

${chalk.bold('Support:')}
  https://lydian.com/support
  support@lydian.com
`);

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`\nUnknown command: ${program.args.join(' ')}`));
  console.log(`\nRun ${chalk.cyan('lydian --help')} to see available commands\n`);
  process.exit(1);
});

// Error handling
process.on('uncaughtException', (error) => {
  handleError(error, globalOptions.verbose);
});

process.on('unhandledRejection', (error) => {
  handleError(error, globalOptions.verbose);
});

// Parse arguments
program.parse(process.argv);

// Show help if no arguments
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
