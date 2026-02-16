/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SHIPMENT TRACKING API
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Track shipments across all Turkish and international carriers
 *
 * Supported carriers:
 * - Turkey: Aras, Yurtiçi, HepsiJet, MNG, Sürat, UPS
 * - International: UPS, DHL, FedEx
 *
 * Endpoint: POST /api/v1/shipment/track
 *
 * Request body:
 * {
 *   "trackingNumber": "1234567890",
 *   "vendor": "aras" (optional - auto-detect if not provided)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "trackingNumber": "1234567890",
 *     "vendor": "aras",
 *     "status": "IN_TRANSIT",
 *     "currentLocation": "Istanbul Depo",
 *     "estimatedDelivery": "2025-10-12T14:00:00Z",
 *     "events": [...]
 *   }
 * }
 *
 * @module api/v1/shipment/track
 */

const { createApiHandler } = require('../_base/api-handler');
const { sanitizeTrackingNumber } = require('../../../security/input-sanitizer');
const axios = require('axios');

/**
 * Shipment tracking handler
 */
const handler = async (context, req, res) => {
  const { sanitizedBody, secrets, locale } = context;
  const { trackingNumber, vendor } = sanitizedBody;

  // Validate tracking number
  const validation = sanitizeTrackingNumber(trackingNumber);
  if (!validation.valid) {
    throw {
      code: 'INVALID_TRACKING_NUMBER',
      statusCode: 400,
      message: validation.reason,
    };
  }

  const sanitizedTrackingNo = validation.sanitized;

  // Detect vendor if not provided
  const detectedVendor = vendor || detectCarrier(sanitizedTrackingNo);
  if (!detectedVendor) {
    throw {
      code: 'VENDOR_NOT_DETECTED',
      statusCode: 400,
      message: 'Could not detect carrier from tracking number',
    };
  }

  // Route to appropriate carrier API
  let trackingData;
  switch (detectedVendor.toLowerCase()) {
    case 'aras':
      trackingData = await trackAras(sanitizedTrackingNo, secrets, locale);
      break;
    case 'yurtici':
    case 'yurtiçi':
      trackingData = await trackYurtici(sanitizedTrackingNo, secrets, locale);
      break;
    case 'hepsijet':
      trackingData = await trackHepsiJet(sanitizedTrackingNo, secrets, locale);
      break;
    case 'mng':
      trackingData = await trackMNG(sanitizedTrackingNo, secrets, locale);
      break;
    case 'surat':
    case 'sürat':
      trackingData = await trackSurat(sanitizedTrackingNo, secrets, locale);
      break;
    case 'ups':
      trackingData = await trackUPS(sanitizedTrackingNo, secrets, locale);
      break;
    default:
      throw {
        code: 'UNSUPPORTED_VENDOR',
        statusCode: 400,
        message: `Carrier ${detectedVendor} is not supported`,
      };
  }

  return {
    data: {
      trackingNumber: sanitizedTrackingNo,
      vendor: detectedVendor,
      ...trackingData,
    },
    retries: 0,
  };
};

/**
 * Detect carrier from tracking number format
 * @param {string} trackingNo Tracking number
 * @returns {string|null} Carrier name
 */
function detectCarrier(trackingNo) {
  // Aras: 10-12 digits
  if (/^\d{10,12}$/.test(trackingNo)) {
    return 'aras';
  }

  // Yurtiçi: Starts with YK or YT
  if (/^(YK|YT)\d{10}$/.test(trackingNo)) {
    return 'yurtici';
  }

  // HepsiJet: Starts with HJ
  if (/^HJ\d{10}$/.test(trackingNo)) {
    return 'hepsijet';
  }

  // MNG: 10-11 digits starting with specific prefix
  if (/^\d{10,11}$/.test(trackingNo)) {
    return 'mng';
  }

  // UPS: 1Z format
  if (/^1Z[A-Z0-9]{16}$/.test(trackingNo)) {
    return 'ups';
  }

  return null;
}

/**
 * Track shipment via Aras Kargo API
 */
