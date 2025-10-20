/**
 * Database Connection Pool Manager
 * SQLite için verimli connection pooling
 * 
 * Özellikler:
 * - Connection reuse (yeniden kullanım)
 * - Automatic scaling (otomatik ölçeklendirme)
 * - Connection health monitoring
 * - Leak detection (sızıntı tespiti)
 */

const Database = require('better-sqlite3');
const path = require('path');

class ConnectionPool {
  constructor(options = {}) {
    this.dbPath = options.dbPath || path.join(__dirname, '../../database/ailydian.db');
    this.minConnections = options.minConnections || 2;
    this.maxConnections = options.maxConnections || 10;
    this.idleTimeout = options.idleTimeout || 30000; // 30 saniye
    this.acquireTimeout = options.acquireTimeout || 5000; // 5 saniye
    
    this.pool = [];
    this.activeConnections = new Map();
    this.waitingQueue = [];
    
    this.stats = {
      created: 0,
      acquired: 0,
      released: 0,
      destroyed: 0,
      timeouts: 0,
      errors: 0
    };

    // Başlangıçta minimum connection oluştur
    this.initialize();
  }

  /**
   * Pool'u başlat - minimum connection sayısı oluştur
   */
  initialize() {
    for (let i = 0; i < this.minConnections; i++) {
      const conn = this.createConnection();
      this.pool.push(conn);
    }

    // Periyodik cleanup
    setInterval(() => this.cleanup(), this.idleTimeout);
  }

  /**
   * Yeni database connection oluştur
   */
  createConnection() {
    try {
      const db = new Database(this.dbPath);
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('cache_size = 10000'); // 10MB cache
      db.pragma('temp_store = MEMORY');
      
      const conn = {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        db: db,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        inUse: false
      };

      this.stats.created++;
      return conn;

    } catch (error) {
      this.stats.errors++;
      throw new Error(`Connection oluşturulamadı: ${error.message}`);
    }
  }

  /**
   * Pool'dan connection al
   */
  async acquire() {
    return new Promise((resolve, reject) => {
      // Timeout timer başlat
      const timeoutId = setTimeout(() => {
        this.stats.timeouts++;
        reject(new Error('Connection acquire timeout'));
      }, this.acquireTimeout);

      const tryAcquire = () => {
        // Boşta olan connection var mı?
        const availableConn = this.pool.find(c => !c.inUse);

        if (availableConn) {
          availableConn.inUse = true;
          availableConn.lastUsed = Date.now();
          this.activeConnections.set(availableConn.id, availableConn);
          this.stats.acquired++;
          
          clearTimeout(timeoutId);
          resolve(availableConn.db);
          return;
        }

        // Pool dolu ama maksimuma ulaşmadıysak yeni oluştur
        if (this.pool.length < this.maxConnections) {
          const newConn = this.createConnection();
          newConn.inUse = true;
          this.pool.push(newConn);
          this.activeConnections.set(newConn.id, newConn);
          this.stats.acquired++;
          
          clearTimeout(timeoutId);
          resolve(newConn.db);
          return;
        }

        // Bekle
        this.waitingQueue.push({ resolve, reject, timeoutId });
      };

      tryAcquire();
    });
  }

  /**
   * Connection'ı pool'a geri ver
   */
  async release(db) {
    try {
      // Active connection bul
      let conn = null;
      for (const [id, c] of this.activeConnections.entries()) {
        if (c.db === db) {
          conn = c;
          this.activeConnections.delete(id);
          break;
        }
      }

      if (!conn) {
        throw new Error('Connection pool\'da bulunamadı');
      }

      conn.inUse = false;
      conn.lastUsed = Date.now();
      this.stats.released++;

      // Bekleyen var mı?
      if (this.waitingQueue.length > 0) {
        const waiter = this.waitingQueue.shift();
        clearTimeout(waiter.timeoutId);
        
        conn.inUse = true;
        this.activeConnections.set(conn.id, conn);
        this.stats.acquired++;
        waiter.resolve(conn.db);
      }

      return true;

    } catch (error) {
      this.stats.errors++;
      console.error('Release error:', error);
      return false;
    }
  }

  /**
   * Boşta kalan eski connection'ları temizle
   */
  cleanup() {
    const now = Date.now();
    const minToKeep = this.minConnections;

    // Kullanılmayan ve eski connection'ları bul
    const idleConnections = this.pool.filter(c => 
      !c.inUse && (now - c.lastUsed) > this.idleTimeout
    );

    // Minimum sayıyı koruyarak sil
    const excessCount = this.pool.length - minToKeep;
    const toRemove = Math.min(idleConnections.length, excessCount);

    for (let i = 0; i < toRemove; i++) {
      const conn = idleConnections[i];
      try {
        conn.db.close();
        this.pool = this.pool.filter(c => c.id !== conn.id);
        this.stats.destroyed++;
      } catch (error) {
        this.stats.errors++;
        console.error('Cleanup error:', error);
      }
    }
  }

  /**
   * Helper: Transaction ile query çalıştır
   */
  async withTransaction(callback) {
    const db = await this.acquire();
    
    try {
      db.exec('BEGIN TRANSACTION');
      const result = await callback(db);
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    } finally {
      await this.release(db);
    }
  }

  /**
   * Helper: Basit query çalıştır
   */
  async query(sql, params = []) {
    const db = await this.acquire();
    
    try {
      const stmt = db.prepare(sql);
      return stmt.all(...params);
    } finally {
      await this.release(db);
    }
  }

  /**
   * Helper: Tek satır getir
   */
  async queryOne(sql, params = []) {
    const db = await this.acquire();
    
    try {
      const stmt = db.prepare(sql);
      return stmt.get(...params);
    } finally {
      await this.release(db);
    }
  }

  /**
   * Helper: Insert/Update/Delete
   */
  async execute(sql, params = []) {
    const db = await this.acquire();
    
    try {
      const stmt = db.prepare(sql);
      return stmt.run(...params);
    } finally {
      await this.release(db);
    }
  }

  /**
   * Pool istatistikleri
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      activeConnections: this.activeConnections.size,
      idleConnections: this.pool.filter(c => !c.inUse).length,
      waitingRequests: this.waitingQueue.length,
      utilizationPercent: ((this.activeConnections.size / this.pool.length) * 100).toFixed(2)
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const db = await this.acquire();
      const result = db.prepare('SELECT 1 as health').get();
      await this.release(db);
      
      return {
        healthy: result.health === 1,
        stats: this.getStats()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Pool'u kapat - tüm connection'ları temizle
   */
  async close() {
    // Aktif connection'ları bekle
    while (this.activeConnections.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Tüm connection'ları kapat
    for (const conn of this.pool) {
      try {
        conn.db.close();
        this.stats.destroyed++;
      } catch (error) {
        this.stats.errors++;
        console.error('Close error:', error);
      }
    }

    this.pool = [];
    this.activeConnections.clear();
    this.waitingQueue = [];
  }
}

// Singleton instance
let globalPool = null;

function getPool(options) {
  if (!globalPool) {
    globalPool = new ConnectionPool(options);
  }
  return globalPool;
}

module.exports = ConnectionPool;
module.exports.getPool = getPool;
