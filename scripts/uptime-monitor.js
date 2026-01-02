#!/usr/bin/env node
// ============================================================================
// AILYDIAN - Uptime Monitoring Script
// ============================================================================
// Simple uptime monitoring for production health endpoints.
// Can be run as a cron job or used with UptimeRobot/Pingdom.
// ============================================================================

/* global URL */

const https = require('https');
const http = require('http');

// ============================================================================
// Configuration
// ============================================================================

const config = {
  // Primary production URL
  productionUrl: process.env.PRODUCTION_URL || 'https://www.ailydian.com',

  // Endpoints to monitor
  endpoints: [
    {
      name: 'Main Site',
      path: '/',
      expectedStatus: [200, 301, 302],
      timeout: 10000,
    },
    {
      name: 'Health Check (All Services)',
      path: '/api/services/health',
      expectedStatus: [200],
      timeout: 10000,
      checkBody: true,
      expectedBodyContains: 'OK',
    },
    {
      name: 'Service Discovery',
      path: '/api/services',
      expectedStatus: [200],
      timeout: 10000,
    },
  ],

  // Notification settings
  notifications: {
    console: true, // Always log to console
    webhook: process.env.UPTIME_WEBHOOK_URL, // Optional: Slack/Discord webhook
    email: process.env.UPTIME_EMAIL, // Optional: Email notifications
  },

  // Retry settings
  retries: 3,
  retryDelay: 5000, // 5 seconds
};

// ============================================================================
// HTTP Request Helper
// ============================================================================

function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.get(
      url,
      {
        timeout,
        headers: {
          'User-Agent': 'AILYDIAN-Uptime-Monitor/1.0',
        },
      },
      (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
          });
        });
      }
    );

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// ============================================================================
// Health Check Functions
// ============================================================================

async function checkEndpoint(endpoint, retryCount = 0) {
  const url = `${config.productionUrl}${endpoint.path}`;

  try {
    console.log(`🔍 Checking: ${endpoint.name} (${url})`);

    const response = await makeRequest(url, endpoint.timeout);

    // Check status code
    if (!endpoint.expectedStatus.includes(response.statusCode)) {
      throw new Error(
        `Unexpected status code: ${response.statusCode} (expected: ${endpoint.expectedStatus.join(' or ')})`
      );
    }

    // Check body if required
    if (endpoint.checkBody && endpoint.expectedBodyContains) {
      if (!response.body.includes(endpoint.expectedBodyContains)) {
        throw new Error(`Response body does not contain: "${endpoint.expectedBodyContains}"`);
      }
    }

    console.log(`✅ ${endpoint.name}: OK (${response.statusCode})`);

    return {
      success: true,
      endpoint: endpoint.name,
      url,
      statusCode: response.statusCode,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ ${endpoint.name}: ${error.message}`);

    // Retry logic
    if (retryCount < config.retries) {
      console.log(
        `🔄 Retrying ${endpoint.name} (${retryCount + 1}/${config.retries}) in ${config.retryDelay / 1000}s...`
      );
      await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
      return checkEndpoint(endpoint, retryCount + 1);
    }

    return {
      success: false,
      endpoint: endpoint.name,
      url,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

async function checkAllEndpoints() {
  console.log('════════════════════════════════════════════════════');
  console.log('🚀 AILYDIAN Uptime Monitor');
  console.log(`   Production: ${config.productionUrl}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log('════════════════════════════════════════════════════\n');

  const results = [];

  for (const endpoint of config.endpoints) {
    const result = await checkEndpoint(endpoint);
    results.push(result);
  }

  return results;
}

// ============================================================================
// Notification Functions
// ============================================================================

async function sendWebhookNotification(results) {
  if (!config.notifications.webhook) {
    return;
  }

  const failedChecks = results.filter((r) => !r.success);

  if (failedChecks.length === 0) {
    return; // Don't send notifications for successful checks
  }

  const message = {
    text: `🚨 AILYDIAN Uptime Alert`,
    attachments: [
      {
        color: 'danger',
        fields: failedChecks.map((check) => ({
          title: check.endpoint,
          value: check.error,
          short: false,
        })),
        footer: 'AILYDIAN Uptime Monitor',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await makeRequest(config.notifications.webhook, 5000, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    console.log('📧 Webhook notification sent');
  } catch (error) {
    console.error('❌ Failed to send webhook notification:', error.message);
  }
}

function printSummary(results) {
  console.log('\n════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('════════════════════════════════════════════════════');

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  console.log(`✅ Successful: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${failureCount}/${results.length}`);

  if (failureCount > 0) {
    console.log('\n🚨 FAILED CHECKS:');
    results
      .filter((r) => !r.success)
      .forEach((check) => {
        console.log(`   • ${check.endpoint}: ${check.error}`);
      });
  }

  console.log('════════════════════════════════════════════════════\n');

  // Exit code
  process.exit(failureCount > 0 ? 1 : 0);
}

// ============================================================================
// CLI Arguments
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    url: null,
    json: false,
    watch: false,
    interval: 60000, // 1 minute
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        options.url = args[++i];
        break;
      case '--json':
        options.json = true;
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--interval':
        options.interval = parseInt(args[++i], 10) * 1000;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
AILYDIAN Uptime Monitor
=======================

Usage:
  node scripts/uptime-monitor.js [options]

Options:
  --url <url>          Production URL to monitor (default: https://www.ailydian.com)
  --json               Output results as JSON
  --watch              Continuously monitor (runs every --interval)
  --interval <seconds> Interval between checks in watch mode (default: 60)
  --help, -h           Show this help message

Environment Variables:
  PRODUCTION_URL       Production URL to monitor
  UPTIME_WEBHOOK_URL   Webhook URL for notifications (Slack/Discord)
  UPTIME_EMAIL         Email address for notifications

Examples:
  # Single check
  node scripts/uptime-monitor.js

  # Check custom URL
  node scripts/uptime-monitor.js --url https://staging.ailydian.com

  # Continuous monitoring (every 30 seconds)
  node scripts/uptime-monitor.js --watch --interval 30

  # Output as JSON
  node scripts/uptime-monitor.js --json

Cron Examples:
  # Check every 5 minutes
  */5 * * * * cd /path/to/ailydian && node scripts/uptime-monitor.js

  # Check every hour
  0 * * * * cd /path/to/ailydian && node scripts/uptime-monitor.js
`);
}

// ============================================================================
// Main Function
// ============================================================================

async function main() {
  const options = parseArgs();

  // Override production URL if provided
  if (options.url) {
    config.productionUrl = options.url;
  }

  // Watch mode (continuous monitoring)
  if (options.watch) {
    console.log(`🔁 Watch mode enabled (interval: ${options.interval / 1000}s)\n`);

    while (true) {
      const results = await checkAllEndpoints();

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        printSummary(results);
      }

      // Send notifications
      await sendWebhookNotification(results);

      console.log(`⏳ Next check in ${options.interval / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, options.interval));
    }
  }

  // Single check
  const results = await checkAllEndpoints();

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    process.exit(results.some((r) => !r.success) ? 1 : 0);
  } else {
    // Send notifications
    await sendWebhookNotification(results);

    printSummary(results);
  }
}

// ============================================================================
// Run
// ============================================================================

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

// ============================================================================
// Exports (for testing)
// ============================================================================

module.exports = {
  checkEndpoint,
  checkAllEndpoints,
  config,
};
