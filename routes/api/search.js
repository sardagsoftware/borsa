// 🔍 SEARCH API ROUTE - Fuse.js Powered Search
// Provides fuzzy search across all pages and content

const express = require('express');
const router = express.Router();
const Fuse = require('fuse.js');
const path = require('path');
const fs = require('fs').promises;

// Search index cache
let searchIndex = null;
let lastIndexUpdate = null;
const INDEX_TTL = 3600000; // 1 hour

/**
 * Build search index from menu data and pages
 */
async function buildSearchIndex(lang = 'en') {
  try {
    const menuPath = path.join(__dirname, '../../data/menu', `${lang}.json`);
    const menuData = JSON.parse(await fs.readFile(menuPath, 'utf-8'));

    const searchData = [];

    // Index all menu items
    Object.entries(menuData).forEach(([category, categoryData]) => {
      categoryData.sections.forEach(section => {
        section.items.forEach(item => {
          searchData.push({
            title: item.label,
            description: item.description,
            icon: item.icon,
            href: item.href,
            badge: item.badge || null,
            category: categoryData.title,
            section: section.title,
            type: 'page'
          });
        });
      });
    });

    // Add common pages that might not be in menu
    const commonPages = [
      {
        title: 'LyDian AI Platform',
        description: 'Aurora frequencies with glass-glow interface',
        href: '/',
        category: 'Home',
        type: 'page'
      },
      {
        title: 'Dashboard',
        description: 'User dashboard and control panel',
        href: '/dashboard.html',
        category: 'User',
        type: 'page'
      }
    ];

    searchData.push(...commonPages);

    return searchData;

  } catch (error) {
    console.error('Search index build error:', error);
    return [];
  }
}

/**
 * Get or refresh search index
 */
async function getSearchIndex(lang = 'en') {
  const now = Date.now();

  // Return cached index if valid
  if (searchIndex && lastIndexUpdate && (now - lastIndexUpdate) < INDEX_TTL) {
    return searchIndex;
  }

  // Build new index
  const data = await buildSearchIndex(lang);

  const fuse = new Fuse(data, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'description', weight: 0.3 },
      { name: 'category', weight: 0.2 },
      { name: 'section', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true
  });

  searchIndex = fuse;
  lastIndexUpdate = now;

  return fuse;
}

/**
 * @route   GET /api/search
 * @desc    Search across all pages
 * @query   q - Search query (required)
 * @query   lang - Language code (tr|en), defaults to 'en'
 * @query   limit - Max results, defaults to 10
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const query = req.query.q;
    const lang = req.query.lang || 'en';
    const limit = parseInt(req.query.limit) || 10;

    // Validate query
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters'
      });
    }

    // Validate language
    if (!['tr', 'en'].includes(lang)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid language code. Supported: tr, en'
      });
    }

    // Get search index
    const fuse = await getSearchIndex(lang);

    // Perform search
    const results = fuse.search(query, { limit });

    // Format results
    const formattedResults = results.map(result => ({
      ...result.item,
      score: result.score,
      relevance: Math.round((1 - result.score) * 100) // Convert to percentage
    }));

    res.json({
      success: true,
      query,
      lang,
      count: formattedResults.length,
      results: formattedResults
    });

  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

/**
 * @route   POST /api/search/reindex
 * @desc    Force rebuild of search index
 * @access  Public
 */
router.post('/reindex', async (req, res) => {
  try {
    searchIndex = null;
    lastIndexUpdate = null;

    const lang = req.query.lang || 'en';
    await getSearchIndex(lang);

    res.json({
      success: true,
      message: 'Search index rebuilt',
      lang
    });

  } catch (error) {
    console.error('Reindex Error:', error);
    res.status(500).json({
      success: false,
      error: 'Reindex failed'
    });
  }
});

/**
 * @route   GET /api/search/stats
 * @desc    Get search index stats
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const fuse = await getSearchIndex(lang);
    const data = fuse._docs || [];

    res.json({
      success: true,
      stats: {
        totalDocuments: data.length,
        lastUpdate: lastIndexUpdate ? new Date(lastIndexUpdate).toISOString() : null,
        cacheAge: lastIndexUpdate ? Math.round((Date.now() - lastIndexUpdate) / 1000) : null,
        lang
      }
    });

  } catch (error) {
    console.error('Search stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats'
    });
  }
});

module.exports = router;
