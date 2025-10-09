/**
 * LYDIAN-IQ LOGISTICS CONNECTORS - UNIT TESTS
 *
 * Purpose: Comprehensive test suite for all logistics connectors
 * Coverage: Base connector, rate limiting, error handling, all 6 vendors
 * Framework: Jest
 */

import axios from 'axios';
import {
  ArasConnector,
  YurticiConnector,
  UPSConnector,
  HepsijetConnector,
  MNGConnector,
  SuratConnector,
  createConnector,
  generateIdempotencyKey,
  redactPII,
  CreateShipmentRequest,
} from '../src/index';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Logistics Connectors - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================
  // Base Connector Tests
  // ===========================
  describe('BaseLogisticsConnector', () => {
    it('should enforce rate limiting (5 rps)', async () => {
      const connector = new ArasConnector({
        api_key: 'test-key',
        partner_id: 'test-partner',
      });

      mockedAxios.create.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          data: {
            takip_no: 'ARAS123',
            son_durum_kodu: '40',
            hareketler: [],
          },
        }),
      } as any);

      const start = Date.now();

      // Make 6 requests (should trigger rate limiting)
      const promises = Array(6)
        .fill(null)
        .map(() =>
          connector.getTracking({ vendor: 'aras', tracking_no: 'ARAS123' })
        );

      await Promise.all(promises);

      const elapsed = Date.now() - start;

      // 6 requests at 5 rps = should take at least 200ms (1/5 second)
      expect(elapsed).toBeGreaterThanOrEqual(150);
    }, 10000);

    it('should standardize validation errors', async () => {
      const connector = new ArasConnector({
        api_key: 'test-key',
        partner_id: 'test-partner',
      });

      await expect(
        connector.createShipment({
          vendor: 'aras',
          order_id: '',  // Invalid: empty string
          from: {} as any,
          to: {} as any,
          dims: {} as any,
        })
      ).rejects.toThrow(/Validation error/);
    });

    it('should standardize carrier errors', async () => {
      const connector = new ArasConnector({
        api_key: 'test-key',
        partner_id: 'test-partner',
      });

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue({
          response: {
            status: 429,
            data: { message: 'Rate limit exceeded' },
          },
        }),
      } as any);

      await expect(
        connector.createShipment({
          vendor: 'aras',
          order_id: 'ORD-123',
          from: {
            name: 'Sender',
            phone: '+905551234567',
            line1: 'Address 1',
            city: 'Istanbul',
            zip: '34000',
            country: 'TR',
          },
          to: {
            name: 'Recipient',
            phone: '+905559876543',
            line1: 'Address 2',
            city: 'Ankara',
            zip: '06000',
            country: 'TR',
          },
          dims: {
            length_cm: 30,
            width_cm: 20,
            height_cm: 10,
            weight_kg: 2,
          },
        })
      ).rejects.toMatchObject({
        message: expect.stringContaining('Rate limit'),
      });
    });
  });

  // ===========================
  // Aras Connector Tests
  // ===========================
  describe('ArasConnector', () => {
    it('should create shipment successfully', async () => {
      const connector = new ArasConnector({
        api_key: 'test-key',
        partner_id: 'test-partner',
      });

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({
          data: {
            takip_no: 'ARAS123456',
            etiket_url: 'https://example.com/label.pdf',
            fiyat: 25.5,
          },
        }),
      } as any);

      const request: CreateShipmentRequest = {
        vendor: 'aras',
        order_id: 'ORD-123',
        from: {
          name: 'Sender',
          phone: '+905551234567',
          line1: 'Sender Address',
          city: 'Istanbul',
          zip: '34000',
          country: 'TR',
        },
        to: {
          name: 'Recipient',
          phone: '+905559876543',
          line1: 'Recipient Address',
          city: 'Ankara',
          zip: '06000',
          country: 'TR',
        },
        dims: {
          length_cm: 30,
          width_cm: 20,
          height_cm: 10,
          weight_kg: 2,
        },
      };

      const result = await connector.createShipment(request);

      expect(result).toMatchObject({
        tracking_no: 'ARAS123456',
        vendor: 'aras',
        status: 'label_ready',
        shipping_cost: 25.5,
        currency: 'TRY',
      });
    });

    it('should verify webhook signature correctly', () => {
      const connector = new ArasConnector({
        api_key: 'test-key',
        partner_id: 'test-partner',
        webhook_secret: 'test-secret',
      });

      const payload = JSON.stringify({ tracking_no: 'ARAS123', status: 'delivered' });
      const timestamp = String(Date.now());
      const nonce = 'random-nonce';

      const crypto = require('crypto');
      const message = `${timestamp}|${nonce}|${payload}`;
      const signature = crypto
        .createHmac('sha256', 'test-secret')
        .update(message)
        .digest('hex');

      const isValid = connector.verifyWebhookSignature(payload, signature, timestamp, nonce);

      expect(isValid).toBe(true);
    });

    it('should reject expired webhook signatures', () => {
      const connector = new ArasConnector({
        api_key: 'test-key',
        partner_id: 'test-partner',
        webhook_secret: 'test-secret',
      });

      const payload = JSON.stringify({ tracking_no: 'ARAS123', status: 'delivered' });
      const timestamp = String(Date.now() - 400000); // 6 minutes ago (expired)
      const nonce = 'random-nonce';

      const crypto = require('crypto');
      const message = `${timestamp}|${nonce}|${payload}`;
      const signature = crypto
        .createHmac('sha256', 'test-secret')
        .update(message)
        .digest('hex');

      const isValid = connector.verifyWebhookSignature(payload, signature, timestamp, nonce);

      expect(isValid).toBe(false);
    });
  });

  // ===========================
  // Yurtiçi Connector Tests
  // ===========================
  describe('YurticiConnector', () => {
    it('should cache OAuth tokens', async () => {
      const connector = new YurticiConnector({
        client_id: 'test-client',
        client_secret: 'test-secret',
      });

      const mockPost = jest.fn()
        .mockResolvedValueOnce({
          data: {
            access_token: 'token123',
            expires_in: 3600,
          },
        })
        .mockResolvedValueOnce({
          data: {
            trackingNo: 'YK123',
            labelUrl: 'https://example.com/label.pdf',
            maliyet: 30,
          },
        })
        .mockResolvedValueOnce({
          data: {
            trackingNo: 'YK456',
            labelUrl: 'https://example.com/label2.pdf',
            maliyet: 35,
          },
        });

      mockedAxios.create.mockReturnValue({
        post: mockPost,
      } as any);

      const request: CreateShipmentRequest = {
        vendor: 'yurtici',
        order_id: 'ORD-123',
        from: {
          name: 'Sender',
          phone: '+905551234567',
          line1: 'Address 1',
          city: 'Istanbul',
          zip: '34000',
          country: 'TR',
        },
        to: {
          name: 'Recipient',
          phone: '+905559876543',
          line1: 'Address 2',
          city: 'Ankara',
          zip: '06000',
          country: 'TR',
        },
        dims: {
          length_cm: 30,
          width_cm: 20,
          height_cm: 10,
          weight_kg: 2,
        },
      };

      // First shipment: should request token
      await connector.createShipment(request);

      // Second shipment: should reuse cached token
      await connector.createShipment({ ...request, order_id: 'ORD-456' });

      // Should only call OAuth endpoint once (cached)
      expect(mockPost).toHaveBeenCalledTimes(3); // 1 token + 2 shipments
    });
  });

  // ===========================
  // UPS Connector Tests
  // ===========================
  describe('UPSConnector', () => {
    it('should create international shipment', async () => {
      const connector = new UPSConnector({
        client_id: 'test-client',
        client_secret: 'test-secret',
        account_number: 'ACC123',
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'ups-token',
          expires_in: 3600,
        },
      });

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({
          data: {
            ShipmentResponse: {
              ShipmentResults: {
                PackageResults: {
                  TrackingNumber: '1Z999AA10123456784',
                  ShippingLabel: {
                    GraphicImage: 'base64-label-data',
                  },
                },
              },
            },
          },
        }),
      } as any);

      const request: CreateShipmentRequest = {
        vendor: 'ups',
        order_id: 'ORD-INTL-123',
        from: {
          name: 'Sender',
          phone: '+905551234567',
          line1: 'Istanbul Address',
          city: 'Istanbul',
          zip: '34000',
          country: 'TR',
        },
        to: {
          name: 'Recipient',
          phone: '+491234567890',
          line1: 'Berlin Address',
          city: 'Berlin',
          zip: '10115',
          country: 'DE',
        },
        dims: {
          length_cm: 40,
          width_cm: 30,
          height_cm: 20,
          weight_kg: 5,
        },
        options: {
          service_type: 'international',
        },
      };

      const result = await connector.createShipment(request);

      expect(result.tracking_no).toBe('1Z999AA10123456784');
      expect(result.vendor).toBe('ups');
      expect(result.label_url).toContain('base64');
    });
  });

  // ===========================
  // Hepsijet Connector Tests
  // ===========================
  describe('HepsijetConnector', () => {
    it('should support same-day delivery', async () => {
      const connector = new HepsijetConnector({
        api_key: 'test-key',
        merchant_id: 'MERCHANT123',
      });

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue({
          data: {
            tracking_number: 'HJ123456',
            label_url: 'https://example.com/label.pdf',
            shipping_fee: 15,
          },
        }),
      } as any);

      const request: CreateShipmentRequest = {
        vendor: 'hepsijet',
        order_id: 'ORD-SAME-DAY-123',
        from: {
          name: 'Sender',
          phone: '+905551234567',
          line1: 'Istanbul Address',
          city: 'Istanbul',
          zip: '34000',
          country: 'TR',
        },
        to: {
          name: 'Recipient',
          phone: '+905559876543',
          line1: 'Istanbul Address 2',
          city: 'Istanbul',
          zip: '34100',
          country: 'TR',
        },
        dims: {
          length_cm: 20,
          width_cm: 15,
          height_cm: 10,
          weight_kg: 1,
        },
        options: {
          service_type: 'same_day',
        },
      };

      const result = await connector.createShipment(request);

      expect(result.vendor).toBe('hepsijet');
      expect(result.tracking_no).toBe('HJ123456');
    });
  });

  // ===========================
  // Utility Function Tests
  // ===========================
  describe('Utility Functions', () => {
    it('should generate deterministic idempotency keys', () => {
      const key1 = generateIdempotencyKey('ORD-123', 'aras');
      const key2 = generateIdempotencyKey('ORD-123', 'aras');
      const key3 = generateIdempotencyKey('ORD-456', 'aras');

      // Same order + vendor = same key (within same hour)
      expect(key1).toBe(key2);

      // Different order = different key
      expect(key1).not.toBe(key3);
    });

    it('should redact PII fields', () => {
      const shipment = {
        from: {
          name: 'John Doe',
          phone: '+905551234567',
          line1: 'Street Address',
          city: 'Istanbul',
          zip: '34000',
          country: 'TR',
        },
        to: {
          name: 'Jane Smith',
          phone: '+905559876543',
          line1: 'Another Street',
          city: 'Ankara',
          zip: '06000',
          country: 'TR',
        },
      };

      const redacted = redactPII(shipment);

      expect(redacted.from?.name).toBe('[REDACTED]');
      expect(redacted.from?.phone).toBe('[REDACTED]');
      expect(redacted.from?.line1).toBe('[REDACTED]');
      expect(redacted.to?.name).toBe('[REDACTED]');
      expect(redacted.to?.phone).toBe('[REDACTED]');
    });
  });

  // ===========================
  // Factory Pattern Tests
  // ===========================
  describe('createConnector Factory', () => {
    it('should create Aras connector', () => {
      const connector = createConnector({
        vendor: 'aras',
        api_key: 'test-key',
        partner_id: 'test-partner',
      });

      expect(connector).toBeInstanceOf(ArasConnector);
    });

    it('should create Yurtiçi connector', () => {
      const connector = createConnector({
        vendor: 'yurtici',
        client_id: 'test-client',
        client_secret: 'test-secret',
      });

      expect(connector).toBeInstanceOf(YurticiConnector);
    });

    it('should create UPS connector', () => {
      const connector = createConnector({
        vendor: 'ups',
        client_id: 'test-client',
        client_secret: 'test-secret',
        account_number: 'ACC123',
      });

      expect(connector).toBeInstanceOf(UPSConnector);
    });

    it('should create Hepsijet connector', () => {
      const connector = createConnector({
        vendor: 'hepsijet',
        api_key: 'test-key',
        merchant_id: 'MERCHANT123',
      });

      expect(connector).toBeInstanceOf(HepsijetConnector);
    });

    it('should create MNG connector', () => {
      const connector = createConnector({
        vendor: 'mng',
        api_key: 'test-key',
        customer_code: 'CUST123',
      });

      expect(connector).toBeInstanceOf(MNGConnector);
    });

    it('should create Sürat connector', () => {
      const connector = createConnector({
        vendor: 'surat',
        api_key: 'test-key',
        sender_code: 'SEND123',
      });

      expect(connector).toBeInstanceOf(SuratConnector);
    });

    it('should throw error for unknown vendor', () => {
      expect(() =>
        createConnector({
          vendor: 'unknown' as any,
          api_key: 'test-key',
        } as any)
      ).toThrow('Unknown vendor');
    });
  });

  // ===========================
  // Desi Calculation Tests
  // ===========================
  describe('Turkish Desi Calculation', () => {
    it('should calculate desi correctly for Turkish carriers', async () => {
      const connector = new ArasConnector({
        api_key: 'test-key',
        partner_id: 'test-partner',
      });

      const mockPost = jest.fn().mockResolvedValue({
        data: {
          takip_no: 'ARAS123',
          etiket_url: 'https://example.com/label.pdf',
          fiyat: 25.5,
        },
      });

      mockedAxios.create.mockReturnValue({ post: mockPost } as any);

      await connector.createShipment({
        vendor: 'aras',
        order_id: 'ORD-123',
        from: {
          name: 'Sender',
          phone: '+905551234567',
          line1: 'Address',
          city: 'Istanbul',
          zip: '34000',
          country: 'TR',
        },
        to: {
          name: 'Recipient',
          phone: '+905559876543',
          line1: 'Address',
          city: 'Ankara',
          zip: '06000',
          country: 'TR',
        },
        dims: {
          length_cm: 30,
          width_cm: 20,
          height_cm: 10,
          weight_kg: 2,
        },
      });

      // Check that desi was calculated: (30 * 20 * 10) / 3000 = 2
      expect(mockPost).toHaveBeenCalledWith(
        '/shipments',
        expect.objectContaining({
          gonderibilgileri: expect.objectContaining({
            desi: 2,
          }),
        })
      );
    });
  });
});
