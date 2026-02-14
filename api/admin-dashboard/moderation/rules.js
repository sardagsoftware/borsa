/**
 * AILYDIAN Admin Dashboard - Moderation Rules API
 *
 * GET    /api/admin-dashboard/moderation/rules              - List all rules
 * POST   /api/admin-dashboard/moderation/rules              - Create a new rule (super_admin only)
 * DELETE /api/admin-dashboard/moderation/rules?ruleId=...   - Delete a rule (super_admin only)
 *
 * Rules define automated content moderation patterns (regex-based).
 *
 * Redis key patterns:
 *   - moderation:rules         (sorted set, score = timestamp, member = rule id)
 *   - moderation:rule:{id}     (hash: name, pattern, action, is_active, created_by, created_at)
 *
 * Audit trail:
 *   SET admin:audit:{timestamp}:moderation  (JSON, 90-day TTL = 7776000s)
 *
 * Protected by triple-layer admin authentication.
 * GET: super_admin + moderator
 * POST / DELETE: super_admin only
 */

const { withAdminAuth } = require('../_middleware');
const { applySanitization } = require('../../_middleware/sanitize');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Upstash Redis REST API
// ---------------------------------------------------------------------------

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command, ...args) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const response = await fetch(`${UPSTASH_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([command, ...args]),
    });
    const data = await response.json();
    return data.result;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a flat array from HGETALL [k1, v1, k2, v2, ...] into an object.
 */
function arrayToObject(arr) {
  if (!arr || arr.length === 0) return null;
  const obj = {};
  for (let i = 0; i < arr.length; i += 2) {
    obj[arr[i]] = arr[i + 1];
  }
  return obj;
}

/**
 * Validate that a string is a valid JavaScript regex pattern.
 * Rejects patterns longer than 500 chars and known ReDoS patterns.
 */
function validateRegex(pattern) {
  if (!pattern || typeof pattern !== 'string') {
    return false;
  }
  if (pattern.length > 500) {
    return false;
  }

  // Block dangerous ReDoS patterns
  const dangerousPatterns = [/\(\.\*\)\+/, /\(\.\+\)\+/, /\(\[^\]]*\]\+\)\+/];
  for (const dp of dangerousPatterns) {
    if (dp.test(pattern)) {
      return false;
    }
  }

  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Allowed rule actions
// ---------------------------------------------------------------------------

const VALID_RULE_ACTIONS = ['flag', 'block', 'warn'];

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

module.exports = withAdminAuth(async (req, res) => {
  applySanitization(req, res);

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(503).json({
      success: false,
      error: 'Veritabani baglantisi yapilamiyor',
    });
  }

  // =========================================================================
  // GET - List all moderation rules
  // =========================================================================
  if (req.method === 'GET') {
    try {
      // Get all rule IDs from the sorted set (newest first by score)
      const ruleIds = await redis('ZREVRANGEBYSCORE', 'moderation:rules', '+inf', '-inf');

      if (!ruleIds || ruleIds.length === 0) {
        return res.status(200).json({
          success: true,
          rules: [],
        });
      }

      const rules = [];

      for (const ruleId of ruleIds) {
        const rawData = await redis('HGETALL', `moderation:rule:${ruleId}`);
        const rule = arrayToObject(rawData);
        if (!rule) continue;

        rules.push({
          id: ruleId,
          name: rule.name || '',
          pattern: rule.pattern || '',
          action: rule.action || 'flag',
          isActive: rule.is_active === 'true',
          createdBy: rule.created_by || '',
          createdAt: rule.created_at || '',
        });
      }

      return res.status(200).json({
        success: true,
        rules,
      });
    } catch (err) {
      console.error('[ADMIN_MOD_RULES_LIST]', err.message);
      return res.status(500).json({
        success: false,
        error: 'Sunucu hatasi olustu',
      });
    }
  }

  // =========================================================================
  // POST - Create a new moderation rule (super_admin only)
  // =========================================================================
  if (req.method === 'POST') {
    // Enforce super_admin role
    if (!req.adminUser || req.adminUser.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Erisim reddedildi',
      });
    }

    const { name, pattern, action: ruleAction, isActive } = req.body || {};

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz istek',
      });
    }
    if (name.trim().length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz istek',
      });
    }

    // Validate pattern (regex string)
    if (!pattern || typeof pattern !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz istek',
      });
    }
    if (!validateRegex(pattern)) {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz istek',
      });
    }

    // Validate action
    if (!ruleAction || !VALID_RULE_ACTIONS.includes(ruleAction)) {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz istek',
      });
    }

    // isActive defaults to true if not provided
    const activeFlag = isActive !== false;

    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const timestamp = Date.now();

      // HSET the rule hash
      await redis(
        'HSET',
        `moderation:rule:${id}`,
        'name',
        name.trim(),
        'pattern',
        pattern,
        'action',
        ruleAction,
        'is_active',
        activeFlag ? 'true' : 'false',
        'created_by',
        req.adminUser.sub || '',
        'created_at',
        now
      );

      // ZADD to the rules sorted set (score = timestamp)
      await redis('ZADD', 'moderation:rules', String(timestamp), id);

      // Audit trail
      const auditData = JSON.stringify({
        action: 'rule_create',
        ruleId: id,
        ruleName: name.trim(),
        ruleAction,
        adminId: req.adminUser.sub || '',
        timestamp: now,
      });

      await redis('SET', `admin:audit:${timestamp}:moderation`, auditData, 'EX', '7776000');

      return res.status(201).json({
        success: true,
        message: 'Kural olusturuldu',
        rule: {
          id,
          name: name.trim(),
          pattern,
          action: ruleAction,
          isActive: activeFlag,
          createdBy: req.adminUser.sub || '',
          createdAt: now,
        },
      });
    } catch (err) {
      console.error('[ADMIN_MOD_RULES_CREATE]', err.message);
      return res.status(500).json({
        success: false,
        error: 'Sunucu hatasi olustu',
      });
    }
  }

  // =========================================================================
  // DELETE - Delete a moderation rule (super_admin only)
  // =========================================================================
  if (req.method === 'DELETE') {
    // Enforce super_admin role
    if (!req.adminUser || req.adminUser.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Erisim reddedildi',
      });
    }

    const ruleId = req.query.ruleId;

    if (!ruleId || typeof ruleId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Gecersiz istek',
      });
    }

    try {
      // Verify rule exists before deleting
      const rawData = await redis('HGETALL', `moderation:rule:${ruleId}`);
      const existingRule = arrayToObject(rawData);

      if (!existingRule) {
        return res.status(404).json({
          success: false,
          error: 'Kural bulunamadi',
        });
      }

      // DEL the rule hash
      await redis('DEL', `moderation:rule:${ruleId}`);

      // ZREM from the rules sorted set
      await redis('ZREM', 'moderation:rules', ruleId);

      // Audit trail
      const now = new Date().toISOString();
      const timestamp = Date.now();
      const auditData = JSON.stringify({
        action: 'rule_delete',
        ruleId,
        ruleName: existingRule.name || '',
        adminId: req.adminUser.sub || '',
        timestamp: now,
      });

      await redis('SET', `admin:audit:${timestamp}:moderation`, auditData, 'EX', '7776000');

      return res.status(200).json({
        success: true,
        message: 'Kural silindi',
      });
    } catch (err) {
      console.error('[ADMIN_MOD_RULES_DELETE]', err.message);
      return res.status(500).json({
        success: false,
        error: 'Sunucu hatasi olustu',
      });
    }
  }

  // =========================================================================
  // Unsupported method
  // =========================================================================
  return res.status(405).json({
    success: false,
    error: 'Desteklenmeyen HTTP metodu',
  });
});
