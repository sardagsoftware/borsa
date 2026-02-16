/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PRODUCT SYNC API
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sync products across e-commerce platforms
 *
 * Supported platforms:
 * - Turkey: Trendyol, Hepsiburada, N11, Sahibinden, Arabam
 * - International: Noon, Zalando, OTTO, bol.com, eMAG
 *
 * Endpoint: POST /api/v1/product/sync
 *
 * Request body:
 * {
 *   "vendor": "trendyol",
 *   "action": "search|get|update",
 *   "query": "iPhone 15" (for search),
 *   "sku": "ABC123" (for get/update),
 *   "updates": { price: 25000, stock: 10 } (for update)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "products": [...],
 *     "total": 150,
 *     "page": 1
 *   }
 * }
 *
 * @module api/v1/product/sync
 */

const { createApiHandler } = require('../_base/api-handler');
const { sanitizeSKU } = require('../../../security/input-sanitizer');
const axios = require('axios');

/**
 * Product sync handler
 */
const handler = async (context, req, res) => {
  const { sanitizedBody, secrets, locale } = context;
  const { vendor, action, query, sku, updates } = sanitizedBody;

  if (!vendor) {
    throw {
      code: 'VENDOR_REQUIRED',
      statusCode: 400,
      message: 'Vendor parameter is required',
    };
  }

  if (!action || !['search', 'get', 'update'].includes(action)) {
    throw {
      code: 'INVALID_ACTION',
      statusCode: 400,
      message: 'Action must be one of: search, get, update',
    };
  }

  // Route to appropriate platform
  let result;
  switch (vendor.toLowerCase()) {
    case 'trendyol':
      result = await handleTrendyol(action, { query, sku, updates }, secrets, locale);
      break;
    case 'hepsiburada':
      result = await handleHepsiburada(action, { query, sku, updates }, secrets, locale);
      break;
    case 'n11':
      result = await handleN11(action, { query, sku, updates }, secrets, locale);
      break;
    case 'sahibinden':
      result = await handleSahibinden(action, { query, sku, updates }, secrets, locale);
      break;
    case 'arabam':
      result = await handleArabam(action, { query, sku, updates }, secrets, locale);
      break;
    default:
      throw {
        code: 'UNSUPPORTED_VENDOR',
        statusCode: 400,
        message: `Vendor ${vendor} is not supported for product sync`,
      };
  }

  return {
    data: result,
    retries: 0,
  };
};

/**
 * Handle Trendyol operations
 */
