/**
 * Output Formatters
 * Handles formatting and displaying CLI output
 */

import * as chalk from 'chalk';
import * as yaml from 'yaml';
import Table from 'cli-table3';
import { GlobalOptions } from '../types';

export class OutputFormatter {
  private options: GlobalOptions;

  constructor(options: GlobalOptions = {}) {
    this.options = options;
  }

  /**
   * Print data in the appropriate format
   */
  print(data: any, headers?: string[]): void {
    if (this.options.silent) {
      return;
    }

    if (this.options.json) {
      this.printJson(data);
    } else if (this.options.yaml) {
      this.printYaml(data);
    } else {
      this.printTable(data, headers);
    }
  }

  /**
   * Print as JSON
   */
  private printJson(data: any): void {
    const json = JSON.stringify(data, null, 2);
    if (this.options.color !== false) {
      console.log(this.colorizeJson(json));
    } else {
      console.log(json);
    }
  }

  /**
   * Print as YAML
   */
  private printYaml(data: any): void {
    console.log(yaml.stringify(data, { indent: 2 }));
  }

  /**
   * Print as table
   */
  private printTable(data: any, headers?: string[]): void {
    if (Array.isArray(data)) {
      if (data.length === 0) {
        this.info('No results found');
        return;
      }

      const keys = headers || Object.keys(data[0]);
      const table = new Table({
        head: keys.map(k => chalk.cyan(k)),
        style: {
          head: [],
          border: ['grey']
        }
      });

      data.forEach(item => {
        const row = keys.map(key => {
          const value = item[key];
          if (value === null || value === undefined) return '-';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value);
        });
        table.push(row);
      });

      console.log(table.toString());
    } else if (typeof data === 'object') {
      const table = new Table({
        style: {
          border: ['grey']
        }
      });

      Object.entries(data).forEach(([key, value]) => {
        table.push([
          chalk.cyan(key),
          value === null || value === undefined ? '-' :
          typeof value === 'object' ? JSON.stringify(value, null, 2) :
          String(value)
        ]);
      });

      console.log(table.toString());
    } else {
      console.log(data);
    }
  }

  /**
   * Colorize JSON output
   */
  private colorizeJson(json: string): string {
    return json
      .replace(/"([^"]+)":/g, (_, key) => `${chalk.cyan(`"${key}":`)}`)
      .replace(/: "([^"]*)"/g, (_, value) => `: ${chalk.green(`"${value}"`)}`)
      .replace(/: (\d+)/g, (_, num) => `: ${chalk.yellow(num)}`)
      .replace(/: (true|false)/g, (_, bool) => `: ${chalk.magenta(bool)}`)
      .replace(/: null/g, `: ${chalk.gray('null')}`);
  }

  /**
   * Print success message
   */
  success(message: string): void {
    if (!this.options.silent) {
      console.log(chalk.green('✓'), message);
    }
  }

  /**
   * Print error message
   */
  error(message: string, error?: any): void {
    console.error(chalk.red('✗'), message);
    if (this.options.verbose && error) {
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      } else if (error.details) {
        console.error(chalk.gray(JSON.stringify(error.details, null, 2)));
      }
    }
  }

  /**
   * Print warning message
   */
  warn(message: string): void {
    if (!this.options.silent) {
      console.warn(chalk.yellow('⚠'), message);
    }
  }

  /**
   * Print info message
   */
  info(message: string): void {
    if (!this.options.silent) {
      console.log(chalk.blue('ℹ'), message);
    }
  }

  /**
   * Print verbose message
   */
  verbose(message: string): void {
    if (this.options.verbose && !this.options.silent) {
      console.log(chalk.gray('→'), message);
    }
  }

  /**
   * Print a section header
   */
  header(message: string): void {
    if (!this.options.silent) {
      console.log();
      console.log(chalk.bold.white(message));
      console.log(chalk.gray('─'.repeat(message.length)));
    }
  }

  /**
   * Print a divider
   */
  divider(): void {
    if (!this.options.silent) {
      console.log(chalk.gray('─'.repeat(50)));
    }
  }

  /**
   * Print key-value pair
   */
  keyValue(key: string, value: any): void {
    if (!this.options.silent) {
      const formattedValue = typeof value === 'object' ?
        JSON.stringify(value, null, 2) :
        String(value);
      console.log(`${chalk.cyan(key + ':')} ${formattedValue}`);
    }
  }
}

/**
 * Create an output formatter with options
 */
export function createFormatter(options: GlobalOptions = {}): OutputFormatter {
  return new OutputFormatter(options);
}
