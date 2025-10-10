/**
 * 📚 Intent Dictionaries & Patterns (Vanilla JS)
 * Synonyms and regex patterns for natural language understanding
 *
 * @author LyDian AI - Ultra Intelligence Platform
 */

(function(window) {
  'use strict';

  /**
   * Synonym dictionaries by locale
   */
  const synonyms = {
    tr: {
      shipment: ['kargo', 'gönderi', 'paket', 'kargom', 'takip', 'sevkiyat', 'teslimat', 'gönderim'],
      track: ['nerede', 'takip', 'durum', 'sorgula', 'bul', 'ara', 'görüntüle', 'kontrol'],
      vendor: [
        // Kargo Şirketleri
        'hepsijet', 'aras', 'yurtiçi', 'yurtici', 'mng', 'sürat', 'surat', 'ups',
        'dhl', 'fedex', 'tnt', 'ptt', 'sendeo', 'horoz', 'borusan',
        // Havayolu
        'thy', 'pegasus', 'sunexpress', 'anadolujet',
        // E-ticaret
        'trendyol', 'hepsiburada', 'n11', 'gittigidiyor', 'amazon'
      ],
      loan: ['kredi', 'faiz', 'taksit', 'borç', 'finansman', 'çek'],
      bank: [
        // Kamu Bankaları
        'ziraat', 'halkbank', 'vakıfbank', 'vakif',
        // Özel Bankalar
        'akbank', 'garanti', 'yapıkredi', 'yapı kredi', 'işbank', 'denizbank',
        'teb', 'odeabank', 'ing', 'qnb', 'finansbank', 'alternatifbank',
        // Katılım Bankaları
        'albaraka', 'kuveyt türk', 'türkiye finans', 'ziraat katılım', 'vakıf katılım'
      ],
      amount: ['tutar', 'miktar', 'para', '₺', 'tl', 'lira', 'ücret'],
      term: ['vade', 'ay', 'aylık', 'dönem', 'süre'],
      price: ['fiyat', 'etiket', 'bedel', 'ücret', 'tarife'],
      optimize: ['optimiz', 'arttır', 'düşür', 'iyileştir', 'marj'],
      trip: ['otel', 'uçuş', 'seyahat', 'tatil', 'rezervasyon', 'konaklama', 'tur', 'gezi'],
      place: [
        // Turistik Şehirler
        'antalya', 'istanbul', 'izmir', 'bodrum', 'marmaris', 'fethiye', 'alanya',
        'kapadokya', 'nevşehir', 'pamukkale', 'çeşme', 'kuşadası', 'belek', 'side',
        'trabzon', 'kaş', 'ölüdeniz', 'göreme', 'sapanca', 'kartepe', 'uludağ',
        'ankara', 'bursa', 'konya', 'gaziantep'
      ],
      esg: ['karbon', 'co2', 'yeşil', 'çevre', 'sürdürülebilir'],
      insights: ['trend', 'istatistik', 'analiz', 'rapor', 'veri'],
      product: ['ürün', 'stok', 'envanter', 'katalog'],
      order: ['sipariş', 'müşteri', 'satış'],
      menu: ['menü', 'yemek', 'restoran']
    },

    en: {
      shipment: ['shipment', 'package', 'delivery', 'parcel', 'cargo'],
      track: ['track', 'status', 'where', 'locate'],
      vendor: ['hepsijet', 'aras', 'yurtici', 'mng', 'surat', 'ups'],
      loan: ['loan', 'credit', 'interest', 'mortgage'],
      amount: ['amount', 'sum', 'money', 'price'],
      term: ['term', 'month', 'period', 'duration'],
      price: ['price', 'cost', 'fee', 'rate'],
      optimize: ['optimize', 'increase', 'decrease', 'improve', 'margin'],
      trip: ['hotel', 'flight', 'travel', 'trip', 'vacation'],
      place: ['antalya', 'istanbul', 'izmir', 'city', 'destination'],
      esg: ['carbon', 'co2', 'green', 'environment', 'sustainable'],
      insights: ['trend', 'statistics', 'analysis', 'report', 'data'],
      product: ['product', 'stock', 'inventory', 'catalog'],
      order: ['order', 'customer', 'sale'],
      menu: ['menu', 'food', 'restaurant']
    },

    ar: {
      shipment: ['شحنة', 'طرد', 'توصيل', 'بضائع'],
      track: ['تتبع', 'حالة', 'أين', 'موقع'],
      vendor: ['hepsijet', 'aras', 'yurtici', 'mng', 'surat', 'ups'],
      loan: ['قرض', 'ائتمان', 'فائدة'],
      amount: ['مبلغ', 'مال', 'سعر'],
      term: ['مدة', 'شهر', 'فترة'],
      price: ['سعر', 'تكلفة', 'رسوم'],
      optimize: ['تحسين', 'زيادة', 'تقليل'],
      trip: ['فندق', 'رحلة', 'سفر', 'إجازة'],
      place: ['أنطاليا', 'اسطنبول', 'مدينة'],
      esg: ['كربون', 'أخضر', 'بيئة', 'مستدام'],
      insights: ['اتجاه', 'إحصائيات', 'تحليل'],
      product: ['منتج', 'مخزون', 'كتالوج'],
      order: ['طلب', 'عميل', 'بيع'],
      menu: ['قائمة', 'طعام', 'مطعم']
    }
  };

  /**
   * Intent matching patterns by locale
   */
  const patterns = {
    tr: [
      // Shipment tracking
      {
        action: 'shipment.track',
        re: /\b(kargo|gönderi|takip|nerede|paket)\b.*?\b(hepsijet|aras|yurtiçi|yurtici|mng|sürat|surat|ups)\b.*?(\d{7,})/i,
        params: ['_ignore', 'vendor', 'trackingNo'],
        reason: 'Kargo takibi'
      },
      {
        action: 'shipment.track',
        re: /\b(hepsijet|aras|yurtiçi|yurtici|mng|sürat|surat|ups)\b.*?(\d{7,})\b.*?\b(takip|nerede|durum)/i,
        params: ['vendor', 'trackingNo'],
        reason: 'Kargo sorgulama'
      },

      // Loan comparison
      {
        action: 'loan.compare',
        re: /\b(kredi|faiz)\b.*?(\ d[\d\.]{3,})\s*(?:tl|₺|lira)?\b.*?\b(\d{1,3})\s*(?:ay|aylık)/i,
        params: ['_ignore', 'amount', 'term'],
        reason: 'Kredi karşılaştırma'
      },
      {
        action: 'loan.compare',
        re: /(\d[\d\.]{3,})\s*(?:tl|₺|lira)?\b.*?\b(\d{1,3})\s*(?:ay|aylık).*?\b(kredi|faiz)/i,
        params: ['amount', 'term'],
        reason: 'Kredi sorgusu'
      },

      // Economy/Price optimization
      {
        action: 'economy.optimize',
        re: /\b(fiyat|etiket)\b.*?\b(optimiz|arttır|düşür|iyileştir|marj)\b/i,
        params: [],
        reason: 'Fiyat optimizasyonu'
      },

      // Trip search
      {
        action: 'trip.search',
        re: /\b(otel|seyahat|uçuş|tatil|rezervasyon)\b.*?\b([a-zçğıöşü\s]{3,})\b.*?(\d+)\s*(?:gece|gün)\b.*?(\d+)\s*(?:kişi|pax|yetişkin)/i,
        params: ['_ignore', 'place', 'days', 'pax'],
        reason: 'Otel/seyahat arama'
      },

      // ESG Carbon calculation
      {
        action: 'esg.calculate-carbon',
        re: /\b(karbon|co2|yeşil|çevre)\b.*?\b(hesap|ölç|ayak izi)/i,
        params: [],
        reason: 'Karbon ayak izi hesaplama'
      }
    ],

    en: [
      // Shipment tracking
      {
        action: 'shipment.track',
        re: /\b(track|shipment|package|delivery)\b.*?\b(hepsijet|aras|yurtici|mng|surat|ups)\b.*?(\d{7,})/i,
        params: ['_ignore', 'vendor', 'trackingNo'],
        reason: 'Shipment tracking'
      },

      // Loan comparison
      {
        action: 'loan.compare',
        re: /\b(loan|credit)\b.*?(\d[\d,]{3,})\s*(?:tl|₺)?\ b.*?\b(\d{1,3})\s*(?:month|mo)/i,
        params: ['_ignore', 'amount', 'term'],
        reason: 'Loan comparison'
      },

      // Trip search
      {
        action: 'trip.search',
        re: /\b(hotel|flight|travel|trip)\b.*?\b([a-z\s]{3,})\b.*?(\d+)\s*(?:night|day).*?(\d+)\s*(?:person|pax|guest)/i,
        params: ['_ignore', 'place', 'days', 'pax'],
        reason: 'Trip search'
      }
    ],

    ar: [
      // Shipment tracking
      {
        action: 'shipment.track',
        re: /\b(تتبع|شحنة|طرد)\b.*?\b(hepsijet|aras|yurtici|mng|surat|ups)\b.*?(\d{7,})/i,
        params: ['_ignore', 'vendor', 'trackingNo'],
        reason: 'تتبع الشحنة'
      }
    ]
  };

  /**
   * Action metadata (for UI hints, RBAC, etc.)
   */
  const actionMetadata = {
    'shipment.track': {
      category: 'logistics',
      icon: '📦',
      requiredParams: ['vendor', 'trackingNo'],
      optionalParams: [],
      scopes: []
    },
    'loan.compare': {
      category: 'finance',
      icon: '💰',
      requiredParams: ['amount', 'term'],
      optionalParams: [],
      scopes: []
    },
    'economy.optimize': {
      category: 'economy',
      icon: '📈',
      requiredParams: [],
      optionalParams: ['marginTarget'],
      scopes: ['economy.optimize']
    },
    'trip.search': {
      category: 'travel',
      icon: '✈️',
      requiredParams: ['place', 'days', 'pax'],
      optionalParams: ['checkIn', 'checkOut'],
      scopes: []
    },
    'insights.price-trend': {
      category: 'insights',
      icon: '📊',
      requiredParams: [],
      optionalParams: ['sku', 'category'],
      scopes: ['insights.read']
    },
    'esg.calculate-carbon': {
      category: 'esg',
      icon: '🌱',
      requiredParams: [],
      optionalParams: ['orderId', 'shipmentId'],
      scopes: ['esg.read']
    },
    'product.sync': {
      category: 'commerce',
      icon: '🛍️',
      requiredParams: ['vendor'],
      optionalParams: ['sku', 'products'],
      scopes: ['economy.optimize']
    },
    'menu.update': {
      category: 'delivery',
      icon: '🍔',
      requiredParams: ['vendor'],
      optionalParams: ['menuItems'],
      scopes: ['economy.optimize']
    }
  };

  // Export to window
  window.IntentDictionaries = {
    synonyms: synonyms,
    patterns: patterns,
    actionMetadata: actionMetadata
  };

})(window);