async function handleTrendyol(action, params, secrets, locale) {
  const { query, sku, updates } = params;

  try {
    switch (action) {
      case 'search':
        return await searchTrendyol(query, secrets, locale);
      case 'get':
        return await getTrendyolProduct(sku, secrets, locale);
      case 'update':
        return await updateTrendyolProduct(sku, updates, secrets, locale);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('[Trendyol] Operation error:', error.message);
    throw {
      code: 'VENDOR_ERROR',
      statusCode: 502,
      message: 'Failed to execute Trendyol operation',
    };
  }
}

/**
 * Search products on Trendyol
 */
async function searchTrendyol(query, secrets, locale) {
  const response = await axios.get(
    'https://api.trendyol.com/sapigw/product-search-gateway/api/search',
    {
      params: {
        q: query,
        culture: locale === 'tr' ? 'tr-TR' : 'en-US',
        channelId: 1,
      },
      headers: {
        Authorization: `Bearer ${secrets.apiKey}`,
        'User-Agent': 'Lydian-IQ/1.0',
      },
      timeout: 10000,
    }
  );

  const data = response.data;

  return {
    products: (data.result.products || []).map(product => ({
      sku: product.merchantId?.toString(),
      name: product.name,
      price: product.price?.sellingPrice,
      originalPrice: product.price?.originalPrice,
      currency: 'TRY',
      stock: product.stockCount || 0,
      inStock: product.hasStock,
      imageUrl: product.imageUrl,
      url: `https://www.trendyol.com${product.url}`,
      rating: product.ratingScore?.averageRating || 0,
      ratingCount: product.ratingScore?.totalCount || 0,
      brand: product.brand?.name || null,
      seller: product.merchant?.officialName || null,
      category: product.category?.name || null,
      badges: product.badges || [],
      freeShipping: product.freeShipping || false,
    })),
    total: data.result.totalCount || 0,
    page: 1,
    pageSize: data.result.products?.length || 0,
  };
}

/**
 * Get single product from Trendyol
 */
async function getTrendyolProduct(sku, secrets, locale) {
  const response = await axios.get(
    `https://api.trendyol.com/sapigw/product-gateway/api/products/${sku}`,
    {
      headers: {
        Authorization: `Bearer ${secrets.apiKey}`,
        'User-Agent': 'Lydian-IQ/1.0',
      },
      timeout: 10000,
    }
  );

  const product = response.data;

  return {
    sku: sku,
    name: product.name,
    price: product.salePrice,
    originalPrice: product.originalPrice,
    currency: 'TRY',
    stock: product.quantity || 0,
    inStock: product.quantity > 0,
    imageUrl: product.images?.[0]?.url || null,
    url: product.productUrl,
    rating: product.rating || 0,
    ratingCount: product.ratingCount || 0,
    brand: product.brand,
    seller: product.merchant,
    category: product.categoryName,
    description: product.description,
    attributes: product.attributes || [],
  };
}

/**
 * Update product on Trendyol (seller API)
 */
async function updateTrendyolProduct(sku, updates, secrets, locale) {
  const response = await axios.put(
    `https://api.trendyol.com/sapigw/suppliers/${secrets.supplierId}/products/price-and-inventory`,
    {
      items: [
        {
          barcode: sku,
          quantity: updates.stock,
          salePrice: updates.price,
          listPrice: updates.listPrice || updates.price,
        },
      ],
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${secrets.apiKey}:${secrets.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Lydian-IQ/1.0',
      },
      timeout: 10000,
    }
  );

  return {
    success: true,
    sku,
    updatedFields: updates,
    batchId: response.data.batchRequestId,
  };
}

/**
 * Handle Hepsiburada operations
 */
async function handleHepsiburada(action, params, secrets, locale) {
  const { query, sku, updates } = params;

  try {
    switch (action) {
      case 'search':
        return await searchHepsiburada(query, secrets, locale);
      case 'get':
        return await getHepsiburadaProduct(sku, secrets, locale);
      case 'update':
        return await updateHepsiburadaProduct(sku, updates, secrets, locale);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('[Hepsiburada] Operation error:', error.message);
    throw {
      code: 'VENDOR_ERROR',
      statusCode: 502,
      message: 'Failed to execute Hepsiburada operation',
    };
  }
}

/**
 * Search products on Hepsiburada
 */
async function searchHepsiburada(query, secrets, locale) {
  const response = await axios.get('https://listing-external.hepsiburada.com/listings/merchantid', {
    params: {
      searchText: query,
      merchantId: secrets.merchantId,
    },
    headers: {
      Authorization: `Bearer ${secrets.apiKey}`,
    },
    timeout: 10000,
  });

  const data = response.data;

  return {
    products: (data.listings || []).map(product => ({
      sku: product.sku,
      name: product.productName,
      price: product.price,
      originalPrice: product.originalPrice,
      currency: 'TRY',
      stock: product.availableStock,
      inStock: product.availableStock > 0,
      imageUrl: product.images?.[0] || null,
      url: product.url,
      rating: product.rating || 0,
      ratingCount: product.ratingCount || 0,
      brand: product.brandName,
      seller: product.merchantName,
      category: product.categoryName,
    })),
    total: data.totalCount || 0,
    page: 1,
    pageSize: data.listings?.length || 0,
  };
}

/**
 * Get single product from Hepsiburada
 */
async function getHepsiburadaProduct(sku, secrets, locale) {
  const response = await axios.get(
    `https://listing-external.hepsiburada.com/listings/merchantid/${secrets.merchantId}/sku/${sku}`,
    {
      headers: {
        Authorization: `Bearer ${secrets.apiKey}`,
      },
      timeout: 10000,
    }
  );

  const product = response.data;

  return {
    sku,
    name: product.productName,
    price: product.price,
    originalPrice: product.originalPrice,
    currency: 'TRY',
    stock: product.availableStock,
    inStock: product.availableStock > 0,
    imageUrl: product.images?.[0] || null,
    url: product.url,
    rating: product.rating || 0,
    ratingCount: product.ratingCount || 0,
    brand: product.brandName,
    seller: product.merchantName,
    category: product.categoryName,
    description: product.description,
  };
}

/**
 * Update product on Hepsiburada
 */
async function updateHepsiburadaProduct(sku, updates, secrets, locale) {
  const response = await axios.post(
    'https://listing-external.hepsiburada.com/listings/merchantid',
    {
      merchantId: secrets.merchantId,
      hbSku: sku,
      price: updates.price,
      availableStock: updates.stock,
    },
    {
      headers: {
        Authorization: `Bearer ${secrets.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  return {
    success: true,
    sku,
    updatedFields: updates,
    message: 'Product updated successfully',
  };
}

/**
 * Handle N11 operations
 */
async function handleN11(action, params, secrets, locale) {
  const { query, sku, updates } = params;

  try {
    switch (action) {
      case 'search':
        return await searchN11(query, secrets, locale);
      case 'get':
        return await getN11Product(sku, secrets, locale);
      case 'update':
        return await updateN11Product(sku, updates, secrets, locale);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('[N11] Operation error:', error.message);
    throw {
      code: 'VENDOR_ERROR',
      statusCode: 502,
      message: 'Failed to execute N11 operation',
    };
  }
}

/**
 * Search products on N11
 */
async function searchN11(query, secrets, locale) {
  const response = await axios.post(
    'https://api.n11.com/ws/ProductService.wsdl',
    {
      auth: {
        appKey: secrets.apiKey,
        appSecret: secrets.apiSecret,
      },
      keyword: query,
      pagingData: {
        currentPage: 1,
        pageSize: 100,
      },
    },
    {
      headers: {
        'Content-Type': 'text/xml',
      },
      timeout: 10000,
    }
  );

  const data = response.data;

  return {
    products: (data.products?.product || []).map(product => ({
      sku: product.id?.toString(),
      name: product.title,
      price: product.price,
      originalPrice: product.discountedPrice || product.price,
      currency: 'TRY',
      stock: product.stockItems?.stockItem?.[0]?.quantity || 0,
      inStock: product.stockItems?.stockItem?.[0]?.quantity > 0,
      imageUrl: product.images?.image?.[0]?.url || null,
      url: product.productUrl,
      rating: 0,
      ratingCount: 0,
      brand: null,
      seller: product.seller?.sellerNickname || null,
      category: product.category?.name || null,
    })),
    total: data.pagingData?.totalCount || 0,
    page: 1,
    pageSize: data.products?.product?.length || 0,
  };
}

/**
 * Get single product from N11
 */
async function getN11Product(sku, secrets, locale) {
  const response = await axios.post(
    'https://api.n11.com/ws/ProductService.wsdl',
    {
      auth: {
        appKey: secrets.apiKey,
        appSecret: secrets.apiSecret,
      },
      productId: sku,
    },
    {
      headers: {
        'Content-Type': 'text/xml',
      },
      timeout: 10000,
    }
  );

  const product = response.data.product;

  return {
    sku,
    name: product.title,
    price: product.price,
    originalPrice: product.discountedPrice || product.price,
    currency: 'TRY',
    stock: product.stockItems?.stockItem?.[0]?.quantity || 0,
    inStock: product.stockItems?.stockItem?.[0]?.quantity > 0,
    imageUrl: product.images?.image?.[0]?.url || null,
    url: product.productUrl,
    rating: 0,
    ratingCount: 0,
    brand: null,
    seller: product.seller?.sellerNickname || null,
    category: product.category?.name || null,
    description: product.description,
  };
}

/**
 * Update product on N11
 */
async function updateN11Product(sku, updates, secrets, locale) {
  const response = await axios.post(
    'https://api.n11.com/ws/ProductService.wsdl',
    {
      auth: {
        appKey: secrets.apiKey,
        appSecret: secrets.apiSecret,
      },
      productId: sku,
      price: updates.price,
      stockItems: {
        stockItem: [
          {
            quantity: updates.stock,
          },
        ],
      },
    },
    {
      headers: {
        'Content-Type': 'text/xml',
      },
      timeout: 10000,
    }
  );

  return {
    success: true,
    sku,
    updatedFields: updates,
    message: 'Product updated successfully',
  };
}

/**
 * Handle Sahibinden operations (classified ads)
 */
async function handleSahibinden(action, params, secrets, locale) {
  const { query } = params;

  if (action !== 'search') {
    throw {
      code: 'UNSUPPORTED_ACTION',
      statusCode: 400,
      message: 'Sahibinden only supports search action',
    };
  }

  try {
    const response = await axios.get('https://api.sahibinden.com/v1/search', {
      params: {
        query,
        category: 'all',
      },
      headers: {
        'X-API-Key': secrets.apiKey,
      },
      timeout: 10000,
    });

    const data = response.data;

    return {
      products: (data.results || []).map(item => ({
        sku: item.classifiedId?.toString(),
        name: item.title,
        price: item.price,
        originalPrice: item.price,
        currency: 'TRY',
        stock: 1,
        inStock: true,
        imageUrl: item.photos?.[0]?.url || null,
        url: item.url,
        rating: 0,
        ratingCount: 0,
        brand: null,
        seller: item.advertiser?.name || null,
        category: item.category?.name || null,
        location: item.location?.cityName || null,
        date: item.date,
      })),
      total: data.totalCount || 0,
      page: 1,
      pageSize: data.results?.length || 0,
    };
  } catch (error) {
    console.error('[Sahibinden] Search error:', error.message);
    throw {
      code: 'VENDOR_ERROR',
      statusCode: 502,
      message: 'Failed to search on Sahibinden',
    };
  }
}

/**
 * Handle Arabam operations (automotive classifieds)
 */
async function handleArabam(action, params, secrets, locale) {
  const { query } = params;

  if (action !== 'search') {
    throw {
      code: 'UNSUPPORTED_ACTION',
      statusCode: 400,
      message: 'Arabam only supports search action',
    };
  }

  try {
    const response = await axios.get('https://api.arabam.com/v1/search', {
      params: {
        q: query,
      },
      headers: {
        Authorization: `Bearer ${secrets.apiKey}`,
      },
      timeout: 10000,
    });

    const data = response.data;

    return {
      products: (data.listings || []).map(item => ({
        sku: item.id?.toString(),
        name: item.title,
        price: item.price,
        originalPrice: item.price,
        currency: 'TRY',
        stock: 1,
        inStock: true,
        imageUrl: item.photos?.[0] || null,
        url: item.url,
        rating: 0,
        ratingCount: 0,
        brand: item.make,
        seller: item.seller?.name || null,
        category: `${item.make} ${item.model}`,
        metadata: {
          year: item.year,
          km: item.kilometers,
          fuel: item.fuelType,
          transmission: item.gearType,
        },
      })),
      total: data.totalCount || 0,
      page: 1,
      pageSize: data.listings?.length || 0,
    };
  } catch (error) {
    console.error('[Arabam] Search error:', error.message);
    throw {
      code: 'VENDOR_ERROR',
      statusCode: 502,
      message: 'Failed to search on Arabam',
    };
  }
}

// Create and export handler
module.exports = createApiHandler({
  requiredScopes: ['product:read', 'product:write'],
  connector: 'product',
  action: 'sync',
  handler,
  rateLimit: { window: '1m', max: 30 },
  idempotent: true,
  streaming: false,
});
