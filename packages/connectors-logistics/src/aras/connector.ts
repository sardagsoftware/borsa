/**
 * ARAS KARGO LOGISTICS CONNECTOR
 *
 * Vendor: Aras Kargo (Turkey's largest cargo company)
 * Status: partner_required
 * Auth: API Key
 * Base URL: https://api.araskargo.com.tr/v1
 * Rate Limit: 5 rps
 *
 * Features:
 * - Domestic shipping only
 * - COD (Cash on Delivery)
 * - Insurance
 * - Webhook support (HMAC-SHA256)
 * - Label formats: PDF, ZPL
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
 * Aras Kargo configuration
 */
interface ArasConfig {
  api_key: string;
  partner_id: string;
  webhook_secret?: string; // For HMAC verification
  base_url?: string;
}

/**
 * Aras Connector
 */
export class ArasConnector extends BaseLogisticsConnector {
  private readonly client: AxiosInstance;
  private readonly config: ArasConfig;

  constructor(config: ArasConfig) {
    super('aras', { requests_per_second: 5, burst_size: 10 });

    this.config = config;
    this.client = axios.create({
      baseURL: config.base_url || 'https://api.araskargo.com.tr/v1',
      timeout: 30000,
      headers: {
        'X-API-Key': config.api_key,
        'X-Partner-ID': config.partner_id,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create shipment
   */
  protected async doCreateShipment(request: CreateShipmentRequest): Promise<ShipmentResponse> {
    // Build Aras shipment request
    const arasRequest = {
      referans_no: request.order_id,
      gondericibilgileri: {
        adsoyad: request.from.name,
        telefon: request.from.phone,
        adres: request.from.line1,
        ilce: request.from.city,
        il: request.from.state || request.from.city,
        posta_kodu: request.from.zip,
      },
      alicibilgileri: {
        adsoyad: request.to.name,
        telefon: request.to.phone,
        adres: request.to.line1,
        ilce: request.to.city,
        il: request.to.state || request.to.city,
        posta_kodu: request.to.zip,
      },
      gonderibilgileri: {
        agirlik: request.dims.weight_kg,
        desi: this.calculateDesi(request.dims),
        icerik: 'Package',
      },
      hizmet_turu: this.getServiceType(request.options?.service_type || 'standard'),
      odeme_sekli: request.options?.cod_enabled ? 'alici_odemeli' : 'gonderici_odemeli',
      tahsilat_tutari: request.options?.cod_amount || 0,
      sigorta_tutari: request.options?.insurance_value || 0,
    };

    const response = await this.client.post('/shipments', arasRequest);

    const { takip_no, etiket_url, fiyat } = response.data;

    return {
      shipment_id: takip_no,
      tracking_no: takip_no,
      status: 'label_ready',
      label_url: etiket_url,
      label_format: 'PDF',
      vendor: 'aras',
      created_at: new Date().toISOString(),
      shipping_cost: fiyat,
      currency: 'TRY',
    };
  }

  /**
   * Get tracking information
   */
  protected async doGetTracking(request: GetTrackingRequest): Promise<TrackingResponse> {
    const response = await this.client.get(`/tracking/${request.tracking_no}`);

    const trackData = response.data;
    const events: TrackingEvent[] = (trackData.hareketler || []).map((hareket: any) => ({
      timestamp: new Date(hareket.tarih).toISOString(),
      status: this.mapArasStatus(hareket.durum_kodu),
      location: hareket.sube || hareket.il || 'Unknown',
      description: hareket.aciklama,
      description_tr: hareket.aciklama,
    }));

    const currentStatus = this.mapArasStatus(trackData.son_durum_kodu);
    const deliveredEvent = events.find((e) => e.status === 'delivered');

    return {
      tracking_no: request.tracking_no,
      vendor: 'aras',
      status: currentStatus,
      events,
      delivered_at: deliveredEvent?.timestamp,
      delivered_to: trackData.teslim_alan,
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Cancel shipment
   */
  protected async doCancelShipment(
    request: CancelShipmentRequest
  ): Promise<CancelShipmentResponse> {
    const arasRequest = {
      takip_no: request.tracking_no,
      iptal_nedeni: request.reason || 'Customer request',
    };

    const response = await this.client.post(
      `/shipments/${request.tracking_no}/cancel`,
      arasRequest
    );

    const { iade_uygun } = response.data;

    return {
      tracking_no: request.tracking_no,
      vendor: 'aras',
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      refund_eligible: iade_uygun === true,
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
      url: response.data.etiket_url,
      format: response.data.format || 'PDF',
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
   * Get Aras service type
   */
  private getServiceType(serviceType: string): string {
    const mapping: Record<string, string> = {
      standard: 'standart',
      express: 'hizli',
      same_day: 'ayni_gun',
    };
    return mapping[serviceType] || 'standart';
  }

  /**
   * Map Aras status code to unified status
   */
  private mapArasStatus(arasCode: string): string {
    const mapping: Record<string, string> = {
      '10': 'created',
      '20': 'label_ready',
      '30': 'picked_up',
      '40': 'in_transit',
      '50': 'out_for_delivery',
      '60': 'delivered',
      '70': 'exception',
      '80': 'canceled',
    };
    return mapping[arasCode] || 'in_transit';
  }
}
