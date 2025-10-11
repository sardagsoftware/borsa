/**
 * Logistics Search Provider - REAL DATA
 * Searches across shipping/cargo providers using real tracking APIs
 */

const axios = require('axios');

async function search(query, lang, limit) {
  // Check if query looks like a tracking number
  const trackingPattern = /\d{10,18}/;
  const trackingMatch = query.match(trackingPattern);

  if (!trackingMatch) {
    return [];
  }

  const trackingNumber = trackingMatch[0];
  const results = [];

  // Try tracking via real API
  try {
    const trackRes = await axios.post('/api/v1/shipment/track', {
      trackingNumber: trackingNumber
      // vendor will be auto-detected
    }, {
      baseURL: process.env.API_BASE_URL || 'http://localhost:3100',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (trackRes.data.success && trackRes.data.data) {
      const tracking = trackRes.data.data;

      const statusTextTR = {
        'DELIVERED': 'Teslim Edildi',
        'OUT_FOR_DELIVERY': 'Dağıtımda',
        'IN_TRANSIT': 'Aktarımda',
        'PENDING': 'Beklemede',
        'EXCEPTION': 'İstisna',
        'UNKNOWN': 'Bilinmiyor'
      };

      const statusTextEN = {
        'DELIVERED': 'Delivered',
        'OUT_FOR_DELIVERY': 'Out for Delivery',
        'IN_TRANSIT': 'In Transit',
        'PENDING': 'Pending',
        'EXCEPTION': 'Exception',
        'UNKNOWN': 'Unknown'
      };

      const statusText = lang === 'tr'
        ? statusTextTR[tracking.status] || tracking.status
        : statusTextEN[tracking.status] || tracking.status;

      results.push({
        type: 'shipment',
        vendor: tracking.vendor,
        title: lang === 'tr'
          ? `Kargo Takibi: ${tracking.trackingNumber}`
          : `Shipment Tracking: ${tracking.trackingNumber}`,
        snippet: lang === 'tr'
          ? `Durum: ${statusText} - ${tracking.currentLocation}`
          : `Status: ${statusText} - ${tracking.currentLocation}`,
        score: 0.95,
        payload: {
          trackingNumber: tracking.trackingNumber,
          vendor: tracking.vendor,
          status: tracking.status,
          currentLocation: tracking.currentLocation,
          estimatedDelivery: tracking.estimatedDelivery,
          lastUpdate: tracking.lastUpdate,
          events: tracking.events?.slice(0, 5) || [],
          recipient: tracking.recipient,
          metadata: tracking.metadata
        }
      });
    }
  } catch (error) {
    console.error('[Logistics Search] Tracking error:', error.message);

    // Fallback: Return tracking link with detected carrier
    const detectedVendor = detectCarrier(trackingNumber);
    if (detectedVendor) {
      results.push({
        type: 'shipment',
        vendor: detectedVendor,
        title: lang === 'tr'
          ? `Kargo Takibi: ${trackingNumber}`
          : `Shipment Tracking: ${trackingNumber}`,
        snippet: lang === 'tr'
          ? 'Takip numarasını kontrol edin'
          : 'Check tracking number',
        score: 0.85,
        payload: {
          trackingNumber,
          vendor: detectedVendor,
          status: 'PENDING',
          trackingFallback: true
        }
      });
    }
  }

  return results.slice(0, limit);
}

/**
 * Detect carrier from tracking number format
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

  // MNG: 10-11 digits
  if (/^\d{10,11}$/.test(trackingNo)) {
    return 'mng';
  }

  // UPS: 1Z format
  if (/^1Z[A-Z0-9]{16}$/.test(trackingNo)) {
    return 'ups';
  }

  return 'aras'; // default fallback
}

module.exports = {
  search
};
