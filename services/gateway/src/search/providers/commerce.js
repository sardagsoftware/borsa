/**
 * Commerce Search Provider - REAL DATA
 * Searches across e-commerce platforms using real APIs
 */

const axios = require('axios');

async function search(query, lang, limit) {
  const results = [];

  // Search Trendyol via real API
  try {
    const trendyolRes = await axios.post('/api/v1/product/sync', {
      vendor: 'trendyol',
      action: 'search',
      query: query
    }, {
      baseURL: process.env.API_BASE_URL || 'http://localhost:3100',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (trendyolRes.data.success && trendyolRes.data.data?.products?.length > 0) {
      const products = trendyolRes.data.data.products.slice(0, 2);
      results.push(...products.map(product => ({
        type: 'product',
        vendor: 'trendyol',
        title: `${product.name} - Trendyol`,
        snippet: lang === 'tr'
          ? `${product.price} ${product.currency} - ${product.inStock ? 'Stokta' : 'Tükendi'}`
          : `${product.price} ${product.currency} - ${product.inStock ? 'In Stock' : 'Out of Stock'}`,
        url: product.url || `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}`,
        score: 0.9,
        payload: {
          sku: product.sku,
          price: product.price,
          originalPrice: product.originalPrice,
          currency: product.currency,
          inStock: product.inStock,
          stock: product.stock,
          imageUrl: product.imageUrl,
          rating: product.rating,
          ratingCount: product.ratingCount,
          brand: product.brand,
          seller: product.seller,
          freeShipping: product.freeShipping || false
        }
      })));
    }
  } catch (error) {
    console.error('[Commerce Search] Trendyol error:', error.message);
    // Fallback to direct URL if API fails
    results.push({
      type: 'product',
      vendor: 'trendyol',
      title: `${query} - Trendyol`,
      snippet: lang === 'tr' ? 'Arama sonuçlarını görüntüle' : 'View search results',
      url: `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}`,
      score: 0.85,
      payload: { searchFallback: true }
    });
  }

  // Search Hepsiburada via real API
  try {
    const hbRes = await axios.post('/api/v1/product/sync', {
      vendor: 'hepsiburada',
      action: 'search',
      query: query
    }, {
      baseURL: process.env.API_BASE_URL || 'http://localhost:3100',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (hbRes.data.success && hbRes.data.data?.products?.length > 0) {
      const products = hbRes.data.data.products.slice(0, 2);
      results.push(...products.map(product => ({
        type: 'product',
        vendor: 'hepsiburada',
        title: `${product.name} - Hepsiburada`,
        snippet: lang === 'tr'
          ? `${product.price} ${product.currency} - ${product.inStock ? 'Stokta' : 'Tükendi'}`
          : `${product.price} ${product.currency} - ${product.inStock ? 'In Stock' : 'Out of Stock'}`,
        url: product.url || `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}`,
        score: 0.88,
        payload: {
          sku: product.sku,
          price: product.price,
          originalPrice: product.originalPrice,
          currency: product.currency,
          inStock: product.inStock,
          stock: product.stock,
          imageUrl: product.imageUrl,
          rating: product.rating,
          ratingCount: product.ratingCount,
          brand: product.brand,
          seller: product.seller
        }
      })));
    }
  } catch (error) {
    console.error('[Commerce Search] Hepsiburada error:', error.message);
    // Fallback to direct URL
    results.push({
      type: 'product',
      vendor: 'hepsiburada',
      title: `${query} - Hepsiburada`,
      snippet: lang === 'tr' ? 'Arama sonuçlarını görüntüle' : 'View search results',
      url: `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}`,
      score: 0.83,
      payload: { searchFallback: true }
    });
  }

  // Search N11 via real API
  try {
    const n11Res = await axios.post('/api/v1/product/sync', {
      vendor: 'n11',
      action: 'search',
      query: query
    }, {
      baseURL: process.env.API_BASE_URL || 'http://localhost:3100',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (n11Res.data.success && n11Res.data.data?.products?.length > 0) {
      const product = n11Res.data.data.products[0];
      results.push({
        type: 'product',
        vendor: 'n11',
        title: `${product.name} - N11`,
        snippet: lang === 'tr'
          ? `${product.price} ${product.currency}`
          : `${product.price} ${product.currency}`,
        url: product.url || `https://www.n11.com/arama?q=${encodeURIComponent(query)}`,
        score: 0.82,
        payload: {
          sku: product.sku,
          price: product.price,
          currency: product.currency,
          inStock: product.inStock,
          imageUrl: product.imageUrl,
          seller: product.seller
        }
      });
    }
  } catch (error) {
    console.error('[Commerce Search] N11 error:', error.message);
  }

  return results.slice(0, limit);
}

module.exports = {
  search
};
