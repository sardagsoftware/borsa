/**
 * Vercel Serverless Function Entry Point
 * Wraps Express server.js for Vercel deployment
 *
 * @description This file exports the Express app as a Vercel serverless function
 * @author AILYDIAN DevOps Team
 * @version 1.0.0
 */

// Import the Express app from server.js
// Note: server.js must export `app` instead of calling `app.listen()`
const app = require('../server.js');

// Export as Vercel serverless function
module.exports = app;
