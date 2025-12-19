/**
 * 🎯 PENETRATION TESTING FRAMEWORK
 * ==================================
 *
 * Enterprise-level penetration testing tool
 * White Hat Security - Authorized Testing Only
 *
 * Tests:
 * - SQL Injection
 * - XSS Attacks
 * - CSRF Vulnerabilities
 * - Authentication Bypass
 * - API Security
 * - Rate Limiting
 * - Input Validation
 * - Session Management
 */

const axios = require('axios');
const crypto = require('crypto');

class PenetrationTester {
  constructor(baseURL) {
    this.baseURL = baseURL || 'http://localhost:3000';
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      score: 0
    };
  }

  // ========================================
  // SQL INJECTION TESTS
  // ========================================
  async testSQLInjection() {
    console.log('\n🔍 Testing SQL Injection Protection...');

    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users--",
      "' UNION SELECT * FROM users--",
      "admin'--",
      "' OR 1=1--",
      "1' AND '1'='1",
      "\\x27 OR 1=1--"
    ];

    let vulnerabilities = 0;

    for (const payload of sqlPayloads) {
      try {
        const response = await axios.post(`${this.baseURL}/api/auth/login`, {
          username: payload,
          password: payload
        }, { validateStatus: () => true });

        // Check if SQL injection was successful
        if (response.status === 200 && response.data.success) {
          this.results.failed.push({
            test: 'SQL Injection',
            payload,
            severity: 'CRITICAL',
            description: 'SQL Injection vulnerability detected'
          });
          vulnerabilities++;
        }
      } catch (error) {
        // Error is good - means payload was rejected
      }
    }

    if (vulnerabilities === 0) {
      this.results.passed.push({
        test: 'SQL Injection Protection',
        status: 'SECURE',
        description: 'All SQL injection attempts blocked'
      });
      this.results.score += 15;
    }
  }

  // ========================================
  // XSS TESTS
  // ========================================
  async testXSS() {
    console.log('\n🔍 Testing XSS Protection...');

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
      '"><script>alert(String.fromCharCode(88,83,83))</script>'
    ];

    let vulnerabilities = 0;

    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(`${this.baseURL}/api/unified-ai`, {
          message: payload
        }, { validateStatus: () => true });

        // Check if payload is reflected without sanitization
        if (response.data.response && response.data.response.includes(payload)) {
          this.results.failed.push({
            test: 'XSS Protection',
            payload,
            severity: 'HIGH',
            description: 'XSS payload reflected without sanitization'
          });
          vulnerabilities++;
        }
      } catch (error) {
        // Error is acceptable
      }
    }

    if (vulnerabilities === 0) {
      this.results.passed.push({
        test: 'XSS Protection',
        status: 'SECURE',
        description: 'All XSS attempts sanitized'
      });
      this.results.score += 15;
    }
  }

  // ========================================
  // AUTHENTICATION TESTS
  // ========================================
  async testAuthentication() {
    console.log('\n🔍 Testing Authentication Security...');

    // Test 1: Weak password acceptance
    const weakPasswords = ['123456', 'password', 'admin', '12345678'];
    let weakPasswordAccepted = false;

    for (const pwd of weakPasswords) {
      try {
        const response = await axios.post(`${this.baseURL}/api/auth/register`, {
          email: `test${Date.now()}@test.com`,
          password: pwd
        }, { validateStatus: () => true });

        if (response.status === 200 || response.status === 201) {
          weakPasswordAccepted = true;
          break;
        }
      } catch (error) {}
    }

    if (weakPasswordAccepted) {
      this.results.warnings.push({
        test: 'Password Policy',
        severity: 'MEDIUM',
        description: 'Weak passwords are accepted'
      });
    } else {
      this.results.passed.push({
        test: 'Password Policy',
        status: 'SECURE',
        description: 'Strong password policy enforced'
      });
      this.results.score += 10;
    }

    // Test 2: Brute force protection
    const attempts = [];
    for (let i = 0; i < 10; i++) {
      try {
        const response = await axios.post(`${this.baseURL}/api/auth/login`, {
          username: 'nonexistent@user.com',
          password: `wrongpass${i}`
        }, { validateStatus: () => true });

        attempts.push(response.status);
      } catch (error) {}
    }

    // Check if rate limiting kicked in
    if (attempts.filter(s => s === 429).length > 0) {
      this.results.passed.push({
        test: 'Brute Force Protection',
        status: 'SECURE',
        description: 'Rate limiting active'
      });
      this.results.score += 15;
    } else {
      this.results.warnings.push({
        test: 'Brute Force Protection',
        severity: 'HIGH',
        description: 'No rate limiting detected'
      });
    }
  }

  // ========================================
  // API SECURITY TESTS
  // ========================================
  async testAPISecurity() {
    console.log('\n🔍 Testing API Security...');

    // Test 1: Missing authentication header
    try {
      const response = await axios.get(`${this.baseURL}/api/telemetry/models`, {
        validateStatus: () => true
      });

      if (response.status === 200) {
        this.results.warnings.push({
          test: 'API Authentication',
          severity: 'HIGH',
          description: 'Protected endpoint accessible without auth'
        });
      } else {
        this.results.passed.push({
          test: 'API Authentication',
          status: 'SECURE',
          description: 'Authentication required'
        });
        this.results.score += 10;
      }
    } catch (error) {}

    // Test 2: CORS configuration
    try {
      const response = await axios.options(`${this.baseURL}/api/unified-ai`, {
        headers: {
          'Origin': 'http://malicious-site.com',
          'Access-Control-Request-Method': 'POST'
        },
        validateStatus: () => true
      });

      const corsHeader = response.headers['access-control-allow-origin'];
      if (corsHeader === '*') {
        this.results.warnings.push({
          test: 'CORS Configuration',
          severity: 'MEDIUM',
          description: 'CORS allows all origins (*)'
        });
      } else {
        this.results.passed.push({
          test: 'CORS Configuration',
          status: 'SECURE',
          description: 'CORS properly configured'
        });
        this.results.score += 5;
      }
    } catch (error) {}
  }

  // ========================================
  // INPUT VALIDATION TESTS
  // ========================================
  async testInputValidation() {
    console.log('\n🔍 Testing Input Validation...');

    const maliciousInputs = [
      { type: 'oversized', data: 'A'.repeat(1000000) }, // 1MB string
      { type: 'null-byte', data: 'test\x00.pdf' },
      { type: 'path-traversal', data: '../../../etc/passwd' },
      { type: 'command-injection', data: '; cat /etc/passwd' },
      { type: 'xxe', data: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>' }
    ];

    let blocked = 0;

    for (const input of maliciousInputs) {
      try {
        const response = await axios.post(`${this.baseURL}/api/unified-ai`, {
          message: input.data
        }, {
          validateStatus: () => true,
          timeout: 5000
        });

        if (response.status === 400 || response.status === 413) {
          blocked++;
        }
      } catch (error) {
        if (error.code === 'ECONNABORTED') {
          blocked++;
        }
      }
    }

    if (blocked >= maliciousInputs.length - 1) {
      this.results.passed.push({
        test: 'Input Validation',
        status: 'SECURE',
        description: 'Malicious inputs properly validated'
      });
      this.results.score += 15;
    } else {
      this.results.warnings.push({
        test: 'Input Validation',
        severity: 'MEDIUM',
        description: `Only ${blocked}/${maliciousInputs.length} malicious inputs blocked`
      });
    }
  }

  // ========================================
  // SECURITY HEADERS TEST
  // ========================================
  async testSecurityHeaders() {
    console.log('\n🔍 Testing Security Headers...');

    try {
      const response = await axios.get(this.baseURL, {
        validateStatus: () => true
      });

      const requiredHeaders = {
        'strict-transport-security': 'HSTS',
        'x-content-type-options': 'X-Content-Type-Options',
        'x-frame-options': 'X-Frame-Options',
        'content-security-policy': 'CSP',
        'x-xss-protection': 'X-XSS-Protection'
      };

      let headersPresent = 0;
      const missing = [];

      for (const [header, name] of Object.entries(requiredHeaders)) {
        if (response.headers[header]) {
          headersPresent++;
        } else {
          missing.push(name);
        }
      }

      if (headersPresent === Object.keys(requiredHeaders).length) {
        this.results.passed.push({
          test: 'Security Headers',
          status: 'SECURE',
          description: 'All security headers present'
        });
        this.results.score += 10;
      } else {
        this.results.warnings.push({
          test: 'Security Headers',
          severity: 'MEDIUM',
          description: `Missing headers: ${missing.join(', ')}`
        });
      }
    } catch (error) {
      this.results.warnings.push({
        test: 'Security Headers',
        severity: 'LOW',
        description: 'Could not check headers'
      });
    }
  }

  // ========================================
  // RUN ALL TESTS
  // ========================================
  async runAllTests() {
    console.log('🎯 PENETRATION TESTING FRAMEWORK');
    console.log('================================');
    console.log(`Target: ${this.baseURL}`);
    console.log(`Started: ${new Date().toISOString()}\n`);

    await this.testSecurityHeaders();
    await this.testInputValidation();
    await this.testAPISecurity();
    await this.testAuthentication();
    await this.testXSS();
    await this.testSQLInjection();

    this.generateReport();
  }

  // ========================================
  // GENERATE REPORT
  // ========================================
  generateReport() {
    console.log('\n\n📊 PENETRATION TEST REPORT');
    console.log('==========================\n');

    console.log(`✅ Passed Tests: ${this.results.passed.length}`);
    this.results.passed.forEach(test => {
      console.log(`   - ${test.test}: ${test.description}`);
    });

    console.log(`\n⚠️  Warnings: ${this.results.warnings.length}`);
    this.results.warnings.forEach(warning => {
      console.log(`   - [${warning.severity}] ${warning.test}: ${warning.description}`);
    });

    console.log(`\n❌ Failed Tests: ${this.results.failed.length}`);
    this.results.failed.forEach(failure => {
      console.log(`   - [${failure.severity}] ${failure.test}: ${failure.description}`);
    });

    console.log(`\n📈 Security Score: ${this.results.score}/100`);

    let rating = 'F';
    if (this.results.score >= 90) rating = 'A+';
    else if (this.results.score >= 80) rating = 'A';
    else if (this.results.score >= 70) rating = 'B';
    else if (this.results.score >= 60) rating = 'C';
    else if (this.results.score >= 50) rating = 'D';

    console.log(`📊 Security Rating: ${rating}`);

    console.log(`\n✅ Test Completed: ${new Date().toISOString()}`);

    return {
      score: this.results.score,
      rating,
      passed: this.results.passed.length,
      warnings: this.results.warnings.length,
      failed: this.results.failed.length
    };
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new PenetrationTester(process.argv[2]);
  tester.runAllTests().catch(console.error);
}

module.exports = PenetrationTester;
