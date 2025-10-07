import { LydianClient } from './client';
import { City, CityAsset, CityMetrics, Alert, PaginatedResponse, PaginationParams } from './types';

/**
 * Smart Cities API client
 */
export class SmartCitiesClient {
  constructor(private client: LydianClient) {}

  /**
   * Create a new city
   */
  async createCity(data: Omit<City, 'id' | 'createdAt' | 'updatedAt'>): Promise<City> {
    return this.client.request<City>('POST', '/smart-cities/cities', { body: data });
  }

  /**
   * Get city by ID
   */
  async getCity(cityId: string): Promise<City> {
    return this.client.request<City>('GET', `/smart-cities/cities/${cityId}`);
  }

  /**
   * List all cities with pagination
   */
  async listCities(params?: PaginationParams): Promise<PaginatedResponse<City>> {
    return this.client.request<PaginatedResponse<City>>('GET', '/smart-cities/cities', {
      query: params,
    });
  }

  /**
   * Update city
   */
  async updateCity(cityId: string, data: Partial<City>): Promise<City> {
    return this.client.request<City>('PATCH', `/smart-cities/cities/${cityId}`, { body: data });
  }

  /**
   * Delete city
   */
  async deleteCity(cityId: string): Promise<void> {
    await this.client.request<void>('DELETE', `/smart-cities/cities/${cityId}`);
  }

  /**
   * Create city asset
   */
  async createAsset(data: Omit<CityAsset, 'id' | 'createdAt' | 'updatedAt'>): Promise<CityAsset> {
    return this.client.request<CityAsset>('POST', '/smart-cities/assets', { body: data });
  }

  /**
   * List city assets
   */
  async listAssets(cityId: string, params?: PaginationParams): Promise<PaginatedResponse<CityAsset>> {
    return this.client.request<PaginatedResponse<CityAsset>>('GET', `/smart-cities/cities/${cityId}/assets`, {
      query: params,
    });
  }

  /**
   * Get city metrics
   */
  async getMetrics(cityId: string, startDate?: string, endDate?: string): Promise<CityMetrics[]> {
    return this.client.request<CityMetrics[]>('GET', `/smart-cities/cities/${cityId}/metrics`, {
      query: { startDate, endDate },
    });
  }

  /**
   * Create alert
   */
  async createAlert(data: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    return this.client.request<Alert>('POST', '/smart-cities/alerts', { body: data });
  }

  /**
   * List alerts
   */
  async listAlerts(cityId: string, params?: PaginationParams & { status?: string; severity?: string }): Promise<PaginatedResponse<Alert>> {
    return this.client.request<PaginatedResponse<Alert>>('GET', `/smart-cities/cities/${cityId}/alerts`, {
      query: params,
    });
  }

  /**
   * Update alert status
   */
  async updateAlert(alertId: string, status: 'acknowledged' | 'resolved'): Promise<Alert> {
    return this.client.request<Alert>('PATCH', `/smart-cities/alerts/${alertId}`, {
      body: { status },
    });
  }
}
