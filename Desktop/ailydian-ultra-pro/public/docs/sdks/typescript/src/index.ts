/**
 * @lydian/sdk - Official TypeScript/JavaScript SDK for Lydian AI Platform
 * @version 1.0.0
 */

import { LydianClient } from './client';
import { SmartCitiesClient } from './smart-cities';
import { InsanIQClient } from './insan-iq';
import { LydianIQClient } from './lydian-iq';
import { LydianConfig, OAuth2Config } from './types';

/**
 * Main SDK class
 */
export class Lydian {
  private client: LydianClient;

  public readonly smartCities: SmartCitiesClient;
  public readonly insanIQ: InsanIQClient;
  public readonly lydianIQ: LydianIQClient;

  constructor(config: LydianConfig = {}) {
    this.client = new LydianClient(config);

    this.smartCities = new SmartCitiesClient(this.client);
    this.insanIQ = new InsanIQClient(this.client);
    this.lydianIQ = new LydianIQClient(this.client);
  }

  /**
   * Authenticate with OAuth2
   */
  async authenticateOAuth2(config: OAuth2Config): Promise<void> {
    await this.client.authenticateOAuth2(config);
  }
}

// Export all types
export * from './types';
export * from './client';
export * from './utils';
export { SmartCitiesClient } from './smart-cities';
export { InsanIQClient } from './insan-iq';
export { LydianIQClient } from './lydian-iq';

// Default export
export default Lydian;
