/**
 * Vercel Serverless Function Entry Point
 * Wraps Express server.js for Vercel deployment
 *
 * @description This file exports the Express app as a Vercel serverless function
 * @author AILYDIAN DevOps Team
 * @version 1.2.0
 *
 * IMPORTANT: This wrapper ensures server.js initialization completes before handling requests
 */

const { applySanitization } = require('./_middleware/sanitize');

// Set Vercel-specific environment
process.env.VERCEL = '1';
process.env.IS_SERVERLESS = 'true';

let app;
let appInitialized = false;

// Lazy-load the app to handle initialization properly
function getApp() {
  if (!app) {
    try {
      console.log('[Vercel] Initializing Express app...');
      app = require('../server.js');
      appInitialized = true;
      console.log('[Vercel] Express app initialized successfully');
    } catch (error) {
      console.error('[Vercel] Failed to initialize Express app:', error);
      throw error;
    }
  }
  return app;
}

// Export a handler function for Vercel
module.exports = (req, res) => {
  applySanitization(req, res);
  try {
    const expressApp = getApp();

    // Handle the request with Express
    expressApp(req, res);
  } catch (error) {
    console.error('[Vercel] Request handling error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process request',
      timestamp: new Date().toISOString(),
    });
  }
};
