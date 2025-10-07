/**
 * Database Initialization Script
 * Creates SQLite database with all required tables
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'ailydian.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

/**
 * Create Users Table
 */
const createUsersTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'USER',
      twoFactorSecret TEXT,
      twoFactorEnabled INTEGER DEFAULT 0,
      emailVerified INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastLogin DATETIME,
      subscription TEXT DEFAULT 'free',
      credits INTEGER DEFAULT 100,
      usageLimit INTEGER DEFAULT 1000,
      currentUsage INTEGER DEFAULT 0,
      resetDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      avatar TEXT,
      bio TEXT,
      status TEXT DEFAULT 'active'
    )
  `;
  db.exec(sql);

  // Create index on role for RBAC
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

  console.log('✓ Users table created');
};

/**
 * Create Sessions Table
 */
const createSessionsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      refreshToken TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      expiresAt DATETIME NOT NULL,
      lastActivity DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(sql);

  // Create index for faster lookups
  db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId)');

  console.log('✓ Sessions table created');
};

/**
 * Create Activity Log Table
 */
const createActivityLogTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      action TEXT NOT NULL,
      description TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      metadata TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(sql);

  // Create index for faster queries
  db.exec('CREATE INDEX IF NOT EXISTS idx_activity_userId ON activity_log(userId)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_activity_createdAt ON activity_log(createdAt)');

  console.log('✓ Activity Log table created');
};

/**
 * Create Usage Stats Table
 */
const createUsageStatsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS usage_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      chatMessages INTEGER DEFAULT 0,
      imagesGenerated INTEGER DEFAULT 0,
      voiceMinutes INTEGER DEFAULT 0,
      creditsUsed INTEGER DEFAULT 0,
      date DATE DEFAULT CURRENT_DATE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, date)
    )
  `;
  db.exec(sql);

  db.exec('CREATE INDEX IF NOT EXISTS idx_usage_userId_date ON usage_stats(userId, date)');

  console.log('✓ Usage Stats table created');
};

/**
 * Create API Keys Table
 */
const createApiKeysTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      keyName TEXT NOT NULL,
      keyHash TEXT UNIQUE NOT NULL,
      keyPrefix TEXT NOT NULL,
      permissions TEXT,
      lastUsed DATETIME,
      expiresAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(sql);

  db.exec('CREATE INDEX IF NOT EXISTS idx_apikeys_userId ON api_keys(userId)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_apikeys_hash ON api_keys(keyHash)');

  console.log('✓ API Keys table created');
};

/**
 * Create Email Verification Table
 */
const createEmailVerificationTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS email_verification (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expiresAt DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      used INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(sql);

  db.exec('CREATE INDEX IF NOT EXISTS idx_email_token ON email_verification(token)');

  console.log('✓ Email Verification table created');
};

/**
 * Create Password Reset Table
 */
const createPasswordResetTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS password_reset (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expiresAt DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      used INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(sql);

  db.exec('CREATE INDEX IF NOT EXISTS idx_password_token ON password_reset(token)');

  console.log('✓ Password Reset table created');
};

/**
 * Create Chat History Table
 */
const createChatHistoryTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      modelUsed TEXT,
      tokensUsed INTEGER,
      creditsUsed INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(sql);

  db.exec('CREATE INDEX IF NOT EXISTS idx_chat_userId ON chat_history(userId)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_chat_createdAt ON chat_history(createdAt)');

  console.log('✓ Chat History table created');
};

/**
 * Create Generated Images Table
 */
const createGeneratedImagesTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS generated_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      prompt TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      modelUsed TEXT,
      creditsUsed INTEGER DEFAULT 10,
      parameters TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(sql);

  db.exec('CREATE INDEX IF NOT EXISTS idx_images_userId ON generated_images(userId)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_images_createdAt ON generated_images(createdAt)');

  console.log('✓ Generated Images table created');
};

/**
 * Create Subscriptions Table
 */
const createSubscriptionsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      plan TEXT NOT NULL,
      stripeCustomerId TEXT,
      stripeSubscriptionId TEXT,
      status TEXT DEFAULT 'active',
      currentPeriodStart DATETIME,
      currentPeriodEnd DATETIME,
      cancelAtPeriodEnd INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(sql);

  db.exec('CREATE INDEX IF NOT EXISTS idx_subscriptions_userId ON subscriptions(userId)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_subscriptions_stripeId ON subscriptions(stripeSubscriptionId)');

  console.log('✓ Subscriptions table created');
};

/**
 * Create Invoices Table
 */
const createInvoicesTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      stripeInvoiceId TEXT UNIQUE,
      amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'usd',
      status TEXT NOT NULL,
      paidAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(sql);

  db.exec('CREATE INDEX IF NOT EXISTS idx_invoices_userId ON invoices(userId)');

  console.log('✓ Invoices table created');
};

/**
 * Initialize Database
 */
const initializeDatabase = () => {
  console.log('🔧 Initializing Ailydian Database...\n');

  try {
    createUsersTable();
    createSessionsTable();
    createActivityLogTable();
    createUsageStatsTable();
    createApiKeysTable();
    createEmailVerificationTable();
    createPasswordResetTable();
    createChatHistoryTable();
    createGeneratedImagesTable();
    createSubscriptionsTable();
    createInvoicesTable();

    console.log('\n✅ Database initialized successfully!');
    console.log(`📁 Database location: ${dbPath}`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    db.close();
  }
};

/**
 * Get Database Connection
 */
const getDatabase = () => {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
};

/**
 * Export functions
 */
module.exports = {
  initializeDatabase,
  getDatabase,
  dbPath
};

// Run initialization if executed directly
if (require.main === module) {
  initializeDatabase();
}
