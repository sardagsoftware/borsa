/**
 * SÜRAT KARGO LOGISTICS CONNECTOR
 *
 * Vendor: Sürat Kargo
 * Status: partner_required
 * Auth: API Key
 * Base URL: https://api.suratkargo.com.tr/v1
 * Rate Limit: 5 rps
 *
 * Features:
 * - Domestic shipping only (Turkey)
 * - COD, Insurance support
 * - Webhook support (HMAC-SHA256)
 * - Label format: PDF only
 * - Fast delivery network
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
 * Sürat Kargo configuration
 */
interface SuratConfig {
  api_key: string;
  sender_code: string; // Sürat gönderici kodu
  webhook_secret?: string;
  base_url?: string;
}

/**
 * Sürat Connector
 */
export class SuratConnector extends BaseLogisticsConnector {
  private readonly client: AxiosInstance;
  private readonly config: SuratConfig;

  constructor(config: SuratConfig) {
    super('surat', { requests_per_second: 5, burst_size: 10 });

    this.config = config;
    this.client = axios.create({
      baseURL: config.base_url || 'https://api.suratkargo.com.tr/v1',
      timeout: 30000,
      headers: {
        'X-API-Key': config.api_key,
        'X-Sender-Code': config.sender_code,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create shipment
   */
  protected async doCreateShipment(request: CreateShipmentRequest): Promise<ShipmentResponse> {
    // Build Sürat shipment request
    const suratRequest = {
      siparis_referans: request.order_id,
      gonderici_kodu: this.config.sender_code,
      gonderici_bilgileri: {
        isim: request.from.name,
        telefon: request.from.phone,
        adres: request.from.line1,
        ilce: request.from.city,
        il: request.from.state || request.from.city,
        posta_kodu: request.from.zip,
      },
      alici_bilgileri: {
        isim: request.to.name,
        telefon: request.to.phone,
        adres: request.to.line1,
        ilce: request.to.city,
        il: request.to.state || request.to.city,
        posta_kodu: request.to.zip,
      },
      paket_bilgileri: {
        agirlik_kg: request.dims.weight_kg,
        en_cm: request.dims.width_cm,
        boy_cm: request.dims.length_cm,
        yukseklik_cm: request.dims.height_cm,
        desi: this.calculateDesi(request.dims),
        aciklama: 'Package',
      },
      servis: this.getServiceType(request.options?.service_type || 'standard'),
      odeme_sekli: request.options?.cod_enabled ? 'ALICI' : 'GONDERICI',
      tahsilat_tutari: request.options?.cod_amount || 0,
      sigorta_tutari: request.options?.insurance_value || 0,
    };

    const response = await this.client.post('/gonderi/olustur', suratRequest);

    const { takip_numarasi, etiket_link, kargo_ucreti } = response.data;

    return {
      shipment_id: takip_numarasi,
      tracking_no: takip_numarasi,
      status: 'label_ready',
      label_url: etiket_link,
      label_format: 'PDF',
      vendor: 'surat',
      created_at: new Date().toISOString(),
      shipping_cost: kargo_ucreti,
      currency: 'TRY',
    };
  }

  /**
   * Get tracking information
   */
  protected async doGetTracking(request: GetTrackingRequest): Promise<TrackingResponse> {
    const response = await this.client.get(`/gonderi/takip/${request.tracking_no}`);

    const trackData = response.data;
    const events: TrackingEvent[] = (trackData.gecmis || []).map((kayit: any) => ({
      timestamp: new Date(kayit.zaman).toISOString(),
      status: this.mapSuratStatus(kayit.durum),
      location: kayit.lokasyon || 'Unknown',
      description: kayit.detay,
      description_tr: kayit.detay,
    }));

    const currentStatus = this.mapSuratStatus(trackData.mevcut_durum);
    const deliveredEvent = events.find((e) => e.status === 'delivered');

    return {
      tracking_no: request.tracking_no,
      vendor: 'surat',
      status: currentStatus,
      events,
      delivered_at: deliveredEvent?.timestamp,
      delivered_to: trackData.teslim_eden,
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
      takip_numarasi: request.tracking_no,
      neden: request.reason || 'Müşteri isteği',
    };

    const response = await this.client.post(`/gonderi/iptal`, cancelRequest);

    const { iade_hakki } = response.data;

    return {
      tracking_no: request.tracking_no,
      vendor: 'surat',
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      refund_eligible: iade_hakki === true,
      message: 'Gönderi iptal edilmiştir',
    };
  }

  /**
   * Get label
   */
  protected async doGetLabel(
    tracking_no: string
  ): Promise<{ url: string; format: 'PDF' | 'ZPL' | 'GIF' }> {
    const response = await this.client.get(`/gonderi/etiket/${tracking_no}`);

    return {
      url: response.data.etiket_link,
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
   * Get Sürat service type
   */
  private getServiceType(serviceType: string): string {
    const mapping: Record<string, string> = {
      standard: 'NORMAL',
      express: 'HIZLI',
      same_day: 'AYNI_GUN',
    };
    return mapping[serviceType] || 'NORMAL';
  }

  /**
   * Map Sürat status code to unified status
   */
  private mapSuratStatus(suratCode: string): string {
    const mapping: Record<string, string> = {
      KAYIT: 'created',
      ETIKET_BASIM: 'label_ready',
      ALINMA: 'picked_up',
      DAGITIMDA: 'in_transit',
      KURYE_DAGITIMDA: 'out_for_delivery',
      TESLIM: 'delivered',
      SORUN: 'exception',
      IPTAL: 'canceled',
    };
    return mapping[suratCode] || 'in_transit';
  }
}
