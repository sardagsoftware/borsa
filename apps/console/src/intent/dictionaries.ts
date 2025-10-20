/**
 * 📚 Intent Dictionaries - 72 Connectors (TR + International)
 * 
 * Vendor mappings, keywords, and domain-specific vocabularies
 * All lowercase, Turkish-normalized
 * 
 * @module intent/dictionaries
 */

// ============================================================================
// 🇹🇷 TURKEY - 23 Connectors
// ============================================================================

export const VENDORS_TR_ECOMMERCE = [
  // Major marketplaces
  'trendyol', 'ty', 'trendy',
  'hepsiburada', 'hb', 'hepsi',
  'n11', 'n on bir',
  'temu', 'temu turkey',
  
  // Classifieds
  'sahibinden', 'shb', 'sahibin',
  'arabam', 'arabam.com',
];

export const VENDORS_TR_CARGO = [
  'aras', 'aras kargo',
  'yurtici', 'yurtiçi', 'yurtiçi kargo',
  'hepsijet', 'hepsi jet',
  'mng', 'mng kargo',
  'surat', 'sürat', 'sürat kargo',
  'ups', 'ups turkey',
];

export const VENDORS_TR_FOOD = [
  'getir',
  'yemeksepeti', 'ysepeti', 'yemek sepeti',
  'trendyol yemek', 'ty yemek',
];

export const VENDORS_TR_GROCERY = [
  'migros',
  'carrefoursa', 'carrefour', 'carrefour sa',
  'a101', 'a yüz bir',
  'bim', 'bİm',
  'sok', 'şok', 'şok market',
];

export const VENDORS_TR_FINANCE = [
  'hangikredi', 'hangi kredi',
];

export const VENDORS_TR_TRAVEL = [
  'jollytur', 'jolly tur',
  'enuygun', 'en uygun',
  'trivago', 'trivago turkey',
];

// ============================================================================
// 🌍 INTERNATIONAL - 49 Connectors
// ============================================================================

// 🇦🇿 Azerbaijan (4)
export const VENDORS_AZ = [
  'tap.az', 'tap',
  'turbo.az', 'turbo',
  'wolt azerbaijan', 'wolt az',
  'bolt food azerbaijan', 'bolt az',
];

// 🇶🇦 Qatar (6)
export const VENDORS_QA = [
  'talabat qatar', 'talabat qa',
  'snoonu',
  'carrefour qatar',
  'lulu qatar', 'lulu',
  'wolt qatar',
  'delivery hero qatar',
];

// 🇸🇦 Saudi Arabia (7)
export const VENDORS_SA = [
  'noon saudi', 'noon sa', 'noon',
  'haraj',
  'hungerstation', 'hunger station',
  'mrsool',
  'nana',
  'talabat saudi', 'talabat sa',
  'carrefour saudi',
];

// 🇨🇾 Cyprus (5)
export const VENDORS_CY = [
  'bazaraki',
  'foody cyprus', 'foody cy',
  'wolt cyprus',
  'alphamega',
  'deliveroo cyprus',
];

// 🇷🇺 Russia (6 - SANCTIONED)
export const VENDORS_RU = [
  'wildberries', 'wb',
  'ozon',
  'yandex market', 'yandex',
  'avito',
  'sbermegamarket', 'sber',
  'lamoda',
];

// 🇩🇪 Germany (6)
export const VENDORS_DE = [
  'zalando', 'zalando de',
  'otto', 'otto de',
  'lieferando', 'lieferando de',
  'rewe',
  'check24',
  'gorillas',
];

// 🇧🇬 Bulgaria (2)
export const VENDORS_BG = [
  'emag bulgaria', 'emag bg', 'emag',
  'olx bulgaria', 'olx bg',
];

// 🇦🇹 Austria (5)
export const VENDORS_AT = [
  'willhaben',
  'lieferando austria', 'lieferando at',
  'foodora austria', 'foodora at',
  'billa',
  'gurkerl',
];

