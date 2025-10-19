// 🗂️ MENU API ROUTE - i18n Menu Data Provider
// Serves localized menu data for the mega dropdown navigation

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Cache for menu data (1 hour TTL)
const menuCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * @route   GET /api/menu
 * @desc    Get localized menu data
 * @query   lang - Language code (tr|en), defaults to 'en'
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const lang = req.query.lang || 'en';

    // Validate language code
    if (!['tr', 'en'].includes(lang)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid language code. Supported: tr, en'
      });
    }

    // Check cache first
    const cacheKey = `menu_${lang}`;
    const cached = menuCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
        lang
      });
    }

    // Load menu data from file
    const menuPath = path.join(__dirname, '../../data/menu', `${lang}.json`);
    const menuData = await fs.readFile(menuPath, 'utf-8');
    const menu = JSON.parse(menuData);

    // Update cache
    menuCache.set(cacheKey, {
      data: menu,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      data: menu,
      cached: false,
      lang
    });

  } catch (error) {
    console.error('Menu API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load menu data'
    });
  }
});

/**
 * @route   POST /api/menu/clear-cache
 * @desc    Clear menu cache (for development)
 * @access  Public
 */
router.post('/clear-cache', (req, res) => {
  menuCache.clear();
  res.json({
    success: true,
    message: 'Menu cache cleared'
  });
});

module.exports = router;
