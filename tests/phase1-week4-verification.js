/**
 * Phase 1 Week 4 Verification Test
 * Tests all Week 4 features: Migrations, Suspicious Activity Detection, Analytics
 */

const Database = require('better-sqlite3');
const path = require('path');
const SuspiciousActivityDetector = require('../security/suspicious-activity-detector');

const DB_PATH = path.join(__dirname, '../database/ailydian.db');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║  Phase 1 Week 4 Verification Tests        ║', 'blue');
  log('╚════════════════════════════════════════════╝\n', 'blue');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Database Migrations
  log('Test 1: Database Migrations', 'cyan');
  try {
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    // Check if migrations table exists
    const migrationsTable = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'
    `).get();

    if (migrationsTable) {
      log('  ✓ Migrations table exists', 'green');

      // Check applied migrations
      const appliedMigrations = db.prepare('SELECT name FROM migrations ORDER BY id').all();
      log(`  ✓ Applied migrations: ${appliedMigrations.length}`, 'green');

      appliedMigrations.forEach(m => {
        log(`    - ${m.name}`, 'cyan');
      });

      passedTests++;
    } else {
      log('  ✗ Migrations table not found', 'red');
      failedTests++;
    }

    db.close();
  } catch (error) {
    log(`  ✗ Migration test failed: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 2: OAuth Columns
  log('\nTest 2: OAuth Columns in Users Table', 'cyan');
  try {
    const db = new Database(DB_PATH);

    const userSchema = db.prepare(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='users'
    `).get();

    const hasGoogleId = userSchema.sql.includes('googleId');
    const hasGithubId = userSchema.sql.includes('githubId');
    const hasBackupCodes = userSchema.sql.includes('twoFactorBackupCodes');

    if (hasGoogleId && hasGithubId && hasBackupCodes) {
      log('  ✓ All OAuth columns present', 'green');
      log('    - googleId ✓', 'green');
      log('    - githubId ✓', 'green');
      log('    - twoFactorBackupCodes ✓', 'green');
      passedTests++;
    } else {
      log('  ✗ Missing OAuth columns', 'red');
      if (!hasGoogleId) log('    - googleId ✗', 'red');
      if (!hasGithubId) log('    - githubId ✗', 'red');
      if (!hasBackupCodes) log('    - twoFactorBackupCodes ✗', 'red');
      failedTests++;
    }

    db.close();
  } catch (error) {
    log(`  ✗ OAuth columns test failed: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 3: Session OAuth Columns
  log('\nTest 3: OAuth Columns in Sessions Table', 'cyan');
  try {
    const db = new Database(DB_PATH);

    const sessionSchema = db.prepare(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='sessions'
    `).get();

    const hasSessionId = sessionSchema.sql.includes('sessionId');
    const hasProvider = sessionSchema.sql.includes('provider');
    const hasOAuthAccess = sessionSchema.sql.includes('oauthAccessToken');
    const hasOAuthRefresh = sessionSchema.sql.includes('oauthRefreshToken');

    if (hasSessionId && hasProvider && hasOAuthAccess && hasOAuthRefresh) {
      log('  ✓ All session OAuth columns present', 'green');
      log('    - sessionId ✓', 'green');
      log('    - provider ✓', 'green');
      log('    - oauthAccessToken ✓', 'green');
      log('    - oauthRefreshToken ✓', 'green');
      passedTests++;
    } else {
      log('  ✗ Missing session OAuth columns', 'red');
      failedTests++;
    }

    db.close();
  } catch (error) {
    log(`  ✗ Session OAuth columns test failed: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 4: Performance Indexes
  log('\nTest 4: Performance Indexes', 'cyan');
  try {
    const db = new Database(DB_PATH);

    const indexes = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'
    `).all();

    if (indexes.length >= 20) {
      log(`  ✓ Found ${indexes.length} performance indexes`, 'green');

      // Check for key indexes
      const indexNames = indexes.map(i => i.name);
      const keyIndexes = [
        'idx_users_email',
        'idx_users_googleId',
        'idx_users_githubId',
        'idx_sessions_sessionId',
        'idx_sessions_provider',
        'idx_activity_log_userId_createdAt'
      ];

      const missingIndexes = keyIndexes.filter(idx => !indexNames.includes(idx));

      if (missingIndexes.length === 0) {
        log('  ✓ All critical indexes present', 'green');
        passedTests++;
      } else {
        log('  ✗ Missing critical indexes:', 'red');
        missingIndexes.forEach(idx => log(`    - ${idx}`, 'red'));
        failedTests++;
      }
    } else {
      log(`  ✗ Insufficient indexes (found ${indexes.length}, expected 20+)`, 'red');
      failedTests++;
    }

    db.close();
  } catch (error) {
    log(`  ✗ Performance indexes test failed: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 5: Suspicious Activity Detector
  log('\nTest 5: Suspicious Activity Detection', 'cyan');
  try {
    const db = new Database(DB_PATH);
    const detector = new SuspiciousActivityDetector(db);

    // Create a test user and activity history
    const testUserId = 999999;

    // Test geographic anomaly detection (simulated)
    const assessment = await detector.analyzeLoginAttempt({
      userId: testUserId,
      ipAddress: '8.8.8.8', // Google DNS (California)
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      timestamp: new Date()
    });

    if (assessment && typeof assessment.riskScore === 'number') {
      log('  ✓ Risk assessment successful', 'green');
      log(`    - Risk Score: ${assessment.riskScore.toFixed(2)}`, 'cyan');
      log(`    - Risk Level: ${assessment.riskLevel}`, 'cyan');
      log(`    - Recommendation: ${assessment.recommendation}`, 'cyan');
      passedTests++;
    } else {
      log('  ✗ Risk assessment failed', 'red');
      failedTests++;
    }

    db.close();
  } catch (error) {
    log(`  ✗ Suspicious activity detection test failed: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 6: Activity Log Table
  log('\nTest 6: Activity Log Table', 'cyan');
  try {
    const db = new Database(DB_PATH);

    const activityLogTable = db.prepare(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='activity_log'
    `).get();

    if (activityLogTable) {
      log('  ✓ Activity log table exists', 'green');

      // Check row count
      const count = db.prepare('SELECT COUNT(*) as count FROM activity_log').get();
      log(`  ✓ Activity log entries: ${count.count}`, 'green');
      passedTests++;
    } else {
      log('  ✗ Activity log table not found', 'red');
      failedTests++;
    }

    db.close();
  } catch (error) {
    log(`  ✗ Activity log test failed: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 7: Migration Files Exist
  log('\nTest 7: Migration Files', 'cyan');
  try {
    const fs = require('fs');
    const migrationsDir = path.join(__dirname, '../database/migrations');

    const requiredMigrations = [
      '011_oauth_columns.sql',
      '011_oauth_columns_rollback.sql',
      '012_session_oauth_columns.sql',
      '012_session_oauth_columns_rollback.sql',
      '013_performance_indexes.sql',
      '013_performance_indexes_rollback.sql'
    ];

    let allExist = true;
    requiredMigrations.forEach(file => {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        log(`  ✓ ${file}`, 'green');
      } else {
        log(`  ✗ ${file} not found`, 'red');
        allExist = false;
      }
    });

    if (allExist) {
      passedTests++;
    } else {
      failedTests++;
    }

  } catch (error) {
    log(`  ✗ Migration files test failed: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 8: Security API Files
  log('\nTest 8: Security API Endpoints', 'cyan');
  try {
    const fs = require('fs');

    const apiFiles = [
      '../api/security/analyze-activity.js',
      '../api/security/analytics.js'
    ];

    let allExist = true;
    apiFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        log(`  ✓ ${path.basename(file)}`, 'green');
      } else {
        log(`  ✗ ${path.basename(file)} not found`, 'red');
        allExist = false;
      }
    });

    if (allExist) {
      passedTests++;
    } else {
      failedTests++;
    }

  } catch (error) {
    log(`  ✗ Security API files test failed: ${error.message}`, 'red');
    failedTests++;
  }

  // Test 9: Security Dashboard HTML
  log('\nTest 9: Security Analytics Dashboard', 'cyan');
  try {
    const fs = require('fs');
    const dashboardPath = path.join(__dirname, '../public/security-analytics.html');

    if (fs.existsSync(dashboardPath)) {
      const content = fs.readFileSync(dashboardPath, 'utf8');

      // Check for key elements
      const hasTitle = content.includes('Security Analytics Dashboard');
      const hasAPI = content.includes('/api/security/analytics');
      const hasCharts = content.includes('chart-section');

      if (hasTitle && hasAPI && hasCharts) {
        log('  ✓ Dashboard file exists and complete', 'green');
        passedTests++;
      } else {
        log('  ✗ Dashboard file incomplete', 'red');
        failedTests++;
      }
    } else {
      log('  ✗ Dashboard file not found', 'red');
      failedTests++;
    }

  } catch (error) {
    log(`  ✗ Security dashboard test failed: ${error.message}`, 'red');
    failedTests++;
  }

  // Summary
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║  Test Summary                              ║', 'blue');
  log('╚════════════════════════════════════════════╝\n', 'blue');

  const totalTests = passedTests + failedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Success Rate: ${successRate}%\n`, successRate >= 90 ? 'green' : 'yellow');

  if (failedTests === 0) {
    log('╔════════════════════════════════════════════╗', 'green');
    log('║  ✅ ALL TESTS PASSED                       ║', 'green');
    log('║  Phase 1 Week 4 Implementation Complete   ║', 'green');
    log('╚════════════════════════════════════════════╝\n', 'green');
    process.exit(0);
  } else {
    log('╔════════════════════════════════════════════╗', 'red');
    log('║  ✗ SOME TESTS FAILED                       ║', 'red');
    log('║  Please review the errors above            ║', 'red');
    log('╚════════════════════════════════════════════╝\n', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
