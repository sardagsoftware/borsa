#!/usr/bin/env node
/**
 * Database Migration Runner
 * Handles running and tracking database migrations for Ailydian Ultra Pro
 *
 * Usage:
 *   npm run migrate              # Run all pending migrations
 *   npm run migrate:rollback     # Rollback last migration
 *   npm run migrate:status       # Show migration status
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'ailydian.db');
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Initialize database connection
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Colors for console output
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

/**
 * Create migrations tracking table if it doesn't exist
 */
function createMigrationsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.exec(sql);
}

/**
 * Get list of applied migrations
 */
function getAppliedMigrations() {
  try {
    const rows = db.prepare('SELECT name FROM migrations ORDER BY id').all();
    return rows.map(row => row.name);
  } catch (error) {
    return [];
  }
}

/**
 * Get list of available migration files
 */
function getAvailableMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    log(`Migrations directory not found: ${MIGRATIONS_DIR}`, 'red');
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql') && !file.includes('rollback'))
    .sort();

  return files;
}

/**
 * Run a single migration
 */
function runMigration(filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filepath, 'utf8');

  log(`\n→ Running migration: ${filename}`, 'cyan');

  try {
    // Begin transaction
    db.exec('BEGIN TRANSACTION');

    // Execute migration SQL
    db.exec(sql);

    // Record migration in tracking table
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(filename);

    // Commit transaction
    db.exec('COMMIT');

    log(`✓ Migration completed: ${filename}`, 'green');
    return true;
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    log(`✗ Migration failed: ${filename}`, 'red');
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Rollback the last migration
 */
function rollbackLastMigration() {
  const appliedMigrations = getAppliedMigrations();

  if (appliedMigrations.length === 0) {
    log('No migrations to rollback', 'yellow');
    return false;
  }

  const lastMigration = appliedMigrations[appliedMigrations.length - 1];
  const rollbackFile = lastMigration.replace('.sql', '_rollback.sql');
  const rollbackPath = path.join(MIGRATIONS_DIR, rollbackFile);

  if (!fs.existsSync(rollbackPath)) {
    log(`Rollback file not found: ${rollbackFile}`, 'red');
    return false;
  }

  log(`\n→ Rolling back migration: ${lastMigration}`, 'cyan');

  try {
    const sql = fs.readFileSync(rollbackPath, 'utf8');

    // Begin transaction
    db.exec('BEGIN TRANSACTION');

    // Execute rollback SQL
    db.exec(sql);

    // Remove migration record
    db.prepare('DELETE FROM migrations WHERE name = ?').run(lastMigration);

    // Commit transaction
    db.exec('COMMIT');

    log(`✓ Rollback completed: ${lastMigration}`, 'green');
    return true;
  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    log(`✗ Rollback failed: ${lastMigration}`, 'red');
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Show migration status
 */
function showStatus() {
  const applied = getAppliedMigrations();
  const available = getAvailableMigrations();

  log('\n═══════════════════════════════════════', 'blue');
  log('      DATABASE MIGRATION STATUS', 'blue');
  log('═══════════════════════════════════════\n', 'blue');

  log(`Database: ${DB_PATH}`, 'cyan');
  log(`Total migrations available: ${available.length}`, 'cyan');
  log(`Applied migrations: ${applied.length}\n`, 'cyan');

  if (available.length === 0) {
    log('No migration files found', 'yellow');
    return;
  }

  log('Migration Files:', 'blue');
  log('─────────────────────────────────────────\n');

  available.forEach(migration => {
    const isApplied = applied.includes(migration);
    const status = isApplied ? '✓ Applied' : '○ Pending';
    const color = isApplied ? 'green' : 'yellow';
    log(`  ${status}  ${migration}`, color);
  });

  log('\n═══════════════════════════════════════\n', 'blue');

  const pending = available.filter(m => !applied.includes(m));
  if (pending.length > 0) {
    log(`${pending.length} migration(s) pending`, 'yellow');
  } else {
    log('All migrations applied ✓', 'green');
  }
}

/**
 * Run all pending migrations
 */
function runAllMigrations() {
  const applied = getAppliedMigrations();
  const available = getAvailableMigrations();
  const pending = available.filter(m => !applied.includes(m));

  if (pending.length === 0) {
    log('No pending migrations', 'green');
    return true;
  }

  log(`\n╔═══════════════════════════════════════╗`, 'blue');
  log(`║   Running ${pending.length} pending migration(s)   ║`, 'blue');
  log(`╚═══════════════════════════════════════╝`, 'blue');

  let allSuccess = true;

  for (const migration of pending) {
    const success = runMigration(migration);
    if (!success) {
      allSuccess = false;
      log('\n✗ Migration process stopped due to error', 'red');
      break;
    }
  }

  if (allSuccess) {
    log('\n╔═══════════════════════════════════════╗', 'green');
    log('║   All migrations completed ✓          ║', 'green');
    log('╚═══════════════════════════════════════╝\n', 'green');
  }

  return allSuccess;
}

/**
 * Validate database connection
 */
function validateDatabase() {
  try {
    db.prepare('SELECT 1').get();
    return true;
  } catch (error) {
    log(`Database connection failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  const command = process.argv[2] || 'migrate';

  log('\n╔═══════════════════════════════════════╗', 'blue');
  log('║   Ailydian Migration Runner           ║', 'blue');
  log('╚═══════════════════════════════════════╝\n', 'blue');

  // Validate database connection
  if (!validateDatabase()) {
    process.exit(1);
  }

  // Create migrations tracking table
  createMigrationsTable();

  // Execute command
  switch (command) {
    case 'migrate':
    case 'up':
      const success = runAllMigrations();
      process.exit(success ? 0 : 1);
      break;

    case 'rollback':
    case 'down':
      const rollbackSuccess = rollbackLastMigration();
      process.exit(rollbackSuccess ? 0 : 1);
      break;

    case 'status':
      showStatus();
      process.exit(0);
      break;

    default:
      log('Unknown command. Available commands:', 'yellow');
      log('  migrate or up      - Run all pending migrations', 'cyan');
      log('  rollback or down   - Rollback last migration', 'cyan');
      log('  status             - Show migration status', 'cyan');
      process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`\nFatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  log(`\nUnhandled rejection: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runAllMigrations,
  rollbackLastMigration,
  showStatus,
  getAppliedMigrations,
  getAvailableMigrations
};