// 🇳🇱 Netherlands (5)
export const VENDORS_NL = [
  'bol.com', 'bol', 'bol nl',
  'coolblue',
  'marktplaats',
  'thuisbezorgd',
  'albert heijn', 'ah', 'ah nl',
];

// 🤖 AI Providers (3)
export const VENDORS_AI = [
  'openai', 'gpt', 'chatgpt',
  'anthropic', 'claude',
  'google ai', 'gemini', 'google gemini',
];

// ============================================================================
// Combined Vendor List (All 72)
// ============================================================================

export const ALL_VENDORS = [
  ...VENDORS_TR_ECOMMERCE,
  ...VENDORS_TR_CARGO,
  ...VENDORS_TR_FOOD,
  ...VENDORS_TR_GROCERY,
  ...VENDORS_TR_FINANCE,
  ...VENDORS_TR_TRAVEL,
  ...VENDORS_AZ,
  ...VENDORS_QA,
  ...VENDORS_SA,
  ...VENDORS_CY,
  ...VENDORS_RU,
  ...VENDORS_DE,
  ...VENDORS_BG,
  ...VENDORS_AT,
  ...VENDORS_NL,
  ...VENDORS_AI,
];

// ============================================================================
// Action Keywords (Turkish + English)
// ============================================================================

export const KEYWORDS_SHIPMENT_TRACK = [
  // Turkish
  'takip', 'nerede', 'gör', 'sorgula', 'kontrol', 'bul',
  'kargo', 'gönderi', 'paket',
  // English
  'track', 'where', 'check', 'find', 'locate', 'status',
  'shipment', 'package', 'delivery',
];

export const KEYWORDS_PRODUCT_SYNC = [
  // Turkish
  'ürün', 'senkronize', 'güncelle', 'yükle', 'aktar',
  'katalog', 'envanter', 'stok',
  // English
  'product', 'sync', 'synchronize', 'update', 'upload',
  'catalog', 'inventory', 'stock',
];

export const KEYWORDS_PRICE_UPDATE = [
  // Turkish
  'fiyat', 'düşür', 'artır', 'güncelle', 'değiştir',
  'indirim', 'zam', 'ayarla',
  // English
  'price', 'decrease', 'increase', 'update', 'change',
  'discount', 'adjust', 'set',
];

export const KEYWORDS_INVENTORY_SYNC = [
  // Turkish
  'stok', 'envanter', 'senkronize', 'güncelle',
  'miktar', 'adet',
  // English
  'inventory', 'stock', 'sync', 'update',
  'quantity', 'count',
];

export const KEYWORDS_MENU_UPDATE = [
  // Turkish
  'menü', 'yemek', 'güncelle', 'ekle', 'çıkar',
  'restoran', 'cafe',
  // English
  'menu', 'food', 'update', 'add', 'remove',
  'restaurant', 'cafe',
];

export const KEYWORDS_LOAN_COMPARE = [
  // Turkish
  'kredi', 'kıyasla', 'karşılaştır', 'bul', 'hesapla',
  'taksit', 'faiz', 'ödeme',
  // English
  'loan', 'compare', 'find', 'calculate',
  'installment', 'interest', 'payment',
];

export const KEYWORDS_TRIP_SEARCH = [
  // Turkish
  'seyahat', 'tatil', 'uçuş', 'otel', 'tur',
  'rezervasyon', 'bilet', 'ara', 'bul',
  // English
  'travel', 'vacation', 'flight', 'hotel', 'tour',
  'reservation', 'ticket', 'search', 'find',
];

export const KEYWORDS_INSIGHTS = [
  // Turkish
  'analiz', 'trend', 'rapor', 'grafik', 'istatistik',
  'göster', 'görüntüle',
  // English
  'insight', 'trend', 'report', 'chart', 'analytics',
  'show', 'display', 'view',
];

export const KEYWORDS_ESG = [
  // Turkish
  'karbon', 'ayak izi', 'emisyon', 'çevre', 'sürdürülebilir',
  // English
  'carbon', 'footprint', 'emission', 'environment', 'sustainable',
  'esg', 'sustainability',
];

// ============================================================================
// Domain-Specific Patterns
// ============================================================================

