/**
 * 📚 Intent Dictionaries & Patterns
 * Synonyms and regex patterns for natural language understanding
 *
 * @author LyDian AI - Ultra Intelligence Platform
 */

/**
 * Synonym dictionaries by locale
 * Turkish is primary, others are essential translations
 */
export const synonyms = {
  tr: {
    shipment: ['kargo', 'gönderi', 'paket', 'kargom', 'takip', 'sevkiyat'],
    track: ['nerede', 'takip', 'durum', 'sorgula'],
    vendor: ['hepsijet', 'aras', 'yurtiçi', 'yurtici', 'mng', 'sürat', 'surat', 'ups'],
    loan: ['kredi', 'faiz', 'taksit', 'borç'],
    amount: ['tutar', 'miktar', 'para', '₺', 'tl', 'lira'],
    term: ['vade', 'ay', 'aylık', 'dönem'],
    price: ['fiyat', 'etiket', 'bedel', 'ücret', 'tarife'],
    optimize: ['optimiz', 'arttır', 'düşür', 'iyileştir', 'marj'],
    trip: ['otel', 'uçuş', 'seyahat', 'tatil', 'rezervasyon'],
    place: ['antalya', 'istanbul', 'izmir', 'bodrum', 'şehir'],
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
  },

  ru: {
    shipment: ['посылка', 'доставка', 'груз', 'отправление'],
    track: ['отслеживание', 'статус', 'где'],
    vendor: ['hepsijet', 'aras', 'yurtici', 'mng', 'surat', 'ups'],
    loan: ['кредит', 'заем', 'процент'],
    amount: ['сумма', 'деньги', 'цена'],
    term: ['срок', 'месяц', 'период'],
    price: ['цена', 'стоимость', 'тариф'],
    optimize: ['оптимизация', 'увеличить', 'уменьшить'],
    trip: ['отель', 'полет', 'путешествие'],
    place: ['анталья', 'стамбул', 'город'],
    esg: ['углерод', 'зеленый', 'экология'],
    insights: ['тренд', 'статистика', 'анализ'],
    product: ['продукт', 'запас', 'каталог'],
    order: ['заказ', 'клиент', 'продажа'],
    menu: ['меню', 'еда', 'ресторан']
  },

  de: {
    shipment: ['sendung', 'paket', 'lieferung', 'fracht'],
    track: ['verfolgen', 'status', 'wo'],
    vendor: ['hepsijet', 'aras', 'yurtici', 'mng', 'surat', 'ups'],
    loan: ['kredit', 'darlehen', 'zinsen'],
    amount: ['betrag', 'geld', 'preis'],
    term: ['laufzeit', 'monat', 'zeitraum'],
    price: ['preis', 'kosten', 'gebühr'],
    optimize: ['optimieren', 'erhöhen', 'reduzieren'],
    trip: ['hotel', 'flug', 'reise', 'urlaub'],
    place: ['antalya', 'istanbul', 'stadt'],
    esg: ['kohlenstoff', 'grün', 'umwelt'],
    insights: ['trend', 'statistik', 'analyse'],
    product: ['produkt', 'bestand', 'katalog'],
    order: ['bestellung', 'kunde', 'verkauf'],
    menu: ['menü', 'essen', 'restaurant']
  }
};

/**
 * Intent matching patterns by locale
 * Each pattern has:
 * - action: The action to trigger
 * - re: Regex pattern
 * - params: Parameter names to extract from regex groups
 * - reason: Optional human-readable explanation
 */
