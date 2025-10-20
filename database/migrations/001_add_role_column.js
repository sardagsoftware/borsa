/**
 * Database Migration: Add role column to users table
 * For Role-Based Access Control (RBAC) system
 */

const { getDatabase } = require('../init-db');

function migrate() {
  const db = getDatabase();

  try {
    console.log('🔄 Running migration: Add role column to users table...');

    // Check if role column already exists
    const tableInfo = db.prepare('PRAGMA table_info(users)').all();
    const roleColumnExists = tableInfo.some(col => col.name === 'role');

    if (roleColumnExists) {
      console.log('✓ Role column already exists, skipping migration');
      return;
    }

    // Add role column with default value
    db.exec(`
      ALTER TABLE users
      ADD COLUMN role TEXT DEFAULT 'USER'
    `);

    // Create index on role for faster queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
    `);

    // Update existing users to have USER role
    db.prepare(`
      UPDATE users
      SET role = 'USER'
      WHERE role IS NULL
    `).run();

    console.log('✅ Migration completed: Role column added successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Rollback function (if needed)
function rollback() {
  const db = getDatabase();

  try {
    console.log('🔄 Rolling back migration: Remove role column...');

    // SQLite doesn't support DROP COLUMN directly
    // We would need to recreate the table without the role column
    // This is complex, so we'll just log a warning

    console.warn('⚠️ Rollback not implemented for SQLite. Manual intervention required.');

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate, rollback };