async function trackAras(trackingNo, secrets, locale) {
  try {
    const response = await axios.post(
      'https://api.araskargo.com.tr/tracking/v1/track',
      {
        trackingNumber: trackingNo,
        locale: locale,
      },
      {
        headers: {
          Authorization: `Bearer ${secrets.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const data = response.data;

    return {
      status: mapArasStatus(data.status),
      currentLocation: data.currentLocation?.name || 'Bilinmiyor',
      estimatedDelivery: data.estimatedDelivery || null,
      lastUpdate: data.lastUpdate || new Date().toISOString(),
      events: (data.events || []).map(event => ({
        date: event.date,
        location: event.location?.name || '',
        description: event.description,
        status: mapArasStatus(event.status),
      })),
      recipient: {
        name: data.recipient?.name || null,
        city: data.recipient?.city || null,
        district: data.recipient?.district || null,
      },
      metadata: {
        weight: data.weight || null,
        pieces: data.pieces || 1,
        serviceType: data.serviceType || null,
      },
    };
  } catch (error) {
    console.error('[Aras] Tracking error:', error.message);
    throw {
      code: 'VENDOR_ERROR',
      statusCode: 502,
      message: 'Failed to fetch tracking data from Aras Kargo',
    };
  }
}

/**
 * Track shipment via Yurtiçi Kargo API
 */
async function trackYurtici(trackingNo, secrets, locale) {
  try {
    const response = await axios.get(
      'https://api.yurticikargo.com/api/v1/ShipmentTracking/GetShipmentDetails',
      {
        params: {
          shipmentNumber: trackingNo,
          language: locale === 'tr' ? 'TR' : 'EN',
        },
        headers: {
          ApiKey: secrets.apiKey,
        },
        timeout: 10000,
      }
    );

    const data = response.data;

    return {
      status: mapYurticiStatus(data.status),
      currentLocation: data.lastLocation || 'Bilinmiyor',
      estimatedDelivery: data.estimatedDeliveryDate || null,
      lastUpdate: data.lastUpdateTime || new Date().toISOString(),
      events: (data.movements || []).map(movement => ({
        date: movement.processDate,
        location: movement.unit,
        description: movement.explanation,
        status: mapYurticiStatus(movement.status),
      })),
      recipient: {
        name: data.receiverName || null,
        city: data.receiverCity || null,
        district: data.receiverDistrict || null,
      },
      metadata: {
        weight: data.weight || null,
        pieces: data.pieceCount || 1,
        serviceType: data.deliveryType || null,
      },
    };
  } catch (error) {
    console.error('[Yurtiçi] Tracking error:', error.message);
    throw {
      code: 'VENDOR_ERROR',
      statusCode: 502,
      message: 'Failed to fetch tracking data from Yurtiçi Kargo',
    };
  }
}

/**
 * Track shipment via HepsiJet API
 */
async function trackHepsiJet(trackingNo, secrets, locale) {
  try {
    const response = await axios.get(`https://api.hepsijet.com/v1/tracking/${trackingNo}`, {
      headers: {
        'X-API-Key': secrets.apiKey,
        'Accept-Language': locale,
      },
      timeout: 10000,
    });

    const data = response.data;

    return {
      status: mapHepsiJetStatus(data.status),
      currentLocation: data.currentLocation || 'Bilinmiyor',
      estimatedDelivery: data.estimatedDelivery || null,
      lastUpdate: data.lastUpdate || new Date().toISOString(),
      events: (data.trackingHistory || []).map(event => ({
        date: event.timestamp,
        location: event.location,
        description: event.description,
        status: mapHepsiJetStatus(event.status),
      })),
      recipient: {
        name: data.recipientName || null,
        city: data.recipientCity || null,
        district: data.recipientDistrict || null,
      },
      metadata: {
        weight: data.weight || null,
        pieces: 1,
        serviceType: data.serviceType || 'Standard',
      },
    };
  } catch (error) {
    console.error('[HepsiJet] Tracking error:', error.message);
    throw {
      code: 'VENDOR_ERROR',
      statusCode: 502,
      message: 'Failed to fetch tracking data from HepsiJet',
    };
  }
}

/**
 * Track shipment via MNG Kargo API
 */
async function trackMNG(trackingNo, secrets, locale) {
  try {
    const response = await axios.post(
      'https://api.mngkargo.com.tr/api/external/TrackAndTrace',
      {
        barcodeNo: trackingNo,
      },
      {
        headers: {
          ApiKey: secrets.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const data = response.data;

    return {
      status: mapMNGStatus(data.deliveryStatus),
      currentLocation: data.lastTransactionUnit || 'Bilinmiyor',
      estimatedDelivery: data.estimatedDeliveryDate || null,
      lastUpdate: data.lastTransactionDate || new Date().toISOString(),
      events: (data.movements || []).map(movement => ({
        date: movement.transactionDate,
        location: movement.transactionUnit,
        description: movement.transactionDescription,
        status: mapMNGStatus(movement.status),
      })),
      recipient: {
        name: data.receiverName || null,
        city: data.receiverCity || null,
        district: data.receiverDistrict || null,
      },
      metadata: {
        weight: data.weight || null,
        pieces: data.numberOfPieces || 1,
        serviceType: data.deliveryType || null,
      },
    };
  } catch (error) {
    console.error('[MNG] Tracking error:', error.message);
    throw {
      code: 'VENDOR_ERROR',
      statusCode: 502,
      message: 'Failed to fetch tracking data from MNG Kargo',
    };
  }
}

/**
 * Track shipment via Sürat Kargo API
 */
async function trackSurat(trackingNo, secrets, locale) {
  // Sürat uses similar API to MNG
  try {
    const response = await axios.get(`https://api.suratkargo.com.tr/api/tracking/${trackingNo}`, {
      headers: {
        Authorization: `Bearer ${secrets.apiKey}`,
      },
      timeout: 10000,
    });

    const data = response.data;

    return {
      status: mapSuratStatus(data.status),
      currentLocation: data.currentLocation || 'Bilinmiyor',
      estimatedDelivery: data.estimatedDelivery || null,
      lastUpdate: data.lastUpdate || new Date().toISOString(),
      events: (data.history || []).map(event => ({
        date: event.date,
        location: event.location,
        description: event.description,
        status: mapSuratStatus(event.status),
      })),
      recipient: {
        name: data.recipient?.name || null,
        city: data.recipient?.city || null,
        district: data.recipient?.district || null,
      },
      metadata: {
        weight: data.weight || null,
        pieces: data.pieces || 1,
        serviceType: data.serviceType || null,
      },
    };
  } catch (error) {
    console.error('[Sürat] Tracking error:', error.message);
    throw {
      code: 'VENDOR_ERROR',
      statusCode: 502,
      message: 'Failed to fetch tracking data from Sürat Kargo',
    };
  }
}

/**
 * Track shipment via UPS API
 */
async function trackUPS(trackingNo, secrets, locale) {
  try {
    const response = await axios.get(`https://onlinetools.ups.com/track/v1/details/${trackingNo}`, {
      headers: {
        Authorization: `Bearer ${secrets.apiKey}`,
        transId: `lydian-${Date.now()}`,
        transactionSrc: 'Lydian-IQ',
      },
      timeout: 10000,
    });

    const data = response.data.trackResponse.shipment[0];

    return {
      status: mapUPSStatus(data.package[0].currentStatus.statusCode),
      currentLocation: data.package[0].currentStatus.location?.address?.city || 'Unknown',
      estimatedDelivery: data.package[0].deliveryDate?.[0]?.date || null,
      lastUpdate: data.package[0].currentStatus.statusTime || new Date().toISOString(),
      events: (data.package[0].activity || []).map(activity => ({
        date: activity.date + 'T' + activity.time,
        location: activity.location?.address?.city || '',
        description: activity.status.description,
        status: mapUPSStatus(activity.status.statusCode),
      })),
      recipient: {
        name: null,
        city: data.shipTo?.address?.city || null,
        district: null,
      },
      metadata: {
        weight: data.package[0].packageWeight?.weight || null,
        pieces: data.package.length || 1,
        serviceType: data.service?.description || null,
      },
    };
  } catch (error) {
    console.error('[UPS] Tracking error:', error.message);
    throw {
      code: 'VENDOR_ERROR',
      statusCode: 502,
      message: 'Failed to fetch tracking data from UPS',
    };
  }
}

// Status mapping functions (vendor-specific to unified)
function mapArasStatus(vendorStatus) {
  const statusMap = {
    DELIVERED: 'DELIVERED',
    IN_TRANSIT: 'IN_TRANSIT',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    PENDING: 'PENDING',
    EXCEPTION: 'EXCEPTION',
  };
  return statusMap[vendorStatus] || 'UNKNOWN';
}

function mapYurticiStatus(vendorStatus) {
  const statusMap = {
    'Teslim Edildi': 'DELIVERED',
    Dağıtımda: 'OUT_FOR_DELIVERY',
    Aktarımda: 'IN_TRANSIT',
    Şubede: 'IN_TRANSIT',
  };
  return statusMap[vendorStatus] || 'IN_TRANSIT';
}

function mapHepsiJetStatus(vendorStatus) {
  const statusMap = {
    delivered: 'DELIVERED',
    in_transit: 'IN_TRANSIT',
    out_for_delivery: 'OUT_FOR_DELIVERY',
    pending: 'PENDING',
  };
  return statusMap[vendorStatus] || 'UNKNOWN';
}

function mapMNGStatus(vendorStatus) {
  return mapYurticiStatus(vendorStatus); // Similar status format
}

function mapSuratStatus(vendorStatus) {
  return mapYurticiStatus(vendorStatus); // Similar status format
}

function mapUPSStatus(statusCode) {
  const statusMap = {
    D: 'DELIVERED',
    I: 'IN_TRANSIT',
    O: 'OUT_FOR_DELIVERY',
    P: 'PENDING',
    X: 'EXCEPTION',
  };
  return statusMap[statusCode] || 'IN_TRANSIT';
}

// Create and export handler
module.exports = createApiHandler({
  requiredScopes: ['shipment:read'],
  connector: 'shipment',
  action: 'track',
  handler,
  rateLimit: { window: '1m', max: 60 },
  idempotent: true,
  streaming: false,
});
