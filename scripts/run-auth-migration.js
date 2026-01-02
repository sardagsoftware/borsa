#!/usr/bin/env node
/**
 * 🔐 AUTH DATABASE MIGRATION RUNNER
 * ============================================================================
 * Runs the authentication system database migration
 * ============================================================================
 *
 * Usage:
 *   node scripts/run-auth-migration.js
 *
 * Environment:
 *   Requires DATABASE_URL or DB_* variables in .env file
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createSecureClient } = require('../lib/db-connection-secure');

const MIGRATION_FILE = path.join(__dirname, '../prisma/migrations/001_auth_system.sql');

async function runMigration() {
  console.log('🔐 AUTH SYSTEM MIGRATION');
  console.log('='.repeat(80));
  console.log();

  // Check if migration file exists
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error('❌ Migration file not found:', MIGRATION_FILE);
    process.exit(1);
  }

  // Read migration SQL
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  console.log('📄 Migration file:', MIGRATION_FILE);
  console.log('📊 SQL size:', sql.length, 'bytes');
  console.log();

  // Connect to database
  let client;
  try {
    console.log('🔌 Connecting to database...');
    client = await createSecureClient();
    console.log('✅ Connected to database');
    console.log();

    // Check PostgreSQL version
    const versionResult = await client.query('SELECT version();');
    console.log('📌 PostgreSQL version:', versionResult.rows[0].version.substring(0, 50));
    console.log();

    // Run migration
    console.log('🚀 Running migration...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
    console.log();

    // Verify tables created
    console.log('📊 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'users',
        'sessions',
        'email_verification_tokens',
        'password_reset_tokens',
        'oauth_accounts',
        'login_attempts',
        'auth_audit_log'
      )
      ORDER BY table_name;
    `);

    console.log('Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    console.log();

    // Count tables
    const expectedTables = 7;
    const createdTables = tablesResult.rows.length;

    if (createdTables === expectedTables) {
      console.log(`✅ All ${expectedTables} tables created successfully!`);
    } else {
      console.warn(`⚠️  Warning: Expected ${expectedTables} tables, found ${createdTables}`);
    }

    console.log();
    console.log('='.repeat(80));
    console.log('🎉 AUTH SYSTEM DATABASE READY!');
    console.log('='.repeat(80));
    console.log();
    console.log('Next steps:');
    console.log('  1. Start auth service: node services/auth-service.js');
    console.log('  2. Test registration: POST /api/auth/register');
    console.log('  3. Test login: POST /api/auth/login');
    console.log();
  } catch (error) {
    console.error();
    console.error('❌ Migration failed!');
    console.error('Error:', error.message);
    console.error();

    if (error.message.includes('already exists')) {
      console.log('ℹ️  Note: Some objects may already exist. This is OK if re-running migration.');
    } else if (error.message.includes('connection')) {
      console.log('💡 Tip: Check your DATABASE_URL in .env file');
    } else {
      console.error('Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
runMigration();
