/**
 * Configuration Manager
 * Handles reading/writing CLI configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as yaml from 'yaml';
import { LydianConfig, ProfileConfig, GlobalSettings } from '../types';

const CONFIG_DIR = path.join(os.homedir(), '.lydian');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.yaml');

const DEFAULT_CONFIG: LydianConfig = {
  current_profile: 'production',
  profiles: {
    development: {
      endpoint: 'https://dev.api.lydian.com',
      auth_method: 'apikey'
    },
    staging: {
      endpoint: 'https://staging.api.lydian.com',
      auth_method: 'oauth2'
    },
    production: {
      endpoint: 'https://api.lydian.com',
      auth_method: 'oauth2'
    }
  },
  settings: {
    timeout: 30000,
    retry: 3,
    output_format: 'table',
    color: true
  }
};

export class ConfigManager {
  private config: LydianConfig | null = null;

  /**
   * Initialize configuration directory and file
   */
  async init(): Promise<void> {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    }

    if (!fs.existsSync(CONFIG_FILE)) {
      await this.save(DEFAULT_CONFIG);
      // Set secure permissions
      fs.chmodSync(CONFIG_FILE, 0o600);
    }
  }

  /**
   * Load configuration from file
   */
  async load(): Promise<LydianConfig> {
    if (this.config) {
      return this.config;
    }

    await this.init();

    try {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      this.config = yaml.parse(content) as LydianConfig;
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load config: ${error}`);
    }
  }

  /**
   * Save configuration to file
   */
  async save(config: LydianConfig): Promise<void> {
    try {
      const content = yaml.stringify(config);
      fs.writeFileSync(CONFIG_FILE, content, { mode: 0o600 });
      this.config = config;
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  /**
   * Get current profile configuration
   */
  async getCurrentProfile(): Promise<{ name: string; config: ProfileConfig }> {
    const config = await this.load();
    const name = config.current_profile;
    const profileConfig = config.profiles[name];

    if (!profileConfig) {
      throw new Error(`Profile '${name}' not found`);
    }

    return { name, config: profileConfig };
  }

  /**
   * Switch to a different profile
   */
  async switchProfile(profileName: string): Promise<void> {
    const config = await this.load();

    if (!config.profiles[profileName]) {
      throw new Error(`Profile '${profileName}' does not exist`);
    }

    config.current_profile = profileName;
    await this.save(config);
  }

  /**
   * Get a configuration value
   */
  async get(key: string, profileName?: string): Promise<any> {
    const config = await this.load();
    const profile = profileName || config.current_profile;

    const parts = key.split('.');

    if (parts[0] === 'profiles' && parts[1]) {
      let value: any = config.profiles[parts[1]];
      for (let i = 2; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    }

    if (parts[0] === 'settings') {
      let value: any = config.settings;
      for (let i = 1; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    }

    return config.profiles[profile]?.[key];
  }

  /**
   * Set a configuration value
   */
  async set(key: string, value: any, profileName?: string): Promise<void> {
    const config = await this.load();
    const profile = profileName || config.current_profile;

    const parts = key.split('.');

    if (parts[0] === 'settings') {
      let obj: any = config.settings;
      for (let i = 1; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    } else {
      if (!config.profiles[profile]) {
        config.profiles[profile] = {
          endpoint: 'https://api.lydian.com',
          auth_method: 'oauth2'
        };
      }
      config.profiles[profile][key as keyof ProfileConfig] = value;
    }

    await this.save(config);
  }

  /**
   * List all configuration
   */
  async list(): Promise<LydianConfig> {
    return await this.load();
  }

  /**
   * Get global settings
   */
  async getSettings(): Promise<GlobalSettings> {
    const config = await this.load();
    return config.settings;
  }

  /**
   * Update global settings
   */
  async updateSettings(settings: Partial<GlobalSettings>): Promise<void> {
    const config = await this.load();
    config.settings = { ...config.settings, ...settings };
    await this.save(config);
  }

  /**
   * Get config file path
   */
  getConfigPath(): string {
    return CONFIG_FILE;
  }

  /**
   * Check if config exists
   */
  exists(): boolean {
    return fs.existsSync(CONFIG_FILE);
  }

  /**
   * Delete configuration
   */
  async delete(): Promise<void> {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
      this.config = null;
    }
  }
}

export const configManager = new ConfigManager();
