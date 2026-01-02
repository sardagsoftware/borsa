#!/usr/bin/env node
// ============================================================================
// AILYDIAN - Automated Security Audit Script
// ============================================================================
// Comprehensive security audit tool for production deployments.
// Checks for vulnerabilities, misconfigurations, and security best practices.
// ============================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// Configuration
// ============================================================================

const config = {
  // Paths to scan
  paths: {
    env: '.env',
    envExample: '.env.example',
    packageJson: 'package.json',
    packageLockJson: 'package-lock.json',
    srcDirs: ['server.js', 'api/', 'middleware/', 'services/', 'routes/'],
  },

  // Security checks
  checks: {
    npmAudit: true,
    secretScanning: true,
    dependencyCheck: true,
    owaspCompliance: true,
    sslConfiguration: true,
    securityHeaders: true,
  },

  // Thresholds
  thresholds: {
    criticalVulnerabilities: 0, // Max allowed critical vulnerabilities
    highVulnerabilities: 5, // Max allowed high vulnerabilities
    secretStrengthMin: 32, // Min length for secrets
  },

  // Excluded patterns
  exclude: {
    files: ['node_modules', '.git', 'dist', 'build', 'coverage', 'ops/backups'],
    secrets: [
      'EXAMPLE_',
      'TEST_',
      'DEMO_',
      'your-',
      'your_',
      'sk-test-',
      'InstrumentationKey=your-',
    ],
  },
};

// ============================================================================
// Audit Results
// ============================================================================

class AuditResults {
  constructor() {
    this.passed = [];
    this.warnings = [];
    this.failures = [];
    this.info = [];
    this.vulnerabilities = {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
    };
  }

  addPass(check, message) {
    this.passed.push({ check, message });
  }

  addWarning(check, message) {
    this.warnings.push({ check, message });
  }

  addFailure(check, message) {
    this.failures.push({ check, message });
  }

  addInfo(check, message) {
    this.info.push({ check, message });
  }

  get hasFailures() {
    return this.failures.length > 0;
  }

  get hasCriticalIssues() {
    return (
      this.vulnerabilities.critical > config.thresholds.criticalVulnerabilities ||
      this.vulnerabilities.high > config.thresholds.highVulnerabilities
    );
  }
}

const results = new AuditResults();

// ============================================================================
// Helper Functions
// ============================================================================

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return error.stdout || error.message;
  }
}

function fileExists(filepath) {
  return fs.existsSync(path.resolve(filepath));
}

function readFile(filepath) {
  try {
    return fs.readFileSync(path.resolve(filepath), 'utf8');
  } catch {
    return null;
  }
}

function isExcluded(filepath) {
  return config.exclude.files.some(pattern => filepath.includes(pattern));
}

// ============================================================================
// Security Checks
// ============================================================================

/**
 * Check 1: npm audit - Dependency vulnerabilities
 */
function checkNpmAudit() {
  console.log('\n🔍 Running npm audit...');

  try {
    const auditOutput = exec('npm audit --json');
    const audit = JSON.parse(auditOutput);

    // Parse vulnerabilities
    if (audit.metadata && audit.metadata.vulnerabilities) {
      const vulns = audit.metadata.vulnerabilities;
      results.vulnerabilities.critical = vulns.critical || 0;
      results.vulnerabilities.high = vulns.high || 0;
      results.vulnerabilities.moderate = vulns.moderate || 0;
      results.vulnerabilities.low = vulns.low || 0;

      if (vulns.critical > 0) {
        results.addFailure('npm-audit', `Found ${vulns.critical} CRITICAL vulnerabilities`);
      }
      if (vulns.high > config.thresholds.highVulnerabilities) {
        results.addFailure(
          'npm-audit',
          `Found ${vulns.high} HIGH vulnerabilities (threshold: ${config.thresholds.highVulnerabilities})`
        );
      }
      if (vulns.moderate > 0) {
        results.addWarning('npm-audit', `Found ${vulns.moderate} MODERATE vulnerabilities`);
      }
      if (vulns.low > 0) {
        results.addInfo('npm-audit', `Found ${vulns.low} LOW vulnerabilities`);
      }

      if (vulns.critical === 0 && vulns.high === 0) {
        results.addPass('npm-audit', 'No critical or high vulnerabilities found');
      }
    } else {
      results.addPass('npm-audit', 'No vulnerabilities found');
    }
  } catch (error) {
    results.addWarning('npm-audit', `npm audit failed: ${error.message}`);
  }
}

/**
 * Check 2: Secret scanning
 */
