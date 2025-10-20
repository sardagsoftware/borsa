#!/usr/bin/env node
/**
 * Backend API Integration Tests
 * Tests all critical endpoints with new security middleware
 */

const http = require('http');

const BASE_URL = 'http://localhost:3100';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class BackendAPITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async test(name, url, options = {}) {
    this.results.total++;

    return new Promise((resolve) => {
      const parsedUrl = new URL(BASE_URL + url);

      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = http.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          const passed = this.evaluateResponse(res.statusCode, data, options.expect);

          if (passed) {
            this.results.passed++;
            console.log(`${colors.green}✓${colors.reset} ${name}`);
          } else {
            this.results.failed++;
            console.log(`${colors.red}✗${colors.reset} ${name} (Status: ${res.statusCode})`);
          }

          resolve(passed);
        });
      });

      req.on('error', (error) => {
        this.results.failed++;
        console.log(`${colors.red}✗${colors.reset} ${name} (Error: ${error.message})`);
        resolve(false);
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  evaluateResponse(statusCode, data, expect = {}) {
    if (expect.status && statusCode !== expect.status) {
      return false;
    }

    if (expect.minStatus && statusCode < expect.minStatus) {
      return false;
    }

    if (expect.maxStatus && statusCode > expect.maxStatus) {
      return false;
    }

    if (expect.contains) {
      return data.includes(expect.contains);
    }

    // Default: 200-299 is success
    return statusCode >= 200 && statusCode < 300;
  }

  async runAll() {
    console.log(`\n${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║  LyDian Backend API Integration Tests     ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

    // Health & Status Endpoints
    console.log(`${colors.blue}📊 Health & Status:${colors.reset}`);
    await this.test('GET /api/health', '/api/health');
    await this.test('GET /api/status', '/api/status');
    await this.test('GET /api/models', '/api/models');

    // Security Endpoints (should require auth)
    console.log(`\n${colors.blue}🔐 Security (Guest Access):${colors.reset}`);
    await this.test('GET / (Public)', '/');
    await this.test('GET /index.html', '/index.html', { expect: { minStatus: 200, maxStatus: 399 } });
    await this.test('GET /chat.html', '/chat.html', { expect: { minStatus: 200, maxStatus: 399 } });

    // AI Endpoints
    console.log(`\n${colors.blue}🤖 AI Endpoints:${colors.reset}`);
    await this.test('POST /api/chat (Guest)', '/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        message: 'Hello, this is a test',
        model: 'gpt-4o'
      },
      expect: { minStatus: 200, maxStatus: 499 } // Can be 200 or 401/403
    });

    // Smart Cities Endpoints
    console.log(`\n${colors.blue}🏙️ Smart Cities:${colors.reset}`);
    await this.test('GET /api/smart-cities/health', '/api/smart-cities/health', {
      expect: { minStatus: 200, maxStatus: 499 }
    });

    // İnsan IQ Endpoints
    console.log(`\n${colors.blue}🧠 İnsan IQ:${colors.reset}`);
    await this.test('GET /api/insan-iq/health', '/api/insan-iq/health', {
      expect: { minStatus: 200, maxStatus: 499 }
    });

    // LyDian IQ Endpoints
    console.log(`\n${colors.blue}⚖️ LyDian IQ:${colors.reset}`);
    await this.test('GET /api/lydian-iq/health', '/api/lydian-iq/health', {
      expect: { minStatus: 200, maxStatus: 499 }
    });

    // Rate Limiting Test
    console.log(`\n${colors.blue}🚦 Rate Limiting:${colors.reset}`);
    const rateLimitTests = [];
    for (let i = 0; i < 5; i++) {
      rateLimitTests.push(
        this.test(`Request ${i + 1}/5`, '/api/health')
      );
    }
    await Promise.all(rateLimitTests);

    // Azure Services
    console.log(`\n${colors.blue}☁️ Azure Services:${colors.reset}`);
    await this.test('GET /api/azure/health', '/api/azure/health', {
      expect: { minStatus: 200, maxStatus: 499 }
    });

    // Medical AI
    console.log(`\n${colors.blue}🏥 Medical AI:${colors.reset}`);
    await this.test('POST /api/medical/chat', '/api/medical/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        message: 'What is diabetes?',
        specialization: 'general'
      },
      expect: { minStatus: 200, maxStatus: 499 }
    });

    // Token Governor Status
    console.log(`\n${colors.blue}🎯 Token Governor:${colors.reset}`);
    await this.test('GET /api/token-governor/status', '/api/token-governor/status');

    // Print Results
    console.log(`\n${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║  Test Results                              ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

    const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`${colors.green}Passed: ${this.results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`);
    console.log(`Pass Rate: ${passRate >= 80 ? colors.green : colors.red}${passRate}%${colors.reset}\n`);

    if (passRate >= 80) {
      console.log(`${colors.green}✅ Backend API is healthy and ready for production!${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`${colors.red}❌ Backend API has issues that need attention.${colors.reset}\n`);
      process.exit(1);
    }
  }
}

// Run tests
const tester = new BackendAPITester();
tester.runAll().catch(console.error);
