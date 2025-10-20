/**
 * UPS LOGISTICS CONNECTOR
 *
 * Vendor: UPS Turkey
 * Status: public_api
 * Auth: OAuth 2.0
 * Base URL: https://onlinetools.ups.com/api
 * Rate Limit: 10 rps
 *
 * Features:
 * - Domestic & International shipping
 * - Express delivery
 * - Label formats: PDF, ZPL, GIF
 * - No webhook support (polling required)
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
  TrackingEvent,
} from '../schema';

/**
 * UPS OAuth 2.0 configuration
 */
interface UPSConfig {
  client_id: string;
  client_secret: string;
  account_number: string; // UPS shipper account number
  base_url?: string;
}

/**
 * UPS OAuth token cache
 */
interface TokenCache {
  access_token: string;
  expires_at: number;
}

/**
 * UPS Connector
 */
export class UPSConnector extends BaseLogisticsConnector {
  private readonly client: AxiosInstance;
  private readonly config: UPSConfig;
  private tokenCache: TokenCache | null = null;

  constructor(config: UPSConfig) {
    super('ups', { requests_per_second: 10, burst_size: 20 });

    this.config = config;
    this.client = axios.create({
      baseURL: config.base_url || 'https://onlinetools.ups.com/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get OAuth 2.0 access token
   */
  private async getAccessToken(): Promise<string> {
    // Check cache
    if (this.tokenCache && this.tokenCache.expires_at > Date.now()) {
      return this.tokenCache.access_token;
    }

    // Request new token
    const response = await axios.post(
      `${this.config.base_url || 'https://onlinetools.ups.com/api'}/oauth/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
      }),
      {
        auth: {
          username: this.config.client_id,
          password: this.config.client_secret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in } = response.data;

    // Cache token (with 60s buffer)
    this.tokenCache = {
      access_token,
      expires_at: Date.now() + (expires_in - 60) * 1000,
    };

    return access_token;
  }

  /**
   * Create shipment
   */
  protected async doCreateShipment(request: CreateShipmentRequest): Promise<ShipmentResponse> {
    const token = await this.getAccessToken();

    // Build UPS shipment request
    const upsRequest = {
      ShipmentRequest: {
        Request: {
          RequestOption: 'nonvalidate',
          TransactionReference: {
            CustomerContext: request.order_id,
          },
        },
        Shipment: {
          Description: 'Package',
          Shipper: {
            Name: request.from.name,
            ShipperNumber: this.config.account_number,
            Phone: {
              Number: request.from.phone,
            },
            Address: {
              AddressLine: [request.from.line1, request.from.line2].filter(Boolean),
              City: request.from.city,
              StateProvinceCode: request.from.state || '',
              PostalCode: request.from.zip,
              CountryCode: request.from.country,
            },
          },
          ShipTo: {
            Name: request.to.name,
            Phone: {
              Number: request.to.phone,
            },
            Address: {
              AddressLine: [request.to.line1, request.to.line2].filter(Boolean),
              City: request.to.city,
              StateProvinceCode: request.to.state || '',
              PostalCode: request.to.zip,
              CountryCode: request.to.country,
            },
          },
          Package: {
            Packaging: {
              Code: '02', // Customer Supplied Package
            },
            Dimensions: {
              UnitOfMeasurement: {
                Code: 'CM',
              },
              Length: String(request.dims.length_cm),
              Width: String(request.dims.width_cm),
              Height: String(request.dims.height_cm),
            },
            PackageWeight: {
              UnitOfMeasurement: {
                Code: 'KGS',
              },
              Weight: String(request.dims.weight_kg),
            },
          },
          Service: {
            Code: this.getServiceCode(request.options?.service_type || 'standard'),
          },
          PaymentInformation: {
            ShipmentCharge: {
              Type: '01', // Transportation
              BillShipper: {
                AccountNumber: this.config.account_number,
              },
            },
          },
        },
        LabelSpecification: {
          LabelImageFormat: {
            Code: 'PDF',
          },
          HTTPUserAgent: 'Lydian-IQ/1.0',
        },
      },
    };

    const response = await this.client.post('/shipments/v1/ship', upsRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const shipmentData = response.data.ShipmentResponse;
    const trackingNo = shipmentData.ShipmentResults.PackageResults.TrackingNumber;
    const labelUrl = shipmentData.ShipmentResults.PackageResults.ShippingLabel.GraphicImage; // Base64

    return {
      shipment_id: trackingNo,
      tracking_no: trackingNo,
      status: 'label_ready',
      label_url: `data:application/pdf;base64,${labelUrl}`,
      label_format: 'PDF',
      vendor: 'ups',
      created_at: new Date().toISOString(),
      shipping_cost: undefined, // UPS doesn't return cost in shipment response
      currency: 'USD',
    };
  }

  /**
   * Get tracking information
   */
  protected async doGetTracking(request: GetTrackingRequest): Promise<TrackingResponse> {
    const token = await this.getAccessToken();

    const response = await this.client.get(
      `/track/v1/details/${request.tracking_no}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const trackData = response.data.trackResponse.shipment[0];
    const events: TrackingEvent[] = (trackData.package[0].activity || []).map((activity: any) => ({
      timestamp: new Date(activity.date + 'T' + activity.time).toISOString(),
      status: this.mapUPSStatus(activity.status.code),
      location: activity.location?.address?.city || 'Unknown',
      description: activity.status.description,
    }));

    const currentStatus = events.length > 0 ? events[0].status : 'created';
    const deliveredActivity = events.find((e) => e.status === 'delivered');

    return {
      tracking_no: request.tracking_no,
      vendor: 'ups',
      status: currentStatus,
      events,
      delivered_at: deliveredActivity?.timestamp,
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Cancel shipment (void)
   */
  protected async doCancelShipment(
    request: CancelShipmentRequest
  ): Promise<CancelShipmentResponse> {
    const token = await this.getAccessToken();

    const voidRequest = {
      VoidShipmentRequest: {
        Request: {
          TransactionReference: {
            CustomerContext: request.tracking_no,
          },
        },
        VoidShipment: {
          ShipmentIdentificationNumber: request.tracking_no,
        },
      },
    };

    await this.client.post('/shipments/v1/void', voidRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      tracking_no: request.tracking_no,
      vendor: 'ups',
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      refund_eligible: true, // UPS allows refunds for voided shipments
      message: 'Shipment voided successfully',
    };
  }

  /**
   * Get label
   */
  protected async doGetLabel(
    tracking_no: string
  ): Promise<{ url: string; format: 'PDF' | 'ZPL' | 'GIF' }> {
    // UPS label is returned in createShipment response
    // For existing shipments, would need to call labelrecovery API
    // For now, return placeholder
    return {
      url: `https://onlinetools.ups.com/api/shipments/v1/label/${tracking_no}`,
      format: 'PDF',
    };
  }

  /**
   * Map UPS service code
   */
  private getServiceCode(serviceType: string): string {
    const mapping: Record<string, string> = {
      standard: '11', // UPS Standard
      express: '01', // UPS Next Day Air
      international: '08', // UPS Worldwide Expedited
    };
    return mapping[serviceType] || '11';
  }

  /**
   * Map UPS status code to unified status
   */
  private mapUPSStatus(upsCode: string): string {
    const mapping: Record<string, string> = {
      I: 'in_transit',
      P: 'picked_up',
      D: 'delivered',
      X: 'exception',
      M: 'out_for_delivery',
    };
    return mapping[upsCode] || 'in_transit';
  }
}
