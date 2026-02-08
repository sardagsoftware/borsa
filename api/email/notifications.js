/**
 * 🔔 LyDian Email Notifications API
 * Real-time email notifications using Server-Sent Events (SSE)
 *
 * Features:
 * - Real-time push notifications
 * - Browser notifications
 * - PWA support
 * - Mobile-friendly
 *
 * @security White-Hat Compliant
 * @version 1.0.0
 */

const { handleCORS } = require('../_lib/cors-simple');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  try {
    const { method, query, body } = req;

    // GET: Setup SSE connection for real-time notifications
    if (method === 'GET') {
      // Setup SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const accountId = query.account || 'admin';

      // Send initial connection message
      res.write(
        `data: ${JSON.stringify({
          type: 'connected',
          account: accountId,
          timestamp: new Date().toISOString(),
          message: 'Real-time notifications active',
        })}\n\n`
      );

      // Heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        res.write(
          `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          })}\n\n`
        );
      }, 30000); // Every 30 seconds

      // Simulate new email notifications (for demo)
      const notificationInterval = setInterval(() => {
        const mockNotification = generateMockNotification(accountId);
        res.write(`data: ${JSON.stringify(mockNotification)}\n\n`);
      }, 60000); // Every 60 seconds

      // Clean up on connection close
      req.on('close', () => {
        clearInterval(heartbeatInterval);
        clearInterval(notificationInterval);
        res.end();
      });

      return;
    }

    // POST: Send push notification
    if (method === 'POST') {
      const { account, title, body, icon, priority = 'normal' } = body || {};

      if (!account || !title || !body) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: account, title, body',
        });
      }

      // Create notification payload
      const notification = {
        id: generateNotificationId(),
        account,
        title,
        body,
        icon: icon || '📧',
        priority,
        timestamp: new Date().toISOString(),
        read: false,
        actions: [
          { action: 'open', title: 'Aç' },
          { action: 'dismiss', title: 'Kapat' },
        ],
      };

      // In production, this would:
      // 1. Store notification in database
      // 2. Send via WebSocket/SSE to connected clients
      // 3. Send push notification to mobile devices
      // 4. Trigger browser notification

      res.status(200).json({
        success: true,
        notification,
        message: 'Notification sent successfully',
      });

      return;
    }

    // PUT: Mark notification as read
    if (method === 'PUT') {
      const { notificationId } = query;

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          error: 'notificationId is required',
        });
      }

      // In production, this would update the notification in the database
      res.status(200).json({
        success: true,
        notificationId,
        read: true,
        message: 'Notification marked as read',
      });

      return;
    }

    // DELETE: Clear all notifications
    if (method === 'DELETE') {
      const { account } = query;

      if (!account) {
        return res.status(400).json({
          success: false,
          error: 'account is required',
        });
      }

      // In production, this would delete notifications from database
      res.status(200).json({
        success: true,
        account,
        cleared: true,
        message: 'All notifications cleared',
      });

      return;
    }

    res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('Email Notifications API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Bir hata olustu. Lutfen tekrar deneyin.',
    });
  }
};

// Helper functions
function generateNotificationId() {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMockNotification(accountId) {
  const senders = [
    { name: 'John Doe', email: 'john@example.com' },
    { name: 'Jane Smith', email: 'jane@company.com' },
    { name: 'Bob Johnson', email: 'bob@startup.io' },
    { name: 'Alice Williams', email: 'alice@tech.com' },
  ];

  const subjects = [
    'Meeting Tomorrow',
    'Q4 Report Ready',
    'Action Required: System Update',
    'New Feature Request',
    'Invoice #INV-2025-001',
    'Welcome to LyDian',
    'Your Feedback Matters',
    'Security Alert',
  ];

  const sender = senders[Math.floor(Math.random() * senders.length)];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];

  return {
    type: 'new_email',
    id: generateNotificationId(),
    account: accountId,
    from: sender,
    subject,
    preview: `${subject.substring(0, 50)}...`,
    timestamp: new Date().toISOString(),
    unread: true,
    priority: Math.random() > 0.8 ? 'high' : 'normal',
  };
}