function checkSecrets() {
  console.log('\n🔍 Scanning for exposed secrets...');

  // Patterns to detect secrets
  const secretPatterns = [
    { name: 'AWS Keys', pattern: /AKIA[0-9A-Z]{16}/g },
    { name: 'Private Keys', pattern: /-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/g },
    { name: 'Generic API Keys', pattern: /[a-zA-Z0-9_-]{32,}/g },
    { name: 'JWT Tokens', pattern: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g },
  ];

  let foundSecrets = 0;

  // Scan source files
  const scanDirs = config.paths.srcDirs.filter(dir => fileExists(dir));

  scanDirs.forEach(dir => {
    try {
      const files = exec(`find ${dir} -type f -name "*.js" 2>/dev/null`).split('\n');

      files.forEach(file => {
        if (!file || isExcluded(file)) return;

        const content = readFile(file);
        if (!content) return;

        secretPatterns.forEach(({ name, pattern }) => {
          const matches = content.match(pattern);
          if (matches && matches.length > 0) {
            // Filter out example/test secrets
            const realSecrets = matches.filter(
              match => !config.exclude.secrets.some(ex => match.includes(ex))
            );

            if (realSecrets.length > 0) {
              results.addFailure(
                'secret-scanning',
                `Potential ${name} found in ${file} (${realSecrets.length} matches)`
              );
              foundSecrets += realSecrets.length;
            }
          }
        });
      });
    } catch {
      // Skip directories that don't exist
    }
  });

  if (foundSecrets === 0) {
    results.addPass('secret-scanning', 'No exposed secrets detected in source code');
  }
}

/**
 * Check 3: .env file validation
 */
function checkEnvFile() {
  console.log('\n🔍 Validating environment configuration...');

  // Check if .env exists
  if (!fileExists(config.paths.env)) {
    results.addWarning('env-validation', '.env file not found (this is OK for production)');
    return;
  }

  // Check if .env is in .gitignore
  if (fileExists('.gitignore')) {
    const gitignore = readFile('.gitignore');
    if (!gitignore.includes('.env')) {
      results.addFailure('env-validation', '.env is NOT in .gitignore - SECURITY RISK!');
    } else {
      results.addPass('env-validation', '.env is properly ignored by git');
    }
  }

  // Validate secret strength
  const envContent = readFile(config.paths.env);
  const secretLines = envContent
    .split('\n')
    .filter(line => line.includes('SECRET') || line.includes('KEY') || line.includes('TOKEN'));

  let weakSecrets = 0;

  secretLines.forEach(line => {
    const [key, value] = line.split('=');
    if (!value) return;

    // Skip example secrets
    if (config.exclude.secrets.some(ex => value.includes(ex))) return;

    // Check secret length
    if (value.length < config.thresholds.secretStrengthMin) {
      results.addWarning(
        'env-validation',
        `Weak secret detected: ${key} (length: ${value.length}, min: ${config.thresholds.secretStrengthMin})`
      );
      weakSecrets++;
    }
  });

  if (weakSecrets === 0) {
    results.addPass('env-validation', 'All secrets meet minimum strength requirements');
  }
}

/**
 * Check 4: OWASP Top 10 compliance
 */
function checkOwaspCompliance() {
  console.log('\n🔍 Checking OWASP Top 10 compliance...');

  const checks = [
    {
      name: 'A01:2021 - Broken Access Control',
      files: ['middleware/rbac.js', 'middleware/auth-governance.js'],
      pass: 'Access control middleware detected',
      fail: 'Missing access control middleware',
    },
    {
      name: 'A02:2021 - Cryptographic Failures',
      files: ['middleware/encryption.js', 'middleware/enforce-https.js'],
      pass: 'Encryption middleware detected',
      fail: 'Missing encryption middleware',
    },
    {
      name: 'A03:2021 - Injection',
      files: ['middleware/input-validation.js'],
      pass: 'Input validation middleware detected',
      fail: 'Missing input validation middleware',
    },
    {
      name: 'A05:2021 - Security Misconfiguration',
      files: ['middleware/security-headers.js', 'middleware/security.js'],
      pass: 'Security headers middleware detected',
      fail: 'Missing security headers middleware',
    },
    {
      name: 'A07:2021 - Identification and Authentication Failures',
      files: ['middleware/session-secure-config.js', 'middleware/cookie-auth.js'],
      pass: 'Session management middleware detected',
      fail: 'Missing session management middleware',
    },
    {
      name: 'A09:2021 - Security Logging and Monitoring Failures',
      files: ['middleware/audit-logger.js', 'services/monitoring-telemetry-service.js'],
      pass: 'Logging and monitoring detected',
      fail: 'Missing logging and monitoring',
    },
  ];

  checks.forEach(check => {
    const exists = check.files.some(file => fileExists(file));
    if (exists) {
      results.addPass('owasp-compliance', `${check.name}: ${check.pass}`);
    } else {
      results.addWarning('owasp-compliance', `${check.name}: ${check.fail}`);
    }
  });
}

/**
 * Check 5: Security headers validation
 */
function checkSecurityHeaders() {
  console.log('\n🔍 Validating security headers configuration...');

  const securityFile = 'middleware/security-headers.js';

  if (!fileExists(securityFile)) {
    results.addFailure('security-headers', 'Security headers middleware not found');
    return;
  }

  const content = readFile(securityFile);
  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'Permissions-Policy',
    'Referrer-Policy',
  ];

  requiredHeaders.forEach(header => {
    if (content.includes(header)) {
      results.addPass('security-headers', `${header} configured`);
    } else {
      results.addWarning('security-headers', `${header} not found`);
    }
  });

  // Check for unsafe CSP directives
  if (content.includes("'unsafe-eval'")) {
    results.addFailure('security-headers', "CSP contains 'unsafe-eval' - SECURITY RISK!");
  } else {
    results.addPass('security-headers', "CSP does not contain 'unsafe-eval'");
  }
}

