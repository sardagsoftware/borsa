/**
 * CloudSave API - Persist game state
 * GET  /api/cloudsave → { save: SaveBlob | null }
 * POST /api/cloudsave → { ok: boolean }
 */

const sqlite3 = require('sqlite3');
const path = require('path');
const { handleCORS } = require('../../middleware/cors-handler');
const { applySanitization } = require('../_middleware/sanitize');

const DB_PATH = path.join(process.cwd(), 'database', 'ailydian.db');

function getDb() {
  return new sqlite3.Database(DB_PATH);
}

// Ensure table exists
function ensureTable() {
  const db = getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS game_saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      save_data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  db.close();
}

ensureTable();

module.exports = async (req, res) => {
  applySanitization(req, res);
  // CORS
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  const userId = req.headers['x-user-id'] || 'guest';

  if (req.method === 'GET') {
    const db = getDb();
    db.get(
      'SELECT save_data FROM game_saves WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
      [userId],
      (err, row) => {
        db.close();
        if (err) {
          console.error('CloudSave GET error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        const save = row ? JSON.parse(row.save_data) : null;
        res.status(200).json({ save });
      }
    );
  } else if (req.method === 'POST') {
    const blob = req.body;
    if (!blob || typeof blob !== 'object') {
      return res.status(400).json({ error: 'Invalid save data' });
    }

    const now = Date.now();
    const db = getDb();
    db.run(
      'INSERT INTO game_saves (user_id, save_data, created_at, updated_at) VALUES (?, ?, ?, ?)',
      [userId, JSON.stringify(blob), now, now],
      (err) => {
        db.close();
        if (err) {
          console.error('CloudSave POST error:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json({ ok: true });
      }
    );
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