export const PATTERNS = {
  // Tracking numbers
  trackingNumber: /\b\d{10,15}\b/,
  
  // Amounts
  amount: /\d+(?:[.,]\d+)?\s*(?:bin|k|m|tl|usd|eur|₺|\$|€)/i,
  
  // Percentages
  percentage: /(?:yuzde|percent|%)\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*%/i,
  
  // Dates
  date: /\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/,
  
  // Time
  time: /\d{1,2}:\d{2}(?::\d{2})?/,
};

// ============================================================================
// Vendor ID Mapping (normalized name → connector ID)
// ============================================================================

export const VENDOR_ID_MAP: Record<string, string> = {
  // TR - E-commerce
  'trendyol': 'trendyol-tr',
  'ty': 'trendyol-tr',
  'hepsiburada': 'hepsiburada-tr',
  'hb': 'hepsiburada-tr',
  'n11': 'n11-tr',
  'temu': 'temu-tr',
  'sahibinden': 'sahibinden-tr',
  'arabam': 'arabam-tr',
  
  // TR - Cargo
  'aras': 'aras-tr',
  'aras kargo': 'aras-tr',
  'yurtici': 'yurtici-tr',
  'yurtiçi': 'yurtici-tr',
  'hepsijet': 'hepsijet-tr',
  'mng': 'mng-tr',
  'surat': 'surat-tr',
  'sürat': 'surat-tr',
  'ups': 'ups-tr',
  
  // TR - Food
  'getir': 'getir-tr',
  'yemeksepeti': 'yemeksepeti-tr',
  'trendyol yemek': 'trendyol-yemek-tr',
  
  // TR - Grocery
  'migros': 'migros-tr',
  'carrefoursa': 'carrefoursa-tr',
  'a101': 'a101-tr',
  'bim': 'bim-tr',
  'sok': 'sok-tr',
  'şok': 'sok-tr',
  
  // TR - Finance
  'hangikredi': 'hangikredi-tr',
  
  // TR - Travel
  'jollytur': 'jollytur-tr',
  'enuygun': 'enuygun-tr',
  'trivago': 'trivago-tr',
  
  // International
  'tap.az': 'tap-az',
  'turbo.az': 'turbo-az',
  'wolt azerbaijan': 'wolt-az',
  'bolt food azerbaijan': 'bolt-food-az',
  
  'talabat qatar': 'talabat-qa',
  'snoonu': 'snoonu-qa',
  'carrefour qatar': 'carrefour-qa',
  'lulu': 'lulu-qa',
  
  'noon': 'noon-sa',
  'haraj': 'haraj-sa',
  'hungerstation': 'hungerstation-sa',
  'mrsool': 'mrsool-sa',
  'nana': 'nana-sa',
  
  'bazaraki': 'bazaraki-cy',
  'foody cyprus': 'foody-cy',
  'wolt cyprus': 'wolt-cy',
  'alphamega': 'alphamega-cy',
  
  'wildberries': 'wildberries-ru',
  'ozon': 'ozon-ru',
  'yandex market': 'yandex-market-ru',
  'avito': 'avito-ru',
  
  'zalando': 'zalando-de',
  'otto': 'otto-de',
  'lieferando': 'lieferando-de',
  'rewe': 'rewe-de',
  'check24': 'check24-de',
  'gorillas': 'gorillas-de',
  
  'emag': 'emag-bg',
  'olx bulgaria': 'olx-bg',
  
  'willhaben': 'willhaben-at',
  'foodora austria': 'foodora-at',
  'billa': 'billa-at',
  'gurkerl': 'gurkerl-at',
  
  'bol.com': 'bol-nl',
  'coolblue': 'coolblue-nl',
  'marktplaats': 'marktplaats-nl',
  'thuisbezorgd': 'thuisbezorgd-nl',
  'albert heijn': 'albert-heijn-nl',
  
  'openai': 'openai-ai',
  'anthropic': 'anthropic-ai',
  'google ai': 'google-ai',
};

console.log('✅ Intent dictionaries loaded (72 connectors, TR + International)');