/**
 * Check 6: Dependency check
 */
function checkDependencies() {
  console.log('\n🔍 Checking dependencies...');

  if (!fileExists(config.paths.packageJson)) {
    results.addFailure('dependency-check', 'package.json not found');
    return;
  }

  const packageJson = JSON.parse(readFile(config.paths.packageJson));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // Check for outdated dependencies
  try {
    const outdated = exec('npm outdated --json');
    if (outdated.trim()) {
      const outdatedPackages = JSON.parse(outdated);
      const count = Object.keys(outdatedPackages).length;
      if (count > 0) {
        results.addWarning('dependency-check', `${count} outdated dependencies found`);
      }
    } else {
      results.addPass('dependency-check', 'All dependencies are up to date');
    }
  } catch {
    results.addInfo('dependency-check', 'Could not check for outdated dependencies');
  }

  // Check for critical security packages
  const securityPackages = ['helmet', 'csurf', 'express-rate-limit', '@sentry/node'];
  securityPackages.forEach(pkg => {
    if (dependencies[pkg]) {
      results.addPass('dependency-check', `Security package ${pkg} installed`);
    } else {
      results.addWarning('dependency-check', `Security package ${pkg} not installed`);
    }
  });
}

// ============================================================================
// Report Generation
// ============================================================================

function printReport() {
  console.log('\n' + '='.repeat(80));
  console.log('🛡️  SECURITY AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(80));

  // Vulnerabilities summary
  console.log('\n📊 VULNERABILITY SUMMARY:');
  console.log(`   Critical: ${results.vulnerabilities.critical}`);
  console.log(`   High:     ${results.vulnerabilities.high}`);
  console.log(`   Moderate: ${results.vulnerabilities.moderate}`);
  console.log(`   Low:      ${results.vulnerabilities.low}`);

  // Passed checks
  if (results.passed.length > 0) {
    console.log('\n✅ PASSED CHECKS:');
    results.passed.forEach(({ check, message }) => {
      console.log(`   ✓ [${check}] ${message}`);
    });
  }

  // Warnings
  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(({ check, message }) => {
      console.log(`   ! [${check}] ${message}`);
    });
  }

  // Failures
  if (results.failures.length > 0) {
    console.log('\n❌ FAILURES:');
    results.failures.forEach(({ check, message }) => {
      console.log(`   ✗ [${check}] ${message}`);
    });
  }

  // Info
  if (results.info.length > 0) {
    console.log('\nℹ️  INFORMATION:');
    results.info.forEach(({ check, message }) => {
      console.log(`   ℹ [${check}] ${message}`);
    });
  }

  // Final summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 SUMMARY:');
  console.log(`   Passed:   ${results.passed.length}`);
  console.log(`   Warnings: ${results.warnings.length}`);
  console.log(`   Failures: ${results.failures.length}`);

  if (results.hasCriticalIssues) {
    console.log('\n🚨 CRITICAL ISSUES DETECTED - DEPLOYMENT BLOCKED!');
  } else if (results.hasFailures) {
    console.log('\n⚠️  FAILURES DETECTED - REVIEW REQUIRED');
  } else if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS DETECTED - REVIEW RECOMMENDED');
  } else {
    console.log('\n✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT');
  }

  console.log('='.repeat(80) + '\n');
}

function generateJsonReport() {
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vulnerabilities: results.vulnerabilities,
    checks: {
      passed: results.passed,
      warnings: results.warnings,
      failures: results.failures,
      info: results.info,
    },
    summary: {
      passed: results.passed.length,
      warnings: results.warnings.length,
      failures: results.failures.length,
      hasCriticalIssues: results.hasCriticalIssues,
      hasFailures: results.hasFailures,
    },
  };

  return JSON.stringify(report, null, 2);
}

// ============================================================================
// Main Function
// ============================================================================

async function main() {
  console.log('🔒 AILYDIAN Security Audit');
  console.log('Starting comprehensive security audit...\n');

  // Run all checks
  if (config.checks.npmAudit) checkNpmAudit();
  if (config.checks.secretScanning) checkSecrets();
  if (config.checks.dependencyCheck) checkDependencies();
  if (config.checks.owaspCompliance) checkOwaspCompliance();
  if (config.checks.securityHeaders) checkSecurityHeaders();
  checkEnvFile();

  // Print report
  printReport();

  // Output JSON if requested
  if (process.argv.includes('--json')) {
    console.log(generateJsonReport());
  }

  // Exit with appropriate code
  if (results.hasCriticalIssues) {
    process.exit(2); // Critical issues
  } else if (results.hasFailures) {
    process.exit(1); // Failures
  } else {
    process.exit(0); // Success
  }
}

// ============================================================================
// Run
// ============================================================================

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Security audit failed:', error);
    process.exit(1);
  });
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  runAudit: main,
  AuditResults,
  config,
};
