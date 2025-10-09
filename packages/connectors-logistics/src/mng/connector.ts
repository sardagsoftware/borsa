/**
 * MNG KARGO LOGISTICS CONNECTOR
 *
 * Vendor: MNG Kargo
 * Status: partner_required
 * Auth: API Key
 * Base URL: https://api.mngkargo.com.tr/v1
 * Rate Limit: 5 rps
 *
 * Features:
 * - Domestic & International shipping
 * - COD, Insurance, Webhook support (HMAC-SHA256)
 * - Label formats: PDF, ZPL
 * - Branch network across Turkey
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
 * MNG Kargo configuration
 */
interface MNGConfig {
  api_key: string;
  customer_code: string; // MNG müşteri kodu
  webhook_secret?: string;
  base_url?: string;
}

/**
 * MNG Connector
 */
export class MNGConnector extends BaseLogisticsConnector {
  private readonly client: AxiosInstance;
  private readonly config: MNGConfig;

  constructor(config: MNGConfig) {
    super('mng', { requests_per_second: 5, burst_size: 10 });

    this.config = config;
    this.client = axios.create({
      baseURL: config.base_url || 'https://api.mngkargo.com.tr/v1',
      timeout: 30000,
      headers: {
        'X-API-Key': config.api_key,
        'X-Customer-Code': config.customer_code,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create shipment
   */
  protected async doCreateShipment(request: CreateShipmentRequest): Promise<ShipmentResponse> {
    // Build MNG shipment request
    const mngRequest = {
      referans_no: request.order_id,
      musteri_kodu: this.config.customer_code,
      gonderici: {
        ad_soyad: request.from.name,
        telefon: request.from.phone,
        adres: request.from.line1,
        ilce: request.from.city,
        il: request.from.state || request.from.city,
        posta_kodu: request.from.zip,
        ulke: request.from.country,
      },
      alici: {
        ad_soyad: request.to.name,
        telefon: request.to.phone,
        adres: request.to.line1,
        ilce: request.to.city,
        il: request.to.state || request.to.city,
        posta_kodu: request.to.zip,
        ulke: request.to.country,
      },
      koli_bilgileri: {
        agirlik: request.dims.weight_kg,
        en: request.dims.width_cm,
        boy: request.dims.length_cm,
        yukseklik: request.dims.height_cm,
        desi: this.calculateDesi(request.dims),
        icerik: 'Package',
      },
      servis_tipi: this.getServiceType(request.options?.service_type || 'standard'),
      odeme_tipi: request.options?.cod_enabled ? 'ALICI_ODEMELI' : 'GONDERICI_ODEMELI',
      tahsilat_tutari: request.options?.cod_amount || 0,
      sigorta_degeri: request.options?.insurance_value || 0,
    };

    const response = await this.client.post('/shipments/create', mngRequest);

    const { takip_no, etiket_url, navlun } = response.data;

    return {
      shipment_id: takip_no,
      tracking_no: takip_no,
      status: 'label_ready',
      label_url: etiket_url,
      label_format: 'PDF',
      vendor: 'mng',
      created_at: new Date().toISOString(),
      shipping_cost: navlun,
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
      timestamp: new Date(hareket.tarih_saat).toISOString(),
      status: this.mapMNGStatus(hareket.durum_kodu),
      location: hareket.sube_adi || hareket.il || 'Unknown',
      description: hareket.aciklama,
      description_tr: hareket.aciklama,
    }));

    const currentStatus = this.mapMNGStatus(trackData.son_durum_kodu);
    const deliveredEvent = events.find((e) => e.status === 'delivered');

    return {
      tracking_no: request.tracking_no,
      vendor: 'mng',
      status: currentStatus,
      events,
      delivered_at: deliveredEvent?.timestamp,
      delivered_to: trackData.teslim_alan_kisi,
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
      takip_no: request.tracking_no,
      iptal_sebebi: request.reason || 'Müşteri talebi',
    };

    const response = await this.client.post(`/shipments/cancel`, cancelRequest);

    const { iade_uygun } = response.data;

    return {
      tracking_no: request.tracking_no,
      vendor: 'mng',
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
   * Get MNG service type
   */
  private getServiceType(serviceType: string): string {
    const mapping: Record<string, string> = {
      standard: 'STANDART',
      express: 'EKSPRES',
      same_day: 'AYNI_GUN',
      international: 'ULUSLARARASI',
    };
    return mapping[serviceType] || 'STANDART';
  }

  /**
   * Map MNG status code to unified status
   */
  private mapMNGStatus(mngCode: string): string {
    const mapping: Record<string, string> = {
      '100': 'created',
      '110': 'label_ready',
      '200': 'picked_up',
      '300': 'in_transit',
      '400': 'out_for_delivery',
      '500': 'delivered',
      '600': 'exception',
      '700': 'canceled',
    };
    return mapping[mngCode] || 'in_transit';
  }
}