export const patterns = {
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
      re: /\b(kredi|faiz)\b.*?(\d[\d\.]{3,})\s*(?:tl|₺|lira)?\b.*?\b(\d{1,3})\s*(?:ay|aylık)/i,
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
    {
      action: 'economy.optimize',
      re: /\b(marj)\b.*?%?(\d+)/i,
      params: ['_ignore', 'marginTarget'],
      reason: 'Marj hedefi optimizasyonu'
    },

    // Trip search
    {
      action: 'trip.search',
      re: /\b(otel|seyahat|uçuş|tatil|rezervasyon)\b.*?\b([a-zçğıöşü\s]{3,})\b.*?(\d+)\s*(?:gece|gün)\b.*?(\d+)\s*(?:kişi|pax|yetişkin)/i,
      params: ['_ignore', 'place', 'days', 'pax'],
      reason: 'Otel/seyahat arama'
    },

    // Price trend insights
    {
      action: 'insights.price-trend',
      re: /\b(fiyat)\b.*?\b(trend|istatistik|analiz|grafik)/i,
      params: [],
      reason: 'Fiyat trend analizi'
    },

    // ESG Carbon calculation
    {
      action: 'esg.calculate-carbon',
      re: /\b(karbon|co2|yeşil|çevre)\b.*?\b(hesap|ölç|ayak izi)/i,
      params: [],
      reason: 'Karbon ayak izi hesaplama'
    },

    // Product sync
    {
      action: 'product.sync',
      re: /\b(ürün)\b.*?\b(yayınla|ekle|yükle|senkronize|sync)/i,
      params: [],
      reason: 'Ürün yayınlama'
    },

    // Menu update
    {
      action: 'menu.update',
      re: /\b(menü|yemek)\b.*?\b(güncelle|değiştir|düzenle)/i,
      params: [],
      reason: 'Menü güncelleme'
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
      re: /\b(loan|credit)\b.*?(\d[\d,]{3,})\s*(?:tl|₺)?\b.*?\b(\d{1,3})\s*(?:month|mo)/i,
      params: ['_ignore', 'amount', 'term'],
      reason: 'Loan comparison'
    },

    // Price optimization
    {
      action: 'economy.optimize',
      re: /\b(price|cost)\b.*?\b(optimize|increase|decrease|improve|margin)/i,
      params: [],
      reason: 'Price optimization'
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
    },

    // Loan comparison
    {
      action: 'loan.compare',
      re: /\b(قرض|ائتمان)\b.*?(\d[\d,]{3,})\s*(?:tl|₺)?\b.*?\b(\d{1,3})\s*شهر/i,
      params: ['_ignore', 'amount', 'term'],
      reason: 'مقارنة القروض'
    }
  ],

  ru: [
    // Shipment tracking
    {
      action: 'shipment.track',
      re: /\b(отслеживание|посылка|доставка)\b.*?\b(hepsijet|aras|yurtici|mng|surat|ups)\b.*?(\d{7,})/i,
      params: ['_ignore', 'vendor', 'trackingNo'],
      reason: 'Отслеживание посылки'
    },

    // Loan comparison
    {
      action: 'loan.compare',
      re: /\b(кредит|заем)\b.*?(\d[\d,]{3,})\s*(?:tl|₺)?\b.*?\b(\d{1,3})\s*(?:месяц)/i,
      params: ['_ignore', 'amount', 'term'],
      reason: 'Сравнение кредитов'
    }
  ],

  de: [
    // Shipment tracking
    {
      action: 'shipment.track',
      re: /\b(verfolgen|sendung|paket)\b.*?\b(hepsijet|aras|yurtici|mng|surat|ups)\b.*?(\d{7,})/i,
      params: ['_ignore', 'vendor', 'trackingNo'],
      reason: 'Sendungsverfolgung'
    },

    // Loan comparison
    {
      action: 'loan.compare',
      re: /\b(kredit|darlehen)\b.*?(\d[\d,]{3,})\s*(?:tl|₺)?\b.*?\b(\d{1,3})\s*(?:monat)/i,
      params: ['_ignore', 'amount', 'term'],
      reason: 'Kreditvergleich'
    }
  ]
};

/**
 * Action metadata (for UI hints, RBAC, etc.)
 */
export const actionMetadata = {
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
