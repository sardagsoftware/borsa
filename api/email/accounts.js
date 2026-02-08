/**
 * LyDian Email Accounts API
 * Manages all ailydian.com email accounts with unified inbox
 *
 * Features:
 * - 10 email accounts (admin@, support@, info@, etc.)
 * - Password from environment variable (EMAIL_ACCOUNT_PASSWORD)
 * - Unified inbox (catch-all)
 * - Real-time notifications
 *
 * @security White-Hat Compliant
 * @version 1.1.0
 */

const { handleCORS } = require('./_lib/cors-simple');

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  try {
    // Password from environment variable only
    const EMAIL_PASSWORD = process.env.EMAIL_ACCOUNT_PASSWORD;
    if (!EMAIL_PASSWORD) {
      console.error('EMAIL_ACCOUNT_PASSWORD environment variable not set');
      return res.status(500).json({
        success: false,
        error: 'Email service not configured',
      });
    }

    // Email accounts configuration
    const EMAIL_ACCOUNTS = [
      {
        id: 'admin',
        name: 'Admin',
        email: 'admin@ailydian.com',
        password: EMAIL_PASSWORD,
        icon: '👑',
        description: 'Genel yönetim ve admin işlemleri',
        forwardTo: null, // Master inbox
        active: true,
      },
      {
        id: 'support',
        name: 'Support',
        email: 'support@ailydian.com',
        password: EMAIL_PASSWORD,
        icon: '🛠️',
        description: 'Müşteri desteği ve teknik yardım',
        forwardTo: 'admin@ailydian.com',
        active: true,
      },
      {
        id: 'info',
        name: 'Info',
        email: 'info@ailydian.com',
        password: EMAIL_PASSWORD,
        icon: 'ℹ️',
        description: 'Genel bilgi ve sorular',
        forwardTo: 'admin@ailydian.com',
        active: true,
      },
      {
        id: 'personal',
        name: 'Personal',
        email: 'admin@ailydian.com',
        password: EMAIL_PASSWORD,
        icon: '👤',
        description: 'Kişisel hesap',
        forwardTo: null,
        active: true,
      },
      {
        id: 'noreply',
        name: 'No Reply',
        email: 'noreply@ailydian.com',
        password: EMAIL_PASSWORD,
        icon: '🚫',
        description: 'Otomatik bildirim mailleri (giden)',
        forwardTo: null,
        active: true,
      },
      {
        id: 'sales',
        name: 'Sales',
        email: 'sales@ailydian.com',
        password: EMAIL_PASSWORD,
        icon: '💰',
        description: 'Satış ve ticari işlemler',
        forwardTo: 'admin@ailydian.com',
        active: true,
      },
      {
        id: 'contact',
        name: 'Contact',
        email: 'contact@ailydian.com',
        password: EMAIL_PASSWORD,
        icon: '📮',
        description: 'İletişim formu ve genel mesajlar',
        forwardTo: 'admin@ailydian.com',
        active: true,
      },
      {
        id: 'hello',
        name: 'Hello',
        email: 'hello@ailydian.com',
        password: EMAIL_PASSWORD,
        icon: '👋',
        description: 'Karşılama ve ilk iletişim',
        forwardTo: 'admin@ailydian.com',
        active: true,
      },
      {
        id: 'team',
        name: 'Team',
        email: 'team@ailydian.com',
        password: EMAIL_PASSWORD,
        icon: '👥',
        description: 'Ekip içi iletişim',
        forwardTo: 'admin@ailydian.com',
        active: true,
      },
      {
        id: 'security',
        name: 'Security',
        email: 'security@ailydian.com',
        password: EMAIL_PASSWORD,
        icon: '🔒',
        description: 'Güvenlik uyarıları ve raporlar',
        forwardTo: 'admin@ailydian.com',
        active: true,
      },
    ];

    // Handle different request methods
    if (req.method === 'GET') {
      // Return accounts list (without passwords)
      const accounts = EMAIL_ACCOUNTS.map(({ password: _p, ...account }) => account);

      return res.status(200).json({
        success: true,
        accounts,
        total: accounts.length,
        unified: true,
        masterInbox: 'admin@ailydian.com',
        message: 'All accounts forward to unified inbox',
      });
    }

    if (req.method === 'POST') {
      // Authenticate user
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      const account = EMAIL_ACCOUNTS.find(a => a.email === email);

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found',
        });
      }

      if (account.password !== password) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password',
        });
      }

      // Return account info (without password)
      const { password: _pw, ...accountInfo } = account;

      return res.status(200).json({
        success: true,
        account: accountInfo,
        token: Buffer.from(`${email}:${Date.now()}`).toString('base64'),
        message: 'Authentication successful',
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('Email Accounts API Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
