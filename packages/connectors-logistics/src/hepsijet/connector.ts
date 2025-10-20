/**
 * HEPSİJET LOGISTICS CONNECTOR
 *
 * Vendor: Hepsijet (Hepsiburada logistics arm)
 * Status: partner_required
 * Auth: API Key
 * Base URL: https://api.hepsijet.com/v1
 * Rate Limit: 5 rps
 *
 * Features:
 * - Domestic shipping only (Turkey)
 * - Same-day delivery in major cities
 * - COD, Webhook support (HMAC-SHA256)
 * - Label format: PDF only
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { BaseLogisticsConnector } from '../base-connector';
import {
  CreateShipmentRequest,
  ShipmentResponse,
  GetTrackingRequest,
  TrackingResponse,
  CancelShipmentRequest,
  CancelShipmentResponse,
  TrackingEvent,
} from '../schema';

/**
 * Hepsijet configuration
 */
interface HepsijetConfig {
  api_key: string;
  merchant_id: string;
  webhook_secret?: string;
  base_url?: string;
}

/**
 * Hepsijet Connector
 */
export class HepsijetConnector extends BaseLogisticsConnector {
  private readonly client: AxiosInstance;
  private readonly config: HepsijetConfig;

  constructor(config: HepsijetConfig) {
    super('hepsijet', { requests_per_second: 5, burst_size: 10 });

    this.config = config;
    this.client = axios.create({
      baseURL: config.base_url || 'https://api.hepsijet.com/v1',
      timeout: 30000,
      headers: {
        'X-API-Key': config.api_key,
        'X-Merchant-ID': config.merchant_id,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create shipment
   */
  protected async doCreateShipment(request: CreateShipmentRequest): Promise<ShipmentResponse> {
    // Build Hepsijet shipment request
    const hepsijetRequest = {
      merchant_order_id: request.order_id,
      sender: {
        name: request.from.name,
        phone: request.from.phone,
        address: request.from.line1,
        district: request.from.city,
        city: request.from.state || request.from.city,
        postal_code: request.from.zip,
      },
      receiver: {
        name: request.to.name,
        phone: request.to.phone,
        address: request.to.line1,
        district: request.to.city,
        city: request.to.state || request.to.city,
        postal_code: request.to.zip,
      },
      parcel: {
        weight_kg: request.dims.weight_kg,
        length_cm: request.dims.length_cm,
        width_cm: request.dims.width_cm,
        height_cm: request.dims.height_cm,
        desi: this.calculateDesi(request.dims),
        content: 'Package',
      },
      service_type: this.getServiceType(request.options?.service_type || 'standard'),
      payment_type: request.options?.cod_enabled ? 'RECEIVER' : 'SENDER',
      cod_amount: request.options?.cod_amount || 0,
      declared_value: request.options?.insurance_value || 0,
    };

    const response = await this.client.post('/shipments', hepsijetRequest);

    const { tracking_number, label_url, shipping_fee } = response.data;

    return {
      shipment_id: tracking_number,
      tracking_no: tracking_number,
      status: 'label_ready',
      label_url: label_url,
      label_format: 'PDF',
      vendor: 'hepsijet',
      created_at: new Date().toISOString(),
      shipping_cost: shipping_fee,
      currency: 'TRY',
    };
  }

  /**
   * Get tracking information
   */
  protected async doGetTracking(request: GetTrackingRequest): Promise<TrackingResponse> {
    const response = await this.client.get(`/tracking/${request.tracking_no}`);

    const trackData = response.data;
    const events: TrackingEvent[] = (trackData.events || []).map((event: any) => ({
      timestamp: new Date(event.timestamp).toISOString(),
      status: this.mapHepsijetStatus(event.status_code),
      location: event.location || 'Unknown',
      description: event.description,
      description_tr: event.description_tr || event.description,
    }));

    const currentStatus = this.mapHepsijetStatus(trackData.current_status);
    const deliveredEvent = events.find((e) => e.status === 'delivered');

    return {
      tracking_no: request.tracking_no,
      vendor: 'hepsijet',
      status: currentStatus,
      events,
      delivered_at: deliveredEvent?.timestamp,
      delivered_to: trackData.delivered_to,
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Cancel shipment
   */
  protected async doCancelShipment(
    request: CancelShipmentRequest
  ): Promise<CancelShipmentResponse> {
    const cancelRequest = {
      tracking_number: request.tracking_no,
      reason: request.reason || 'Customer request',
    };

    const response = await this.client.post(
      `/shipments/${request.tracking_no}/cancel`,
      cancelRequest
    );

    const { refund_eligible } = response.data;

    return {
      tracking_no: request.tracking_no,
      vendor: 'hepsijet',
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      refund_eligible: refund_eligible === true,
      message: 'Gönderi iptal edildi',
    };
  }

  /**
   * Get label
   */
  protected async doGetLabel(
    tracking_no: string
  ): Promise<{ url: string; format: 'PDF' | 'ZPL' | 'GIF' }> {
    const response = await this.client.get(`/shipments/${tracking_no}/label`);

    return {
      url: response.data.label_url,
      format: 'PDF',
    };
  }

  /**
   * Verify webhook signature (HMAC-SHA256)
   */
  public verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string,
    nonce: string
  ): boolean {
    if (!this.config.webhook_secret) {
      throw new Error('Webhook secret not configured');
    }

    // Check timestamp (max 5 minutes old)
    const requestAge = Date.now() - parseInt(timestamp);
    if (requestAge > 300000) {
      return false;
    }

    // Compute expected signature
    const message = `${timestamp}|${nonce}|${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhook_secret)
      .update(message)
      .digest('hex');

    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Calculate desi (volumetric weight) for Turkish carriers
   * Formula: (length * width * height) / 3000
   */
  private calculateDesi(dims: { length_cm: number; width_cm: number; height_cm: number }): number {
    return (dims.length_cm * dims.width_cm * dims.height_cm) / 3000;
  }

  /**
   * Get Hepsijet service type
   */
  private getServiceType(serviceType: string): string {
    const mapping: Record<string, string> = {
      standard: 'STANDARD',
      express: 'EXPRESS',
      same_day: 'SAME_DAY',
    };
    return mapping[serviceType] || 'STANDARD';
  }

  /**
   * Map Hepsijet status code to unified status
   */
  private mapHepsijetStatus(hepsijetCode: string): string {
    const mapping: Record<string, string> = {
      CREATED: 'created',
      LABEL_READY: 'label_ready',
      PICKED_UP: 'picked_up',
      IN_TRANSIT: 'in_transit',
      OUT_FOR_DELIVERY: 'out_for_delivery',
      DELIVERED: 'delivered',
      EXCEPTION: 'exception',
      CANCELED: 'canceled',
    };
    return mapping[hepsijetCode] || 'in_transit';
  }
}
