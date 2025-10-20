/**
 * YURTİÇİ KARGO LOGISTICS CONNECTOR
 *
 * Vendor: Yurtiçi Kargo
 * Status: partner_required
 * Auth: OAuth 2.0
 * Base URL: https://api.yurticikargo.com/v2
 * Rate Limit: 5 rps
 *
 * Features:
 * - Domestic & International shipping
 * - COD, Insurance, Webhook support
 */

import axios, { AxiosInstance } from 'axios';
import { BaseLogisticsConnector } from '../base-connector';
import {
  CreateShipmentRequest,
  ShipmentResponse,
  GetTrackingRequest,
  TrackingResponse,
  CancelShipmentRequest,
  CancelShipmentResponse,
} from '../schema';

interface YurticiConfig {
  client_id: string;
  client_secret: string;
  webhook_secret?: string;
  base_url?: string;
}

export class YurticiConnector extends BaseLogisticsConnector {
  private readonly client: AxiosInstance;
  private readonly config: YurticiConfig;
  private tokenCache: { access_token: string; expires_at: number } | null = null;

  constructor(config: YurticiConfig) {
    super('yurtici', { requests_per_second: 5, burst_size: 10 });
    this.config = config;
    this.client = axios.create({
      baseURL: config.base_url || 'https://api.yurticikargo.com/v2',
      timeout: 30000,
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expires_at > Date.now()) {
      return this.tokenCache.access_token;
    }

    const response = await this.client.post('/oauth/token', {
      grant_type: 'client_credentials',
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
    });

    this.tokenCache = {
      access_token: response.data.access_token,
      expires_at: Date.now() + (response.data.expires_in - 60) * 1000,
    };

    return this.tokenCache.access_token;
  }

  protected async doCreateShipment(request: CreateShipmentRequest): Promise<ShipmentResponse> {
    const token = await this.getAccessToken();

    // Build Yurtiçi shipment request
    const yurticiRequest = {
      siparis_no: request.order_id,
      gondericiBilgileri: {
        adSoyad: request.from.name,
        telefon: request.from.phone,
        adres: request.from.line1,
        ilce: request.from.city,
        il: request.from.state || request.from.city,
        postaKodu: request.from.zip,
        ulke: request.from.country,
      },
      aliciBilgileri: {
        adSoyad: request.to.name,
        telefon: request.to.phone,
        adres: request.to.line1,
        ilce: request.to.city,
        il: request.to.state || request.to.city,
        postaKodu: request.to.zip,
        ulke: request.to.country,
      },
      gonderiDetay: {
        agirlik: request.dims.weight_kg,
        en: request.dims.width_cm,
        boy: request.dims.length_cm,
        yukseklik: request.dims.height_cm,
        desi: this.calculateDesi(request.dims),
        icerik: 'Package',
      },
      servisTuru: this.getServiceType(request.options?.service_type || 'standard'),
      odemeSekli: request.options?.cod_enabled ? 'alici' : 'gonderici',
      tahsilatTutari: request.options?.cod_amount || 0,
      sigortaDegeri: request.options?.insurance_value || 0,
    };

    const response = await this.client.post('/shipments', yurticiRequest, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { trackingNo, labelUrl, maliyet } = response.data;

    return {
      shipment_id: trackingNo,
      tracking_no: trackingNo,
      status: 'label_ready',
      label_url: labelUrl,
      label_format: 'PDF',
      vendor: 'yurtici',
      created_at: new Date().toISOString(),
      shipping_cost: maliyet,
      currency: 'TRY',
    };
  }

  protected async doGetTracking(request: GetTrackingRequest): Promise<TrackingResponse> {
    const token = await this.getAccessToken();
    const response = await this.client.get(`/tracking/${request.tracking_no}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const trackData = response.data;
    const events: TrackingEvent[] = (trackData.hareketler || []).map((hareket: any) => ({
      timestamp: new Date(hareket.tarih).toISOString(),
      status: this.mapYurticiStatus(hareket.durumKodu),
      location: hareket.sube || hareket.sehir || 'Unknown',
      description: hareket.aciklama,
      description_tr: hareket.aciklama,
    }));

    const currentStatus = this.mapYurticiStatus(trackData.guncelDurum);
    const deliveredEvent = events.find((e) => e.status === 'delivered');

    return {
      tracking_no: request.tracking_no,
      vendor: 'yurtici',
      status: currentStatus,
      events,
      delivered_at: deliveredEvent?.timestamp,
      delivered_to: trackData.teslimAlan,
      last_updated: new Date().toISOString(),
    };
  }

  protected async doCancelShipment(request: CancelShipmentRequest): Promise<CancelShipmentResponse> {
    const token = await this.getAccessToken();

    const cancelRequest = {
      takipNo: request.tracking_no,
      iptalNedeni: request.reason || 'Müşteri talebi',
    };

    const response = await this.client.post(`/shipments/${request.tracking_no}/cancel`, cancelRequest, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { iadeUygun } = response.data;

    return {
      tracking_no: request.tracking_no,
      vendor: 'yurtici',
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      refund_eligible: iadeUygun === true,
      message: 'Gönderi başarıyla iptal edildi',
    };
  }

  protected async doGetLabel(tracking_no: string): Promise<{ url: string; format: 'PDF' | 'ZPL' | 'GIF' }> {
    const token = await this.getAccessToken();
    const response = await this.client.get(`/shipments/${tracking_no}/label`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { url: response.data.etiketUrl, format: response.data.format || 'PDF' };
  }

  /**
   * Calculate desi (volumetric weight) for Turkish carriers
   * Formula: (length * width * height) / 3000
   */
  private calculateDesi(dims: { length_cm: number; width_cm: number; height_cm: number }): number {
    return (dims.length_cm * dims.width_cm * dims.height_cm) / 3000;
  }

  /**
   * Get Yurtiçi service type
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
   * Map Yurtiçi status code to unified status
   */
  private mapYurticiStatus(yurticiCode: string): string {
    const mapping: Record<string, string> = {
      '1': 'created',
      '2': 'label_ready',
      '3': 'picked_up',
      '4': 'in_transit',
      '5': 'out_for_delivery',
      '6': 'delivered',
      '7': 'exception',
      '8': 'canceled',
    };
    return mapping[yurticiCode] || 'in_transit';
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
    const crypto = require('crypto');
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
}
