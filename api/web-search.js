// Web Search API - Google Custom Search Integration
// Provides web search functionality with caching

const axios = require('axios');
const NodeCache = require('node-cache');
const { getCorsOrigin } = require('_middleware/cors');

// Google Custom Search Configuration
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || ''; // Optional custom search engine ID

// For production, you would use Google Custom Search API
// If GOOGLE_SEARCH_ENGINE_ID is not set, we'll use a generic search approach
const GOOGLE_CUSTOM_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';

// Cache configuration
const searchCache = new NodeCache({
  stdTTL: 3600, // Cache for 1 hour
  checkperiod: 600, // Check expired keys every 10 minutes
  maxKeys: 1000
});

// Rate limiting
const requestLog = new Map();
const RATE_LIMIT = 50; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

// Check rate limit
function checkRateLimit(userId = 'anonymous') {
  const now = Date.now();
  const userRequests = requestLog.get(userId) || [];

  const recentRequests = userRequests.filter(time => now - time < RATE_WINDOW);

  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }

  recentRequests.push(now);
  requestLog.set(userId, recentRequests);
  return true;
}

// Generate cache key
function getCacheKey(query, options) {
  return `search:${query}:${options.num || 10}:${options.start || 1}:${options.language || 'tr'}`;
}

// Format search results
function formatResults(items) {
  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items.map(item => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    displayLink: item.displayLink,
    formattedUrl: item.formattedUrl,
    image: item.pagemap?.cse_image?.[0]?.src || null,
    thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || null
  }));
}

// Main search handler
async function handleSearch(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // Validate API key
  if (!GOOGLE_AI_API_KEY) {
    console.error('❌ Google API key not configured');
    return res.status(500).json({
      success: false,
      error: 'Search API not configured',
      message: 'Please set GOOGLE_AI_API_KEY environment variable'
    });
  }

  // Rate limiting
  const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: `Maximum ${RATE_LIMIT} requests per minute`
    });
  }

  try {
    const {
      q: query,
      num = 10, // Number of results
      start = 1, // Starting index
      language = 'tr', // Search language
      safe = 'active', // Safe search
      nocache = false
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter required',
        message: 'Please provide a search query using ?q=your+search+term'
      });
    }

    console.log(`🔍 Search Request - Query: "${query}", Results: ${num}`);

    // Check cache unless nocache is specified
    const cacheKey = getCacheKey(query, { num, start, language });
    if (!nocache) {
      const cachedResults = searchCache.get(cacheKey);
      if (cachedResults) {
        console.log(`✅ Returning cached results for: "${query}"`);
        return res.status(200).json({
          success: true,
          cached: true,
          ...cachedResults
        });
      }
    }

    // Perform search
    let searchResults;

    if (GOOGLE_SEARCH_ENGINE_ID) {
      // Use Google Custom Search API (recommended for production)
      const searchUrl = `${GOOGLE_CUSTOM_SEARCH_URL}?key=${GOOGLE_AI_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=${num}&start=${start}&lr=lang_${language}&safe=${safe}`;

      const response = await axios.get(searchUrl, {
        timeout: 10000
      });

      searchResults = {
        query: query,
        totalResults: parseInt(response.data.searchInformation?.totalResults || 0),
        searchTime: parseFloat(response.data.searchInformation?.searchTime || 0),
        results: formatResults(response.data.items),
        resultCount: response.data.items?.length || 0
      };

    } else {
      // Fallback: Use DuckDuckGo Instant Answer API (free, no API key required)
      // Note: This is a basic implementation. For production, use Google Custom Search
      const duckduckgoUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

      const response = await axios.get(duckduckgoUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Ailydian-Ultra-Pro/1.0'
        }
      });

      const data = response.data;

      // Format DuckDuckGo results
      const results = [];

      // Abstract
      if (data.Abstract) {
        results.push({
          title: data.Heading || query,
          link: data.AbstractURL,
          snippet: data.Abstract,
          displayLink: data.AbstractSource,
          formattedUrl: data.AbstractURL,
          image: data.Image || null,
          thumbnail: null
        });
      }

      // Related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, num - 1).forEach(topic => {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0],
              link: topic.FirstURL,
              snippet: topic.Text,
              displayLink: new URL(topic.FirstURL).hostname,
              formattedUrl: topic.FirstURL,
              image: topic.Icon?.URL || null,
              thumbnail: null
            });
          }
        });
      }

      searchResults = {
        query: query,
        totalResults: results.length,
        searchTime: 0,
        results: results,
        resultCount: results.length,
        provider: 'DuckDuckGo'
      };

      // Add warning about using fallback
      if (results.length === 0) {
        return res.status(200).json({
          success: true,
          warning: 'Limited search results. For production use, configure GOOGLE_SEARCH_ENGINE_ID',
          query: query,
          results: [],
          resultCount: 0,
          message: 'Try using Google Custom Search API for better results'
        });
      }
    }

    // Cache results
    searchCache.set(cacheKey, searchResults);

    console.log(`✅ Search completed - ${searchResults.resultCount} results found`);

    res.status(200).json({
      success: true,
      cached: false,
      ...searchResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Search API Error:', error.message);

    // Handle specific errors
    if (error.response) {
      const status = error.response.status;

      if (status === 401 || status === 403) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Invalid Google API key or Custom Search Engine ID'
        });
      }

      if (status === 429) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          message: 'Google Custom Search API rate limit reached'
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Search request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Clear cache handler
async function clearCache(req, res) {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));

  try {
    const { query } = req.query;

    if (query) {
      // Clear specific query cache
      const keys = searchCache.keys();
      let cleared = 0;

      keys.forEach(key => {
        if (key.includes(query)) {
          searchCache.del(key);
          cleared++;
        }
      });

      res.status(200).json({
        success: true,
        message: `Cleared ${cleared} cached entries for query: ${query}`
      });
    } else {
      // Clear all cache
      searchCache.flushAll();
      res.status(200).json({
        success: true,
        message: 'All search cache cleared'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
}

// Get cache statistics
async function getCacheStats(req, res) {
  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req));

  try {
    const stats = searchCache.getStats();
    const keys = searchCache.keys();

    res.status(200).json({
      success: true,
      stats: {
        keys: stats.keys,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hits / (stats.hits + stats.misses) || 0,
        cachedQueries: keys.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
}

// Export handlers
module.exports = {
  handleSearch,
  clearCache,
  getCacheStats
};
