/**
 * Chat Authentication System Migration
 * Creates tables for independent chat user system
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// UUID generator for SQLite
function generateUUID() {
  return crypto.randomUUID();
}

function runMigration() {
  const dbPath = path.join(__dirname, '..', 'ailydian.db');

  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found:', dbPath);
    process.exit(1);
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  console.log('Running Chat Auth System Migration...\n');

  try {
    // Chat Users Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        avatar_url TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
        email_verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login_at DATETIME
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_users_email ON chat_users(email)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_users_status ON chat_users(status)');
    console.log('✓ chat_users table created');

    // Chat User Sessions Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        is_valid INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES chat_users(id) ON DELETE CASCADE
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_user_sessions(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_sessions_token ON chat_user_sessions(refresh_token)');
    console.log('✓ chat_user_sessions table created');

    // Chat User Settings Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_user_settings (
        user_id TEXT PRIMARY KEY,
        theme TEXT DEFAULT 'dark',
        language TEXT DEFAULT 'tr',
        font_size TEXT DEFAULT 'medium',
        preferred_model TEXT DEFAULT 'premium',
        auto_save_history INTEGER DEFAULT 1,
        notifications_enabled INTEGER DEFAULT 1,
        sound_enabled INTEGER DEFAULT 1,
        custom_settings TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES chat_users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ chat_user_settings table created');

    // Chat Conversations Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT,
        model_used TEXT DEFAULT 'premium',
        message_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES chat_users(id) ON DELETE CASCADE
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_conv_user ON chat_conversations(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_conv_updated ON chat_conversations(updated_at)');
    console.log('✓ chat_conversations table created');

    // Chat Messages Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        model TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_msg_conv ON chat_messages(conversation_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_msg_created ON chat_messages(created_at)');
    console.log('✓ chat_messages table created');

    // Password Reset Tokens Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_password_resets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES chat_users(id) ON DELETE CASCADE
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_reset_token ON chat_password_resets(token)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_chat_reset_user ON chat_password_resets(user_id)');
    console.log('✓ chat_password_resets table created');

    console.log('\n✅ Chat Auth System Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
