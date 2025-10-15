/**
 * 📧 LyDian Email Accounts API
 * Manages all ailydian.com email accounts with unified inbox
 *
 * Features:
 * - 10 email accounts (admin@, support@, info@, etc.)
 * - Single password: Xrubyphyton1985.!?
 * - Unified inbox (catch-all)
 * - Real-time notifications
 *
 * @security White-Hat Compliant
 * @version 1.0.0
 */

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  try {
    // Email accounts configuration
    const EMAIL_ACCOUNTS = [
      {
        id: 'admin',
        name: 'Admin',
        email: 'admin@ailydian.com',
        password: 'Xrubyphyton1985.!?',
        icon: '👑',
        description: 'Genel yönetim ve admin işlemleri',
        forwardTo: null, // Master inbox
        active: true
      },
      {
        id: 'support',
        name: 'Support',
        email: 'support@ailydian.com',
        password: 'Xrubyphyton1985.!?',
        icon: '🛠️',
        description: 'Müşteri desteği ve teknik yardım',
        forwardTo: 'admin@ailydian.com',
        active: true
      },
      {
        id: 'info',
        name: 'Info',
        email: 'info@ailydian.com',
        password: 'Xrubyphyton1985.!?',
        icon: 'ℹ️',
        description: 'Genel bilgi ve sorular',
        forwardTo: 'admin@ailydian.com',
        active: true
      },
      {
        id: 'emrah',
        name: 'Emrah Sardag',
        email: 'emrah@ailydian.com',
        password: 'Xrubyphyton1985.!?',
        icon: '👤',
        description: 'Kişisel hesap',
        forwardTo: null,
        active: true
      },
      {
        id: 'noreply',
        name: 'No Reply',
        email: 'noreply@ailydian.com',
        password: 'Xrubyphyton1985.!?',
        icon: '🚫',
        description: 'Otomatik bildirim mailleri (giden)',
        forwardTo: null,
        active: true
      },
      {
        id: 'sales',
        name: 'Sales',
        email: 'sales@ailydian.com',
        password: 'Xrubyphyton1985.!?',
        icon: '💰',
        description: 'Satış ve ticari işlemler',
        forwardTo: 'admin@ailydian.com',
        active: true
      },
      {
        id: 'contact',
        name: 'Contact',
        email: 'contact@ailydian.com',
        password: 'Xrubyphyton1985.!?',
        icon: '📮',
        description: 'İletişim formu ve genel mesajlar',
        forwardTo: 'admin@ailydian.com',
        active: true
      },
      {
        id: 'hello',
        name: 'Hello',
        email: 'hello@ailydian.com',
        password: 'Xrubyphyton1985.!?',
        icon: '👋',
        description: 'Karşılama ve ilk iletişim',
        forwardTo: 'admin@ailydian.com',
        active: true
      },
      {
        id: 'team',
        name: 'Team',
        email: 'team@ailydian.com',
        password: 'Xrubyphyton1985.!?',
        icon: '👥',
        description: 'Ekip içi iletişim',
        forwardTo: 'admin@ailydian.com',
        active: true
      },
      {
        id: 'security',
        name: 'Security',
        email: 'security@ailydian.com',
        password: 'Xrubyphyton1985.!?',
        icon: '🔒',
        description: 'Güvenlik uyarıları ve raporlar',
        forwardTo: 'admin@ailydian.com',
        active: true
      }
    ];

    // Handle different request methods
    switch (req.method) {
      case 'GET':
        // Return accounts list (without passwords)
        const accounts = EMAIL_ACCOUNTS.map(({ password, ...account }) => account);

        res.status(200).json({
          success: true,
          accounts,
          total: accounts.length,
          unified: true,
          masterInbox: 'admin@ailydian.com',
          message: 'All accounts forward to unified inbox'
        });
        break;

      case 'POST':
        // Authenticate user
        const { email, password } = req.body || {};

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            error: 'Email and password are required'
          });
        }

        const account = EMAIL_ACCOUNTS.find(a => a.email === email);

        if (!account) {
          return res.status(404).json({
            success: false,
            error: 'Account not found'
          });
        }

        if (account.password !== password) {
          return res.status(401).json({
            success: false,
            error: 'Invalid password'
          });
        }

        // Return account info (without password)
        const { password: _, ...accountInfo } = account;

        res.status(200).json({
          success: true,
          account: accountInfo,
          token: Buffer.from(`${email}:${Date.now()}`).toString('base64'),
          message: 'Authentication successful'
        });
        break;

      default:
        res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Email Accounts API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
