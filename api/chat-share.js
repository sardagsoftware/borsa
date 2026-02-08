/**
 * 🔐 SECURE CHAT SHARING & EXPORT API
 * ===================================
 * - Crypto-secure random IDs
 * - Time-limited access (24h default)
 * - One-time use option
 * - NO search engine indexing
 * - PDF/TXT/JSON export
 */

const crypto = require('crypto');
const express = require('express');
const { applySanitization } = require('./_middleware/sanitize');
const router = express.Router();

// Apply sanitization middleware to all routes
router.use((req, res, next) => {
  applySanitization(req, res);
  next();
});

// In-memory storage (in production, use Redis or Database)
const sharedChats = new Map();

// Cleanup expired shares every hour
setInterval(
  () => {
    const now = Date.now();
    for (const [id, data] of sharedChats.entries()) {
      if (data.expiresAt < now) {
        sharedChats.delete(id);
        console.log(`🗑️  Expired share deleted: ${id}`);
      }
    }
  },
  60 * 60 * 1000
);

/**
 * Generate cryptographically secure random ID
 */
function generateSecureId() {
  return crypto.randomBytes(16).toString('base64url'); // URL-safe, 22 chars
}

/**
 * POST /api/chat-share
 * Create a secure share link
 */
router.post('/', (req, res) => {
  try {
    const { messages, title, expiresIn = 24, oneTimeUse = false } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required',
      });
    }

    // Generate secure ID
    const shareId = generateSecureId();

    // Calculate expiration (default 24 hours)
    const expiresAt = Date.now() + expiresIn * 60 * 60 * 1000;

    // Store share data
    sharedChats.set(shareId, {
      messages,
      title: title || 'Hukuk AI Sohbeti',
      createdAt: Date.now(),
      expiresAt,
      oneTimeUse,
      used: false,
      accessCount: 0,
    });

    console.log(`✅ Share created: ${shareId} (expires in ${expiresIn}h)`);

    res.json({
      success: true,
      shareId,
      shareUrl: `/shared/${shareId}`,
      expiresAt: new Date(expiresAt).toISOString(),
      oneTimeUse,
    });
  } catch (error) {
    console.error('❌ Share creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create share link',
    });
  }
});

/**
 * GET /api/chat-share/:id
 * Retrieve shared chat (with security checks)
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const share = sharedChats.get(id);

    if (!share) {
      return res.status(404).json({
        success: false,
        error: 'Share not found or expired',
      });
    }

    // Check expiration
    if (share.expiresAt < Date.now()) {
      sharedChats.delete(id);
      return res.status(410).json({
        success: false,
        error: 'Share link has expired',
      });
    }

    // Check one-time use
    if (share.oneTimeUse && share.used) {
      sharedChats.delete(id);
      return res.status(410).json({
        success: false,
        error: 'This share link was already used',
      });
    }

    // Mark as used and increment access count
    if (share.oneTimeUse) {
      share.used = true;
    }
    share.accessCount++;

    // Send chat data with anti-indexing headers
    res.set({
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    });

    res.json({
      success: true,
      title: share.title,
      messages: share.messages,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      oneTimeUse: share.oneTimeUse,
    });
  } catch (error) {
    console.error('❌ Share retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve share',
    });
  }
});

/**
 * GET /api/chat-share/:id/export/:format
 * Export chat in different formats (PDF, TXT, JSON)
 */
router.get('/:id/export/:format', (req, res) => {
  try {
    const { id, format } = req.params;
    const share = sharedChats.get(id);

    if (!share || share.expiresAt < Date.now()) {
      return res.status(404).send('Share not found or expired');
    }

    // Anti-indexing headers
    res.set({
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'Cache-Control': 'private, no-cache, no-store',
    });

    const { title, messages, createdAt } = share;
    const timestamp = new Date(createdAt).toLocaleString('tr-TR');

    switch (format.toLowerCase()) {
      case 'txt': {
        let txtContent = `${title}\n`;
        txtContent += `Oluşturulma: ${timestamp}\n`;
        txtContent += `${'='.repeat(60)}\n\n`;

        messages.forEach((msg, index) => {
          const role = msg.role === 'user' ? 'SİZ' : 'LYDİAN HUKUK AI';
          txtContent += `[${index + 1}] ${role}:\n${msg.content}\n\n`;
        });

        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.set(
          'Content-Disposition',
          `attachment; filename="hukuk-ai-sohbet-${id.substring(0, 8)}.txt"`
        );
        res.send(txtContent);
        break;
      }

      case 'json': {
        const jsonData = {
          title,
          createdAt: timestamp,
          messages,
          exportedAt: new Date().toISOString(),
        };

        res.set('Content-Type', 'application/json');
        res.set(
          'Content-Disposition',
          `attachment; filename="hukuk-ai-sohbet-${id.substring(0, 8)}.json"`
        );
        res.json(jsonData);
        break;
      }

      case 'pdf':
        // For PDF, redirect to frontend PDF generator
        res.redirect(`/shared/${id}?export=pdf`);
        break;

      default:
        res.status(400).send('Invalid format. Use: txt, json, or pdf');
    }
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).send('Export failed');
  }
});

/**
 * DELETE /api/chat-share/:id
 * Delete a share (by creator)
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (sharedChats.has(id)) {
      sharedChats.delete(id);
      res.json({
        success: true,
        message: 'Share deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Share not found',
      });
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete share',
    });
  }
});

module.exports = router;
